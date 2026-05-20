import mongoose from 'mongoose';
import logger from './logger.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const connectDB = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://root:rootpassword@mongo:27017/jobboard?authSource=admin', {
        maxPoolSize: 10,
      });
      logger.info(`MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      logger.error(`DB connection attempt ${i + 1} failed: ${err.message}`);
      if (i < retries - 1) {
        const delay = 2000 * (i + 1);
        logger.info(`Retrying DB connection in ${delay / 1000}s...`);
        await sleep(delay);
      }
    }
  }
  logger.error('All DB connection attempts failed. Exiting process...');
  process.exit(1);
};
