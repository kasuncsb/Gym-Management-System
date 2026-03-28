import type { AuthUser } from '../middleware/auth.js';
import {
  getDashboard,
  getMySubscriptions,
  getReportSummary,
  listMyVisits,
  listMyWorkoutLogs,
  generateAiWorkoutPlan,
} from './ops.service.js';
import { db } from '../config/database.js';
import { aiChatMessages, aiChatSessions, aiInteractions } from '../db/schema.js';
import { aiChatMsgLc } from '../db/lifecycleAliases.js';
import { ids } from '../utils/id.js';
import { insertLifecycleRow } from '../utils/lifecycle.js';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { and, desc, eq, sql } from 'drizzle-orm';

const BRANCH_CONTEXT = `
PowerWorld Gyms - Kiribathgoda branch.
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

// Note (2026): gemini-2.0-flash is being deprecated; prefer 2.5 flash as default.
const GEMINI_MODEL_DEFAULT = 'gemini-2.5-flash';
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
      resolve(process.cwd(), 'src', 'ai', 'training', 'kiribathgoda.json'),
      resolve(here, '..', 'ai', 'training', 'kiribathgoda.json'),
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

async function ensureChatSession(user: AuthUser, role: 'member' | 'manager', sessionId?: string): Promise<string> {
  if (sessionId) {
    const [existing] = await db
      .select({ id: aiChatSessions.id })
      .from(aiChatSessions)
      .where(and(eq(aiChatSessions.id, sessionId), eq(aiChatSessions.userId, user.id)))
      .limit(1);
    if (existing) return existing.id;
  }
  const id = ids.uuid();
  const lc = await insertLifecycleRow();
  await db.insert(aiChatSessions).values({
    id,
    lifecycleId: lc,
    userId: user.id,
    role,
    title: role === 'manager' ? 'Manager assistant' : 'Member assistant',
    lastMessageAt: new Date(),
  });
  return id;
}

async function appendChatMessage(sessionId: string, userId: string, role: 'user' | 'assistant', content: string, source: ChatSource) {
  const msgLc = await insertLifecycleRow();
  await db.insert(aiChatMessages).values({
    id: ids.uuid(),
    lifecycleId: msgLc,
    sessionId,
    userId,
    role,
    content,
    source,
  });
  await db.update(aiChatSessions).set({ lastMessageAt: new Date() }).where(eq(aiChatSessions.id, sessionId));
}

async function getRecentSessionMessages(sessionId: string, limit = 12): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const rows = await db
    .select({ role: aiChatMessages.role, content: aiChatMessages.content })
    .from(aiChatMessages)
    .innerJoin(aiChatMsgLc, eq(aiChatMessages.lifecycleId, aiChatMsgLc.id))
    .where(eq(aiChatMessages.sessionId, sessionId))
    .orderBy(desc(aiChatMsgLc.createdAt))
    .limit(limit);
  return rows.reverse();
}

function renderHistoryForPrompt(history: Array<{ role: 'user' | 'assistant'; content: string }>): string {
  if (!history.length) return '';
  return history
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.slice(0, 600)}`)
    .join('\n');
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
  return `Here is guidance based on PowerWorld Kiribathgoda knowledge base:\n${ctx}`;
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

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
  const model = process.env.GEMINI_MODEL ?? GEMINI_MODEL_DEFAULT;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, topP: 0.9, maxOutputTokens: 700 },
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Gemini request failed: ${resp.status} ${text}`);
  }
  const json = await resp.json() as any;
  return json?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response generated.';
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
    const [s] = await db.select({ c: sql<number>`count(*)` }).from(aiChatSessions);
    const [m] = await db.select({ c: sql<number>`count(*)` }).from(aiChatMessages);
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
  await appendChatMessage(resolvedSessionId, user.id, 'user', message, 'system');
  const history = await getRecentSessionMessages(resolvedSessionId, 12);
  const ragAnswer = await callExternalRag(user, message);
  if (ragAnswer) {
    await appendChatMessage(resolvedSessionId, user.id, 'assistant', ragAnswer, 'rag');
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
      await appendChatMessage(resolvedSessionId, user.id, 'assistant', local, 'rag');
      return { answer: local, source: 'rag', sessionId: resolvedSessionId };
    }
  }

  const systemPrompt = `
${BRANCH_CONTEXT}
You are the Member AI assistant for PowerWorld Kiribathgoda.
- Audience: gym members only.
- Capabilities: explain workout plans, suggest safe starting points, clarify subscriptions/check-ins, and guide on using the app.
- Safety: never give medical diagnosis; suggest consulting a doctor for health concerns.
- Use the RAG knowledge context as ground truth for policies and workout templates.
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
Question: ${message}

Using the branch context and RAG snippets above, answer in 1–3 short paragraphs or bullet points. Be concrete and practical.`;

  const prompt = `${systemPrompt}\n${ragContext}\n${userPrompt}`;

  try {
    const answer = await callGemini(prompt);
    await appendChatMessage(resolvedSessionId, user.id, 'assistant', answer, 'gemini');
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
    await appendChatMessage(resolvedSessionId, user.id, 'assistant', fallbackText, 'fallback');
    return {
      source: 'fallback',
      answer: fallbackText,
      sessionId: resolvedSessionId,
    };
  }
}

export async function managerChat(user: AuthUser, message: string, sessionId?: string): Promise<{ answer: string; source: 'rag' | 'gemini' | 'fallback'; sessionId: string }> {
  const resolvedSessionId = await ensureChatSession(user, 'manager', sessionId);
  await appendChatMessage(resolvedSessionId, user.id, 'user', message, 'system');
  const history = await getRecentSessionMessages(resolvedSessionId, 12);
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
Open incidents: ${report.openEquipmentIncidents}
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
You are the manager-facing AI assistant for PowerWorld Kiribathgoda.
Use the KPI data for factual grounding and use RAG snippets for policy/best-practice context.
Never fabricate numbers.

KPI snapshot:
${kpis}

RAG snippets:
${ragContext || '- None available'}
Realtime trend context:
${await buildManagerTrendContext(user.id)}
Recent conversation:
${renderHistoryForPrompt(history.slice(0, -1)) || '- none'}

Manager question:
${message}

Return concise guidance with:
1) direct answer
2) 2-3 recommended actions
3) one risk to monitor.
`;

  try {
    const answer = await callGemini(prompt);
    await appendChatMessage(resolvedSessionId, user.id, 'assistant', answer, 'gemini');
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
    await appendChatMessage(resolvedSessionId, user.id, 'assistant', fallbackText, 'fallback');
    return { answer: fallbackText, source: 'fallback', sessionId: resolvedSessionId };
  }
}

export async function chatForUser(user: AuthUser, message: string, sessionId?: string): Promise<{ answer: string; source: 'rag' | 'gemini' | 'fallback'; sessionId: string }> {
  if (user.role === 'manager' || user.role === 'admin') {
    return managerChat(user, message, sessionId);
  }
  return memberChat(user, message, sessionId);
}

export async function managerInsights(user: AuthUser, question?: string): Promise<{ summary: string; insights: string[]; generatedBy: 'gemini' | 'fallback' }> {
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
Open incidents: ${report.openEquipmentIncidents}
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
      ragSnippet = `\nRAG knowledge for manager (Kiribathgoda):\n${scored
        .map((r) => `- (${r.score.toFixed(2)}) ${r.doc.content}`)
        .join('\n')}\n`;
    }
  } catch {
    // best-effort; continue without RAG
  }

  const prompt = `
${BRANCH_CONTEXT}
You are the Manager Insights AI for PowerWorld Kiribathgoda.
Use the numeric data snapshot and, where available, the RAG knowledge base as ground truth for operational best practices.

Data snapshot:
${baseFacts}
Trend snapshot:
${trendFacts}
${ragSnippet}
Manager question: ${question ?? 'Provide the top operational insights and next actions.'}

Return:
1) One short summary sentence
2) 3 bullet insights with actionable recommendations tailored to this single branch.
3) Mention trend direction (improving/flat/declining) and any anomaly signal only if data supports it.
`;

  try {
    const answer = await callGemini(prompt);
    const lines = answer.split('\n').map((s) => s.trim()).filter(Boolean);
    await logInteraction(user, {
      interactionType: 'insight',
      promptText: question ?? 'Provide the top operational insights and next actions.',
      responseText: answer,
      source: 'gemini',
      metadata: { kpi: { todayVisits: dashboard.todayVisits, openIssues: dashboard.openIssues, monthlyRevenue: dashboard.monthlyRevenue } },
    });
    return {
      generatedBy: 'gemini',
      summary: lines[0] ?? 'Insights generated.',
      insights: lines.slice(1, 4),
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
    await logInteraction(user, {
      interactionType: 'insight',
      promptText: question ?? 'Provide the top operational insights and next actions.',
      responseText: fallbackSummary,
      source: 'fallback',
      metadata: { kpi: { todayVisits: dashboard.todayVisits, openIssues: dashboard.openIssues, monthlyRevenue: dashboard.monthlyRevenue } },
    });
    return {
      generatedBy: 'fallback',
      summary: fallbackSummary,
      insights: [
        'Prioritize unresolved equipment incidents before peak evening hours.',
        'Monitor subscription renewals and follow up with inactive members.',
        'Use check-in peaks to align trainer staffing and reduce waiting times.',
      ],
    };
  }
}

export async function createAiWorkoutPlan(
  user: AuthUser,
  input?: { memberId?: string },
): Promise<{ id?: string | null; name?: string | null; source?: string | null }> {
  const targetMemberId = input?.memberId && user.role !== 'member' ? input.memberId : user.id;
  const plan = await generateAiWorkoutPlan(targetMemberId, user.id, user.role as UserRole);
  const interactionSource = plan?.source === 'ai_generated' ? 'gemini' : 'fallback';
  await logInteraction(user, {
    interactionType: 'workout_plan',
    promptText: `Generate AI workout plan for member ${targetMemberId}`,
    responseText: `Created plan ${plan?.name ?? ''} (${plan?.id ?? ''})`,
    source: interactionSource,
    metadata: { targetMemberId, planId: plan?.id ?? null, planSource: plan?.source ?? null },
  });
  return { id: plan?.id ?? null, name: plan?.name ?? null, source: plan?.source ?? null };
}

