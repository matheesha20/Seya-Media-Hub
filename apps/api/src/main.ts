import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import { config } from './config'
import { authRoutes } from './routes/auth'
import { apiKeyRoutes } from './routes/apikeys'
import { uploadRoutes } from './routes/uploads'
import { assetRoutes } from './routes/assets'
import { transformRoutes } from './routes/transform'
import { adminRoutes } from './routes/admin'
import { healthRoutes } from './routes/health'

const fastify = Fastify({
  logger: {
    level: config.logLevel,
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        headers: req.headers,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  },
})

// Register plugins
await fastify.register(cors, {
  origin: config.corsOrigins,
  credentials: true,
})

await fastify.register(jwt, {
  secret: config.jwtSecret,
})

await fastify.register(multipart, {
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
})

await fastify.register(rateLimit, {
  max: config.rateLimitRequestsPerSecond,
  timeWindow: '1 second',
  allowList: ['127.0.0.1', '::1'],
})

// Register routes
await fastify.register(authRoutes, { prefix: '/v1/auth' })
await fastify.register(apiKeyRoutes, { prefix: '/v1/apikeys' })
await fastify.register(uploadRoutes, { prefix: '/v1/uploads' })
await fastify.register(assetRoutes, { prefix: '/v1/assets' })
await fastify.register(transformRoutes, { prefix: '/i' })
await fastify.register(adminRoutes, { prefix: '/v1' })
await fastify.register(healthRoutes)

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error)
  
  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
      details: error.validation,
    })
  }

  if (error.statusCode) {
    return reply.status(error.statusCode).send({
      error: error.name,
      message: error.message,
    })
  }

  return reply.status(500).send({
    error: 'Internal Server Error',
    message: 'Something went wrong',
  })
})

// Start server
try {
  await fastify.listen({ port: config.port, host: '0.0.0.0' })
  fastify.log.info(`Server listening on port ${config.port}`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
