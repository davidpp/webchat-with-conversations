import { useState, useEffect, useRef } from 'react'
import type { Configuration } from '@botpress/webchat'
import { PanelLeft, PanelLeftClose, SquarePen, Globe, ChevronDown } from 'lucide-react'
import {
  useTranslation,
  MARKETS,
  LANGUAGES,
  getMarket,
  getLanguagesForMarket,
  getDefaultLanguageForMarket,
  buildLocale,
  hasMultipleLanguages,
  type MarketCode,
  type LanguageCode,
} from '../../i18n'
import './EmbeddedHeader.css'

// Load language stylesheet dynamically
function loadLanguageStylesheet(lang: string) {
  const existingLink = document.getElementById(`lang-stylesheet-${lang}`)
  if (existingLink) return // Already loaded

  // Don't load stylesheet for English (it's the default)
  if (lang === 'en') return

  const link = document.createElement('link')
  link.id = `lang-stylesheet-${lang}`
  link.rel = 'stylesheet'
  link.href = `/translations/webchat-${lang}.css`
  document.head.appendChild(link)
}

interface EmbeddedHeaderProps {
  configuration: Configuration
  onToggleSidebar: () => void
  sidebarOpen: boolean
  onCreateConversation: () => void
  /** Optional market code - when provided, hides market selector and shows only language options for that market */
  market?: MarketCode
  /** Callback when locale changes (market-language combination) */
  onLocaleChange?: (locale: string) => void
}

export function EmbeddedHeader({
  configuration,
  onToggleSidebar,
  sidebarOpen,
  onCreateConversation,
  market: marketProp,
  onLocaleChange,
}: EmbeddedHeaderProps) {
  const { t, setLang, lang } = useTranslation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Track current market (from prop or user selection)
  const [selectedMarket, setSelectedMarket] = useState<MarketCode | null>(marketProp ?? null)

  // When market prop changes, update selection
  useEffect(() => {
    if (marketProp) {
      setSelectedMarket(marketProp)
      // Set default language for this market if current language isn't available
      const marketLanguages = getLanguagesForMarket(marketProp)
      const currentLangAvailable = marketLanguages.some((l) => l.code === lang)
      if (!currentLangAvailable) {
        const defaultLang = getDefaultLanguageForMarket(marketProp)
        handleLanguageChange(defaultLang, marketProp)
      }
    }
  }, [marketProp])

  const currentMarket = selectedMarket ? getMarket(selectedMarket) : null
  const availableLanguages = selectedMarket ? getLanguagesForMarket(selectedMarket) : []
  const currentLanguage = LANGUAGES[lang as LanguageCode] ?? LANGUAGES.en

  // Determine what to show in dropdown
  const showMarketSelector = !marketProp // Show market selector only if market not provided as prop
  const showLanguageSelector = selectedMarket && hasMultipleLanguages(selectedMarket)

  const handleMarketSelect = (marketCode: MarketCode) => {
    setSelectedMarket(marketCode)
    const defaultLang = getDefaultLanguageForMarket(marketCode)
    handleLanguageChange(defaultLang, marketCode)
    setDropdownOpen(false)
  }

  const handleLanguageChange = (code: LanguageCode, marketOverride?: MarketCode) => {
    const effectiveMarket = marketOverride ?? selectedMarket
    loadLanguageStylesheet(code)

    // Small delay to let stylesheet load
    setTimeout(() => {
      setLang(code)
      setDropdownOpen(false)

      // Build combined locale and notify
      const locale = effectiveMarket ? buildLocale(effectiveMarket, code) : code
      onLocaleChange?.(locale)

      // Also update the bot with the new locale
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const botpress = (window as any).botpress
      if (botpress?.updateUser) {
        botpress.updateUser({ data: { locale } })
      }
    }, 50)
  }

  // Close dropdown when clicking outside - Shadow DOM compatible
  useEffect(() => {
    if (!dropdownOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const path = e.composedPath()
      const clickedInsideDropdown = path.some((el) => el === dropdownRef.current)
      if (!clickedInsideDropdown) {
        setDropdownOpen(false)
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('click', handleClickOutside, true)
    }
  }, [dropdownOpen])

  // Determine button display
  const getButtonDisplay = () => {
    if (showMarketSelector && !selectedMarket) {
      // No market selected yet, show globe
      return { flag: null, code: 'SELECT' }
    }
    if (showLanguageSelector) {
      // Market with multiple languages - show language
      return { flag: null, code: currentLanguage.code.toUpperCase() }
    }
    if (currentMarket) {
      // Single language market - show market flag
      return { flag: currentMarket.flag, code: currentMarket.code.toUpperCase() }
    }
    return { flag: null, code: lang.toUpperCase() }
  }

  const buttonDisplay = getButtonDisplay()

  // Render dropdown content based on mode
  const renderDropdownContent = () => {
    // If market is provided as prop, only show language options (if multiple)
    if (marketProp) {
      if (!showLanguageSelector) {
        // Single language market - no dropdown needed
        return null
      }
      return (
        <div className="language-menu">
          {availableLanguages.map((language) => (
            <button
              key={language.code}
              className={`language-option ${language.code === lang ? 'active' : ''}`}
              onClick={() => handleLanguageChange(language.code)}
            >
              <span className="language-label">{language.nativeLabel}</span>
            </button>
          ))}
        </div>
      )
    }

    // No market prop - show market selector or language selector based on state
    if (!selectedMarket) {
      // Show market selector
      return (
        <div className="language-menu market-menu">
          {MARKETS.map((market) => (
            <button
              key={market.code}
              className="language-option"
              onClick={() => handleMarketSelect(market.code)}
            >
              <span className="language-flag">{market.flag}</span>
              <span className="language-label">{market.label}</span>
            </button>
          ))}
        </div>
      )
    }

    // Market selected, show language options if multiple
    if (showLanguageSelector) {
      return (
        <div className="language-menu">
          <button
            className="language-option back-option"
            onClick={() => setSelectedMarket(null)}
          >
            ← {t('btn-back') || 'Back'}
          </button>
          <div className="menu-divider" />
          {availableLanguages.map((language) => (
            <button
              key={language.code}
              className={`language-option ${language.code === lang ? 'active' : ''}`}
              onClick={() => handleLanguageChange(language.code)}
            >
              <span className="language-label">{language.nativeLabel}</span>
            </button>
          ))}
        </div>
      )
    }

    // Single language market - show market selector with current market highlighted
    return (
      <div className="language-menu market-menu">
        {MARKETS.map((market) => (
          <button
            key={market.code}
            className={`language-option ${market.code === selectedMarket ? 'active' : ''}`}
            onClick={() => handleMarketSelect(market.code)}
          >
            <span className="language-flag">{market.flag}</span>
            <span className="language-label">{market.label}</span>
          </button>
        ))}
      </div>
    )
  }

  // Don't show dropdown button if market is provided and it has only one language
  const hideDropdown = marketProp && !showLanguageSelector

  return (
    <header className="embedded-header">
      <button
        className="header-btn sidebar-toggle"
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? t('aria-close-sidebar') : t('aria-open-sidebar')}
      >
        {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
      </button>

      <h1 className="header-title">{configuration.botName || 'Chat'}</h1>

      {/* Market/Language dropdown */}
      {!hideDropdown && (
        <div className="language-dropdown" ref={dropdownRef}>
          <button
            className="header-btn language-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-label="Select language"
            aria-expanded={dropdownOpen}
          >
            {buttonDisplay.flag ? (
              <span className="language-flag">{buttonDisplay.flag}</span>
            ) : (
              <Globe size={18} />
            )}
            <span className="language-code">{buttonDisplay.code}</span>
            <ChevronDown size={14} className={`chevron ${dropdownOpen ? 'open' : ''}`} />
          </button>

          {dropdownOpen && renderDropdownContent()}
        </div>
      )}

      <button
        className="header-btn new-chat-btn"
        onClick={onCreateConversation}
        aria-label={t('aria-new-conversation')}
      >
        <SquarePen size={20} />
      </button>
    </header>
  )
}
