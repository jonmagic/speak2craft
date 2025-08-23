import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

// Schema for LLM response
const CommandGenerationSchema = z.object({
  commands: z.array(z.string()).describe('Array of RCON commands to execute'),
  reasoning: z.string().describe('Brief explanation of what was interpreted from the user request'),
  itemsRequested: z.array(z.object({
    itemName: z.string().describe('The Minecraft item name (lowercase, underscore format)'),
    quantity: z.number().int().min(1).max(64).describe('Number of items requested'),
    player: z.string().describe('Target player username')
  })).describe('List of items requested for /give commands only')
})

export type CommandGenerationResult = z.infer<typeof CommandGenerationSchema>

const SYSTEM_PROMPT = `You are a Minecraft command interpreter. Convert natural language requests into valid RCON commands.

AVAILABLE COMMANDS:
- give <player> <item> <quantity> - Give items to player
- god <player> - Toggle invincibility for player
- fly <player> - Toggle flight for player
- sethome <player> <name> - Set a home location
- home <player> <name> - Teleport to saved home location
- tp <player> <target/coordinates> - Teleport player
- tellraw <player> <message> - Send message to player

ITEM NAMING RULES:
- Use exact Minecraft item IDs (lowercase with underscores)
- Examples: bread, diamond_pickaxe, stone, torch, iron_ingot
- Common quantities: bread=5, tools=1, blocks=16, food=5
- Maximum quantity per item: 64

PLAYER TARGETING:
- Always use the exact player name provided
- Default to the requesting player if no specific target mentioned

IMPORTANT RULES:
1. Only generate commands for actions clearly requested by the user
2. Use reasonable default quantities (bread=5, pickaxe=1, blocks=16)
3. For give commands, populate itemsRequested array with all items
4. For non-item commands (god, fly, home, tp), leave itemsRequested empty
5. Always target the requesting player unless specifically told otherwise
6. Keep reasoning brief and helpful

Examples:
- "give me bread" → commands: ["give player bread 5"], itemsRequested: [{"itemName": "bread", "quantity": 5, "player": "player"}]
- "turn on god mode" → commands: ["god player"], itemsRequested: []
- "let me fly" → commands: ["fly player"], itemsRequested: []

RESPONSE FORMAT:
Always return a JSON object with exactly these fields:
- commands: array of command strings
- reasoning: brief explanation string
- itemsRequested: array of objects with itemName, quantity, player fields`

export interface NLPOptions {
  model?: string
  temperature?: number
}

export async function generateCommands(
  utterance: string,
  targetPlayer: string,
  options: NLPOptions = {}
): Promise<CommandGenerationResult> {
  const {
    model = 'gpt-4o-mini',
    temperature = 0.1
  } = options

  try {
    const result = await generateObject({
      model: openai(model),
      schema: CommandGenerationSchema,
      system: SYSTEM_PROMPT,
      prompt: `User request: "${utterance}"
Target player: "${targetPlayer}"

Convert this request into appropriate Minecraft RCON commands.`,
      temperature,
    })

    // Replace placeholder "player" with actual target player name in commands
    const updatedCommands = result.object.commands.map(command =>
      command.replace(/\bplayer\b/g, targetPlayer)
    )

    // Update player names in itemsRequested array
    const updatedItemsRequested = result.object.itemsRequested.map(item => ({
      ...item,
      player: item.player === 'player' ? targetPlayer : item.player
    }))

    return {
      ...result.object,
      commands: updatedCommands,
      itemsRequested: updatedItemsRequested
    }
  } catch (error) {
    console.error('LLM generation failed:', error)
    console.error('Full error details:', JSON.stringify(error, null, 2))
    throw new Error(`Failed to generate commands: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
