export const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgres://mediahub:mediahub@localhost:5432/mediahub',
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Storage (S3 compatible)
  s3Endpoint: process.env.S3_ENDPOINT || 'https://s3.backblazeb2.com',
  s3Region: process.env.S3_REGION || 'auto',
  s3Bucket: process.env.S3_BUCKET || 'seya-media',
  s3AccessKey: process.env.S3_ACCESS_KEY || '',
  s3SecretKey: process.env.S3_SECRET_KEY || '',
  
  // CDN
  cdnPublicHost: process.env.CDN_PUBLIC_HOST || 'cdn.seya.media',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-change-in-production',
  
  // FFmpeg
  ffmpegPath: process.env.FFMPEG_PATH || '/usr/bin/ffmpeg',
  
  // Webhooks
  webhookSigningSecret: process.env.WEBHOOK_SIGNING_SECRET || 'whsec_your_webhook_secret',
  
  // Rate limiting
  rateLimitRequestsPerSecond: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_SECOND || '50', 10),
  rateLimitBurstSize: parseInt(process.env.RATE_LIMIT_BURST_SIZE || '100', 10),
  
  // Transform limits
  maxImageDimension: parseInt(process.env.MAX_IMAGE_DIMENSION || '6000', 10),
  maxImageQuality: parseInt(process.env.MAX_IMAGE_QUALITY || '95', 10),
  maxOutputSizeMb: parseInt(process.env.MAX_OUTPUT_SIZE_MB || '25', 10),
  
  // CORS
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  
  // Plans and limits
  plans: {
    starter: {
      storageMb: 5120,
      egressMb: 51200,
      transformCount: 200000,
    },
    growth: {
      storageMb: 20480,
      egressMb: 204800,
      transformCount: 300000,
    },
    pro: {
      storageMb: 102400,
      egressMb: 1048576,
      transformCount: 1500000,
    },
  },
} as const
