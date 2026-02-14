// Express Application Setup
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/error-handler.middleware';
import { requestLogger } from './middleware/logger.middleware';
import { apiRateLimit } from './middleware/rate-limit.middleware';
import { env } from './config/env';
import { cache } from './utils/cache';

// Import routes
import authRoutes from './routes/auth.routes';
import memberRoutes from './routes/member.routes';
import qrRoutes from './routes/qr.routes';
import subscriptionRoutes from './routes/subscription.routes';
import equipmentRoutes from './routes/equipment.routes';
import publicRoutes from './routes/public.routes';
import dashboardRoutes from './routes/dashboard.routes';
import adminRoutes from './routes/admin.routes';
import managerRoutes from './routes/manager.routes';
import staffRoutes from './routes/staff.routes';
import vitalsRoutes from './routes/vitals.routes';
import workoutRoutes from './routes/workout.routes';
import trainerRoutes from './routes/trainer.routes';
import paymentRoutes from './routes/payment.routes';
import shiftRoutes from './routes/shift.routes';
import notificationRoutes from './routes/notification.routes';
import inventoryRoutes from './routes/inventory.routes';
import reportingRoutes from './routes/reporting.routes';
import analyticsRoutes from './routes/analytics.routes';
import auditRoutes from './routes/audit.routes';
import healthConnectRoutes from './routes/health-connect.routes';

const app: Application = express();

// Security middleware with custom CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", env.FRONTEND_URL],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use('/api/', apiRateLimit);

// Health check with uptime & cache stats
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'PowerWorld Gym API',
        version: '1.0.0',
        uptime: Math.floor(process.uptime()),
        cache: cache.stats(),
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/health-connect', healthConnectRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Route not found'
        }
    });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
