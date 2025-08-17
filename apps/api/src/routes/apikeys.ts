import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db'
import { createApiKey } from '../services/auth'

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
})

// JWT authentication hook
async function authenticateJWT(request: any, reply: any) {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
}

export async function apiKeyRoutes(fastify: FastifyInstance) {
  // Add JWT authentication to all routes
  fastify.addHook('preHandler', authenticateJWT)

  fastify.post('/', {
    schema: {
      body: createApiKeySchema,
    },
  }, async (request, reply) => {
    const { name } = request.body as z.infer<typeof createApiKeySchema>
    const { accountId } = request.user as any

    const result = await createApiKey(accountId, name)

    return {
      id: result.id,
      name,
      key: result.key, // Only returned once
      createdAt: new Date().toISOString(),
    }
  })

  fastify.get('/', async (request, reply) => {
    const { accountId } = request.user as any

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        accountId,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        revoked: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return { apiKeys }
  })

  fastify.delete('/:id', async (request, reply) => {
    const { accountId } = request.user as any
    const { id } = request.params as { id: string }

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id,
        accountId,
      },
    })

    if (!apiKey) {
      return reply.status(404).send({
        error: 'API Key not found',
        message: 'The specified API key does not exist',
      })
    }

    await prisma.apiKey.update({
      where: { id },
      data: { revoked: true },
    })

    return { success: true }
  })
}
