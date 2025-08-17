import { FastifyInstance } from 'fastify'
import { prisma } from '@seya-media-hub/db'
import { storageService } from '../services/storage'
import { verifyTransformURL, TransformParams } from '../services/signer'
import { transformImage } from '../services/sharp'
import { recordUsage } from '../services/usage'

export async function transformRoutes(fastify: FastifyInstance) {
  fastify.get('/:accountId/:assetId', async (request, reply) => {
    const { accountId, assetId } = request.params as { accountId: string; assetId: string }
    const query = request.query as Record<string, string>

    try {
      // Get account and verify signing secret
      const account = await prisma.account.findUnique({
        where: { id: accountId },
      })

      if (!account) {
        return reply.status(404).send({
          error: 'Account not found',
          message: 'The specified account does not exist',
        })
      }

      // Verify signed URL
      const path = `/i/${accountId}/${assetId}`
      const verification = verifyTransformURL(account.transformSigningSecret, path, query)

      if (!verification.isValid) {
        return reply.status(403).send({
          error: 'Invalid signature',
          message: verification.error || 'URL signature verification failed',
        })
      }

      // Get asset
      const asset = await prisma.asset.findFirst({
        where: {
          id: assetId,
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

      // Check if variant already exists
      const existingVariant = await prisma.variant.findFirst({
        where: {
          assetId,
          params: verification.params,
        },
      })

      let outputBuffer: Buffer
      let mime: string
      let width: number | undefined
      let height: number | undefined

      if (existingVariant && existingVariant.storageKey) {
        // Use existing variant
        const fileStream = await storageService.getFileStream(existingVariant.storageKey)
        outputBuffer = fileStream.Body as Buffer
        mime = existingVariant.mime || 'image/webp'
        width = existingVariant.width || undefined
        height = existingVariant.height || undefined
      } else {
        // Transform image
        const inputStream = await storageService.getFileStream(asset.storageKey)
        const inputBuffer = inputStream.Body as Buffer

        const result = await transformImage(inputBuffer, verification.params)
        outputBuffer = result.buffer
        mime = result.mime
        width = result.width
        height = result.height

        // Store variant for future use (optional)
        const variantKey = `${asset.storageKey}_variant_${Date.now()}`
        await storageService.uploadFile(variantKey, outputBuffer, mime)

        await prisma.variant.create({
          data: {
            assetId,
            params: verification.params,
            storageKey: variantKey,
            mime,
            bytes: BigInt(outputBuffer.length),
            width,
            height,
          },
        })
      }

      // Record usage
      await recordUsage(accountId, 'transform', {
        bytes: outputBuffer.length,
        count: 1,
      })

      // Set cache headers
      reply.header('Cache-Control', 'public, s-maxage=31536000, immutable')
      reply.header('Content-Type', mime)
      reply.header('Content-Length', outputBuffer.length.toString())

      return reply.send(outputBuffer)
    } catch (error) {
      fastify.log.error('Transform error:', error)
      return reply.status(500).send({
        error: 'Transform failed',
        message: 'Failed to process the image',
      })
    }
  })
}
