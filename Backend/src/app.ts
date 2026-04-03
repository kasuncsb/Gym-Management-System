import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { notFound, errorHandler } from './middleware/error.js';
import { apiRateLimiter } from './middleware/rate-limit.js';
import authRoutes from './routes/auth.routes.js';
import opsRoutes from './routes/ops.routes.js';
import aiRoutes from './routes/ai.routes.js';

const app = express();

// Trust the first proxy hop (OpenResty/nginx) so rate limiters see real client IPs
app.set('trust proxy', 1);

// Security
app.use(helmet());
// BUG-05 fix: Normalize the FRONTEND_URL — strip trailing slash before using
// it as the CORS origin. A trailing slash ('https://host/') vs no trailing slash
// ('https://host') are treated as different origins by browsers.
const corsOrigin = env.FRONTEND_URL.replace(/\/+$/, '');
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

// Parsing (10 kb JSON limit to prevent payload abuse)
// Allow primitive JSON values (e.g. `null`) for endpoints that accept no body.
// Some clients send `null` as the request body (axios.post(url, null));
// body-parser's default `strict: true` rejects top-level primitives with 400.
app.use(express.json({ limit: '32kb', strict: false }));
app.use(express.urlencoded({ extended: true, limit: '32kb' }));
app.use(cookieParser());

// Health check (no rate limit — for load balancers / readiness)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes — generous rate limit so normal SPA traffic doesn't trigger 429
app.use('/api/auth', apiRateLimiter, authRoutes);
app.use('/api/ops', apiRateLimiter, opsRoutes);
app.use('/api/ai', apiRateLimiter, aiRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
