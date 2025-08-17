import ffmpeg from 'fluent-ffmpeg'
import { config } from '../config'

// Set FFmpeg path
ffmpeg.setFfmpegPath(config.ffmpegPath)

export interface TranscodeResult {
  masterPlaylist: Buffer
  segments: Record<string, Record<string, Buffer>>
  poster?: Buffer
  mp4?: Buffer
  width: number
  height: number
  duration: number
}

export async function transcodeVideo(
  inputBuffer: Buffer,
  assetId: string
): Promise<TranscodeResult> {
  return new Promise((resolve, reject) => {
    const segments: Record<string, Record<string, Buffer>> = {
      '1080p': {},
      '720p': {},
      '480p': {},
    }

    let masterPlaylist: Buffer
    let poster: Buffer
    let mp4: Buffer
    let width = 0
    let height = 0
    let duration = 0

    const command = ffmpeg()
      .input(inputBuffer)
      .inputOptions(['-f mp4'])
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-preset fast',
        '-crf 23',
        '-movflags +faststart',
        '-f hls',
        '-hls_time 4',
        '-hls_list_size 0',
        '-hls_segment_filename', `segment_%03d.ts`,
        '-var_stream_map', 'v:0,a:0 v:1,a:1 v:2,a:2',
        '-master_pl_name', 'master.m3u8',
      ])

    // Add multiple quality streams
    command
      .output('1080p/index.m3u8')
      .size('1920x1080')
      .videoBitrate('4500k')
      .audioBitrate('128k')

    command
      .output('720p/index.m3u8')
      .size('1280x720')
      .videoBitrate('2500k')
      .audioBitrate('128k')

    command
      .output('480p/index.m3u8')
      .size('854x480')
      .videoBitrate('1200k')
      .audioBitrate('96k')

    // Generate poster
    command
      .output('poster.jpg')
      .seekInput(3)
      .frames(1)
      .size('1280x720')

    // Generate MP4 fallback
    command
      .output('video.mp4')
      .size('1280x720')
      .videoBitrate('2500k')
      .audioBitrate('128k')
      .format('mp4')

    command
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine)
      })
      .on('progress', (progress) => {
        console.log(`Processing: ${progress.percent}% done`)
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err)
        reject(err)
      })
      .on('end', async () => {
        try {
          // Read generated files
          const fs = await import('fs/promises')
          const path = await import('path')

          // Read master playlist
          masterPlaylist = await fs.readFile('master.m3u8')

          // Read segments for each quality
          for (const quality of ['1080p', '720p', '480p']) {
            const qualityDir = path.join(process.cwd(), quality)
            const files = await fs.readdir(qualityDir)
            
            for (const file of files) {
              if (file.endsWith('.ts') || file.endsWith('.m3u8')) {
                const content = await fs.readFile(path.join(qualityDir, file))
                segments[quality][file] = content
              }
            }
          }

          // Read poster
          try {
            poster = await fs.readFile('poster.jpg')
          } catch (error) {
            console.warn('Failed to read poster:', error)
          }

          // Read MP4
          try {
            mp4 = await fs.readFile('video.mp4')
          } catch (error) {
            console.warn('Failed to read MP4:', error)
          }

          // Get video info
          const info = await getVideoInfo(inputBuffer)
          width = info.width
          height = info.height
          duration = info.duration

          // Clean up temporary files
          await cleanupTempFiles()

          resolve({
            masterPlaylist,
            segments,
            poster,
            mp4,
            width,
            height,
            duration,
          })
        } catch (error) {
          reject(error)
        }
      })

    command.run()
  })
}

async function getVideoInfo(inputBuffer: Buffer): Promise<{
  width: number
  height: number
  duration: number
}> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputBuffer, (err, metadata) => {
      if (err) {
        reject(err)
        return
      }

      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video')
      if (!videoStream) {
        reject(new Error('No video stream found'))
        return
      }

      resolve({
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        duration: metadata.format.duration || 0,
      })
    })
  })
}

async function cleanupTempFiles(): Promise<void> {
  try {
    const fs = await import('fs/promises')
    const path = await import('path')

    const filesToRemove = [
      'master.m3u8',
      'poster.jpg',
      'video.mp4',
    ]

    for (const file of filesToRemove) {
      try {
        await fs.unlink(file)
      } catch (error) {
        // Ignore errors for files that don't exist
      }
    }

    // Remove quality directories
    for (const quality of ['1080p', '720p', '480p']) {
      try {
        const qualityDir = path.join(process.cwd(), quality)
        const files = await fs.readdir(qualityDir)
        
        for (const file of files) {
          await fs.unlink(path.join(qualityDir, file))
        }
        
        await fs.rmdir(qualityDir)
      } catch (error) {
        // Ignore errors for directories that don't exist
      }
    }
  } catch (error) {
    console.warn('Failed to cleanup temp files:', error)
  }
}
