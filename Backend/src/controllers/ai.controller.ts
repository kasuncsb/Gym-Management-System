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
  res.json(response.success({ status: 'ok', ai: true }));
});

export const chat = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const message = String(req.body?.message ?? '').trim();
  if (!message) throw errors.badRequest('message is required');
  const data = await aiService.memberChat(user, message);
  res.json(response.success(data));
});

export const insights = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const question = req.body?.question ? String(req.body.question) : undefined;
  const data = await aiService.managerInsights(user, question);
  res.json(response.success(data));
});

