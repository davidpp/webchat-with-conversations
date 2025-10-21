import type { ReactNode } from 'react'
import './ConversationListPanel.css'

interface ConversationListPanelProps {
  isOpen: boolean
  onCreateConversation: () => void
  children: ReactNode
  isCreating?: boolean
}

export function ConversationListPanel({
  isOpen,
  onCreateConversation,
  children,
  isCreating = false,
}: ConversationListPanelProps) {
  if (!isOpen) return null

  return (
    <div className="conversation-list-panel open">
      <div className="conversation-list-header">
        <h2>Conversations</h2>
      </div>

      <div className="conversation-list-content">{children}</div>

      <div className="conversation-list-footer">
        <button
          className="conversation-list-new-button"
          onClick={onCreateConversation}
          disabled={isCreating}
        >
          {isCreating ? 'Creating...' : '+ New Conversation'}
        </button>
      </div>
    </div>
  )
}
