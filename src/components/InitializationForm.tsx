import { useState } from 'react'
import { type Configuration } from '@botpress/webchat'
import { extractConfigFromScript } from '../utils/configParser'
import { useTranslation } from '../i18n'
import './InitializationForm.css'

interface InitializationFormProps {
  onInitialize: (clientId: string, configuration: Configuration, scriptUrl?: string, embedded?: boolean) => void
}

export function InitializationForm({ onInitialize }: InitializationFormProps) {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState('')
  const [embedded, setEmbedded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isUrl = (value: string) => {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!inputValue.trim()) {
      setError(t('error-no-input'))
      return
    }

    setLoading(true)

    try {
      if (isUrl(inputValue)) {
        // Fetch and parse the script
        const response = await fetch(inputValue)
        if (!response.ok) {
          throw new Error(`Failed to fetch script: ${response.statusText}`)
        }

        const scriptContent = await response.text()
        const config = extractConfigFromScript(scriptContent)

        if (config) {
          onInitialize(config.clientId, config.configuration, inputValue, embedded)
        }
      } else {
        // Treat as client ID
        const defaultConfig: Configuration = {
          botName: 'Assistant',
          composerPlaceholder: 'Type a message...',
        }
        onInitialize(inputValue.trim(), defaultConfig, undefined, embedded)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadDefault = () => {
    // Check if there's a default client ID in environment
    const envClientId = import.meta.env.VITE_BOTPRESS_CLIENT_ID
    if (envClientId && envClientId.trim()) {
      const defaultConfig: Configuration = {
        botName: 'Botpress Assistant',
        botDescription: 'Ask AI a question about the documentation.',
        botAvatar: 'https://via.placeholder.com/150',
        composerPlaceholder: 'Ask a question...',
        color: '#0588F0',
        variant: 'solid',
        headerVariant: 'glass',
        themeMode: 'light',
        fontFamily: 'inter',
        radius: 3,
      }
      onInitialize(envClientId, defaultConfig, undefined, embedded)
    } else {
      setError(t('error-no-config'))
    }
  }

  return (
    <div className="init-form-container">
      <div className="init-form">
        <h1>{t('title-init')}</h1>
        <p>{t('subtitle-init')}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="input">{t('label-client-id')}</label>
            <input
              id="input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('placeholder-input')}
              disabled={loading}
            />
            <small>
              {t('label-examples')}
              <br />
              • {t('label-client-id-example')} <code>f0119422-b733-4b07-8cf5-b23e84305127</code>
              <br />
              • {t('label-script-url-example')} <code>https://files.bpcontent.cloud/YYYY/MM/DD/HH/YYYYMMDDHHMMSS-XXXXXXXX.js</code>
            </small>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={embedded}
                onChange={(e) => setEmbedded(e.target.checked)}
                disabled={loading}
              />
              <span>{t('label-embedded')}</span>
            </label>
            <small>{t('label-embedded-hint')}</small>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? t('btn-loading') : t('btn-initialize')}
          </button>

          {/* Optional: Load default config button if env var is set */}
          {import.meta.env.VITE_BOTPRESS_CLIENT_ID && (
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <span style={{ color: '#666', fontSize: '12px' }}>{t('label-or')}</span>
              <button
                type="button"
                onClick={handleLoadDefault}
                style={{
                  marginTop: '8px',
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid #e5e7eb',
                  color: '#4b5563'
                }}
                disabled={loading}
              >
                {t('btn-load-default')}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}