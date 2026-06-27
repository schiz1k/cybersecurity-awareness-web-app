import { Router } from 'express'
import { asyncHandler } from '../../http/asyncHandler'
import { listCurrentLeaderboard } from './leaderboard.repository'

export const leaderboardRouter = Router()

leaderboardRouter.get(
  '/current',
  asyncHandler(async (_request, response) => {
    response.json(await listCurrentLeaderboard())
  }),
)
