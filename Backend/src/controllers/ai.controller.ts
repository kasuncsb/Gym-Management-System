import { Response } from 'express';
import { asyncHandler } from '../middleware/error.js';
import * as response from '../utils/response.js';
import type { AuthRequest } from '../middleware/auth.js';
import { errors } from '../utils/errors.js';
import * as aiService from '../services/ai.service.js';
import { parseWorkoutPlanPreferences } from '../validators/aiWorkoutPlanPreferences.js';

function requireUser(req: AuthRequest) {
  if (!req.user) throw errors.unauthorized();
  return req.user;
}

export const health = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const test = await aiService.selfTestGemini();
  const diagnostics = await aiService.getAiDiagnostics();
  res.json(response.success({
    status: 'ok',
    ai: true,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    geminiModel: process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite-preview',
    geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-001',
    ragServiceConfigured: Boolean(process.env.RAG_SERVICE_URL),
    geminiSelfTest: test,
    diagnostics,
  }));
});

const AI_CHAT_MESSAGE_MAX = 8000;

export const chatHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const q = req.query?.sessionId;
  const sessionId = typeof q === 'string' && q.trim() ? q.trim() : undefined;
  res.json(response.success(await aiService.getChatHistoryForUser(user, sessionId)));
});

export const chat = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const message = String(req.body?.message ?? '').trim();
  if (!message) throw errors.badRequest('message is required');
  if (message.length > AI_CHAT_MESSAGE_MAX) {
    throw errors.badRequest(`message must be at most ${AI_CHAT_MESSAGE_MAX} characters`);
  }
  const sessionId = req.body?.sessionId ? String(req.body.sessionId) : undefined;
  const data = await aiService.chatForUser(user, message, sessionId);
  res.json(response.success(data));
});

export const insights = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const question = req.body?.question ? String(req.body.question) : undefined;
  const data = await aiService.managerInsights(user, question);
  res.json(response.success(data));
});

export const workoutPlan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const memberId = req.body?.memberId ? String(req.body.memberId) : undefined;
  const preferences = parseWorkoutPlanPreferences(req.body?.preferences);
  const data = await aiService.createAiWorkoutPlan(user, { memberId, preferences });
  res.json(response.success(data, 'AI workout plan generated'));
});

