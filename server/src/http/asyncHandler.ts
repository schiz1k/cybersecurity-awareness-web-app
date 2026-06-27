import type { NextFunction, Request, Response } from 'express'

export type AsyncRoute = (
  request: Request,
  response: Response,
  next: NextFunction,
) => Promise<void>

export function asyncHandler(route: AsyncRoute) {
  return (request: Request, response: Response, next: NextFunction) => {
    void route(request, response, next).catch(next)
  }
}
