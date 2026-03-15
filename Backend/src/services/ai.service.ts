import type { AuthUser } from '../middleware/auth.js';
import { getDashboard, getReportSummary, generateAiWorkoutPlan } from './ops.service.js';
import { db } from '../config/database.js';
import { aiInteractions } from '../db/schema.js';
import { ids } from '../utils/id.js';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BRANCH_CONTEXT = `
PowerWorld Gyms - Kiribathgoda branch.
Focus on safe workout advice, membership guidance, check-in rules, and trainer session support.
Never provide diagnosis. For medical concerns, advise consulting a professional.
`;

type TrainingDoc = {
  id: string;
  tags?: string[];
  role?: 'member' | 'manager' | 'trainer' | 'admin' | 'staff' | 'generic';
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
    area: 'subscriptions' | 'freezes' | 'revenue' | 'attendance' | 'equipment' | 'staffing' | 'other';
    rule: string;
  };
};

type ScoredDoc = { doc: TrainingDoc; score: number };

let trainingCache: TrainingDoc[] | null = null;
let embeddingCache: { docId: string; vector: number[] }[] | null = null;

const GEMINI_MODEL_DEFAULT = 'gemini-2.0-flash';
const GEMINI_EMBEDDING_MODEL = 'text-embedding-004';
type UserRole = 'admin' | 'manager' | 'staff' | 'trainer' | 'member';

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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured for embeddings');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent?key=${encodeURIComponent(apiKey)}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: { parts: [{ text }] },
    }),
  });
  if (!resp.ok) {
    const textBody = await resp.text();
    throw new Error(`Gemini embed failed: ${resp.status} ${textBody}`);
  }
  const json = await resp.json() as any;
  const vector: number[] | undefined = json?.embedding?.values;
  if (!Array.isArray(vector)) throw new Error('Invalid embedding response');
  return vector;
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
  if (embeddingCache && embeddingCache.length >= docs.length) {
    return { docs, vectors: embeddingCache };
  }
  const vectors: { docId: string; vector: number[] }[] = [];
  for (const doc of docs) {
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
    } catch {
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
    await db.insert(aiInteractions).values({
      id: ids.uuid(),
      userId: user.id,
      userRole: user.role as UserRole,
      interactionType: input.interactionType,
      promptText: input.promptText ?? null,
      responseText: input.responseText ?? null,
      source: input.source,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
      createdAt: new Date(),
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

export async function memberChat(user: AuthUser, message: string): Promise<{ answer: string; source: 'rag' | 'gemini' | 'fallback' }> {
  const ragAnswer = await callExternalRag(user, message);
  if (ragAnswer) {
    await logInteraction(user, { interactionType: 'chat', promptText: message, responseText: ragAnswer, source: 'rag', metadata: { route: 'external_rag' } });
    return { answer: ragAnswer, source: 'rag' };
  }

  let contextBlocks: string[] = [];
  try {
    const scored = await retrieveRagContext(message, { role: user.role, topicHint: 'workouts,subscriptions,usage', maxItems: 4 });
    if (scored.length) {
      contextBlocks = scored.map((r) => `- (${r.score.toFixed(2)}) ${r.doc.content}`);
    }
  } catch {
    const local = await localRag(message);
    if (local) return { answer: local, source: 'rag' };
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

  const userPrompt = `
Member: ${user.fullName}
Role: ${user.role}
Question: ${message}

Using the branch context and RAG snippets above, answer in 1–3 short paragraphs or bullet points. Be concrete and practical.`;

  const prompt = `${systemPrompt}\n${ragContext}\n${userPrompt}`;

  try {
    const answer = await callGemini(prompt);
    await logInteraction(user, { interactionType: 'chat', promptText: message, responseText: answer, source: 'gemini', metadata: { route: 'member_chat' } });
    return { answer, source: 'gemini' };
  } catch {
    const fallbackText = 'I can help with workouts, subscription guidance, appointments, and gym usage. For now, AI service is in fallback mode. Please ask a practical gym question and I will provide a structured recommendation.';
    await logInteraction(user, { interactionType: 'chat', promptText: message, responseText: fallbackText, source: 'fallback', metadata: { route: 'member_chat' } });
    return {
      source: 'fallback',
      answer: fallbackText,
    };
  }
}

export async function managerChat(user: AuthUser, message: string): Promise<{ answer: string; source: 'rag' | 'gemini' | 'fallback' }> {
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

Manager question:
${message}

Return concise guidance with:
1) direct answer
2) 2-3 recommended actions
3) one risk to monitor.
`;

  try {
    const answer = await callGemini(prompt);
    await logInteraction(user, { interactionType: 'chat', promptText: message, responseText: answer, source: 'gemini', metadata: { route: 'manager_chat' } });
    return { answer, source: 'gemini' };
  } catch {
    const fallbackText = `Current snapshot: ${dashboard.todayVisits} visits today, ${dashboard.openIssues} open issues, and Rs. ${dashboard.monthlyRevenue} monthly revenue. Prioritize unresolved incidents, monitor low-visit members nearing expiry, and balance trainer coverage during peak hours.`;
    await logInteraction(user, { interactionType: 'chat', promptText: message, responseText: fallbackText, source: 'fallback', metadata: { route: 'manager_chat' } });
    return { answer: fallbackText, source: 'fallback' };
  }
}

export async function chatForUser(user: AuthUser, message: string): Promise<{ answer: string; source: 'rag' | 'gemini' | 'fallback' }> {
  if (user.role === 'manager' || user.role === 'admin') {
    return managerChat(user, message);
  }
  return memberChat(user, message);
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
${ragSnippet}
Manager question: ${question ?? 'Provide the top operational insights and next actions.'}

Return:
1) One short summary sentence
2) 3 bullet insights with actionable recommendations tailored to this single branch.
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
  } catch {
    const fallbackSummary = `Today there are ${dashboard.todayVisits} visits with ${dashboard.openIssues} open operational issues.`;
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

