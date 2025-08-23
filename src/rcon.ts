import { Rcon } from 'rcon-client'
import { config } from 'dotenv'

config()

export interface RconConfig {
  host: string
  port: number
  password: string
  timeout?: number
}

export interface RconExecutionResult {
  success: boolean
  responses: string[]
  errors: string[]
}

export class MinecraftRcon {
  private config: RconConfig
  private rcon: Rcon | null = null

  constructor(config?: Partial<RconConfig>) {
    this.config = {
      host: config?.host || process.env.RCON_HOST || 'localhost',
      port: config?.port || parseInt(process.env.RCON_PORT || '25575', 10),
      password: config?.password || process.env.RCON_PASSWORD || '',
      timeout: config?.timeout || 5000
    }

    if (!this.config.password) {
      throw new Error('RCON password is required (set RCON_PASSWORD environment variable)')
    }
  }

  /**
   * Connect to the Minecraft RCON server
   */
  async connect(): Promise<void> {
    if (this.rcon) {
      return // Already connected
    }

    this.rcon = new Rcon({
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      timeout: this.config.timeout
    })

    await this.rcon.connect()
  }

  /**
   * Disconnect from the RCON server
   */
  async disconnect(): Promise<void> {
    if (this.rcon) {
      await this.rcon.end()
      this.rcon = null
    }
  }

  /**
   * Execute a single command via RCON
   */
  async executeCommand(command: string): Promise<string> {
    if (!this.rcon) {
      throw new Error('RCON not connected. Call connect() first.')
    }

    const response = await this.rcon.send(command)
    return response
  }

  /**
   * Execute multiple commands via RCON
   */
  async executeCommands(commands: string[]): Promise<RconExecutionResult> {
    const responses: string[] = []
    const errors: string[] = []

    try {
      await this.connect()

      for (const command of commands) {
        try {
          const response = await this.executeCommand(command)
          responses.push(response)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`Command "${command}" failed: ${errorMessage}`)
        }
      }

      return {
        success: errors.length === 0,
        responses,
        errors
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        responses,
        errors: [`RCON connection failed: ${errorMessage}`]
      }
    }
  }

  /**
   * Test the RCON connection by sending a simple command
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.connect()
      await this.executeCommand('list')
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get server info via RCON
   */
  async getServerInfo(): Promise<{ online: boolean; players?: string }> {
    try {
      await this.connect()
      const response = await this.executeCommand('list')
      return {
        online: true,
        players: response
      }
    } catch (error) {
      return {
        online: false
      }
    }
  }
}

// Singleton instance for the application
let rconInstance: MinecraftRcon | null = null

/**
 * Get the singleton RCON instance
 */
export function getRconInstance(): MinecraftRcon {
  if (!rconInstance) {
    rconInstance = new MinecraftRcon()
  }
  return rconInstance
}

/**
 * Execute commands with automatic connection management
 */
export async function executeMinecraftCommands(commands: string[]): Promise<RconExecutionResult> {
  const rcon = getRconInstance()
  const result = await rcon.executeCommands(commands)

  // Always disconnect after execution to prevent hanging connections
  await rcon.disconnect()

  return result
}
