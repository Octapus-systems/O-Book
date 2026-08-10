import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface ApiAuthResult {
  isAuthenticated: boolean
  user?: {
    id: string
    name: string
    email: string
    roleId?: string
  }
  apiKey?: {
    id: string
    name: string
    permissions: string[]
  }
  isApiKey: boolean
  error?: string
  status?: number
}

/**
 * Extracts and validates API key from Authorization header or x-api-key header.
 * If header is present, validates against Prisma ApiKey model.
 * If no API key header is present, falls back to session/default user context.
 */
export async function authenticateApiKeyOrSession(
  request: NextRequest,
  requiredPermission?: string
): Promise<ApiAuthResult> {
  const authHeader = request.headers.get('authorization')
  const apiKeyHeader = request.headers.get('x-api-key')

  let rawKey: string | null = null

  if (authHeader && authHeader.startsWith('Bearer ')) {
    rawKey = authHeader.substring(7).trim()
  } else if (apiKeyHeader) {
    rawKey = apiKeyHeader.trim()
  }

  // If API Key is provided in request headers:
  if (rawKey) {
    try {
      const keyRecord = await (prisma as any).apiKey.findUnique({
        where: { key: rawKey },
        include: { user: { include: { role: true } } },
      })

      if (!keyRecord) {
        return {
          isAuthenticated: false,
          isApiKey: true,
          error: 'Invalid API key',
          status: 401,
        }
      }

      if (!keyRecord.isActive) {
        return {
          isAuthenticated: false,
          isApiKey: true,
          error: 'API key has been revoked',
          status: 401,
        }
      }

      if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
        return {
          isAuthenticated: false,
          isApiKey: true,
          error: 'API key has expired',
          status: 401,
        }
      }

      // Check permissions if required
      if (requiredPermission && keyRecord.permissions) {
        const perms: string[] = keyRecord.permissions
        const domain = requiredPermission.split(':')[0]
        const hasAccess =
          perms.includes('*') ||
          perms.includes(requiredPermission) ||
          perms.includes(`${domain}:*`)

        if (!hasAccess) {
          return {
            isAuthenticated: false,
            isApiKey: true,
            error: `API key lacks required permission: ${requiredPermission}`,
            status: 403,
          }
        }
      }

      // Update lastUsedAt asynchronously (fire and forget)
      ;(prisma as any).apiKey
        .update({
          where: { id: keyRecord.id },
          data: { lastUsedAt: new Date() },
        })
        .catch((err: any) => console.error('Failed to update API key lastUsedAt:', err))

      return {
        isAuthenticated: true,
        isApiKey: true,
        user: {
          id: keyRecord.user.id,
          name: keyRecord.user.name,
          email: keyRecord.user.email,
          roleId: keyRecord.user.roleId,
        },
        apiKey: {
          id: keyRecord.id,
          name: keyRecord.name,
          permissions: keyRecord.permissions,
        },
      }
    } catch (err) {
      console.error('API key auth error:', err)
      return {
        isAuthenticated: false,
        isApiKey: true,
        error: 'Error validating API key',
        status: 500,
      }
    }
  }

  // Fallback for session / UI access when no explicit API Key header is passed
  const defaultUser = await prisma.user.findFirst({
    include: { role: true },
  })

  if (!defaultUser) {
    return {
      isAuthenticated: false,
      isApiKey: false,
      error: 'No active session or API key provided',
      status: 401,
    }
  }

  return {
    isAuthenticated: true,
    isApiKey: false,
    user: {
      id: defaultUser.id,
      name: defaultUser.name,
      email: defaultUser.email,
      roleId: defaultUser.roleId,
    },
  }
}
