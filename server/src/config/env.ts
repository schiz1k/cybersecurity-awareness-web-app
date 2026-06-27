import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z
    .string()
    .default('postgres://cyber_arena:cyber_arena@localhost:5432/cyber_arena'),
  CORS_ORIGIN: z.string().default('http://localhost:4173'),
  DATABASE_SSL: z.enum(['true', 'false']).default('false'),
})

export const env = envSchema.parse(process.env)
