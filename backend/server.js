import 'dotenv/config';
import mongoose from 'mongoose';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import logger from './src/config/logger.js';

const PORT = process.env.PORT || 5000;

// Catch uncaught exceptions globally
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION! Shutting down... Msg: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

// Bootstrap Server & DB
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    logger.error(`UNHANDLED REJECTION! Shutting down... Msg: ${err.message}`);
    logger.error(err.stack);
    server.close(() => {
      process.exit(1);
    });
  });

  // Graceful Shutdown
  const shutdown = () => {
    logger.info('Received shutdown signal (SIGTERM/SIGINT). Closing HTTP server...');
    server.close(() => {
      logger.info('HTTP server closed. Closing database connection...');
      mongoose.connection.close(false).then(() => {
        logger.info('Database connection closed. Exiting process.');
        process.exit(0);
      });
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
});
