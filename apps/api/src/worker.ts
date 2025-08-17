import { Queue, Worker } from 'bullmq'
import Redis from 'ioredis'
import { config } from './config'
import { prisma } from './db'
import { storageService } from './services/storage'
import { transcodeVideo } from './services/ffmpeg'

// Initialize Redis connection
const redis = new Redis(config.redisUrl)

// Create queues
const transcodeQueue = new Queue('transcode', { connection: redis })
const prerenderQueue = new Queue('prerender', { connection: redis })

// Video transcoding worker
const transcodeWorker = new Worker(
  'transcode',
  async (job) => {
    const { assetId } = job.data

    try {
      // Get asset
      const asset = await prisma.asset.findUnique({
        where: { id: assetId },
        include: { account: true },
      })

      if (!asset) {
        throw new Error(`Asset ${assetId} not found`)
      }

      // Update status to processing
      await prisma.asset.update({
        where: { id: assetId },
        data: { status: 'processing' },
      })

      // Download original video
      const videoStream = await storageService.getFileStream(asset.storageKey)
      const videoBuffer = videoStream.Body as Buffer

      // Transcode video
      const result = await transcodeVideo(videoBuffer, assetId)

      // Upload transcoded files
      const uploadPromises = []

      // Upload HLS master playlist
      uploadPromises.push(
        storageService.uploadFile(
          `video/${assetId}/master.m3u8`,
          result.masterPlaylist,
          'application/vnd.apple.mpegurl'
        )
      )

      // Upload HLS segments
      for (const [quality, segments] of Object.entries(result.segments)) {
        for (const [filename, content] of Object.entries(segments)) {
          uploadPromises.push(
            storageService.uploadFile(
              `video/${assetId}/${quality}/${filename}`,
              content,
              'video/mp2t'
            )
          )
        }
      }

      // Upload poster
      if (result.poster) {
        uploadPromises.push(
          storageService.uploadFile(
            `video/${assetId}/poster.jpg`,
            result.poster,
            'image/jpeg'
          )
        )
      }

      // Upload MP4 fallback
      if (result.mp4) {
        uploadPromises.push(
          storageService.uploadFile(
            `video/${assetId}/video.mp4`,
            result.mp4,
            'video/mp4'
          )
        )
      }

      await Promise.all(uploadPromises)

      // Update asset with video info
      await prisma.asset.update({
        where: { id: assetId },
        data: {
          status: 'ready',
          width: result.width,
          height: result.height,
          durationSec: result.duration,
          metadata: {
            ...asset.metadata,
            video: {
              qualities: Object.keys(result.segments),
              poster: result.poster ? `video/${assetId}/poster.jpg` : null,
              mp4: result.mp4 ? `video/${assetId}/video.mp4` : null,
            },
          },
        },
      })

      // Update job status
      await prisma.job.update({
        where: { id: job.id },
        data: { status: 'completed' },
      })

      console.log(`Video transcoding completed for asset ${assetId}`)
    } catch (error) {
      console.error(`Video transcoding failed for asset ${assetId}:`, error)

      // Update asset status to failed
      await prisma.asset.update({
        where: { id: assetId },
        data: { status: 'failed' },
      })

      // Update job status
      await prisma.job.update({
        where: { id: job.id },
        data: { status: 'failed' },
      })

      throw error
    }
  },
  { connection: redis }
)

// Image prerender worker
const prerenderWorker = new Worker(
  'prerender',
  async (job) => {
    const { assetId, params } = job.data

    try {
      // Get asset
      const asset = await prisma.asset.findUnique({
        where: { id: assetId },
      })

      if (!asset || asset.kind !== 'image') {
        throw new Error(`Image asset ${assetId} not found`)
      }

      // Download original image
      const imageStream = await storageService.getFileStream(asset.storageKey)
      const imageBuffer = imageStream.Body as Buffer

      // Transform image
      const { transformImage } = await import('./services/sharp')
      const result = await transformImage(imageBuffer, params)

      // Upload variant
      const variantKey = `images/${assetId}/variant_${Date.now()}.${params.fm || 'webp'}`
      await storageService.uploadFile(variantKey, result.buffer, result.mime)

      // Create variant record
      await prisma.variant.create({
        data: {
          assetId,
          params,
          storageKey: variantKey,
          mime: result.mime,
          bytes: BigInt(result.buffer.length),
          width: result.width,
          height: result.height,
        },
      })

      // Update job status
      await prisma.job.update({
        where: { id: job.id },
        data: { status: 'completed' },
      })

      console.log(`Image prerender completed for asset ${assetId}`)
    } catch (error) {
      console.error(`Image prerender failed for asset ${assetId}:`, error)

      // Update job status
      await prisma.job.update({
        where: { id: job.id },
        data: { status: 'failed' },
      })

      throw error
    }
  },
  { connection: redis }
)

// Error handling
transcodeWorker.on('error', (error) => {
  console.error('Transcode worker error:', error)
})

prerenderWorker.on('error', (error) => {
  console.error('Prerender worker error:', error)
})

console.log('Workers started')

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down workers...')
  await transcodeWorker.close()
  await prerenderWorker.close()
  await redis.quit()
  process.exit(0)
})
