import type { NextFunction, Request, Response } from 'express'

const localHostnames = new Set(['localhost', '127.0.0.1', '::1'])

function normalizeHostname(value?: string | null) {
  return value?.split(',')[0]?.trim().split(':')[0]?.toLowerCase() ?? ''
}

function isPrivateIpv4(hostname: string) {
  const octets = hostname.split('.').map((item) => Number(item))

  if (octets.length !== 4 || octets.some((item) => Number.isNaN(item))) {
    return false
  }

  if (octets[0] === 10) {
    return true
  }

  if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) {
    return true
  }

  return octets[0] === 192 && octets[1] === 168
}

function isLocalHostname(hostname: string) {
  return localHostnames.has(hostname) || isPrivateIpv4(hostname)
}

function hasLocalOrigin(request: Request) {
  const origin = request.header('origin')

  if (!origin) {
    return false
  }

  try {
    return isLocalHostname(new URL(origin).hostname.toLowerCase())
  } catch {
    return false
  }
}

function hasLocalHostHeader(request: Request) {
  return isLocalHostname(
    normalizeHostname(request.header('x-forwarded-host') ?? request.header('host')),
  )
}

export function requireLocalAccess(request: Request, response: Response, next: NextFunction) {
  if (hasLocalOrigin(request) || (!request.header('origin') && hasLocalHostHeader(request))) {
    next()
    return
  }

  response.status(403).json({
    message: 'Админский доступ разрешён только с локального адреса.',
  })
}
