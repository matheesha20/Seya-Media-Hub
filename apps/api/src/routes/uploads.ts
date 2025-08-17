import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db'
import { storageService } from '../services/storage'
import { validateApiKey } from '../services/auth'

const initiateUploadSchema = z.object({
  filename: z.string().min(1),
  mime: z.string().min(1),
  bytes: z.number().positive(),
  kind: z.enum(['image', 'video', 'other']),
})

const commitUploadSchema = z.object({
  assetTempId: z.string(),
  storageKey: z.string(),
  meta: z.record(z.any()).optional(),
})

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

export async function uploadRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate)

  fastify.post('/initiate', {
    schema: {
      body: initiateUploadSchema,
    },
  }, async (request, reply) => {
    const { filename, mime, bytes, kind } = request.body as z.infer<typeof initiateUploadSchema>
    const { accountId } = request.user as any

    // Generate storage key
    const storageKey = storageService.generateStorageKey(accountId, filename, kind)
    
    // Generate pre-signed URL for direct upload
    const uploadUrl = await storageService.generatePresignedUrl(storageKey, mime, 3600)

    // Create temporary asset record
    const assetTempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

    return {
      uploadUrl,
      storageKey,
      assetTempId,
      expiresIn: 3600,
    }
  })

  fastify.post('/commit', {
    schema: {
      body: commitUploadSchema,
    },
  }, async (request, reply) => {
    const { assetTempId, storageKey, meta } = request.body as z.infer<typeof commitUploadSchema>
    const { accountId } = request.user as any

    // Verify file exists in storage
    const fileExists = await storageService.fileExists(storageKey)
    if (!fileExists) {
      return reply.status(400).send({
        error: 'File not found',
        message: 'The uploaded file was not found in storage',
      })
    }

    // Get file info from storage
    const fileInfo = await storageService.getFileStream(storageKey)
    const contentType = fileInfo.ContentType || 'application/octet-stream'
    const contentLength = fileInfo.ContentLength || 0

    // Determine asset kind from content type
    let kind = 'other'
    if (contentType.startsWith('image/')) {
      kind = 'image'
    } else if (contentType.startsWith('video/')) {
      kind = 'video'
    }

    // Create asset record
    const asset = await prisma.asset.create({
      data: {
        accountId,
        kind,
        originalUrl: storageService.getPublicUrl(storageKey),
        storageKey,
        mime: contentType,
        bytes: BigInt(contentLength),
        metadata: meta || {},
        status: kind === 'video' ? 'queued' : 'ready', // Videos need processing
      },
    })

    // If it's a video, queue for processing
    if (kind === 'video') {
      // TODO: Queue video processing job
      // await queueService.addJob('transcode', { assetId: asset.id })
    }

    return {
      asset: {
        id: asset.id,
        kind: asset.kind,
        originalUrl: asset.originalUrl,
        mime: asset.mime,
        bytes: Number(asset.bytes),
        status: asset.status,
        createdAt: asset.createdAt,
      },
    }
  })
}
