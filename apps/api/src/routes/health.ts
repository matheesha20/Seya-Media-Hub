import { FastifyInstance } from 'fastify'
import { prisma } from '../db'

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/healthz', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  fastify.get('/readyz', async (request, reply) => {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`
      
      return { 
        status: 'ready', 
        timestamp: new Date().toISOString(),
        services: {
          database: 'ok'
        }
      }
    } catch (error) {
      fastify.log.error('Health check failed:', error)
      return reply.status(503).send({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed'
      })
    }
  })
}
