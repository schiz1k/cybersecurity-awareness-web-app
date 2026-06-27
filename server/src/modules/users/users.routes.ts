import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../http/asyncHandler'
import { requireAuthenticatedUser, resolveCurrentSessionToken } from '../../http/currentUser'
import { HttpError } from '../../http/httpError'
import {
  createAttemptByUserId,
  createUser,
  createUserSession,
  getUserByEmail,
  getUserStateById,
  markMaterialCompleteByUserId,
  revokeSession,
  toggleBookmarkByUserId,
  updateCurrentUserById,
} from './users.repository'
import { hashPassword, verifyPassword } from './auth'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2),
  city: z.string().optional(),
  teamId: z.string().uuid().nullable().optional(),
  primaryTrack: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const profileSchema = z.object({
  learnerName: z.string().min(2),
  role: z.string().min(2),
})

const attemptSchema = z.object({
  score: z.number().int().min(0),
  label: z.string().min(1),
  summary: z.string().min(1),
})

export const usersRouter = Router()

usersRouter.post(
  '/register',
  asyncHandler(async (request, response) => {
    const payload = registerSchema.parse(request.body)
    const existing = await getUserByEmail(payload.email)

    if (existing) {
      response.status(409).json({ message: 'Пользователь с таким email уже существует.' })
      return
    }

    const user = await createUser({
      email: payload.email,
      passwordHash: hashPassword(payload.password),
      displayName: payload.displayName,
      city: payload.city,
      teamId: payload.teamId,
      primaryTrack: payload.primaryTrack,
    })

    const sessionToken = await createUserSession(String(user.id))
    response.status(201).json({
      sessionToken,
      state: await getUserStateById(String(user.id)),
    })
  }),
)

usersRouter.post(
  '/login',
  asyncHandler(async (request, response) => {
    const payload = loginSchema.parse(request.body)
    const user = await getUserByEmail(payload.email)

    if (!user || !verifyPassword(payload.password, String(user.password_hash))) {
      throw new HttpError(401, 'Неверный email или пароль.')
    }

    const sessionToken = await createUserSession(String(user.id))
    response.json({
      sessionToken,
      state: await getUserStateById(String(user.id)),
    })
  }),
)

usersRouter.post(
  '/logout',
  asyncHandler(async (request, response) => {
    const sessionToken = resolveCurrentSessionToken(request)

    if (!sessionToken) {
      response.status(204).end()
      return
    }

    await revokeSession(sessionToken)
    response.status(204).end()
  }),
)

usersRouter.get(
  '/current/state',
  asyncHandler(async (request, response) => {
    const currentUser = await requireAuthenticatedUser(request)
    response.json(await getUserStateById(String(currentUser.id)))
  }),
)

usersRouter.patch(
  '/current/profile',
  asyncHandler(async (request, response) => {
    const payload = profileSchema.parse(request.body)
    const currentUser = await requireAuthenticatedUser(request)
    response.json(await updateCurrentUserById(String(currentUser.id), payload))
  }),
)

usersRouter.post(
  '/current/bookmarks/:materialSlug/toggle',
  asyncHandler(async (request, response) => {
    const currentUser = await requireAuthenticatedUser(request)
    response.json(await toggleBookmarkByUserId(String(currentUser.id), request.params.materialSlug))
  }),
)

usersRouter.post(
  '/current/materials/:materialSlug/complete',
  asyncHandler(async (request, response) => {
    const currentUser = await requireAuthenticatedUser(request)
    response.json(
      await markMaterialCompleteByUserId(String(currentUser.id), request.params.materialSlug),
    )
  }),
)

usersRouter.post(
  '/current/tests/:testSlug/attempts',
  asyncHandler(async (request, response) => {
    const payload = attemptSchema.parse(request.body)
    const currentUser = await requireAuthenticatedUser(request)
    response.json(await createAttemptByUserId(String(currentUser.id), request.params.testSlug, payload))
  }),
)
