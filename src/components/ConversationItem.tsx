import { ChevronRight } from 'lucide-react'
import type { ConversationPreview } from '../types/conversation'
import './ConversationItem.css'

interface ConversationItemProps {
  conversation: ConversationPreview
  isActive: boolean
  onClick: () => void
}

function getRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const previewText = conversation.lastMessage?.text
    ? conversation.lastMessage.text.slice(0, 50) + (conversation.lastMessage.text.length > 50 ? '...' : '')
    : 'New conversation'
  const timeAgo = getRelativeTime(conversation.updatedAt)

  return (
    <div
      className={`conversation-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="conversation-content">
        <div className="conversation-preview">{previewText}</div>
        <div className="conversation-meta">
          <span className="conversation-time">{timeAgo}</span>
        </div>
      </div>
      <div className="conversation-chevron">
        <ChevronRight size={20} />
      </div>
    </div>
  )
}
