import { createServer } from './app'
import { ensureSchema } from './db/ensureSchema'
import { env } from './config/env'

async function start() {
  await ensureSchema()

  const app = createServer()

  app.listen(env.PORT, () => {
    console.log(`Cyber Arena API started on http://localhost:${env.PORT}`)
  })
}

void start().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
