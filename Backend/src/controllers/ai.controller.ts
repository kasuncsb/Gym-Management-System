import { Response } from 'express';
import { asyncHandler } from '../middleware/error.js';
import * as response from '../utils/response.js';
import type { AuthRequest } from '../middleware/auth.js';
import { errors } from '../utils/errors.js';
import * as aiService from '../services/ai.service.js';

function requireUser(req: AuthRequest) {
  if (!req.user) throw errors.unauthorized();
  return req.user;
}

export const health = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const test = await aiService.selfTestGemini();
  res.json(response.success({
    status: 'ok',
    ai: true,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    geminiModel: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
    geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-001',
    ragServiceConfigured: Boolean(process.env.RAG_SERVICE_URL),
    geminiSelfTest: test,
  }));
});

export const chat = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const message = String(req.body?.message ?? '').trim();
  if (!message) throw errors.badRequest('message is required');
  const data = await aiService.chatForUser(user, message);
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
  const data = await aiService.createAiWorkoutPlan(user, { memberId });
  res.json(response.success(data, 'AI workout plan generated'));
});

