// Market and Language configuration for Ledvance webchat
// Markets are country/region codes, Languages are ISO 639-1 language codes

export type MarketCode =
  | 'ar' // Argentina
  | 'au' // Australia
  | 'bx' // Benelux
  | 'br' // Brazil
  | 'bg' // Bulgaria
  | 'hr' // Croatia
  | 'cz' // Czech Republic
  | 'dk' // Denmark
  | 'fi' // Finland
  | 'fr' // France
  | 'de' // Germany
  | 'en' // Global .COM
  | 'hu' // Hungary
  | 'it' // Italy
  | 'es' // Spain
  | 'ch' // Switzerland

export type LanguageCode =
  | 'en' // English
  | 'de' // German
  | 'fr' // French
  | 'es' // Spanish
  | 'pt' // Portuguese
  | 'nl' // Dutch
  | 'bg' // Bulgarian
  | 'hr' // Croatian
  | 'cs' // Czech
  | 'da' // Danish
  | 'fi' // Finnish
  | 'hu' // Hungarian
  | 'it' // Italian

export interface Market {
  code: MarketCode
  label: string
  flag: string
  languages: LanguageCode[]
  defaultLanguage: LanguageCode
}

export interface Language {
  code: LanguageCode
  label: string
  nativeLabel: string // Label in the language itself
}

// All markets with their available languages
export const MARKETS: Market[] = [
  { code: 'ar', label: 'Argentina', flag: '🇦🇷', languages: ['es'], defaultLanguage: 'es' },
  { code: 'au', label: 'Australia', flag: '🇦🇺', languages: ['en'], defaultLanguage: 'en' },
  { code: 'bx', label: 'Benelux', flag: '🇧🇪', languages: ['nl', 'fr'], defaultLanguage: 'nl' },
  { code: 'br', label: 'Brazil', flag: '🇧🇷', languages: ['pt'], defaultLanguage: 'pt' },
  { code: 'bg', label: 'Bulgaria', flag: '🇧🇬', languages: ['bg'], defaultLanguage: 'bg' },
  { code: 'hr', label: 'Croatia', flag: '🇭🇷', languages: ['hr'], defaultLanguage: 'hr' },
  { code: 'cz', label: 'Czech Republic', flag: '🇨🇿', languages: ['cs'], defaultLanguage: 'cs' },
  { code: 'dk', label: 'Denmark', flag: '🇩🇰', languages: ['da'], defaultLanguage: 'da' },
  { code: 'fi', label: 'Finland', flag: '🇫🇮', languages: ['fi'], defaultLanguage: 'fi' },
  { code: 'fr', label: 'France', flag: '🇫🇷', languages: ['fr'], defaultLanguage: 'fr' },
  { code: 'de', label: 'Germany', flag: '🇩🇪', languages: ['de'], defaultLanguage: 'de' },
  { code: 'en', label: 'Global .COM', flag: '🌐', languages: ['en'], defaultLanguage: 'en' },
  { code: 'hu', label: 'Hungary', flag: '🇭🇺', languages: ['hu'], defaultLanguage: 'hu' },
  { code: 'it', label: 'Italy', flag: '🇮🇹', languages: ['it'], defaultLanguage: 'it' },
  { code: 'es', label: 'Spain', flag: '🇪🇸', languages: ['es'], defaultLanguage: 'es' },
  { code: 'ch', label: 'Switzerland', flag: '🇨🇭', languages: ['de', 'fr', 'it'], defaultLanguage: 'de' },
]

// All languages with their labels
export const LANGUAGES: Record<LanguageCode, Language> = {
  en: { code: 'en', label: 'English', nativeLabel: 'English' },
  de: { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  fr: { code: 'fr', label: 'French', nativeLabel: 'Français' },
  es: { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  pt: { code: 'pt', label: 'Portuguese', nativeLabel: 'Português' },
  nl: { code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands' },
  bg: { code: 'bg', label: 'Bulgarian', nativeLabel: 'Български' },
  hr: { code: 'hr', label: 'Croatian', nativeLabel: 'Hrvatski' },
  cs: { code: 'cs', label: 'Czech', nativeLabel: 'Čeština' },
  da: { code: 'da', label: 'Danish', nativeLabel: 'Dansk' },
  fi: { code: 'fi', label: 'Finnish', nativeLabel: 'Suomi' },
  hu: { code: 'hu', label: 'Hungarian', nativeLabel: 'Magyar' },
  it: { code: 'it', label: 'Italian', nativeLabel: 'Italiano' },
}

// Helper functions

/**
 * Get a market by its code
 */
export function getMarket(code: MarketCode): Market | undefined {
  return MARKETS.find((m) => m.code === code)
}

/**
 * Get available languages for a market
 */
export function getLanguagesForMarket(marketCode: MarketCode): Language[] {
  const market = getMarket(marketCode)
  if (!market) return [LANGUAGES.en]
  return market.languages.map((langCode) => LANGUAGES[langCode])
}

/**
 * Get the default language for a market
 */
export function getDefaultLanguageForMarket(marketCode: MarketCode): LanguageCode {
  const market = getMarket(marketCode)
  return market?.defaultLanguage ?? 'en'
}

/**
 * Build a locale string from market and language (e.g., "ch-de")
 */
export function buildLocale(market: MarketCode, language: LanguageCode): string {
  return `${market}-${language}`
}

/**
 * Parse a locale string into market and language
 */
export function parseLocale(locale: string): { market: MarketCode; language: LanguageCode } | null {
  const parts = locale.split('-')
  if (parts.length !== 2) return null

  const [market, language] = parts as [MarketCode, LanguageCode]

  // Validate market exists
  if (!MARKETS.find((m) => m.code === market)) return null

  // Validate language exists
  if (!LANGUAGES[language]) return null

  return { market, language }
}

/**
 * Check if a market has multiple languages
 */
export function hasMultipleLanguages(marketCode: MarketCode): boolean {
  const market = getMarket(marketCode)
  return (market?.languages.length ?? 0) > 1
}

/**
 * Check if a language code is valid
 */
export function isValidLanguage(code: string): code is LanguageCode {
  return code in LANGUAGES
}

/**
 * Check if a market code is valid
 */
export function isValidMarket(code: string): code is MarketCode {
  return MARKETS.some((m) => m.code === code)
}
