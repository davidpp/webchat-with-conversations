import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { TranslationProvider, useTranslation, loadLanguageStylesheet, type SupportedLanguage } from './i18n'
import './index.css'
import App from './App.tsx'

// Get initial language from URL (?lang=de)
function getInitialLanguage(): SupportedLanguage {
  const params = new URLSearchParams(window.location.search)
  const lang = params.get('lang')
  if (lang === 'de' || lang === 'fr') {
    return lang
  }
  return 'en'
}

const initialLang = getInitialLanguage()

// Global API type
interface BotpressAPI {
  setLanguage: (lang: SupportedLanguage) => void
  getLanguage: () => SupportedLanguage
  on: (event: string, handler: (data: any) => void) => () => void
}

// Extend window type
declare global {
  interface Window {
    botpress?: BotpressAPI
  }
}

// Component that connects TranslationProvider to global API
function GlobalAPIConnector({ children }: { children: React.ReactNode }) {
  const { setLang, lang } = useTranslation()

  useEffect(() => {
    const eventHandlers = new Map<string, Set<(data: any) => void>>()

    // Create global botpress API
    window.botpress = {
      setLanguage: async (newLang: SupportedLanguage) => {
        await loadLanguageStylesheet(newLang)
        setLang(newLang)

        // Emit event
        const handlers = eventHandlers.get('languageChanged')
        handlers?.forEach(h => h({ language: newLang }))
      },

      getLanguage: () => lang as SupportedLanguage,

      on: (event: string, handler: (data: any) => void) => {
        if (!eventHandlers.has(event)) {
          eventHandlers.set(event, new Set())
        }
        eventHandlers.get(event)!.add(handler)

        // Return unsubscribe function
        return () => {
          eventHandlers.get(event)?.delete(handler)
        }
      }
    }

    return () => {
      // Cleanup
      delete window.botpress
    }
  }, [setLang, lang])

  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TranslationProvider initialLang={initialLang}>
      <GlobalAPIConnector>
        <App />
      </GlobalAPIConnector>
    </TranslationProvider>
  </StrictMode>,
)
