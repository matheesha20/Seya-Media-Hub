import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db'
import { getAccountUsage } from '../services/usage'

// JWT authentication hook
async function authenticateJWT(request: any, reply: any) {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
}

export async function adminRoutes(fastify: FastifyInstance) {
  // Add JWT authentication to all routes
  fastify.addHook('preHandler', authenticateJWT)

  fastify.get('/me/usage', {
    schema: {
      querystring: z.object({
        range: z.enum(['day', 'week', 'month']).optional(),
      }),
    },
  }, async (request, reply) => {
    const { accountId } = request.user as any
    const { range = 'month' } = request.query as { range: 'day' | 'week' | 'month' }

    try {
      const usage = await getAccountUsage(accountId, range)

      return {
        usage,
        range,
      }
    } catch (error) {
      fastify.log.error('Usage fetch error:', error)
      return reply.status(500).send({
        error: 'Failed to fetch usage',
        message: 'Unable to retrieve usage information',
      })
    }
  })

  fastify.get('/me/limits', async (request, reply) => {
    const { accountId } = request.user as any

    try {
      const account = await prisma.account.findUnique({
        where: { id: accountId },
        select: {
          plan: true,
          monthlyLimitStorageMb: true,
          monthlyLimitEgressMb: true,
          monthlyLimitTransformCount: true,
        },
      })

      if (!account) {
        return reply.status(404).send({
          error: 'Account not found',
          message: 'The specified account does not exist',
        })
      }

      return {
        limits: {
          storage: account.monthlyLimitStorageMb,
          egress: account.monthlyLimitEgressMb,
          transforms: account.monthlyLimitTransformCount,
        },
        plan: account.plan,
      }
    } catch (error) {
      fastify.log.error('Limits fetch error:', error)
      return reply.status(500).send({
        error: 'Failed to fetch limits',
        message: 'Unable to retrieve account limits',
      })
    }
  })

  fastify.post('/cdn/purge', {
    schema: {
      body: z.object({
        url: z.string().url(),
      }),
    },
  }, async (request, reply) => {
    const { url } = request.body as { url: string }
    const { accountId } = request.user as any

    // TODO: Implement CDN purge
    // This would typically call the CDN provider's API to purge the cache
    // For now, we'll just log the request

    fastify.log.info(`CDN purge requested for URL: ${url} by account: ${accountId}`)

    return {
      success: true,
      message: 'Purge request submitted',
      url,
    }
  })

  fastify.get('/me/account', async (request, reply) => {
    const { accountId } = request.user as any

    try {
      const account = await prisma.account.findUnique({
        where: { id: accountId },
        select: {
          id: true,
          name: true,
          plan: true,
          cdnHostname: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      })

      if (!account) {
        return reply.status(404).send({
          error: 'Account not found',
          message: 'The specified account does not exist',
        })
      }

      return { account }
    } catch (error) {
      fastify.log.error('Account fetch error:', error)
      return reply.status(500).send({
        error: 'Failed to fetch account',
        message: 'Unable to retrieve account information',
      })
    }
  })
}
