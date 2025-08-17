import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../db'
import { config } from '../config'
import { generateApiKey } from '../services/auth'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  accountName: z.string().min(2).max(100),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/signup', {
    schema: {
      body: signupSchema,
    },
  }, async (request, reply) => {
    const { email, password, accountName } = request.body as z.infer<typeof signupSchema>

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return reply.status(409).send({
        error: 'User already exists',
        message: 'A user with this email already exists',
      })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create account and user
    const account = await prisma.account.create({
      data: {
        name: accountName,
        cdnHostname: config.cdnPublicHost,
        transformSigningSecret: generateApiKey(), // Generate signing secret
        user: {
          create: {
            email,
            passwordHash,
            role: 'owner',
          },
        },
      },
      include: {
        user: true,
      },
    })

    // Generate JWT token
    const token = fastify.jwt.sign({
      userId: account.user[0].id,
      accountId: account.id,
      email: account.user[0].email,
      role: account.user[0].role,
    })

    return {
      token,
      user: {
        id: account.user[0].id,
        email: account.user[0].email,
        role: account.user[0].role,
      },
      account: {
        id: account.id,
        name: account.name,
        plan: account.plan,
      },
    }
  })

  fastify.post('/login', {
    schema: {
      body: loginSchema,
    },
  }, async (request, reply) => {
    const { email, password } = request.body as z.infer<typeof loginSchema>

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        account: true,
      },
    })

    if (!user) {
      return reply.status(401).send({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      return reply.status(401).send({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      })
    }

    // Generate JWT token
    const token = fastify.jwt.sign({
      userId: user.id,
      accountId: user.accountId,
      email: user.email,
      role: user.role,
    })

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      account: {
        id: user.account.id,
        name: user.account.name,
        plan: user.account.plan,
      },
    }
  })
}
