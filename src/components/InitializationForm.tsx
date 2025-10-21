import { useState } from 'react'
import { type Configuration } from '@botpress/webchat'
import './InitializationForm.css'

interface InitializationFormProps {
  onInitialize: (clientId: string, configuration: Configuration, scriptUrl?: string) => void
}

export function InitializationForm({ onInitialize }: InitializationFormProps) {
  const [inputValue, setInputValue] = useState('')
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

  const extractConfigFromScript = (scriptContent: string): { clientId: string; configuration: Configuration } | null => {
    try {
      // Extract the window.botpress.init() call - more flexible regex
      const initMatch = scriptContent.match(/window\.botpress\.init\s*\(\s*(\{[\s\S]*?\})\s*\)/);
      if (!initMatch) {
        throw new Error('Could not find window.botpress.init() in script')
      }

      // Use Function constructor to safely evaluate the object literal
      // This handles JS object notation better than regex replacement
      let config: any
      try {
        // Wrap in parentheses to make it an expression
        const evalCode = `(${initMatch[1]})`
        // Create a sandboxed function to evaluate the object
        const fn = new Function('return ' + evalCode)
        config = fn()
      } catch (evalError) {
        // Fallback to regex-based parsing if evaluation fails
        console.warn('Direct evaluation failed, trying regex parsing:', evalError)

        const configStr = initMatch[1]
          // Handle unquoted keys
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')
          // Handle single quotes in values
          .replace(/:\s*'([^']*)'/g, ': "$1"')
          // Handle trailing commas
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          // Escape special characters in strings
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

        config = JSON.parse(configStr)
      }

      if (!config.clientId) {
        throw new Error('No clientId found in configuration')
      }

      return {
        clientId: config.clientId,
        configuration: config.configuration || {}
      }
    } catch (err) {
      console.error('Failed to parse script:', err)
      throw new Error(`Failed to parse Botpress script: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!inputValue.trim()) {
      setError('Please enter a client ID or URL')
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
          onInitialize(config.clientId, config.configuration, inputValue)
        }
      } else {
        // Treat as client ID
        const defaultConfig: Configuration = {
          botName: 'Assistant',
          composerPlaceholder: 'Type a message...',
        }
        onInitialize(inputValue.trim(), defaultConfig)
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
      onInitialize(envClientId, defaultConfig)
    } else {
      setError('No default client ID configured in environment')
    }
  }

  return (
    <div className="init-form-container">
      <div className="init-form">
        <h1>Initialize Webchat</h1>
        <p>Enter a Botpress client ID or script URL to get started</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="input">Client ID or Script URL</label>
            <input
              id="input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g., abc123 or https://files.bpcontent.cloud/..."
              disabled={loading}
            />
            <small>
              Examples:
              <br />
              • Client ID: <code>f0119422-b733-4b07-8cf5-b23e84305127</code>
              <br />
              • Script URL: <code>https://files.bpcontent.cloud/YYYY/MM/DD/HH/YYYYMMDDHHMMSS-XXXXXXXX.js</code>
            </small>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Initialize Webchat'}
          </button>

          {/* Optional: Load default config button if env var is set */}
          {import.meta.env.VITE_BOTPRESS_CLIENT_ID && (
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <span style={{ color: '#666', fontSize: '12px' }}>or</span>
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
                Load Default Configuration
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}