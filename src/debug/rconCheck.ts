import { MinecraftRcon } from '../rcon'

export interface RconCheckResult {
  success: boolean
  command: string
  response?: string
  error?: string
}

export async function checkRcon(command: string = 'list'): Promise<RconCheckResult> {
  const rcon = new MinecraftRcon()

  try {
    await rcon.connect()
    const response = await rcon.executeCommand(command)
    return {
      success: true,
      command,
      response
    }
  } catch (error) {
    return {
      success: false,
      command,
      error: error instanceof Error ? error.message : String(error)
    }
  } finally {
    try {
      await rcon.disconnect()
    } catch (err) {
      // ignore disconnect errors
    }
  }
}
