import type { TranslationKey } from './types'
import { DEFAULTS } from './defaults'

/**
 * Reads a single translation from CSS custom properties.
 */
export function readCssTranslation(key: TranslationKey): string {
  const cssVar = `--t-${key}`
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(cssVar)
    .trim()
    // CSS values may be quoted - remove surrounding quotes
    .replace(/^['"]|['"]$/g, '')

  return value || DEFAULTS[key]
}

/**
 * Reads all translations from CSS custom properties.
 * Returns a map of key → translated string.
 */
export function readAllTranslations(): Record<TranslationKey, string> {
  const keys = Object.keys(DEFAULTS) as TranslationKey[]

  return Object.fromEntries(
    keys.map((key) => [key, readCssTranslation(key)])
  ) as Record<TranslationKey, string>
}
