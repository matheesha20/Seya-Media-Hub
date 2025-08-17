import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import pino from 'pino';
import sharp from 'sharp';

dotenv.config();
const logger = pino();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

export const imageVariantQueue = new Queue('image:generateVariant', { connection });

new Worker(
  'image:generateVariant',
  async (job) => {
    logger.info({ jobId: job.id }, 'processing image variant');
    // TODO: implement with sharp and storage provider
  },
  { connection }
);

logger.info('worker started');
