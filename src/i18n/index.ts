export { TranslationProvider, useTranslation, loadLanguageStylesheet } from './TranslationProvider'
export type { SupportedLanguage } from './TranslationProvider'
export type { TranslationKey, InterpolationValues } from './types'

// Market/Language configuration
export {
  MARKETS,
  LANGUAGES,
  getMarket,
  getLanguagesForMarket,
  getDefaultLanguageForMarket,
  buildLocale,
  parseLocale,
  hasMultipleLanguages,
  isValidLanguage,
  isValidMarket,
} from './markets'
export type { MarketCode, LanguageCode, Market, Language } from './markets'
