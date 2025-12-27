import { config } from 'dotenv'
import { checkRcon } from './src/debug/rconCheck'
import { checkVoicePipeline } from './src/debug/voiceCheck'

config({ override: true })

async function main() {
  const [, , maybeCommandOrUtterance, maybeDeviceUser] = process.argv

  // If provided, treat first arg as utterance override; else use a default demo phrase
  const utterance = maybeCommandOrUtterance || 'give me 5 bread'
  const deviceUser = maybeDeviceUser

  console.log('=== RCON connectivity check ===')
  const rconResult = await checkRcon('list')
  if (rconResult.success) {
    console.log('✅ RCON connected and authenticated')
    console.log('Response:', rconResult.response)
  } else {
    console.error('❌ RCON failed:', rconResult.error)
  }

  console.log('\n=== Voice pipeline check ===')
  console.log(`Utterance: "${utterance}"${deviceUser ? ` | deviceUser: ${deviceUser}` : ''}`)
  const voiceResult = await checkVoicePipeline({
    utterance,
    deviceUser,
    dryRun: false // run full end-to-end, including RCON execution
  })

  if (voiceResult.success) {
    console.log('✅ Voice pipeline succeeded')
    console.log('Target player:', voiceResult.targetPlayer)
    console.log('Commands:', voiceResult.commands)
    if (voiceResult.rconResult) {
      console.log('RCON responses:', voiceResult.rconResult.responses)
    }
  } else {
    console.error('❌ Voice pipeline failed')
    console.error('Message:', voiceResult.message)
    if (voiceResult.validation) {
      console.error('Validation errors:', voiceResult.validation.errors)
      console.error('Invalid items:', voiceResult.validation.invalidItems)
    }
    if (voiceResult.error) {
      console.error('Error:', voiceResult.error)
    }
    if (voiceResult.rconResult) {
      console.error('RCON errors:', voiceResult.rconResult.errors)
    }
  }
}

main().catch(err => {
  console.error('Unexpected error running debug script:', err)
  process.exit(1)
})
