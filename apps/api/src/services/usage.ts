import { prisma } from '@seya-media-hub/db'
import { config } from '../config'

export type UsageKind = 'storage_write' | 'egress' | 'transform'

export interface UsageData {
  bytes?: number
  count?: number
}

export async function recordUsage(
  accountId: string,
  kind: UsageKind,
  data: UsageData
): Promise<void> {
  await prisma.usageEvent.create({
    data: {
      accountId,
      kind,
      bytes: BigInt(data.bytes || 0),
      count: data.count || 1,
    },
  })
}

export async function getAccountUsage(
  accountId: string,
  range: 'day' | 'week' | 'month' = 'month'
): Promise<{
  storage: number
  egress: number
  transforms: number
  limits: {
    storage: number
    egress: number
    transforms: number
  }
}> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
  })

  if (!account) {
    throw new Error('Account not found')
  }

  // Calculate date range
  const now = new Date()
  let startDate: Date

  switch (range) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
  }

  // Get usage data
  const usageEvents = await prisma.usageEvent.findMany({
    where: {
      accountId,
      at: {
        gte: startDate,
      },
    },
  })

  // Calculate totals
  let storage = 0
  let egress = 0
  let transforms = 0

  for (const event of usageEvents) {
    switch (event.kind) {
      case 'storage_write':
        storage += Number(event.bytes)
        break
      case 'egress':
        egress += Number(event.bytes)
        break
      case 'transform':
        transforms += event.count
        break
    }
  }

  // Get plan limits
  const planLimits = config.plans[account.plan as keyof typeof config.plans] || config.plans.starter

  return {
    storage: Math.round(storage / (1024 * 1024)), // Convert to MB
    egress: Math.round(egress / (1024 * 1024)), // Convert to MB
    transforms,
    limits: {
      storage: planLimits.storageMb,
      egress: planLimits.egressMb,
      transforms: planLimits.transformCount,
    },
  }
}

export async function checkUsageLimits(
  accountId: string,
  kind: UsageKind,
  data: UsageData
): Promise<{ allowed: boolean; reason?: string }> {
  const usage = await getAccountUsage(accountId)
  const { limits } = usage

  switch (kind) {
    case 'storage_write':
      const newStorage = usage.storage + (data.bytes || 0) / (1024 * 1024)
      if (newStorage > limits.storage) {
        return {
          allowed: false,
          reason: `Storage limit exceeded. Current: ${usage.storage}MB, Limit: ${limits.storage}MB`,
        }
      }
      break

    case 'egress':
      const newEgress = usage.egress + (data.bytes || 0) / (1024 * 1024)
      if (newEgress > limits.egress) {
        return {
          allowed: false,
          reason: `Egress limit exceeded. Current: ${usage.egress}MB, Limit: ${limits.egress}MB`,
        }
      }
      break

    case 'transform':
      const newTransforms = usage.transforms + (data.count || 1)
      if (newTransforms > limits.transforms) {
        return {
          allowed: false,
          reason: `Transform limit exceeded. Current: ${usage.transforms}, Limit: ${limits.transforms}`,
        }
      }
      break
  }

  return { allowed: true }
}
