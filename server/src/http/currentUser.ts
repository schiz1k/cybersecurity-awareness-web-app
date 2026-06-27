import type { Request } from 'express'
import { HttpError } from './httpError'
import { getUserBySessionToken } from '../modules/users/users.repository'

export function resolveCurrentSessionToken(request: Request) {
  const authorization = request.header('authorization')?.trim()

  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim()
  }

  return request.header('x-session-token')?.trim() ?? ''
}

export async function requireAuthenticatedUser(request: Request) {
  const sessionToken = resolveCurrentSessionToken(request)

  if (!sessionToken) {
    throw new HttpError(401, 'Требуется вход в аккаунт.')
  }

  const user = await getUserBySessionToken(sessionToken)

  if (!user) {
    throw new HttpError(401, 'Сессия не найдена или уже завершена.')
  }

  return user
}
