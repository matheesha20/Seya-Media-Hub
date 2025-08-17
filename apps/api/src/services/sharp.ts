import sharp from 'sharp'
import { TransformParams } from './signer'
import { config } from '../config'

export async function transformImage(
  inputBuffer: Buffer,
  params: TransformParams
): Promise<{ buffer: Buffer; mime: string; width?: number; height?: number }> {
  const {
    w,
    h,
    fit = 'cover',
    fm = 'webp',
    q = 72,
    dpr = 1,
    bg,
    blur,
    sharpen,
    orient = true,
    strip = true,
  } = params

  // Calculate dimensions with DPR
  const width = w ? Math.round(w * dpr) : undefined
  const height = h ? Math.round(h * dpr) : undefined

  // Validate dimensions
  if (width && width > config.maxImageDimension) {
    throw new Error(`Width exceeds maximum allowed dimension of ${config.maxImageDimension}`)
  }
  if (height && height > config.maxImageDimension) {
    throw new Error(`Height exceeds maximum allowed dimension of ${config.maxImageDimension}`)
  }

  // Validate quality
  if (q > config.maxImageQuality) {
    throw new Error(`Quality exceeds maximum allowed value of ${config.maxImageQuality}`)
  }

  let pipeline = sharp(inputBuffer)

  // Auto-orient
  if (orient) {
    pipeline = pipeline.rotate()
  }

  // Set background if specified
  if (bg) {
    pipeline = pipeline.flatten({ background: `#${bg}` })
  }

  // Resize
  if (width || height) {
    pipeline = pipeline.resize({
      width,
      height,
      fit: fit as any,
      withoutEnlargement: true,
    })
  }

  // Apply effects
  if (blur) {
    pipeline = pipeline.blur(blur)
  }

  if (sharpen) {
    pipeline = pipeline.sharpen()
  }

  // Strip metadata if requested
  if (strip) {
    pipeline = pipeline.withMetadata(false)
  }

  // Apply format and quality
  switch (fm) {
    case 'avif':
      pipeline = pipeline.avif({ quality: q })
      break
    case 'jpg':
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: q, mozjpeg: true })
      break
    case 'png':
      pipeline = pipeline.png()
      break
    case 'webp':
    default:
      pipeline = pipeline.webp({ quality: q })
      break
  }

  // Process the image
  const result = await pipeline.toBuffer({ resolveWithObject: true })

  // Check output size
  const outputSizeMb = result.data.length / (1024 * 1024)
  if (outputSizeMb > config.maxOutputSizeMb) {
    throw new Error(`Output size (${outputSizeMb.toFixed(2)}MB) exceeds maximum allowed size of ${config.maxOutputSizeMb}MB`)
  }

  // Determine MIME type
  let mime: string
  switch (fm) {
    case 'avif':
      mime = 'image/avif'
      break
    case 'jpg':
    case 'jpeg':
      mime = 'image/jpeg'
      break
    case 'png':
      mime = 'image/png'
      break
    case 'webp':
    default:
      mime = 'image/webp'
      break
  }

  return {
    buffer: result.data,
    mime,
    width: result.info.width,
    height: result.info.height,
  }
}

export async function getImageInfo(inputBuffer: Buffer): Promise<{
  width: number
  height: number
  format: string
  size: number
}> {
  const metadata = await sharp(inputBuffer).metadata()
  
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    size: inputBuffer.length,
  }
}
