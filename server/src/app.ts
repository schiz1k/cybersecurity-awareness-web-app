import cors from 'cors'
import express from 'express'
import type { NextFunction, Request, Response } from 'express'
import { env } from './config/env'
import { HttpError } from './http/httpError'
import { contentRouter } from './modules/content/content.routes'
import { leaderboardRouter } from './modules/leaderboard/leaderboard.routes'
import { usersRouter } from './modules/users/users.routes'

export function createServer() {
  const app = express()

  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((item) => item.trim()),
      credentials: true,
    }),
  )
  app.use(express.json())

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' })
  })

  app.use('/api/content', contentRouter)
  app.use('/api/leaderboard', leaderboardRouter)
  app.use('/api/users', usersRouter)

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    void _next
    const message = error instanceof Error ? error.message : 'Unexpected server error'
    const status = error instanceof HttpError ? error.status : 500
    response.status(status).json({ message })
  })

  return app
}
