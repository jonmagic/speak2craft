import fastify from 'fastify'
import { config } from 'dotenv'

// Load environment variables
config()

const app = fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() }
      },
    },
    timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
  },
  genReqId: () => {
    return Math.random().toString(36).substring(2, 15)
  },
})

// Health check endpoint
app.get('/healthz', async (request, reply) => {
  return {
    ok: true,
    ts: Date.now(),
  }
})

// Voice command endpoint
app.post('/voice', async (request, reply) => {
  const body = request.body as { utterance?: string; deviceUser?: string }

  request.log.info({
    utterance: body.utterance,
    deviceUser: body.deviceUser
  }, 'Voice request received')

  // For now, just echo back the request
  return {
    received: body,
    ts: Date.now(),
  }
})

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10)
    const host = process.env.HOST || '0.0.0.0'

    await app.listen({ port, host })
    app.log.info(`Server listening on ${host}:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
