// Server Entry Point
import app from './app';
import logger from './config/logger';

const PORT = process.env.PORT || 5000;

let server: any;

async function startServer() {
    try {
        // Drizzle auto-connects via mysql2 pool, no manual connection needed
        logger.info('Database connection pool ready');

        // Start Express server
        server = app.listen(PORT, () => {
            logger.info(`🚀 PowerWorld Gym API server running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`Health check: http://localhost:${PORT}/health`);
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
async function shutdown(signal: string) {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    if (server) {
        server.close(async () => {
            logger.info('HTTP server closed');
            // mysql2 pool auto-closes on process exit
            logger.info('Database connection pool closed');
            process.exit(0);
        });

        // Force shutdown after 10 seconds
        setTimeout(() => {
            logger.error('Forceful shutdown after timeout');
            process.exit(1);
        }, 10000);
    }
}

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION');
});

// Start the server
startServer();
