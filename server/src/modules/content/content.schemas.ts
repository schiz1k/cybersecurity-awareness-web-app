import { z } from 'zod'

export const quizQuestionSchema = z.object({
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  answer: z.number().int().min(0),
  explanation: z.string().default(''),
})

export const testSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  headline: z.string().min(1),
  tag: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  difficulty: z.enum(['База', 'Средний', 'Продвинутый']),
  duration: z.string().min(1),
  metric: z.string().min(1),
  accent: z.string().regex(/^#([0-9a-fA-F]{6})$/),
  benefits: z.array(z.string().min(1)),
  deck: z.array(z.string().min(1)),
  mode: z.enum(['reflex', 'sequence', 'priority', 'quiz']),
  status: z.enum(['playable', 'draft']),
  questions: z.array(quizQuestionSchema).optional(),
})

export const materialSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  level: z.string().min(1),
  readTime: z.string().min(1),
  summary: z.string().min(1),
  highlights: z.array(z.string().min(1)),
  body: z.array(z.string().min(1)),
})

export const contentBundleSchema = z.object({
  tests: z.array(testSchema),
  materials: z.array(materialSchema),
})
