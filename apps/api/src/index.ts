import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { connectMongo } from '@seya/shared/src/models';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import uploadRoutes from './routes/upload';

dotenv.config();

const app = Fastify({ logger: true });

app.register(cors, { origin: true });
app.register(jwt, { secret: process.env.JWT_SECRET || 'dev' });

app.register(adminRoutes, { prefix: '/v1/admin' });
app.register(authRoutes, { prefix: '/v1/auth' });
app.register(uploadRoutes, { prefix: '/v1' });

const start = async () => {
  try {
    await connectMongo(process.env.MONGODB_URI!);
    await app.listen({ port: parseInt(process.env.PORT || '8080'), host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
