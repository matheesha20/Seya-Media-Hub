import { FastifyInstance } from 'fastify';
import { UserModel } from '@seya/shared/src/models';
import { z } from 'zod';
import argon2 from 'argon2';

export default async function authRoutes(app: FastifyInstance) {
  app.post('/signup', async (req, reply) => {
    const body = z.object({ email: z.string().email(), password: z.string().min(6) }).parse(req.body);
    const passwordHash = await argon2.hash(body.password);
    const user = await UserModel.create({ email: body.email, passwordHash });
    const token = app.jwt.sign({ sub: user._id });
    return { token };
  });

  app.post('/login', async (req, reply) => {
    const body = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);
    const user = await UserModel.findOne({ email: body.email });
    if (!user) return reply.code(401).send({ message: 'Invalid credentials' });
    const ok = await argon2.verify(user.passwordHash, body.password);
    if (!ok) return reply.code(401).send({ message: 'Invalid credentials' });
    const token = app.jwt.sign({ sub: user._id });
    return { token };
  });
}
