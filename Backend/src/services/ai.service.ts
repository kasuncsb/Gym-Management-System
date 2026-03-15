import type { AuthUser } from '../middleware/auth.js';
import { getDashboard, getReportSummary } from './ops.service.js';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BRANCH_CONTEXT = `
PowerWorld Gyms - Kiribathgoda branch.
Focus on safe workout advice, membership guidance, check-in rules, and trainer session support.
Never provide diagnosis. For medical concerns, advise consulting a professional.
`;

type TrainingDoc = { id: string; tags: string[]; content: string };
let trainingCache: TrainingDoc[] | null = null;

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
    const parsed = JSON.parse(raw) as TrainingDoc[];
    trainingCache = Array.isArray(parsed) ? parsed : [];
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
    .slice(0, 2);
  if (!ranked.length) return null;
  const ctx = ranked.map((r) => `- ${r.d.content}`).join('\n');
  return `Here is guidance based on PowerWorld Kiribathgoda knowledge base:\n${ctx}`;
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
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
  if (ragAnswer) return { answer: ragAnswer, source: 'rag' };
  const local = await localRag(message);
  if (local) return { answer: local, source: 'rag' };

  const prompt = `
${BRANCH_CONTEXT}
User role: ${user.role}
User name: ${user.fullName}
Question: ${message}

Respond as a helpful assistant for gym members. Keep it practical and concise.
`;

  try {
    const answer = await callGemini(prompt);
    return { answer, source: 'gemini' };
  } catch {
    return {
      source: 'fallback',
      answer: 'I can help with workouts, subscription guidance, appointments, and gym usage. For now, AI service is in fallback mode. Please ask a practical gym question and I will provide a structured recommendation.',
    };
  }
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

  const prompt = `
${BRANCH_CONTEXT}
You are generating manager insights for PowerWorld Kiribathgoda.
Data snapshot:
${baseFacts}
Manager question: ${question ?? 'Provide the top operational insights and next actions.'}

Return:
1) One short summary sentence
2) 3 bullet insights with actionable recommendations.
`;

  try {
    const answer = await callGemini(prompt);
    const lines = answer.split('\n').map((s) => s.trim()).filter(Boolean);
    return {
      generatedBy: 'gemini',
      summary: lines[0] ?? 'Insights generated.',
      insights: lines.slice(1, 4),
    };
  } catch {
    return {
      generatedBy: 'fallback',
      summary: `Today there are ${dashboard.todayVisits} visits with ${dashboard.openIssues} open operational issues.`,
      insights: [
        'Prioritize unresolved equipment incidents before peak evening hours.',
        'Monitor subscription renewals and follow up with inactive members.',
        'Use check-in peaks to align trainer staffing and reduce waiting times.',
      ],
    };
  }
}

