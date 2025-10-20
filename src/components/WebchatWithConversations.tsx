import { useState, useEffect, useMemo } from 'react'
import { useWebchat, type Configuration, Fab, MessageList, Composer, enrichMessage } from '@botpress/webchat'
import { ChevronLeft, X } from 'lucide-react'
import { ConversationList } from './ConversationList'
import { useConversationList } from '../hooks/useConversationList'
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
    setCurrentView('list')
  }

  return (
    <>
      {/* FAB button in bottom-right corner */}
      {!isOpen && (
        <div className="webchat-fab-container">
          <Fab onClick={() => setIsOpen(true)} imgUrl={configuration.botAvatar} />
        </div>
      )}

      {/* Webchat modal/window */}
      {isOpen && (
        <div className="webchat-modal-container">
          <div className="webchat-modal">
            {/* List View - Show all conversations */}
            {currentView === 'list' && enableConversationList && (
              <div className="conversation-list-view">
                <div className="conversation-list-view-header">
                  <h1>Conversations</h1>
                  <button
                    className="close-button"
                    onClick={handleClose}
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

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
                    {isCreating ? 'Creating...' : '+ New Conversation'}
                  </button>
                </div>
              </div>
            )}

            {/* Chat View - Show current conversation */}
            {currentView === 'chat' && (
              <div className="chat-view">
                <div className="chat-view-header">
                  {enableConversationList && (
                    <button
                      className="back-button"
                      onClick={handleBackToList}
                      aria-label="Back to conversations"
                    >
                      <ChevronLeft size={16} />
                    </button>
                  )}
                  <div className="chat-view-header-content">
                    {configuration.botAvatar && (
                      <img src={configuration.botAvatar} alt={configuration.botName || 'Bot'} className="bot-avatar" />
                    )}
                    <div className="bot-info">
                      <h2>{configuration.botName || 'Bot'}</h2>
                      {configuration.botDescription && (
                        <p className="bot-description">{configuration.botDescription}</p>
                      )}
                    </div>
                  </div>
                  <button
                    className="close-button"
                    onClick={handleClose}
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                {webchat.clientState === 'connecting' && (
                  <div className="chat-view-loading">
                    <div className="spinner" />
                    <p>Connecting...</p>
                  </div>
                )}

                {webchat.clientState === 'error' && (
                  <div className="chat-view-error">
                    <p>Failed to connect</p>
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
                        connected={true}
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
