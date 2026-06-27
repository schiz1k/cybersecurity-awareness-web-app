import { Router } from 'express'
import { contentBundleSchema, materialSchema, testSchema } from './content.schemas'
import { asyncHandler } from '../../http/asyncHandler'
import { requireLocalAccess } from '../../http/localAccess'
import {
  createMaterial,
  createTest,
  deleteMaterial,
  deleteTest,
  getContentBundle,
  getMaterialBySlug,
  getTestBySlug,
  listMaterials,
  listTests,
  replaceAllContent,
  updateMaterial,
  updateTest,
} from './content.repository'

export const contentRouter = Router()

contentRouter.get(
  '/bundle',
  asyncHandler(async (_request, response) => {
    response.json(await getContentBundle())
  }),
)

contentRouter.get(
  '/tests',
  asyncHandler(async (_request, response) => {
    response.json(await listTests())
  }),
)

contentRouter.get(
  '/tests/:slug',
  asyncHandler(async (request, response) => {
    const item = await getTestBySlug(request.params.slug)

    if (!item) {
      response.status(404).json({ message: 'Тест не найден.' })
      return
    }

    response.json(item)
  }),
)

contentRouter.post(
  '/tests',
  requireLocalAccess,
  asyncHandler(async (request, response) => {
    const payload = testSchema.parse(request.body)
    response.status(201).json(await createTest(payload))
  }),
)

contentRouter.put(
  '/tests/:slug',
  requireLocalAccess,
  asyncHandler(async (request, response) => {
    const payload = testSchema.parse(request.body)
    response.json(await updateTest(request.params.slug, payload))
  }),
)

contentRouter.delete(
  '/tests/:slug',
  requireLocalAccess,
  asyncHandler(async (request, response) => {
    await deleteTest(request.params.slug)
    response.status(204).end()
  }),
)

contentRouter.get(
  '/materials',
  asyncHandler(async (_request, response) => {
    response.json(await listMaterials())
  }),
)

contentRouter.get(
  '/materials/:slug',
  asyncHandler(async (request, response) => {
    const item = await getMaterialBySlug(request.params.slug)

    if (!item) {
      response.status(404).json({ message: 'Материал не найден.' })
      return
    }

    response.json(item)
  }),
)

contentRouter.post(
  '/materials',
  requireLocalAccess,
  asyncHandler(async (request, response) => {
    const payload = materialSchema.parse(request.body)
    response.status(201).json(await createMaterial(payload))
  }),
)

contentRouter.put(
  '/materials/:slug',
  requireLocalAccess,
  asyncHandler(async (request, response) => {
    const payload = materialSchema.parse(request.body)
    response.json(await updateMaterial(request.params.slug, payload))
  }),
)

contentRouter.delete(
  '/materials/:slug',
  requireLocalAccess,
  asyncHandler(async (request, response) => {
    await deleteMaterial(request.params.slug)
    response.status(204).end()
  }),
)

contentRouter.put(
  '/bundle',
  requireLocalAccess,
  asyncHandler(async (request, response) => {
    const payload = contentBundleSchema.parse(request.body)
    response.json(await replaceAllContent(payload))
  }),
)
