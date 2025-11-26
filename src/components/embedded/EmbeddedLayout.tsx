import { useState, useEffect, useMemo } from 'react'
import { useWebchat, type Configuration, MessageList, Composer, enrichMessage, StylesheetProvider } from '@botpress/webchat'
import { EmbeddedSidebar } from './EmbeddedSidebar'
import { EmbeddedHeader } from './EmbeddedHeader'
import { useConversationList } from '../../hooks/useConversationList'
import './EmbeddedLayout.css'

interface EmbeddedLayoutProps {
  clientId: string
  apiUrl?: string
  configuration: Configuration
  storageKey?: string
}

export function EmbeddedLayout({
  clientId,
  apiUrl = 'https://webchat.botpress.cloud',
  configuration,
  storageKey,
}: EmbeddedLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentConversationId, setCurrentConversationId] = useState<string>()
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Initialize webchat for the current conversation
  const webchat = useWebchat({
    clientId,
    apiUrl,
    conversationId: currentConversationId,
    storageKey,
  })

  // Initialize conversation list
  const conversationList = useConversationList({
    clientId,
    userToken: webchat.user?.userToken,
    apiUrl,
  })

  // Set initial conversation when user is ready
  useEffect(() => {
    if (webchat.clientState === 'connected' && webchat.conversationId && !currentConversationId) {
      setCurrentConversationId(webchat.conversationId)
    }
  }, [webchat.clientState, webchat.conversationId, currentConversationId])

  // Handle responsive behavior
  useEffect(() => {
    let wasSmallScreen = window.innerWidth < 768

    const checkWidth = () => {
      const isSmall = window.innerWidth < 768
      const wasSmall = wasSmallScreen
      wasSmallScreen = isSmall

      setIsSmallScreen(isSmall)

      // Auto-collapse when transitioning to small screen
      if (isSmall && !wasSmall) {
        setSidebarOpen(false)
      }
      // Auto-expand when transitioning to large screen
      if (!isSmall && wasSmall) {
        setSidebarOpen(true)
      }
    }

    // Initial check
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
    // Close sidebar on mobile after selection
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
                <p>Connecting...</p>
              </div>
            )}

            {webchat.clientState === 'error' && (
              <div className="embedded-error">
                <p>Failed to connect</p>
                {webchat.error && <p className="error-message">{webchat.error.message}</p>}
              </div>
            )}

            {webchat.clientState === 'connected' && webchat.user && (
              <>
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
                    composerPlaceholder={configuration.composerPlaceholder}
                    footer={configuration.footer}
                    connected={true}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
