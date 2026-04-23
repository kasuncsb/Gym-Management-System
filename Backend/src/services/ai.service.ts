import type { AuthUser } from '../middleware/auth.js';
import { parseWorkoutPlanPreferences, type AiWorkoutPlanPreferences } from '../validators/aiWorkoutPlanPreferences.js';
import { AppError } from '../utils/errors.js';
import {
  getDashboard,
  getMySubscriptions,
  getReportSummary,
  listMyVisits,
  listMyWorkoutLogs,
  generateAiWorkoutPlan,
} from './ops.service.js';
import { db } from '../config/database.js';
import { aiInteractions, entityLifecycle } from '../db/schema.js';
import { ids } from '../utils/id.js';
import { insertLifecycleRow } from '../utils/lifecycle.js';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { and, asc, desc, eq, isNotNull, sql } from 'drizzle-orm';

const BRANCH_CONTEXT = `
GymSphere branch operations context.
Focus on safe workout advice, membership guidance, check-in rules, and trainer session support.
Never provide diagnosis. For medical concerns, advise consulting a professional.
`;

type TrainingDoc = {
  id: string;
  tags?: string[];
  role?: 'member' | 'manager' | 'trainer' | 'admin' | 'generic';
  topic?: 'onboarding' | 'workouts' | 'subscriptions' | 'operations' | 'insights' | 'policies' | 'equipment' | 'other';
  content: string;
  faqPairs?: Array<{ q: string; a: string }>;
  workoutTemplate?: {
    level?: 'beginner' | 'intermediate' | 'advanced';
    goal?: string;
    daysPerWeek?: number;
    durationWeeks?: number;
  };
  businessRule?: {
    area: 'subscriptions' | 'revenue' | 'attendance' | 'equipment' | 'staffing' | 'other';
    rule: string;
  };
};

type ScoredDoc = { doc: TrainingDoc; score: number };

let trainingCache: TrainingDoc[] | null = null;
let embeddingCache: { docId: string; vector: number[] }[] | null = null;
let embeddingCooldownUntil = 0;
let embeddingCooldownReason = '';

// Default text model: Gemini 3.1 Flash-Lite (preview). See https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite-preview
const GEMINI_MODEL_DEFAULT = 'gemini-3.1-flash-lite-preview';
// Note (2026): text-embedding-004 is being deprecated; prefer gemini-embedding-001.
const GEMINI_EMBEDDING_MODEL_DEFAULT = 'gemini-embedding-001';
type UserRole = 'admin' | 'manager' | 'trainer' | 'member';

type ChatSource = 'rag' | 'gemini' | 'fallback' | 'system';

function parseGeminiHttpError(err: unknown): { status?: number; message: string; rateLimited: boolean } {
  const message = err instanceof Error ? err.message : String(err);
  const m = message.match(/(\d{3})\s+(\{[\s\S]*\}|.*)$/);
  if (!m) {
    return {
      message,
      rateLimited: /RESOURCE_EXHAUSTED|quota|rate limit|429/i.test(message),
    };
  }
  const status = Number(m[1]);
  const body = m[2] ?? '';
  return {
    status,
    message: body,
    rateLimited: status === 429 || /RESOURCE_EXHAUSTED|quota|rate limit/i.test(body),
  };
}

async function loadTrainingDocs(): Promise<TrainingDoc[]> {
  if (trainingCache) return trainingCache;
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const candidates = [
      resolve(process.cwd(), 'src', 'ai', 'training', 'gms-training.json'),
      resolve(here, '..', 'ai', 'training', 'gms-training.json'),
    ];
    let raw = '';
    for (const p of candidates) {
      try {
        raw = await readFile(p, 'utf8');
        if (raw) break;
      } catch {
        // try next path
      }
    }
    if (!raw) throw new Error('training file not found');
    const parsed = JSON.parse(raw) as TrainingDoc[] | TrainingDoc;
    const docs = Array.isArray(parsed) ? parsed : [parsed];
    trainingCache = docs.map((d, idx) => ({
      role: 'generic',
      topic: 'other',
      tags: [],
      ...d,
      id: d.id ?? `doc-${idx}`,
    }));
  } catch {
    trainingCache = [];
  }
  return trainingCache;
}

async function ensureChatSession(_user: AuthUser, _role: 'member' | 'manager', sessionId?: string): Promise<string> {
  if (sessionId?.trim()) return sessionId.trim();
  return ids.uuid();
}

async function nextChatSeq(chatSessionId: string): Promise<number> {
  const [row] = await db
    .select({ m: sql<number>`coalesce(max(${aiInteractions.seq}), 0)` })
    .from(aiInteractions)
    .where(eq(aiInteractions.chatSessionId, chatSessionId));
  return Number(row?.m ?? 0) + 1;
}

async function appendChatMessage(sessionId: string, user: AuthUser, role: 'user' | 'assistant', content: string, source: ChatSource) {
  const msgLc = await insertLifecycleRow();
  const seq = await nextChatSeq(sessionId);
  const isUser = role === 'user';
  await db.insert(aiInteractions).values({
    id: ids.uuid(),
    lifecycleId: msgLc,
    userId: user.id,
    userRole: user.role as UserRole,
    interactionType: 'chat',
    promptText: isUser ? content : null,
    responseText: isUser ? null : content,
    source: source === 'system' ? 'system' : source,
    metadataJson: null,
    chatSessionId: sessionId,
    chatMessageRole: isUser ? 'user' : 'assistant',
    seq,
  });
}

async function getRecentSessionMessages(sessionId: string, limit = 12): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const rows = await db
    .select({
      role: aiInteractions.chatMessageRole,
      promptText: aiInteractions.promptText,
      responseText: aiInteractions.responseText,
      seq: aiInteractions.seq,
    })
    .from(aiInteractions)
    .where(and(eq(aiInteractions.chatSessionId, sessionId), isNotNull(aiInteractions.chatMessageRole)))
    .orderBy(desc(aiInteractions.seq))
    .limit(limit);
  return rows
    .reverse()
    .map((r) => {
      const isUser = r.role === 'user';
      return {
        role: (isUser ? 'user' : 'assistant') as 'user' | 'assistant',
        content: (isUser ? r.promptText : r.responseText) ?? '',
      };
    });
}

const CHAT_HISTORY_API_MAX = 200;

/** Most recent chat session for this user + full transcript (for UI hydrate). */
export async function getChatHistoryForUser(
  user: AuthUser,
  requestedSessionId?: string | null,
): Promise<{ sessionId: string | null; messages: Array<{ role: 'user' | 'assistant'; text: string }> }> {
  let sid = requestedSessionId?.trim() || null;

  if (sid) {
    const [owns] = await db
      .select({ id: aiInteractions.id })
      .from(aiInteractions)
      .where(
        and(
          eq(aiInteractions.chatSessionId, sid),
          eq(aiInteractions.userId, user.id),
          isNotNull(aiInteractions.chatMessageRole),
        ),
      )
      .limit(1);
    if (!owns) sid = null;
  }

  if (!sid) {
    const [latest] = await db
      .select({ sid: aiInteractions.chatSessionId })
      .from(aiInteractions)
      .innerJoin(entityLifecycle, eq(aiInteractions.lifecycleId, entityLifecycle.id))
      .where(
        and(
          eq(aiInteractions.userId, user.id),
          eq(aiInteractions.interactionType, 'chat'),
          isNotNull(aiInteractions.chatSessionId),
          isNotNull(aiInteractions.chatMessageRole),
        ),
      )
      .orderBy(desc(entityLifecycle.createdAt))
      .limit(1);
    sid = latest?.sid ?? null;
  }

  if (!sid) return { sessionId: null, messages: [] };

  const rows = await db
    .select({
      role: aiInteractions.chatMessageRole,
      promptText: aiInteractions.promptText,
      responseText: aiInteractions.responseText,
      seq: aiInteractions.seq,
    })
    .from(aiInteractions)
    .where(
      and(
        eq(aiInteractions.chatSessionId, sid),
        eq(aiInteractions.userId, user.id),
        isNotNull(aiInteractions.chatMessageRole),
      ),
    )
    .orderBy(asc(aiInteractions.seq));

  const sliceStart = Math.max(0, rows.length - CHAT_HISTORY_API_MAX);
  const sliced = rows.slice(sliceStart);

  const messages = sliced
    .map((r) => {
      const isUser = r.role === 'user';
      const text = (isUser ? r.promptText : r.responseText) ?? '';
      return { role: isUser ? ('user' as const) : ('assistant' as const), text };
    })
    .filter((m) => m.text.trim().length > 0);

  return { sessionId: sid, messages };
}

function renderHistoryForPrompt(history: Array<{ role: 'user' | 'assistant'; content: string }>): string {
  if (!history.length) return '';
  return history
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.slice(0, 600)}`)
    .join('\n');
}

function formatHistoryTranscript(history: Array<{ role: 'user' | 'assistant'; content: string }>): string {
  return history
    .map((m) => `${m.role === 'user' ? 'Member' : 'Assistant'}: ${m.content}`.trim())
    .filter(Boolean)
    .join('\n');
}

/**
 * Member explicitly asks to persist the plan (after Q&A in chat).
 * Must be a short command only — long messages can mention "save my workout plan" as instructions
 * (e.g. Generate-plan intro) and must NOT trigger an immediate DB write.
 */
function memberRequestsWorkoutPlanSave(message: string): boolean {
  const t = message.trim().replace(/\*+/g, '').replace(/\s+/g, ' ').trim();
  if (t.length < 8 || t.length > 120) return false;
  const patterns = [
    /^please\s+save\s+(my\s+)?workout\s+plan[.!]*$/i,
    /^save\s+(my\s+)?workout\s+plan[.!]*$/i,
    /^save\s+this\s+workout\s+plan[.!]*$/i,
    /^save\s+this\s+plan[.!]*$/i,
    /^save\s+my\s+plan[.!]*$/i,
    /^create\s+and\s+save\s+my\s+plan[.!]*$/i,
    /^generate\s+and\s+save\s+(my\s+)?workout\s+plan[.!]*$/i,
    /^save\s+(the\s+)?plan\s+to\s+my\s+programmes[.!]*$/i,
    /^save\s+it\s+to\s+my\s+programmes[.!]*$/i,
    /^add\s+(this\s+|the\s+)?plan\s+to\s+my\s+programmes[.!]*$/i,
  ];
  return patterns.some((re) => re.test(t));
}

function scoreDoc(message: string, doc: TrainingDoc): number {
  const text = message.toLowerCase();
  let score = 0;
  for (const tag of doc.tags ?? []) {
    if (text.includes(tag.toLowerCase())) score += 2;
  }
  const words = text.split(/\s+/).filter(Boolean);
  for (const w of words) {
    if ((doc.content ?? '').toLowerCase().includes(w)) score += 0.1;
  }
  return score;
}

async function localRag(message: string): Promise<string | null> {
  const docs = await loadTrainingDocs();
  if (!docs.length) return null;
  const ranked = docs
    .map((d) => ({ d, score: scoreDoc(message, d) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  if (!ranked.length) return null;
  const ctx = ranked.map((r) => `- ${r.d.content}`).join('\n');
  return `Here is guidance based on the GymSphere knowledge base:\n${ctx}`;
}

async function fetchTextWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...init, signal: controller.signal });
    const text = await resp.text();
    return { ok: resp.ok, status: resp.status, text };
  } finally {
    clearTimeout(t);
  }
}

/** Gemini chat was capped at 700 tokens, cutting answers mid-sentence; chat/insights use higher budgets. */
const GEMINI_CHAT_MAX_OUTPUT_TOKENS = 4096;
const GEMINI_INSIGHTS_MAX_OUTPUT_TOKENS = 4096;

type GeminiCallOptions = {
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
};

async function callGemini(prompt: string, options?: GeminiCallOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
  const model = process.env.GEMINI_MODEL ?? GEMINI_MODEL_DEFAULT;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const maxOutputTokens = options?.maxOutputTokens ?? GEMINI_CHAT_MAX_OUTPUT_TOKENS;
  const temperature = options?.temperature ?? 0.4;
  const topP = options?.topP ?? 0.9;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature, topP, maxOutputTokens },
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Gemini request failed: ${resp.status} ${text}`);
  }
  const json = await resp.json() as any;
  const candidate = json?.candidates?.[0];
  const textOut: string = candidate?.content?.parts?.[0]?.text ?? '';
  if (!textOut.trim()) return 'No response generated.';
  const finishReason = candidate?.finishReason as string | undefined;
  if (String(finishReason ?? '').includes('MAX_TOKENS')) {
    return `${textOut.trim()}\n\n(Reply stopped at the model length limit—you can ask a shorter follow-up for more detail.)`;
  }
  return textOut;
}

async function extractWorkoutPreferencesFromChatTranscript(transcript: string): Promise<AiWorkoutPlanPreferences | undefined> {
  if (!transcript.trim() || !process.env.GEMINI_API_KEY) return undefined;
  try {
    const prompt = `This is a multi-turn chat between a gym member and a coach (not a single form). Infer workout plan preferences from the **whole** thread—merge partial answers across turns. Return ONLY valid JSON with optional string fields:
primaryFocus, daysPerWeek, sessionLength, equipmentAccess, emphasis, avoidOrInjuries, extraNotes.
Use concise phrases. Omit a key only if never implied. No markdown.

Transcript:
${transcript.slice(0, 14_000)}`;
    const raw = await callGemini(prompt, { maxOutputTokens: 900, temperature: 0.1 });
    const clean = raw.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(clean) as unknown;
    return parseWorkoutPlanPreferences(parsed);
  } catch {
    return undefined;
  }
}

async function handleMemberWorkoutPlanSaveFromChat(
  user: AuthUser,
  message: string,
  resolvedSessionId: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<{ answer: string; source: 'gemini' | 'fallback'; sessionId: string }> {
  try {
    const transcript = formatHistoryTranscript(history);
    const preferences = await extractWorkoutPreferencesFromChatTranscript(transcript);
    const plan = await createAiWorkoutPlan(user, { preferences });
    const title = plan.name?.trim() || 'Your new plan';
    const answer = `All set — **${title}** is saved under **Workouts → My programmes**. Open it there to review each day and start training when you are ready.`;
    await appendChatMessage(resolvedSessionId, user, 'assistant', answer, 'gemini');
    await logInteraction(user, {
      interactionType: 'chat',
      promptText: message,
      responseText: answer,
      source: 'gemini',
      metadata: { route: 'member_chat_workout_plan_saved', planId: plan.id ?? null },
    });
    return { answer, source: 'gemini', sessionId: resolvedSessionId };
  } catch (err) {
    const msg = err instanceof AppError ? err.message : err instanceof Error ? err.message : 'Could not create your plan.';
    const answer = `I could not save your plan: ${msg}`;
    await appendChatMessage(resolvedSessionId, user, 'assistant', answer, 'fallback');
    await logInteraction(user, {
      interactionType: 'chat',
      promptText: message,
      responseText: answer,
      source: 'fallback',
      metadata: { route: 'member_chat_workout_plan_save_failed', error: String(msg).slice(0, 500) },
    });
    return { answer, source: 'fallback', sessionId: resolvedSessionId };
  }
}

async function embedText(text: string): Promise<number[]> {
  if (Date.now() < embeddingCooldownUntil) {
    throw new Error(`Gemini embed cooldown active: ${embeddingCooldownReason || 'recent rate limit'}`);
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured for embeddings');
  const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL ?? GEMINI_EMBEDDING_MODEL_DEFAULT;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${embeddingModel}:embedContent?key=${encodeURIComponent(apiKey)}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      // Retrieval-focused vectors behave better for RAG ranking.
      taskType: 'RETRIEVAL_DOCUMENT',
    }),
  });
  if (!resp.ok) {
    const textBody = await resp.text();
    if (resp.status === 429) {
      embeddingCooldownUntil = Date.now() + 60_000;
      embeddingCooldownReason = 'Gemini embeddings quota/rate limit (429)';
    }
    throw new Error(`Gemini embed failed: ${resp.status} ${textBody}`);
  }
  const json = await resp.json() as any;
  const vector: number[] | undefined = json?.embedding?.values;
  if (!Array.isArray(vector)) throw new Error('Invalid embedding response');
  return vector;
}

export async function selfTestGemini(): Promise<{
  generate: { ok: boolean; status?: number; error?: string };
  embed: { ok: boolean; status?: number; error?: string };
}> {
  const model = process.env.GEMINI_MODEL ?? GEMINI_MODEL_DEFAULT;
  const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL ?? GEMINI_EMBEDDING_MODEL_DEFAULT;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      generate: { ok: false, error: 'GEMINI_API_KEY not configured' },
      embed: { ok: false, error: 'GEMINI_API_KEY not configured' },
    };
  }

  const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const embUrl = `https://generativelanguage.googleapis.com/v1beta/models/${embeddingModel}:embedContent?key=${encodeURIComponent(apiKey)}`;

  const [gen, emb] = await Promise.allSettled([
    fetchTextWithTimeout(genUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Respond with exactly: ok' }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 10 },
      }),
    }, 10_000),
    fetchTextWithTimeout(embUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text: 'ok' }] },
        taskType: 'RETRIEVAL_DOCUMENT',
      }),
    }, 10_000),
  ]);

  const normalize = (r: PromiseSettledResult<{ ok: boolean; status: number; text: string }>) => {
    if (r.status === 'rejected') {
      const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
      return { ok: false, error: msg };
    }
    const { ok, status, text } = r.value;
    if (ok) return { ok: true, status };
    const clipped = String(text ?? '').slice(0, 900);
    return { ok: false, status, error: clipped || 'Request failed' };
  };

  return {
    generate: normalize(gen),
    embed: normalize(emb),
  };
}

export async function getAiDiagnostics(): Promise<{
  embeddingCooldownSec: number;
  chatSessions: number;
  chatMessages: number;
}> {
  let chatSessions = 0;
  let chatMessages = 0;
  try {
    const [s] = await db
      .select({ c: sql<number>`count(distinct ${aiInteractions.chatSessionId})` })
      .from(aiInteractions)
      .where(isNotNull(aiInteractions.chatSessionId));
    const [m] = await db
      .select({ c: sql<number>`count(*)` })
      .from(aiInteractions)
      .where(isNotNull(aiInteractions.chatMessageRole));
    chatSessions = Number(s?.c ?? 0);
    chatMessages = Number(m?.c ?? 0);
  } catch {
    // keep diagnostics best effort
  }
  return {
    embeddingCooldownSec: Math.max(0, Math.ceil((embeddingCooldownUntil - Date.now()) / 1000)),
    chatSessions,
    chatMessages,
  };
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const va = a[i] ?? 0;
    const vb = b[i] ?? 0;
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom ? dot / denom : 0;
}

async function ensureEmbeddings(): Promise<{ docs: TrainingDoc[]; vectors: { docId: string; vector: number[] }[] }> {
  const docs = await loadTrainingDocs();
  if (!docs.length) return { docs, vectors: [] };
  if (Date.now() < embeddingCooldownUntil) {
    // Reuse best available cache during cooldown; avoid repeated 429 hammering.
    return { docs, vectors: embeddingCache ?? [] };
  }
  const existing = new Map<string, number[]>();
  for (const e of embeddingCache ?? []) existing.set(e.docId, e.vector);

  // Only compute missing embeddings; don't require a "perfect" cache to reuse.
  const vectors: { docId: string; vector: number[] }[] = [];
  for (const doc of docs) {
    const cached = existing.get(doc.id);
    if (cached && cached.length) {
      vectors.push({ docId: doc.id, vector: cached });
      continue;
    }
    try {
      const basis = [
        doc.content,
        ...(doc.tags ?? []),
        ...(doc.faqPairs?.map((f) => `${f.q} ${f.a}`) ?? []),
        doc.workoutTemplate?.goal ?? '',
        doc.businessRule?.rule ?? '',
      ].filter(Boolean).join('\n');
      const vec = await embedText(basis);
      vectors.push({ docId: doc.id, vector: vec });
    } catch (err) {
      const parsed = parseGeminiHttpError(err);
      if (parsed.rateLimited) {
        embeddingCooldownUntil = Date.now() + 60_000;
        embeddingCooldownReason = 'Gemini embeddings quota/rate limit (429)';
      }
      // skip embedding failure for individual doc
    }
  }
  embeddingCache = vectors;
  return { docs, vectors };
}

async function retrieveRagContext(message: string, opts?: { role?: string; topicHint?: string; maxItems?: number }): Promise<ScoredDoc[]> {
  const { docs, vectors } = await ensureEmbeddings();
  if (!docs.length || !vectors.length) {
    return (await loadTrainingDocs())
      .map((d) => ({ doc: d, score: scoreDoc(message, d) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, opts?.maxItems ?? 3);
  }

  let queryVec: number[] | null = null;
  try {
    queryVec = await embedText([opts?.topicHint, message].filter(Boolean).join('\n'));
  } catch {
    queryVec = null;
  }
  if (!queryVec) {
    return (await loadTrainingDocs())
      .map((d) => ({ doc: d, score: scoreDoc(message, d) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, opts?.maxItems ?? 3);
  }

  const scored: ScoredDoc[] = [];
  for (const { docId, vector } of vectors) {
    const doc = docs.find((d) => d.id === docId);
    if (!doc) continue;
    if (opts?.role && doc.role && doc.role !== opts.role && doc.role !== 'generic') continue;
    if (opts?.topicHint && doc.topic && doc.topic !== 'other') {
      const hint = opts.topicHint.toLowerCase();
      if (!doc.topic.toLowerCase().includes(hint)) continue;
    }
    const sim = cosineSimilarity(queryVec, vector);
    if (sim <= 0) continue;
    scored.push({ doc, score: sim });
  }

  scored.sort((a, b) => b.score - a.score);
  const maxItems = opts?.maxItems ?? 4;
  return scored.slice(0, maxItems);
}

async function logInteraction(
  user: AuthUser,
  input: {
    interactionType: 'chat' | 'workout_plan' | 'insight';
    promptText?: string;
    responseText?: string;
    source: 'rag' | 'gemini' | 'fallback';
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    const intLc = await insertLifecycleRow();
    await db.insert(aiInteractions).values({
      id: ids.uuid(),
      lifecycleId: intLc,
      userId: user.id,
      userRole: user.role as UserRole,
      interactionType: input.interactionType,
      promptText: input.promptText ?? null,
      responseText: input.responseText ?? null,
      source: input.source,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
    });
  } catch {
    // non-blocking logging for compatibility
  }
}

async function callExternalRag(user: AuthUser, message: string): Promise<string | null> {
  const ragUrl = process.env.RAG_SERVICE_URL;
  if (!ragUrl) return null;
  try {
    const res = await fetch(`${ragUrl.replace(/\/+$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: `gym-${user.id}`,
        message,
        context: { role: user.role, user_id: user.id, branch: 'kiribathgoda' },
      }),
    });
    if (!res.ok) return null;
    const body = await res.json() as any;
    if (typeof body?.answer === 'string') return body.answer;
    if (typeof body?.response === 'string') return body.response;
    return null;
  } catch {
    return null;
  }
}

async function buildMemberRealtimeContext(userId: string): Promise<string> {
  const [subs, visits, logs] = await Promise.all([
    getMySubscriptions(userId).catch(() => []),
    listMyVisits(userId, 10).catch(() => []),
    listMyWorkoutLogs(userId).catch(() => []),
  ]);
  const latestSub = subs[0] as any;
  const visits7 = visits.filter((v: any) => {
    const at = new Date(v?.checkInAt ?? 0).getTime();
    return Number.isFinite(at) && Date.now() - at <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const workouts14 = logs.filter((w: any) => {
    const at = new Date(w?.workoutDate ?? 0).getTime();
    return Number.isFinite(at) && Date.now() - at <= 14 * 24 * 60 * 60 * 1000;
  }).length;
  const avgDuration = logs.length
    ? Math.round(logs.reduce((s: number, l: any) => s + Number(l.durationMin ?? 0), 0) / logs.length)
    : 0;
  return [
    `Subscription: ${latestSub ? `${latestSub.planName} (${latestSub.status})` : 'none'}`,
    `Visits last 7 days: ${visits7}`,
    `Workouts last 14 days: ${workouts14}`,
    `Average workout duration: ${avgDuration} min`,
  ].join('\n');
}

async function buildManagerTrendContext(userId: string): Promise<string> {
  const [dashboard, attendanceReport, revenueReport, equipmentReport] = await Promise.all([
    getDashboard('manager', userId),
    getReportSummary({ type: 'attendance' }).catch(() => ({} as any)),
    getReportSummary({ type: 'revenue' }).catch(() => ({} as any)),
    getReportSummary({ type: 'equipment' }).catch(() => ({} as any)),
  ]);
  const daily = Array.isArray((attendanceReport as any).daily) ? (attendanceReport as any).daily : [];
  const recent = daily.slice(-7);
  const previous = daily.slice(-14, -7);
  const recentAvg = recent.length ? recent.reduce((s: number, d: any) => s + Number(d.count ?? 0), 0) / recent.length : 0;
  const previousAvg = previous.length ? previous.reduce((s: number, d: any) => s + Number(d.count ?? 0), 0) / previous.length : 0;
  const attendanceDelta = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
  const trend = attendanceDelta > 5 ? 'improving' : attendanceDelta < -5 ? 'declining' : 'flat';
  const methodTotals = Array.isArray((revenueReport as any).byMethod) ? (revenueReport as any).byMethod : [];
  const openCriticalIncidents = Array.isArray((equipmentReport as any).bySeverity)
    ? (equipmentReport as any).bySeverity.filter((x: any) => x.status === 'open' && (x.severity === 'high' || x.severity === 'critical')).reduce((s: number, x: any) => s + Number(x.count ?? 0), 0)
    : 0;
  return [
    `KPI: activeMembers=${dashboard.activeMembers}, todayVisits=${dashboard.todayVisits}, monthlyRevenue=${dashboard.monthlyRevenue}, openIssues=${dashboard.openIssues}`,
    `Attendance 7-day avg: ${recentAvg.toFixed(1)} vs prior week ${previousAvg.toFixed(1)} (${attendanceDelta.toFixed(1)}%) => trend=${trend}`,
    `Payment mix rows: ${methodTotals.length}`,
    `Open high/critical incidents: ${openCriticalIncidents}`,
  ].join('\n');
}

export async function memberChat(user: AuthUser, message: string, sessionId?: string): Promise<{ answer: string; source: 'rag' | 'gemini' | 'fallback'; sessionId: string }> {
  const resolvedSessionId = await ensureChatSession(user, 'member', sessionId);
  try {
    return await runMemberChat(user, message, resolvedSessionId);
  } catch (err) {
    console.error('[ai] memberChat unhandled', err);
    const answer =
      'Sorry — something went wrong while processing that. Please try again in a moment. If it keeps happening, mention this to staff.';
    try {
      await appendChatMessage(resolvedSessionId, user, 'assistant', answer, 'fallback');
    } catch {
      /* ignore secondary failures */
    }
    return { answer, source: 'fallback', sessionId: resolvedSessionId };
  }
}

async function runMemberChat(
  user: AuthUser,
  message: string,
  resolvedSessionId: string,
): Promise<{ answer: string; source: 'rag' | 'gemini' | 'fallback'; sessionId: string }> {
  await appendChatMessage(resolvedSessionId, user, 'user', message, 'system');
  const history = await getRecentSessionMessages(resolvedSessionId, 20);

  if (user.role === 'member' && memberRequestsWorkoutPlanSave(message)) {
    return handleMemberWorkoutPlanSaveFromChat(user, message, resolvedSessionId, history);
  }

  const ragAnswer = await callExternalRag(user, message);
  if (ragAnswer) {
    await appendChatMessage(resolvedSessionId, user, 'assistant', ragAnswer, 'rag');
    await logInteraction(user, { interactionType: 'chat', promptText: message, responseText: ragAnswer, source: 'rag', metadata: { route: 'external_rag' } });
    return { answer: ragAnswer, source: 'rag', sessionId: resolvedSessionId };
  }

  let contextBlocks: string[] = [];
  let retrieved: ScoredDoc[] = [];
  try {
    retrieved = await retrieveRagContext(message, { role: user.role, topicHint: 'workouts,subscriptions,usage', maxItems: 4 });
    if (retrieved.length) {
      contextBlocks = retrieved.map((r) => `- (${r.score.toFixed(2)}) ${r.doc.content}`);
    }
  } catch {
    const local = await localRag(message);
    if (local) {
      await appendChatMessage(resolvedSessionId, user, 'assistant', local, 'rag');
      return { answer: local, source: 'rag', sessionId: resolvedSessionId };
    }
  }

  const systemPrompt = `
${BRANCH_CONTEXT}
You are the Member AI assistant for GymSphere.
- Audience: gym members only.
- Voice: warm, conversational, and human—like a knowledgeable gym coach texting them. Ask **one or two** focused follow-ups at a time; never demand a long checklist in one message. Build on what they already said; if they only answer part of a question, acknowledge it and ask the next small thing naturally.
- Capabilities: explain workout plans, suggest safe starting points, clarify subscriptions/check-ins, and guide on using the app.
- Safety: never give medical diagnosis; suggest consulting a doctor for health concerns.
- Use the RAG knowledge context as ground truth for policies and workout templates.
- **Workout plan flow:** If they want a new programme saved under **My programmes**, have a relaxed back-and-forth (goals, days/week, time, equipment, injuries, emphasis)—gather details across several turns if needed. When you have enough to build a solid plan, say so briefly. They save it by sending a **single short line** on its own, e.g. \`Save my workout plan\`—remind them of that only when appropriate, not every reply.
- **Formatting:** Use GitHub-flavoured **Markdown** in your replies (**bold** for key terms, short lists where helpful, \`code\` for short tokens). Keep paragraphs scannable; avoid walls of text.
`;

  const ragContext = contextBlocks.length
    ? `RAG knowledge snippets:\n${contextBlocks.join('\n')}\n`
    : '';

  const realtime = await buildMemberRealtimeContext(user.id);
  const historyText = renderHistoryForPrompt(history.slice(0, -1));
  const userPrompt = `
Member: ${user.fullName}
Role: ${user.role}
Realtime member context:
${realtime}
Recent conversation:
${historyText || '- none'}
Latest message from member:
${message}

Reply naturally using the branch context and RAG snippets. Be concrete and practical; match the length to the question (short questions get concise answers). Use Markdown.`;

  const prompt = `${systemPrompt}\n${ragContext}\n${userPrompt}`;

  try {
    const answer = await callGemini(prompt, { maxOutputTokens: GEMINI_CHAT_MAX_OUTPUT_TOKENS });
    await appendChatMessage(resolvedSessionId, user, 'assistant', answer, 'gemini');
    await logInteraction(user, {
      interactionType: 'chat',
      promptText: message,
      responseText: answer,
      source: 'gemini',
      metadata: {
        route: 'member_chat',
        ragPipeline: 'retrieveRagContext→gemini',
        ragDocIds: retrieved.map((r) => r.doc.id),
      },
    });
    return { answer, source: 'gemini', sessionId: resolvedSessionId };
  } catch (err) {
    const parsed = parseGeminiHttpError(err);
    console.error('[ai] gemini memberChat failed', {
      status: parsed.status ?? null,
      rateLimited: parsed.rateLimited,
      reason: parsed.message.slice(0, 400),
      model: process.env.GEMINI_MODEL ?? GEMINI_MODEL_DEFAULT,
    });
    const fallbackText = parsed.rateLimited
      ? 'AI is temporarily rate-limited due to quota usage. Please try again in about a minute.'
      : 'I can help with workouts, subscription guidance, appointments, and gym usage. For now, AI service is in fallback mode. Please ask a practical gym question and I will provide a structured recommendation.';
    await logInteraction(user, {
      interactionType: 'chat',
      promptText: message,
      responseText: fallbackText,
      source: 'fallback',
      metadata: {
        route: 'member_chat',
        ragDocIds: retrieved.map((r) => r.doc.id),
        geminiError: parsed.message,
        geminiStatus: parsed.status ?? null,
        rateLimited: parsed.rateLimited,
        geminiModel: process.env.GEMINI_MODEL ?? GEMINI_MODEL_DEFAULT,
        geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      },
    });
    await appendChatMessage(resolvedSessionId, user, 'assistant', fallbackText, 'fallback');
    return {
      source: 'fallback',
      answer: fallbackText,
      sessionId: resolvedSessionId,
    };
  }
}

export async function managerChat(user: AuthUser, message: string, sessionId?: string): Promise<{ answer: string; source: 'rag' | 'gemini' | 'fallback'; sessionId: string }> {
  const resolvedSessionId = await ensureChatSession(user, 'manager', sessionId);
  try {
    return await runManagerChat(user, message, resolvedSessionId);
  } catch (err) {
    console.error('[ai] managerChat unhandled', err);
    const answer = 'Sorry — I could not complete that request. Please try again shortly.';
    try {
      await appendChatMessage(resolvedSessionId, user, 'assistant', answer, 'fallback');
    } catch {
      /* ignore */
    }
    return { answer, source: 'fallback', sessionId: resolvedSessionId };
  }
}

async function runManagerChat(
  user: AuthUser,
  message: string,
  resolvedSessionId: string,
): Promise<{ answer: string; source: 'rag' | 'gemini' | 'fallback'; sessionId: string }> {
  await appendChatMessage(resolvedSessionId, user, 'user', message, 'system');
  const history = await getRecentSessionMessages(resolvedSessionId, 20);
  const [dashboard, report] = await Promise.all([
    getDashboard('manager', user.id),
    getReportSummary(),
  ]);
  const kpis = `
Active members: ${dashboard.activeMembers}
Visits today: ${dashboard.todayVisits}
Open issues: ${dashboard.openIssues}
Monthly revenue: ${dashboard.monthlyRevenue}
Visits in range: ${(report as any).visitsInRange ?? (report as any).visitsLast30Days ?? 0}
Open incidents: ${(report as Record<string, unknown>).openEquipmentIncidents ?? 0}
`;
  let ragContext = '';
  try {
    const scored = await retrieveRagContext(message, {
      role: 'manager',
      topicHint: 'insights,operations,revenue,attendance,equipment,staffing',
      maxItems: 4,
    });
    if (scored.length) {
      ragContext = scored.map((r) => `- (${r.score.toFixed(2)}) ${r.doc.content}`).join('\n');
    }
  } catch {
    // ignore
  }

  const prompt = `
${BRANCH_CONTEXT}
You are the manager-facing AI assistant for GymSphere.
Use the KPI data for factual grounding and use RAG snippets for policy/best-practice context.
Never fabricate numbers.
Tone: professional but conversational—like a trusted ops partner, not a rigid report.

KPI snapshot:
${kpis}

RAG snippets:
${ragContext || '- None available'}
Realtime trend context:
${await buildManagerTrendContext(user.id)}
Recent conversation:
${renderHistoryForPrompt(history.slice(0, -1)) || '- none'}

Latest message from manager:
${message}

Respond in **Markdown** (bold for emphasis, lists when useful). Structure flexibly: lead with the direct answer, then **recommended actions** (2–3 bullets if appropriate), and **risk to watch** when relevant—skip rigid numbering if a shorter reply fits better.
`;

  try {
    const answer = await callGemini(prompt, { maxOutputTokens: GEMINI_CHAT_MAX_OUTPUT_TOKENS });
    await appendChatMessage(resolvedSessionId, user, 'assistant', answer, 'gemini');
    await logInteraction(user, { interactionType: 'chat', promptText: message, responseText: answer, source: 'gemini', metadata: { route: 'manager_chat' } });
    return { answer, source: 'gemini', sessionId: resolvedSessionId };
  } catch (err) {
    const parsed = parseGeminiHttpError(err);
    console.error('[ai] gemini managerChat failed', {
      status: parsed.status ?? null,
      rateLimited: parsed.rateLimited,
      reason: parsed.message.slice(0, 400),
      model: process.env.GEMINI_MODEL ?? GEMINI_MODEL_DEFAULT,
    });
    const fallbackText = parsed.rateLimited
      ? 'AI is temporarily rate-limited due to quota usage. Please retry in about a minute.'
      : `Current snapshot: ${dashboard.todayVisits} visits today, ${dashboard.openIssues} open issues, and Rs. ${dashboard.monthlyRevenue} monthly revenue. Prioritize unresolved incidents, monitor low-visit members nearing expiry, and balance trainer coverage during peak hours.`;
    await logInteraction(user, { interactionType: 'chat', promptText: message, responseText: fallbackText, source: 'fallback', metadata: { route: 'manager_chat' } });
    await appendChatMessage(resolvedSessionId, user, 'assistant', fallbackText, 'fallback');
    return { answer: fallbackText, source: 'fallback', sessionId: resolvedSessionId };
  }
}

export async function chatForUser(user: AuthUser, message: string, sessionId?: string): Promise<{ answer: string; source: 'rag' | 'gemini' | 'fallback'; sessionId: string }> {
  if (user.role === 'manager' || user.role === 'admin') {
    return managerChat(user, message, sessionId);
  }
  return memberChat(user, message, sessionId);
}

/**
 * Gemini often returns markdown, numbered instructions echoed from the prompt, or mixed paragraphs.
 * Extract a short summary plus bullet insights for a stable API shape.
 */
function parseManagerInsightsAnswer(answer: string): { summary: string; insights: string[] } {
  const raw = answer.replace(/\r\n/g, '\n').trim();
  if (!raw) return { summary: 'Insights generated.', insights: [] };

  const stripDecor = (s: string) =>
    s
      .replace(/^#{1,6}\s+/, '')
      .replace(/^\*\*([^*]+)\*\*:?\s*/i, '$1')
      .replace(/^[*_]+|[*_]+$/g, '')
      .replace(/^([-*•]|\d+[.)]|\[\d+\])\s+/, '')
      .trim();

  const isPromptEcho = (s: string) => {
    const t = s.toLowerCase();
    return (
      /^return\s*:/i.test(s)
      || /^manager question\s*:/i.test(s)
      || /^data snapshot\s*:/i.test(t)
      || /^trend snapshot\s*:/i.test(t)
      || /^one short summary/i.test(t)
      || /^three bullet insights/i.test(t)
      || /^\d+\)\s*(one short|three bullet|mention trend)/i.test(s)
    );
  };

  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !isPromptEcho(l));

  const isBulletLine = (l: string) =>
    /^([-*•]|\d+[.)]|\[\d+\])\s+/.test(l);

  let firstBullet = -1;
  for (let i = 0; i < lines.length; i++) {
    if (isBulletLine(lines[i])) {
      firstBullet = i;
      break;
    }
  }

  const insights: string[] = [];
  if (firstBullet >= 0) {
    for (let i = firstBullet; i < lines.length && insights.length < 12; i++) {
      if (!isBulletLine(lines[i])) continue;
      const c = stripDecor(lines[i]);
      if (c && !isPromptEcho(c)) insights.push(c);
    }
  }

  let summary = '';
  if (firstBullet > 0) {
    summary = lines
      .slice(0, firstBullet)
      .map(stripDecor)
      .filter((s) => s.length > 0 && !isPromptEcho(s))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (!summary && firstBullet === -1) {
    summary = stripDecor(lines[0] ?? '') || lines.join(' ').slice(0, 400);
  } else if (!summary && lines.length) {
    summary = stripDecor(lines[0]);
  }

  if (!summary) summary = stripDecor(lines[lines.length - 1] ?? '') || 'Insights generated.';

  if (insights.length === 0) {
    const tail = firstBullet >= 0 ? lines.slice(firstBullet) : lines.slice(1);
    for (const line of tail) {
      const c = stripDecor(line);
      if (!c || isPromptEcho(c) || isBulletLine(line)) continue;
      insights.push(c);
      if (insights.length >= 3) break;
    }
    if (insights.length === 0 && lines.length > 1) {
      for (const line of lines.slice(1, 4)) {
        const c = stripDecor(line);
        if (c && !isPromptEcho(c)) insights.push(c);
      }
    }
  }

  return {
    summary,
    insights: insights.slice(0, 10),
  };
}

export async function managerInsights(user: AuthUser, question?: string): Promise<{
  content: string;
  summary: string;
  insights: string[];
  generatedBy: 'gemini' | 'fallback';
}> {
  const [dashboard, report] = await Promise.all([
    getDashboard('manager', user.id),
    getReportSummary(),
  ]);

  const baseFacts = `
Active members: ${dashboard.activeMembers}
Visits today: ${dashboard.todayVisits}
Open issues: ${dashboard.openIssues}
Monthly revenue: ${dashboard.monthlyRevenue}
Visits last 30 days: ${(report as any).visitsInRange ?? (report as any).visitsLast30Days ?? 0}
Open incidents: ${(report as Record<string, unknown>).openEquipmentIncidents ?? 0}
`;
  const trendFacts = await buildManagerTrendContext(user.id);

  let ragSnippet = '';
  try {
    const scored = await retrieveRagContext(question ?? 'manager operational insights', {
      role: user.role,
      topicHint: 'insights,operations,revenue,attendance,equipment',
      maxItems: 4,
    });
    if (scored.length) {
      ragSnippet = `\nRAG knowledge for manager (GymSphere):\n${scored
        .map((r) => `- (${r.score.toFixed(2)}) ${r.doc.content}`)
        .join('\n')}\n`;
    }
  } catch {
    // best-effort; continue without RAG
  }

  const prompt = `
${BRANCH_CONTEXT}
You are the Manager Insights AI for GymSphere.
Use the numeric data snapshot and, where available, the RAG knowledge base as ground truth for operational best practices.
Never fabricate numbers—only use values from the snapshot, trends, and RAG text.

Data snapshot:
${baseFacts}
Trend snapshot:
${trendFacts}
${ragSnippet}
Manager question: ${question ?? 'Provide the top operational insights and next actions.'}

Respond in **Markdown** with clear headings, for example:
## Executive summary
(2–4 sentences)

## Priority actions
(5–7 concrete bullets—owners, timelines, or measurable outcomes where sensible)

## Risks & anomalies
(bullets only if the data supports them; otherwise state that none are notable)

## Metrics to watch
(2–4 bullets)

Mention trend direction (improving / flat / declining) only when the trend snapshot supports it.
`;

  try {
    const answer = await callGemini(prompt, { maxOutputTokens: GEMINI_INSIGHTS_MAX_OUTPUT_TOKENS });
    const parsed = parseManagerInsightsAnswer(answer);
    await logInteraction(user, {
      interactionType: 'insight',
      promptText: question ?? 'Provide the top operational insights and next actions.',
      responseText: answer,
      source: 'gemini',
      metadata: { kpi: { todayVisits: dashboard.todayVisits, openIssues: dashboard.openIssues, monthlyRevenue: dashboard.monthlyRevenue } },
    });
    return {
      generatedBy: 'gemini',
      content: answer,
      ...parsed,
    };
  } catch (err) {
    const parsed = parseGeminiHttpError(err);
    console.error('[ai] gemini insights failed', {
      status: parsed.status ?? null,
      rateLimited: parsed.rateLimited,
      reason: parsed.message.slice(0, 400),
      model: process.env.GEMINI_MODEL ?? GEMINI_MODEL_DEFAULT,
    });
    const fallbackSummary = parsed.rateLimited
      ? 'AI insights are temporarily rate-limited due to quota usage. Please retry shortly.'
      : `Today there are ${dashboard.todayVisits} visits with ${dashboard.openIssues} open operational issues.`;
    const fallbackInsights = [
      'Prioritize unresolved equipment incidents before peak evening hours.',
      'Monitor subscription renewals and follow up with inactive members.',
      'Use check-in peaks to align trainer staffing and reduce waiting times.',
    ];
    const fallbackContent = `${fallbackSummary}\n\n## Suggested actions\n${fallbackInsights.map((line) => `- ${line}`).join('\n')}`;
    await logInteraction(user, {
      interactionType: 'insight',
      promptText: question ?? 'Provide the top operational insights and next actions.',
      responseText: fallbackSummary,
      source: 'fallback',
      metadata: { kpi: { todayVisits: dashboard.todayVisits, openIssues: dashboard.openIssues, monthlyRevenue: dashboard.monthlyRevenue } },
    });
    return {
      generatedBy: 'fallback',
      content: fallbackContent,
      summary: fallbackSummary,
      insights: fallbackInsights,
    };
  }
}

export async function createAiWorkoutPlan(
  user: AuthUser,
  input?: { memberId?: string; preferences?: AiWorkoutPlanPreferences },
): Promise<{ id?: string | null; name?: string | null; source?: string | null }> {
  const targetMemberId = input?.memberId && user.role !== 'member' ? input.memberId : user.id;
  const preferences = input?.preferences;
  const plan = await generateAiWorkoutPlan(targetMemberId, user.id, user.role as UserRole, preferences);
  const interactionSource = plan?.source === 'ai_generated' ? 'gemini' : 'fallback';
  const prefSummary = preferences ? JSON.stringify(preferences) : '';
  await logInteraction(user, {
    interactionType: 'workout_plan',
    promptText: prefSummary
      ? `Generate AI workout plan for member ${targetMemberId}\nPreferences: ${prefSummary}`
      : `Generate AI workout plan for member ${targetMemberId}`,
    responseText: `Created plan ${plan?.name ?? ''} (${plan?.id ?? ''})`,
    source: interactionSource,
    metadata: { targetMemberId, planId: plan?.id ?? null, planSource: plan?.source ?? null, preferences: preferences ?? null },
  });
  return { id: plan?.id ?? null, name: plan?.name ?? null, source: plan?.source ?? null };
}

