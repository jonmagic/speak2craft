interface PlayerConfig {
  deviceUsers: Record<string, string>
  defaults: {
    grant_target: string
  }
}

let playerConfig: PlayerConfig | null = null

export function loadPlayerConfig(): void {
  try {
    // Build player mappings from environment variables
    const deviceUsers: Record<string, string> = {}

    // Look for PLAYER_* environment variables
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith('PLAYER_') && value) {
        // Convert PLAYER_EISLEY to eisley
        const deviceUser = key.replace('PLAYER_', '').toLowerCase()
        deviceUsers[deviceUser] = value
      }
    }

    const defaultPlayer = process.env.DEFAULT_PLAYER
    if (!defaultPlayer) {
      throw new Error('DEFAULT_PLAYER environment variable is required')
    }

    playerConfig = {
      deviceUsers,
      defaults: {
        grant_target: defaultPlayer
      }
    }

    console.log('Player config loaded from environment:', playerConfig)
  } catch (error) {
    console.error('Failed to load player config from environment:', error)
    throw error
  }
}

export function resolvePlayer(deviceUser?: string): string {
  if (!playerConfig) {
    throw new Error('Player config not loaded. Call loadPlayerConfig() first.')
  }

  if (!deviceUser) {
    return playerConfig.defaults.grant_target
  }

  const minecraftUsername = playerConfig.deviceUsers[deviceUser.toLowerCase()]
  if (minecraftUsername) {
    return minecraftUsername
  }

  // Fallback to default if device user not found
  return playerConfig.defaults.grant_target
}

export function getPlayerConfig(): PlayerConfig | null {
  return playerConfig
}
