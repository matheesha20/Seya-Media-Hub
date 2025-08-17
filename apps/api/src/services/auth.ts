import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '../db'

export function generateApiKey(): string {
  return `sk_${crypto.randomBytes(32).toString('hex')}`
}

export function generateApiKeyHash(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex')
}

export async function validateApiKey(apiKey: string): Promise<{ accountId: string; account: any } | null> {
  const keyHash = generateApiKeyHash(apiKey)
  
  const apiKeyRecord = await prisma.apiKey.findFirst({
    where: {
      keyHash,
      revoked: false,
    },
    include: {
      account: true,
    },
  })

  if (!apiKeyRecord) {
    return null
  }

  return {
    accountId: apiKeyRecord.accountId,
    account: apiKeyRecord.account,
  }
}

export async function createApiKey(accountId: string, name: string): Promise<{ id: string; key: string }> {
  const apiKey = generateApiKey()
  const keyHash = generateApiKeyHash(apiKey)

  const record = await prisma.apiKey.create({
    data: {
      accountId,
      name,
      keyHash,
    },
  })

  return {
    id: record.id,
    key: apiKey, // Return the plaintext key only once
  }
}
