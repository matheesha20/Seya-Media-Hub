import crypto from 'crypto'
import { config } from '../config'

export interface TransformParams {
  w?: number
  h?: number
  fit?: 'cover' | 'contain' | 'inside' | 'outside'
  fm?: 'webp' | 'avif' | 'jpg' | 'jpeg' | 'png'
  q?: number
  dpr?: number
  bg?: string
  crop?: string
  blur?: number
  sharpen?: number
  orient?: boolean
  strip?: boolean
  exp?: number
}

export function signTransformURL(
  secret: string,
  basePath: string,
  params: TransformParams
): string {
  const { exp = Math.floor(Date.now() / 1000) + 3600, ...rest } = params
  
  // Sort parameters alphabetically
  const sortedParams = Object.entries(rest)
    .filter(([_, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
  
  const qp = new URLSearchParams(sortedParams)
  qp.append('exp', String(exp))
  
  const base = `${basePath}?${qp.toString()}`
  const sig = crypto.createHmac('sha256', secret).update(base).digest('hex')
  
  return `${base}&sig=${sig}`
}

export function verifyTransformURL(
  secret: string,
  path: string,
  query: Record<string, string>
): { isValid: boolean; params: TransformParams; error?: string } {
  try {
    const { sig, exp, ...params } = query
    
    if (!sig || !exp) {
      return { isValid: false, params: {}, error: 'Missing signature or expiration' }
    }
    
    // Check expiration
    const expiration = parseInt(exp, 10)
    const now = Math.floor(Date.now() / 1000)
    
    if (now > expiration) {
      return { isValid: false, params: {}, error: 'URL has expired' }
    }
    
    // Rebuild base string without signature
    const sortedParams = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
    
    const qp = new URLSearchParams(sortedParams)
    qp.append('exp', exp)
    
    const base = `${path}?${qp.toString()}`
    const expectedSig = crypto.createHmac('sha256', secret).update(base).digest('hex')
    
    // Constant-time comparison
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
      return { isValid: false, params: {}, error: 'Invalid signature' }
    }
    
    // Parse and validate parameters
    const transformParams: TransformParams = {
      exp: expiration,
    }
    
    for (const [key, value] of Object.entries(params)) {
      switch (key) {
        case 'w':
        case 'h':
        case 'q':
        case 'dpr':
        case 'blur':
        case 'sharpen':
          const num = parseInt(value, 10)
          if (isNaN(num) || num < 0) {
            return { isValid: false, params: {}, error: `Invalid ${key} parameter` }
          }
          transformParams[key as keyof TransformParams] = num
          break
          
        case 'fit':
          if (!['cover', 'contain', 'inside', 'outside'].includes(value)) {
            return { isValid: false, params: {}, error: 'Invalid fit parameter' }
          }
          transformParams.fit = value as any
          break
          
        case 'fm':
          if (!['webp', 'avif', 'jpg', 'jpeg', 'png'].includes(value)) {
            return { isValid: false, params: {}, error: 'Invalid format parameter' }
          }
          transformParams.fm = value as any
          break
          
        case 'bg':
          if (!/^[0-9a-fA-F]{6}$/.test(value)) {
            return { isValid: false, params: {}, error: 'Invalid background color' }
          }
          transformParams.bg = value
          break
          
        case 'crop':
          if (!/^\d+,\d+,\d+,\d+$/.test(value)) {
            return { isValid: false, params: {}, error: 'Invalid crop parameter' }
          }
          transformParams.crop = value
          break
          
        case 'orient':
        case 'strip':
          transformParams[key as keyof TransformParams] = value === 'true'
          break
          
        default:
          return { isValid: false, params: {}, error: `Unknown parameter: ${key}` }
      }
    }
    
    return { isValid: true, params: transformParams }
  } catch (error) {
    return { isValid: false, params: {}, error: 'Invalid URL format' }
  }
}
