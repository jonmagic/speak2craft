import fastify from 'fastify'
import { config } from 'dotenv'
import { createHmac } from 'crypto'

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

// HMAC verification middleware
app.addHook('preHandler', async (request, reply) => {
  // Skip HMAC verification for health check
  if (request.url === '/healthz') {
    return
  }

  const hmacSecret = process.env.HMAC_SECRET
  if (!hmacSecret) {
    request.log.error('HMAC_SECRET not configured')
    return reply.code(500).send({ error: 'Server configuration error' })
  }

  // Check for dev bypass (LAN only - will remove in Step 11)
  const devBypass = request.headers['x-dev-bypass']
  if (devBypass === '1') {
    request.log.warn('Using dev bypass - should only be used on LAN')
    return
  }

  const signature = request.headers['x-signature']
  if (!signature || typeof signature !== 'string') {
    request.log.warn('Missing X-Signature header')
    return reply.code(401).send({ error: 'Missing signature' })
  }

  // Get raw body for signature verification
  const body = JSON.stringify(request.body || {})
  const expectedSignature = createHmac('sha256', hmacSecret)
    .update(body)
    .digest('base64')

  if (signature !== expectedSignature) {
    request.log.warn({
      provided: signature.substring(0, 10) + '...',
      expected: expectedSignature.substring(0, 10) + '...'
    }, 'Invalid signature')
    return reply.code(401).send({ error: 'Invalid signature' })
  }

  request.log.debug('HMAC signature verified')
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
