import { loadPlayerConfig, resolvePlayer } from '../players'
import { loadItemList, validateItems } from '../items'
import { generateCommands } from '../nlp'
import { executeMinecraftCommands } from '../rcon'

export interface VoiceCheckOptions {
  utterance: string
  deviceUser?: string
  dryRun?: boolean
}

export interface VoiceCheckResult {
  success: boolean
  message: string
  targetPlayer: string
  commands: string[]
  itemsRequested: ReturnType<typeof validateItems>['validItems']
  validation?: ReturnType<typeof validateItems>
  rconResult?: Awaited<ReturnType<typeof executeMinecraftCommands>> | null
  error?: string
}

export async function checkVoicePipeline(options: VoiceCheckOptions): Promise<VoiceCheckResult> {
  const { utterance, deviceUser, dryRun = true } = options

  // Ensure configs are loaded (idempotent in current modules)
  loadPlayerConfig()
  loadItemList()

  const targetPlayer = resolvePlayer(deviceUser)

  try {
    const llmResult = await generateCommands(utterance, targetPlayer)

    let validationResult = null
    if (llmResult.itemsRequested.length > 0) {
      validationResult = validateItems(llmResult.itemsRequested)
      if (!validationResult.isValid) {
        return {
          success: false,
          message: 'Item validation failed',
          targetPlayer,
          commands: llmResult.commands,
          itemsRequested: validationResult.validItems,
          validation: validationResult
        }
      }
    }

    let rconResult: Awaited<ReturnType<typeof executeMinecraftCommands>> | null = null
    if (!dryRun && llmResult.commands.length > 0) {
      rconResult = await executeMinecraftCommands(llmResult.commands)
      if (!rconResult.success) {
        return {
          success: false,
          message: 'RCON execution failed',
          targetPlayer,
          commands: llmResult.commands,
          itemsRequested: validationResult?.validItems || [],
          validation: validationResult || undefined,
          rconResult,
          error: rconResult.errors.join(', ')
        }
      }
    }

    return {
      success: true,
      message: llmResult.spokenResponse,
      targetPlayer,
      commands: llmResult.commands,
      itemsRequested: validationResult?.validItems || [],
      validation: validationResult || undefined,
      rconResult
    }
  } catch (error) {
    return {
      success: false,
      message: 'Voice pipeline failed',
      targetPlayer,
      commands: [],
      itemsRequested: [],
      error: error instanceof Error ? error.message : String(error)
    }
  }
}
