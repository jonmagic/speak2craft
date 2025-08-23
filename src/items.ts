import { readFileSync } from 'fs'
import { join } from 'path'

let validItems: Set<string> | null = null

export function loadItemList(): void {
  try {
    const itemsPath = join(process.cwd(), 'config', 'items.csv')
    const itemsContent = readFileSync(itemsPath, 'utf-8')

    // Parse CSV and create a Set for O(1) lookups
    validItems = new Set(
      itemsContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#')) // Remove empty lines and comments
    )

    console.log(`Loaded ${validItems.size} valid Minecraft items`)
  } catch (error) {
    console.error('Failed to load items.csv:', error)
    throw error
  }
}

export function isValidItem(itemName: string): boolean {
  if (!validItems) {
    throw new Error('Item list not loaded. Call loadItemList() first.')
  }

  return validItems.has(itemName.toLowerCase())
}

export function getValidItems(): string[] {
  if (!validItems) {
    throw new Error('Item list not loaded. Call loadItemList() first.')
  }

  return Array.from(validItems).sort()
}

export function findSimilarItems(itemName: string, maxResults: number = 5): string[] {
  if (!validItems) {
    throw new Error('Item list not loaded. Call loadItemList() first.')
  }

  const searchTerm = itemName.toLowerCase()
  const items = Array.from(validItems)

  // Find items that contain the search term
  const containsMatches = items
    .filter(item => item.includes(searchTerm))
    .slice(0, maxResults)

  if (containsMatches.length > 0) {
    return containsMatches
  }

  // If no contains matches, find items that start with the search term
  const startsWithMatches = items
    .filter(item => item.startsWith(searchTerm))
    .slice(0, maxResults)

  if (startsWithMatches.length > 0) {
    return startsWithMatches
  }

  // Fallback to some common items
  const commonItems = ['bread', 'torch', 'stone', 'wood', 'diamond_pickaxe']
  return commonItems.filter(item => validItems!.has(item)).slice(0, maxResults)
}

export interface ItemValidationResult {
  isValid: boolean
  validItems: Array<{
    itemName: string
    quantity: number
    player: string
  }>
  invalidItems: Array<{
    itemName: string
    quantity: number
    player: string
    suggestions: string[]
  }>
  errors: string[]
}

export function validateItems(
  itemsRequested: Array<{
    itemName: string
    quantity: number
    player: string
  }>
): ItemValidationResult {
  const validItemList: ItemValidationResult['validItems'] = []
  const invalidItemList: ItemValidationResult['invalidItems'] = []
  const errors: string[] = []

  for (const item of itemsRequested) {
    // Validate quantity
    if (item.quantity < 1 || item.quantity > 64) {
      errors.push(`Invalid quantity ${item.quantity} for ${item.itemName}. Must be between 1 and 64.`)
      continue
    }

    // Validate item name
    if (isValidItem(item.itemName)) {
      validItemList.push(item)
    } else {
      const suggestions = findSimilarItems(item.itemName, 3)
      invalidItemList.push({
        ...item,
        suggestions
      })
    }
  }

  return {
    isValid: invalidItemList.length === 0 && errors.length === 0,
    validItems: validItemList,
    invalidItems: invalidItemList,
    errors
  }
}
