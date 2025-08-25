import fastify from 'fastify'
import { config } from 'dotenv'
import { createHmac } from 'crypto'
import { loadPlayerConfig, resolvePlayer } from './players'
import { loadItemList, validateItems } from './items'
import { generateCommands } from './nlp'
import { executeMinecraftCommands } from './rcon'

// Load environment variables
config()

// Load configurations
loadPlayerConfig()
loadItemList()

const app = fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      targets: [
        {
          target: 'pino/file',
          level: 'info',
          options: {
            destination: './tmp/log.txt',
            mkdir: true
          }
        },
        {
          target: 'pino-pretty',
          level: 'info',
          options: {
            colorize: true,
            translateTime: 'SYS:standard'
          }
        }
      ]
    }
  },
  genReqId: () => {
    return Math.random().toString(36).substring(2, 15)
  },
})

// HMAC verification middleware
app.addHook('preHandler', async (request, reply) => {
  // Skip HMAC verification for health check
  if (request.url.startsWith('/healthz')) {
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
  const query = request.query as { checkRcon?: string }
  const shouldCheckRcon = query.checkRcon === '1' || query.checkRcon === 'true'

  const health: any = {
    ok: true,
    ts: Date.now(),
  }

  // Optionally check RCON connectivity
  if (shouldCheckRcon) {
    try {
      const { getRconInstance } = await import('./rcon')
      const rcon = getRconInstance()
      const serverInfo = await rcon.getServerInfo()

      health.rcon = {
        connected: serverInfo.online,
        players: serverInfo.players || null
      }

      // Always disconnect after health check
      await rcon.disconnect()
    } catch (error) {
      health.rcon = {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown RCON error'
      }
    }
  }

  return health
})

// Voice command endpoint
app.post('/voice', async (request, reply) => {
  const body = request.body as { utterance?: string; deviceUser?: string }
  const query = request.query as { dryRun?: string }

  if (!body.utterance || typeof body.utterance !== 'string') {
    return reply.code(400).send({
      success: false,
      message: 'Missing or invalid utterance field'
    })
  }

  // Check if this is a dry-run (testing mode)
  const isDryRun = query.dryRun === '1' || query.dryRun === 'true'

  // Resolve the target player
  const targetPlayer = resolvePlayer(body.deviceUser)

  request.log.info({
    utterance: body.utterance,
    deviceUser: body.deviceUser,
    targetPlayer,
    isDryRun
  }, 'Voice request received')

  try {
    // Generate commands using LLM
    const llmResult = await generateCommands(body.utterance, targetPlayer)

    request.log.info({
      commands: llmResult.commands,
      itemsRequested: llmResult.itemsRequested,
      reasoning: llmResult.reasoning
    }, 'LLM generated commands')

    // Validate items if any were requested
    let validationResult = null
    if (llmResult.itemsRequested.length > 0) {
      validationResult = validateItems(llmResult.itemsRequested)

      request.log.info({
        isValid: validationResult.isValid,
        validItems: validationResult.validItems,
        invalidItems: validationResult.invalidItems,
        errors: validationResult.errors
      }, 'Item validation result')

      // If validation failed, return helpful error message
      if (!validationResult.isValid) {
        const errorMessages = []

        // Add general errors
        errorMessages.push(...validationResult.errors)

        // Add invalid item errors with suggestions
        for (const invalidItem of validationResult.invalidItems) {
          const suggestions = invalidItem.suggestions.length > 0
            ? `. Try: ${invalidItem.suggestions.join(', ')}`
            : ''
          errorMessages.push(`Sorry, '${invalidItem.itemName}' is not a valid Minecraft item${suggestions}`)
        }



        return {
          success: false,
          message: errorMessages.join('. '),
          commands: llmResult.commands,
          itemsRequested: llmResult.itemsRequested,
          validationResult,
          ts: Date.now()
        }
      }
    }

    // Execute commands via RCON (unless dry-run mode)
    let rconResult = null
    if (!isDryRun && llmResult.commands.length > 0) {
      request.log.info({ commands: llmResult.commands }, 'Executing commands via RCON')

      try {
        rconResult = await executeMinecraftCommands(llmResult.commands)

        request.log.info({
          success: rconResult.success,
          responses: rconResult.responses,
          errors: rconResult.errors
        }, 'RCON execution result')

        // If RCON execution failed, return error
        if (!rconResult.success) {
          return {
            success: false,
            message: `Failed to execute commands on Minecraft server: ${rconResult.errors.join(', ')}`,
            commands: llmResult.commands,
            itemsRequested: llmResult.itemsRequested,
            validationResult,
            rconResult,
            ts: Date.now()
          }
        }
      } catch (error) {
        request.log.error(error, 'RCON execution failed with exception')

        return reply.code(500).send({
          success: false,
          message: 'Failed to connect to Minecraft server. Please try again.',
          commands: llmResult.commands,
          itemsRequested: llmResult.itemsRequested,
          validationResult,
          error: error instanceof Error ? error.message : 'Unknown RCON error',
          ts: Date.now()
        })
      }
    }

    // Return success response
    const message = rconResult
      ? llmResult.spokenResponse || `Commands executed successfully on Minecraft server`
      : validationResult
      ? llmResult.spokenResponse || validationResult.validItems.map(item => `${item.itemName} x${item.quantity}`).join(', ')
      : llmResult.spokenResponse || llmResult.reasoning

    return {
      success: true,
      message,
      commands: llmResult.commands,
      itemsRequested: llmResult.itemsRequested,
      validationResult,
      rconResult,
      dryRun: isDryRun,
      ts: Date.now()
    }
  } catch (error) {
    request.log.error(error, 'Failed to process voice command')

    return reply.code(500).send({
      success: false,
      message: 'Sorry, there was an error processing your request',
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now()
    })
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
