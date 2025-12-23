import { useState, useEffect } from 'react'
import { WebchatWithConversations } from './components/WebchatWithConversations'
import { EmbeddedLayout } from './components/embedded'
import { InitializationForm } from './components/InitializationForm'
import { extractConfigFromScript } from './utils/configParser'
import type { Configuration } from '@botpress/webchat'
import './App.css'

type DisplayMode = 'fab' | 'embedded'

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
  const [mode, setMode] = useState<DisplayMode>('fab')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Note: /ledvance is served as static HTML from public/ledvance/index.html
  // The inject.js now uses ShadowPortal directly, no /embed route needed

  // Check URL parameters on mount
  useEffect(() => {
    const checkUrlParams = async () => {
      try {
        // Note: /ledvance is now served as static HTML from public/ledvance/index.html

        // Check for script URL in query params (e.g., ?script=https://...)
        const urlParams = new URLSearchParams(window.location.search)
        const scriptUrl = urlParams.get('script')
        const directClientId = urlParams.get('clientId')
        const modeParam = urlParams.get('mode') as DisplayMode | null

        // Set display mode (fab is default)
        if (modeParam === 'embedded') {
          setMode('embedded')
        }

        // Also check if the entire path after ? is a URL (e.g., ?https://files.bpcontent.cloud/...)
        const fullQuery = window.location.search.slice(1) // Remove the ?
        const isFullQueryUrl = fullQuery.startsWith('http://') || fullQuery.startsWith('https://')

        if (scriptUrl || isFullQueryUrl) {
          const url = scriptUrl || fullQuery
          // Fetch and parse the script
          const response = await fetch(url)
          if (!response.ok) {
            throw new Error(`Failed to fetch script: ${response.statusText}`)
          }

          const scriptContent = await response.text()
          const config = extractConfigFromScript(scriptContent)

          if (config) {
            setClientId(config.clientId)
            setConfiguration({ ...DEFAULT_CONFIGURATION, ...config.configuration })
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

  const handleInitialize = (newClientId: string, newConfiguration: Configuration, scriptUrl?: string, embedded?: boolean) => {
    setClientId(newClientId)
    setConfiguration(newConfiguration)
    if (embedded) {
      setMode('embedded')
    }

    // Update URL to reflect the current state (for sharing)
    if (window.history.replaceState) {
      const url = new URL(window.location.href)
      if (scriptUrl) {
        // Keep the script URL so configuration can be reloaded
        url.search = '?' + scriptUrl
        if (embedded) {
          url.searchParams.set('mode', 'embedded')
        }
      } else {
        // Just keep the clientId for simple cases
        url.searchParams.set('clientId', newClientId)
        if (embedded) {
          url.searchParams.set('mode', 'embedded')
        }
      }
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

  // Route based on display mode
  if (mode === 'embedded') {
    return (
      <EmbeddedLayout
        clientId={clientId}
        configuration={configuration}
        storageKey={`webchat-${clientId}`}
      />
    )
  }

  // Default: FAB mode
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
