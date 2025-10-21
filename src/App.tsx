import { useState, useEffect } from 'react'
import { WebchatWithConversations } from './components/WebchatWithConversations'
import { InitializationForm } from './components/InitializationForm'
import type { Configuration } from '@botpress/webchat'
import './App.css'

// Default configuration for fallback
const DEFAULT_CONFIGURATION: Configuration = {
  botName: 'Assistant',
  botDescription: 'Ask AI a question about the documentation.',
  botAvatar: 'https://via.placeholder.com/150',
  composerPlaceholder: 'Ask a question...',
  color: '#0588F0',
  variant: 'solid',
  headerVariant: 'glass',
  themeMode: 'light',
  fontFamily: 'inter',
  radius: 3,
  feedbackEnabled: true,
  footer: '[⚡️ by Botpress](https://botpress.com/?from=webchat)',
}

function App() {
  const [clientId, setClientId] = useState<string | null>(null)
  const [configuration, setConfiguration] = useState<Configuration>(DEFAULT_CONFIGURATION)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check URL parameters on mount
  useEffect(() => {
    const checkUrlParams = async () => {
      try {
        // Check for script URL in query params (e.g., ?script=https://...)
        const urlParams = new URLSearchParams(window.location.search)
        const scriptUrl = urlParams.get('script')
        const directClientId = urlParams.get('clientId')

        // Also check if the entire path after ? is a URL (e.g., ?https://files.bpcontent.cloud/...)
        const fullQuery = window.location.search.slice(1) // Remove the ?
        const isFullQueryUrl = fullQuery.startsWith('http://') || fullQuery.startsWith('https://')

        if (scriptUrl || isFullQueryUrl) {
          let url = scriptUrl || fullQuery

          // Log for debugging
          console.log('Script URL detection:', {
            scriptUrl,
            fullQuery,
            isFullQueryUrl,
            finalUrl: url,
            windowLocation: window.location.href
          })

          // Ensure the URL is absolute, not relative
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            throw new Error('Invalid script URL: must be an absolute URL starting with http:// or https://')
          }

          // Fetch and parse the script
          const response = await fetch(url)
          if (!response.ok) {
            throw new Error(`Failed to fetch script: ${response.statusText}`)
          }

          const scriptContent = await response.text()
          const config = extractConfigFromScript(scriptContent)

          if (config) {
            setClientId(config.clientId)
            setConfiguration(config.configuration)
          }
        } else if (directClientId) {
          // Use client ID from URL
          setClientId(directClientId)
          setConfiguration(DEFAULT_CONFIGURATION)
        }
        // REMOVED: No longer auto-load from environment variable
        // Always show form unless URL params are provided
      } catch (err) {
        console.error('Failed to load from URL:', err)
        setError(err instanceof Error ? err.message : 'Failed to load configuration')
      } finally {
        setLoading(false)
      }
    }

    checkUrlParams()
  }, [])

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

      // Extract botId if present (some scripts use botId instead of clientId in config)
      const botId = config.botId || config.configuration?.botId

      return {
        clientId: config.clientId,
        configuration: {
          ...DEFAULT_CONFIGURATION,
          ...config.configuration,
          ...(botId && { botId })
        }
      }
    } catch (err) {
      console.error('Failed to parse script:', err)
      console.error('Script content:', scriptContent.substring(0, 500))
      throw new Error(`Failed to parse Botpress script: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleInitialize = (newClientId: string, newConfiguration: Configuration) => {
    setClientId(newClientId)
    setConfiguration(newConfiguration)

    // Update URL to reflect the current state (for sharing)
    if (window.history.replaceState) {
      const url = new URL(window.location.href)
      url.searchParams.set('clientId', newClientId)
      window.history.replaceState({}, '', url)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: '1.125rem',
        color: '#666'
      }}>
        Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '1.125rem' }}>
          Error: {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
      </div>
    )
  }

  if (!clientId) {
    return <InitializationForm onInitialize={handleInitialize} />
  }

  return (
    <WebchatWithConversations
      clientId={clientId}
      configuration={configuration}
      enableConversationList={true}
      storageKey={`webchat-${clientId}`}
    />
  )
}

export default App
