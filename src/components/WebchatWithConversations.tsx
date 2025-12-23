import { useState, useEffect, useMemo } from 'react'
import { useWebchat, type Configuration, Fab, MessageList, Composer, enrichMessage, StylesheetProvider } from '@botpress/webchat'
import { ConversationList } from './ConversationList'
import { UnifiedHeader } from './UnifiedHeader'
import { useConversationList } from '../hooks/useConversationList'
import { useTranslation } from '../i18n'
import './WebchatWithConversations.css'

interface WebchatWithConversationsProps {
  clientId: string
  apiUrl?: string
  configuration: Configuration
  storageKey?: string
  enableConversationList?: boolean
}

type View = 'list' | 'chat'

export function WebchatWithConversations({
  clientId,
  apiUrl = 'https://webchat.botpress.cloud',
  configuration,
  storageKey,
  enableConversationList = true,
}: WebchatWithConversationsProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [currentView, setCurrentView] = useState<View>('chat')
  const [currentConversationId, setCurrentConversationId] = useState<string>()
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

  const handleCreateConversation = async () => {
    setIsCreating(true)
    try {
      const newConv = await conversationList.createConversation()
      setCurrentConversationId(newConv.id)
      setCurrentView('chat')
    } catch (error) {
      console.error('Failed to create conversation:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId)
    setCurrentView('chat')
  }

  const handleBackToList = () => {
    setCurrentView('list')
  }

  const handleClose = () => {
    setIsOpen(false)
    setCurrentView('chat') // Always default to chat view
  }

  const handleFabClick = async () => {
    // Check if there are any conversations
    const conversationCount = conversationList.conversations.length

    if (conversationCount === 0) {
      // No conversations, create a new one
      setIsCreating(true)
      try {
        await webchat.newConversation()
        await conversationList.refreshPreviews()
      } catch (error) {
        console.error('Failed to create conversation:', error)
      }
      setIsCreating(false)
    } else {
      // Has conversations, select the most recent (first in the list)
      const latestConversation = conversationList.conversations[0]
      setCurrentConversationId(latestConversation.id)
    }

    // Always open in chat view, never list view
    setCurrentView('chat')
    setIsOpen(true)
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
      {/* Apply theme styles globally for conversation list */}
      <StylesheetProvider {...themeProps} />

      {/* FAB button in bottom-right corner */}
      {!isOpen && (
        <div className="webchat-fab-container">
          <Fab onClick={handleFabClick} imgUrl={configuration.botAvatar} />
        </div>
      )}

      {/* Webchat modal/window */}
      {isOpen && (
        <div className="webchat-modal-container">
          <div className="webchat-modal bpReset">
            {/* List View - Show all conversations */}
            {currentView === 'list' && enableConversationList && (
              <div className="conversation-list-view">
                <UnifiedHeader
                  variant="list"
                  configuration={configuration}
                  onClose={handleClose}
                />

                <div className="conversation-list-view-content">
                  <ConversationList
                    conversations={conversationList.conversations}
                    currentConversationId={currentConversationId}
                    onSelectConversation={handleSelectConversation}
                    onLoadMore={conversationList.loadMore}
                    hasMore={conversationList.hasMore}
                    isLoading={conversationList.isLoading}
                  />
                </div>

                <div className="conversation-list-view-footer">
                  <button
                    className="new-conversation-button"
                    onClick={handleCreateConversation}
                    disabled={isCreating}
                  >
                    {isCreating ? t('btn-creating') : t('btn-new-conversation')}
                  </button>
                </div>

              </div>
            )}

            {/* Chat View - Show current conversation */}
            {currentView === 'chat' && (
              <div className="chat-view">
                <UnifiedHeader
                  variant="chat"
                  configuration={configuration}
                  onClose={handleClose}
                  onBack={handleBackToList}
                  showBackButton={enableConversationList}
                />

                {webchat.clientState === 'connecting' && (
                  <div className="chat-view-loading">
                    <div className="spinner" />
                    <p>{t('state-connecting')}</p>
                  </div>
                )}

                {webchat.clientState === 'error' && (
                  <div className="chat-view-error">
                    <p>{t('state-failed')}</p>
                    {webchat.error && <p className="error-message">{webchat.error.message}</p>}
                  </div>
                )}

                {webchat.clientState === 'connected' && webchat.user && (
                  <>
                    <div className="chat-view-messages">
                      <MessageList
                        messages={enrichedMessages}
                        isTyping={webchat.isTyping}
                        sendMessage={webchat.client.sendMessage}
                        botName={configuration.botName || 'Bot'}
                        botAvatar={configuration.botAvatar}
                      />
                    </div>

                    <div className="chat-view-composer">
                      <Composer
                        sendMessage={webchat.client.sendMessage}
                        uploadFile={webchat.client.uploadFile}
                        composerPlaceholder={configuration.composerPlaceholder}
                        footer={configuration.footer}
                        connected={true}
                        disableSendButton={webchat.disableSendButton}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
