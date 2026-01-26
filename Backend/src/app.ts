// Express Application Setup
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error-handler.middleware';
import { requestLogger } from './middleware/logger.middleware';
import { apiRateLimit } from './middleware/rate-limit.middleware';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import memberRoutes from './routes/member.routes';
import qrRoutes from './routes/qr.routes';
import subscriptionRoutes from './routes/subscription.routes';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use('/api/', apiRateLimit);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'PowerWorld Gym API',
        version: '1.0.0'
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

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
