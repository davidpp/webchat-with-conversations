/**
 * EmbedPage - Webchat component designed to run inside an iframe
 *
 * Receives configuration via URL params and communicates with parent
 * window via postMessage for API commands and events.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  useWebchat,
  type Configuration,
  MessageList,
  Composer,
  enrichMessage,
  StylesheetProvider,
  Fab,
} from '@botpress/webchat'
import { useConversationList } from '../hooks/useConversationList'
import { TranslationProvider, useTranslation, loadLanguageStylesheet, type SupportedLanguage } from '../i18n'
import { EmbeddedSidebar } from '../components/embedded/EmbeddedSidebar'
import { EmbeddedHeader } from '../components/embedded/EmbeddedHeader'
import { extractConfigFromScript } from '../utils/configParser'
import '../components/embedded/EmbeddedLayout.css'

// Default configuration
const DEFAULT_CONFIGURATION: Configuration = {
  botName: 'Assistant',
  botDescription: 'How can I help you today?',
  composerPlaceholder: 'Ask a question...',
  color: '#0588F0',
  variant: 'solid',
  themeMode: 'light',
  fontFamily: 'inter',
  radius: 3,
}

// Ledvance script URL - config is loaded from this
const LEDVANCE_SCRIPT_URL = 'https://files.bpcontent.cloud/2025/10/02/07/20251002074359-QIWP7U83.js'

// Parse URL params (static parts only - config loaded async for /ledvance)
function getUrlParams() {
  const params = new URLSearchParams(window.location.search)
  const isLedvance = window.location.pathname === '/ledvance'

  return {
    clientId: params.get('clientId') || '',
    lang: (params.get('lang') as SupportedLanguage) || 'en',
    isIframe: params.get('iframe') === 'true',
    isLedvance,
    config: params.get('config') ? JSON.parse(params.get('config')!) : undefined,
  }
}

// Inner component that has access to translation context
function EmbedPageInner() {
  const { t, setLang } = useTranslation()
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const urlParams = getUrlParams()
  const isIframe = urlParams.isIframe

  // State for dynamically loaded config (for /ledvance)
  const [loadedConfig, setLoadedConfig] = useState<{ clientId: string; configuration: Configuration } | null>(null)
  const [configLoading, setConfigLoading] = useState(urlParams.isLedvance)
  const [configError, setConfigError] = useState<string | null>(null)

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentConversationId, setCurrentConversationId] = useState<string>()
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isOpen, setIsOpen] = useState(!urlParams.isIframe) // Start closed if in iframe mode

  // Load config from Botpress script URL for /ledvance
  useEffect(() => {
    if (!urlParams.isLedvance) return

    const loadConfig = async () => {
      try {
        const response = await fetch(LEDVANCE_SCRIPT_URL)
        if (!response.ok) {
          throw new Error(`Failed to fetch script: ${response.statusText}`)
        }
        const scriptContent = await response.text()
        const parsed = extractConfigFromScript(scriptContent)
        if (parsed) {
          setLoadedConfig({
            clientId: parsed.clientId,
            configuration: { ...DEFAULT_CONFIGURATION, ...parsed.configuration },
          })
        }
      } catch (err) {
        console.error('Failed to load Ledvance config:', err)
        setConfigError(err instanceof Error ? err.message : 'Failed to load configuration')
      } finally {
        setConfigLoading(false)
      }
    }

    loadConfig()
  }, [urlParams.isLedvance])

  // Determine actual clientId and configuration
  const clientId = urlParams.isLedvance ? loadedConfig?.clientId || '' : urlParams.clientId
  const configuration: Configuration = useMemo(
    () => urlParams.isLedvance
      ? loadedConfig?.configuration || DEFAULT_CONFIGURATION
      : { ...DEFAULT_CONFIGURATION, ...urlParams.config },
    [urlParams.isLedvance, urlParams.config, loadedConfig]
  )

  // Initialize webchat
  const webchat = useWebchat({
    clientId,
    apiUrl: 'https://webchat.botpress.cloud',
    conversationId: currentConversationId,
    storageKey: clientId ? `webchat-${clientId}` : undefined,
  })

  // Initialize conversation list
  const conversationList = useConversationList({
    clientId,
    userToken: webchat.user?.userToken,
    apiUrl: 'https://webchat.botpress.cloud',
  })

  // Set initial conversation when user is ready
  useEffect(() => {
    if (webchat.clientState === 'connected' && webchat.conversationId && !currentConversationId) {
      setCurrentConversationId(webchat.conversationId)
    }
  }, [webchat.clientState, webchat.conversationId, currentConversationId])

  // Notify parent when ready
  useEffect(() => {
    if (isIframe) {
      window.parent.postMessage({ type: 'bp:ready' }, '*')
    }
  }, [isIframe])

  // Forward webchat events to parent
  useEffect(() => {
    if (!isIframe || webchat.clientState !== 'connected') return

    const unsubscribers = [
      webchat.on('message', (msg) => {
        window.parent.postMessage({ type: 'bp:event', payload: { event: 'message', data: msg } }, '*')
      }),
      webchat.on('error', (err) => {
        window.parent.postMessage({ type: 'bp:event', payload: { event: 'error', data: err } }, '*')
      }),
      webchat.on('conversation', (id) => {
        window.parent.postMessage({ type: 'bp:event', payload: { event: 'conversation', data: id } }, '*')
      }),
      webchat.on('isTyping', (data) => {
        window.parent.postMessage({ type: 'bp:event', payload: { event: 'isTyping', data } }, '*')
      }),
      webchat.on('customEvent', (data) => {
        window.parent.postMessage({ type: 'bp:event', payload: { event: 'customEvent', data } }, '*')
      }),
    ]

    return () => unsubscribers.forEach((unsub) => unsub())
  }, [isIframe, webchat])

  // Handle postMessage commands from parent
  const handleParentMessage = useCallback(
    async (event: MessageEvent) => {
      const { type, payload } = event.data || {}
      if (!type) return

      switch (type) {
        case 'bp:open':
          setIsOpen(true)
          break

        case 'bp:close':
          setIsOpen(false)
          break

        case 'bp:sendMessage':
          if (webchat.clientState === 'connected' && webchat.client) {
            webchat.client.sendMessage({ type: 'text', text: payload.text })
          }
          break

        case 'bp:sendEvent':
          if (webchat.clientState === 'connected' && webchat.client) {
            webchat.client.sendEvent(payload)
          }
          break

        case 'bp:setLanguage':
          await loadLanguageStylesheet(payload.lang)
          setLang(payload.lang)
          break
      }
    },
    [webchat, setLang]
  )

  useEffect(() => {
    if (isIframe) {
      window.addEventListener('message', handleParentMessage)
      return () => window.removeEventListener('message', handleParentMessage)
    }
  }, [isIframe, handleParentMessage])

  // Handle responsive behavior
  useEffect(() => {
    let wasSmallScreen = window.innerWidth < 768

    const checkWidth = () => {
      const isSmall = window.innerWidth < 768
      const wasSmall = wasSmallScreen
      wasSmallScreen = isSmall

      setIsSmallScreen(isSmall)

      if (isSmall && !wasSmall) {
        setSidebarOpen(false)
      }
      if (!isSmall && wasSmall) {
        setSidebarOpen(true)
      }
    }

    setIsSmallScreen(wasSmallScreen)
    if (wasSmallScreen) {
      setSidebarOpen(false)
    }

    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  // Enrich messages for display
  const enrichedMessages = useMemo(() => {
    if (!webchat.user) return []
    return enrichMessage(
      webchat.messages,
      webchat.participants,
      webchat.user.userId,
      configuration.botName || 'Bot',
      configuration.botAvatar
    )
  }, [webchat.messages, webchat.participants, webchat.user, configuration.botName, configuration.botAvatar])

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId)
    if (isSmallScreen) {
      setSidebarOpen(false)
    }
  }

  const handleCreateConversation = async () => {
    setIsCreating(true)
    try {
      const newConv = await conversationList.createConversation()
      setCurrentConversationId(newConv.id)
      if (isSmallScreen) {
        setSidebarOpen(false)
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleFabClick = () => {
    if (isIframe) {
      // Notify parent to toggle
      window.parent.postMessage({ type: 'bp:fabClick' }, '*')
    } else {
      setIsOpen(!isOpen)
    }
  }

  // Extract theme props for StylesheetProvider
  const themeProps = {
    color: configuration.color,
    fontFamily: configuration.fontFamily,
    radius: configuration.radius,
    themeMode: configuration.themeMode,
    variant: configuration.variant,
    headerVariant: configuration.headerVariant,
    additionalStylesheetUrl: configuration.additionalStylesheetUrl,
  }

  // Loading state for /ledvance config
  if (configLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8f9fa' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#666' }}>Loading configuration...</p>
        </div>
      </div>
    )
  }

  // Config error state
  if (configError) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
        Failed to load configuration: {configError}
      </div>
    )
  }

  // Error state
  if (!clientId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
        Missing clientId parameter
      </div>
    )
  }

  // FAB-only mode (when closed in iframe)
  if (isIframe && !isOpen) {
    return (
      <>
        <StylesheetProvider {...themeProps} />
        <div style={{ width: '100%', height: '100%' }}>
          <Fab onClick={handleFabClick} />
        </div>
      </>
    )
  }

  // Full embedded layout
  return (
    <>
      <StylesheetProvider {...themeProps} />
      <div className="embedded-layout bpReset">
        <EmbeddedSidebar
          isOpen={sidebarOpen}
          conversations={conversationList.conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onCreateConversation={handleCreateConversation}
          isCreating={isCreating}
          configuration={configuration}
          isLoading={conversationList.isLoading}
          hasMore={conversationList.hasMore}
          onLoadMore={conversationList.loadMore}
        />

        {/* Overlay for mobile when sidebar is open */}
        {isSmallScreen && sidebarOpen && (
          <div className="embedded-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        <div className="embedded-main">
          <EmbeddedHeader
            configuration={configuration}
            onToggleSidebar={handleToggleSidebar}
            sidebarOpen={sidebarOpen}
            onCreateConversation={handleCreateConversation}
          />

          <div className="embedded-chat-area">
            {webchat.clientState === 'connecting' && (
              <div className="embedded-loading">
                <div className="spinner" />
                <p>{t('state-connecting')}</p>
              </div>
            )}

            {webchat.clientState === 'error' && (
              <div className="embedded-error">
                <p>{t('state-failed')}</p>
                {webchat.error && <p className="error-message">{webchat.error.message}</p>}
              </div>
            )}

            {webchat.clientState === 'connected' && webchat.user && (
              <div className="embedded-chat-content" ref={chatContainerRef}>
                <div className="embedded-messages">
                  <MessageList
                    messages={enrichedMessages}
                    isTyping={webchat.isTyping}
                    sendMessage={webchat.client.sendMessage}
                    botName={configuration.botName || 'Bot'}
                    botAvatar={configuration.botAvatar}
                  />
                </div>

                <div className="embedded-composer">
                  <Composer
                    sendMessage={webchat.client.sendMessage}
                    uploadFile={webchat.client.uploadFile}
                    composerPlaceholder={t('placeholder-composer')}
                    footer={configuration.footer}
                    connected={true}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Wrapper with TranslationProvider
export function EmbedPage() {
  const { lang } = getUrlParams()

  return (
    <TranslationProvider initialLang={lang}>
      <EmbedPageInner />
    </TranslationProvider>
  )
}
