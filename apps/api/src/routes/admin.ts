import { FastifyInstance } from 'fastify';

export default async function adminRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ status: 'ok' }));
  app.get('/metrics', async () => ({ uptime: process.uptime() }));
}
