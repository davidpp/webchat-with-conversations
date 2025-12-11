import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import type { TranslationKey, InterpolationValues } from './types'
import { readAllTranslations } from './cssReader'
import { interpolate } from './interpolate'
import './translations.css'

// Supported languages - includes all languages from markets.ts
// Languages without CSS translation files will fall back to English
export type SupportedLanguage =
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

// Load language stylesheet dynamically
export function loadLanguageStylesheet(lang: string): Promise<void> {
  return new Promise((resolve) => {
    if (lang === 'en') {
      resolve()
      return
    }

    const linkId = `webchat-lang-${lang}`
    const existing = document.getElementById(linkId)
    if (existing) {
      resolve()
      return
    }

    const link = document.createElement('link')
    link.id = linkId
    link.rel = 'stylesheet'
    link.href = `/translations/webchat-${lang}.css`
    link.onload = () => resolve()
    link.onerror = () => resolve() // Continue even if stylesheet fails
    document.head.appendChild(link)
  })
}

interface TranslationContextValue {
  /**
   * Get a translated string by key, with optional interpolation.
   * @example t('btn-new-conversation') // "+ New Conversation"
   * @example t('time-mins', { n: 5 }) // "5m ago"
   */
  t: (key: TranslationKey, values?: InterpolationValues) => string
  /**
   * Set the current language. Updates data-lang attribute and refreshes translations.
   */
  setLang: (lang: string) => void
  /**
   * Manually refresh translations from CSS.
   * Useful after dynamically loading a stylesheet.
   */
  refresh: () => void
  /**
   * Current language code (from data-lang attribute).
   */
  lang: string
}

const TranslationContext = createContext<TranslationContextValue | null>(null)

interface TranslationProviderProps {
  children: ReactNode
  /**
   * Initial language. Defaults to 'en'.
   */
  initialLang?: string
}

export function TranslationProvider({
  children,
  initialLang = 'en',
}: TranslationProviderProps) {
  const [lang, setLangState] = useState(initialLang)
  const [translations, setTranslations] = useState<Record<TranslationKey, string>>(
    () => readAllTranslations()
  )

  const refresh = useCallback(() => {
    // Use requestAnimationFrame to ensure CSS is applied before reading
    requestAnimationFrame(() => {
      setTranslations(readAllTranslations())
    })
  }, [])

  const setLang = useCallback(
    async (newLang: string) => {
      // Load stylesheet first, then update state
      await loadLanguageStylesheet(newLang)
      document.documentElement.setAttribute('data-lang', newLang)
      setLangState(newLang)
      // Small delay to ensure CSS is applied
      requestAnimationFrame(() => {
        refresh()
      })
    },
    [refresh]
  )

  // Set initial lang attribute and load stylesheet
  useEffect(() => {
    const init = async () => {
      if (initialLang !== 'en') {
        await loadLanguageStylesheet(initialLang)
      }
      document.documentElement.setAttribute('data-lang', initialLang)
      // Refresh translations after stylesheet loads
      requestAnimationFrame(() => {
        setTranslations(readAllTranslations())
      })
    }
    init()
  }, [initialLang])

  // Watch for stylesheet additions (external translations)
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node instanceof HTMLLinkElement && node.rel === 'stylesheet') {
              // Wait for stylesheet to load before refreshing
              node.addEventListener('load', refresh)
            } else if (node instanceof HTMLStyleElement) {
              refresh()
            }
          }
        }
      }
    })

    observer.observe(document.head, { childList: true })
    return () => observer.disconnect()
  }, [refresh])

  const t = useCallback(
    (key: TranslationKey, values?: InterpolationValues): string => {
      const template = translations[key] ?? key
      return interpolate(template, values)
    },
    [translations]
  )

  const value = useMemo<TranslationContextValue>(
    () => ({ t, setLang, refresh, lang }),
    [t, setLang, refresh, lang]
  )

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  )
}

/**
 * Hook to access translations in components.
 * Must be used within a TranslationProvider.
 */
export function useTranslation(): TranslationContextValue {
  const context = useContext(TranslationContext)

  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }

  return context
}
