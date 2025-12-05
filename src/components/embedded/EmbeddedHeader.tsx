import { useState, useEffect, useRef } from 'react'
import type { Configuration } from '@botpress/webchat'
import { PanelLeft, PanelLeftClose, SquarePen, Globe, ChevronDown } from 'lucide-react'
import { useTranslation } from '../../i18n'
import './EmbeddedHeader.css'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
] as const

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
}

export function EmbeddedHeader({
  configuration,
  onToggleSidebar,
  sidebarOpen,
  onCreateConversation,
}: EmbeddedHeaderProps) {
  const { t, setLang, lang } = useTranslation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLanguage = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0]

  const handleLanguageChange = (code: string) => {
    loadLanguageStylesheet(code)
    // Small delay to let stylesheet load
    setTimeout(() => {
      setLang(code)
      setDropdownOpen(false)

      // Also update the bot with the new locale
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const botpress = (window as any).botpress
      if (botpress?.updateUser) {
        botpress.updateUser({ data: { locale: code } })
      }
    }, 50)
  }

  // Close dropdown when clicking outside - Shadow DOM compatible
  useEffect(() => {
    if (!dropdownOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      // Use composedPath() to get the actual target path through Shadow DOM
      const path = e.composedPath()
      const clickedInsideDropdown = path.some(
        (el) => el === dropdownRef.current
      )
      if (!clickedInsideDropdown) {
        setDropdownOpen(false)
      }
    }

    // Add a small delay to prevent the opening click from immediately closing
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('click', handleClickOutside, true)
    }
  }, [dropdownOpen])

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

      {/* Language dropdown */}
      <div className="language-dropdown" ref={dropdownRef}>
        <button
          className="header-btn language-btn"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-label="Select language"
          aria-expanded={dropdownOpen}
        >
          <Globe size={18} />
          <span className="language-code">{currentLanguage.code.toUpperCase()}</span>
          <ChevronDown size={14} className={`chevron ${dropdownOpen ? 'open' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="language-menu">
            {LANGUAGES.map((language) => (
              <button
                key={language.code}
                className={`language-option ${language.code === lang ? 'active' : ''}`}
                onClick={() => handleLanguageChange(language.code)}
              >
                <span className="language-flag">{language.flag}</span>
                <span className="language-label">{language.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

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
