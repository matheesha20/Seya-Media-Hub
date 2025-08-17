import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db'
import { storageService } from '../services/storage'
import { validateApiKey } from '../services/auth'
import { signTransformURL } from '../services/signer'
import { config } from '../config'

// Authentication hook for API key or JWT
async function authenticate(request: any, reply: any) {
  const authHeader = request.headers.authorization
  const apiKeyHeader = request.headers['x-api-key']

  if (apiKeyHeader) {
    const apiKeyResult = await validateApiKey(apiKeyHeader)
    if (!apiKeyResult) {
      return reply.status(401).send({
        error: 'Invalid API key',
        message: 'The provided API key is invalid or has been revoked',
      })
    }
    request.user = { accountId: apiKeyResult.accountId, account: apiKeyResult.account }
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      await request.jwtVerify()
    } catch (err) {
      return reply.status(401).send({
        error: 'Invalid token',
        message: 'The provided JWT token is invalid',
      })
    }
  } else {
    return reply.status(401).send({
      error: 'Authentication required',
      message: 'Please provide either an API key or JWT token',
    })
  }
}

export async function assetRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate)

  fastify.get('/', async (request, reply) => {
    const { accountId } = request.user as any
    const { kind, query, page = 1, limit = 20 } = request.query as any

    const skip = (page - 1) * limit

    const where: any = { accountId }
    if (kind) {
      where.kind = kind
    }
    if (query) {
      where.OR = [
        { storageKey: { contains: query, mode: 'insensitive' } },
        { mime: { contains: query, mode: 'insensitive' } },
      ]
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        select: {
          id: true,
          kind: true,
          originalUrl: true,
          mime: true,
          bytes: true,
          width: true,
          height: true,
          durationSec: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.asset.count({ where }),
    ])

    return {
      assets: assets.map(asset => ({
        ...asset,
        bytes: Number(asset.bytes),
        durationSec: asset.durationSec ? Number(asset.durationSec) : null,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  })

  fastify.get('/:id', async (request, reply) => {
    const { accountId } = request.user as any
    const { id } = request.params as { id: string }

    const asset = await prisma.asset.findFirst({
      where: {
        id,
        accountId,
      },
      include: {
        variants: {
          select: {
            id: true,
            params: true,
            mime: true,
            bytes: true,
            width: true,
            height: true,
            createdAt: true,
          },
        },
      },
    })

    if (!asset) {
      return reply.status(404).send({
        error: 'Asset not found',
        message: 'The specified asset does not exist',
      })
    }

    return {
      asset: {
        ...asset,
        bytes: Number(asset.bytes),
        durationSec: asset.durationSec ? Number(asset.durationSec) : null,
        variants: asset.variants.map(variant => ({
          ...variant,
          bytes: variant.bytes ? Number(variant.bytes) : null,
        })),
      },
    }
  })

  fastify.delete('/:id', async (request, reply) => {
    const { accountId } = request.user as any
    const { id } = request.params as { id: string }

    const asset = await prisma.asset.findFirst({
      where: {
        id,
        accountId,
      },
      include: {
        variants: true,
      },
    })

    if (!asset) {
      return reply.status(404).send({
        error: 'Asset not found',
        message: 'The specified asset does not exist',
      })
    }

    // Delete from storage
    try {
      await storageService.deleteFile(asset.storageKey)
      
      // Delete variants
      for (const variant of asset.variants) {
        if (variant.storageKey) {
          await storageService.deleteFile(variant.storageKey)
        }
      }
    } catch (error) {
      // Log error but continue with database cleanup
      fastify.log.error('Failed to delete from storage:', error)
    }

    // Delete from database (cascades to variants)
    await prisma.asset.delete({
      where: { id },
    })

    return { success: true }
  })

  fastify.post('/:id/prerender', {
    schema: {
      body: z.object({
        params: z.array(z.record(z.any())),
      }),
    },
  }, async (request, reply) => {
    const { accountId } = request.user as any
    const { id } = request.params as { id: string }
    const { params } = request.body as { params: any[] }

    const asset = await prisma.asset.findFirst({
      where: {
        id,
        accountId,
        kind: 'image',
      },
    })

    if (!asset) {
      return reply.status(404).send({
        error: 'Asset not found',
        message: 'The specified image asset does not exist',
      })
    }

    if (asset.status !== 'ready') {
      return reply.status(400).send({
        error: 'Asset not ready',
        message: 'The asset is not ready for processing',
      })
    }

    // Queue prerender jobs
    const jobs = []
    for (const paramSet of params) {
      const job = await prisma.job.create({
        data: {
          accountId,
          assetId: asset.id,
          type: 'prerender',
          status: 'queued',
          payload: paramSet,
        },
      })
      jobs.push(job)
    }

    // TODO: Queue actual prerender jobs in BullMQ

    return {
      jobs: jobs.map(job => ({
        id: job.id,
        status: job.status,
        createdAt: job.createdAt,
      })),
    }
  })

  fastify.get('/:id/transform-url', {
    schema: {
      querystring: z.object({
        w: z.string().optional(),
        h: z.string().optional(),
        fit: z.enum(['cover', 'contain', 'inside', 'outside']).optional(),
        fm: z.enum(['webp', 'avif', 'jpg', 'jpeg', 'png']).optional(),
        q: z.string().optional(),
        dpr: z.string().optional(),
        bg: z.string().optional(),
        blur: z.string().optional(),
        sharpen: z.string().optional(),
        orient: z.string().optional(),
        strip: z.string().optional(),
        exp: z.string().optional(),
      }),
    },
  }, async (request, reply) => {
    const { accountId, account } = request.user as any
    const { id } = request.params as { id: string }
    const query = request.query as any

    const asset = await prisma.asset.findFirst({
      where: {
        id,
        accountId,
        kind: 'image',
      },
    })

    if (!asset) {
      return reply.status(404).send({
        error: 'Asset not found',
        message: 'The specified image asset does not exist',
      })
    }

    // Convert query parameters to transform params
    const transformParams: any = {}
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        if (['w', 'h', 'q', 'dpr', 'blur', 'sharpen'].includes(key)) {
          transformParams[key] = parseInt(value as string, 10)
        } else if (['orient', 'strip'].includes(key)) {
          transformParams[key] = value === 'true'
        } else {
          transformParams[key] = value
        }
      }
    }

    const basePath = `/i/${accountId}/${assetId}`
    const signedUrl = signTransformURL(account.transformSigningSecret, basePath, transformParams)

    return {
      url: `https://${config.cdnPublicHost}${signedUrl}`,
      params: transformParams,
    }
  })
}
