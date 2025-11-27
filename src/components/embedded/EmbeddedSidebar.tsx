import { useMemo } from 'react'
import type { Configuration } from '@botpress/webchat'
import { ConversationItem } from '../ConversationItem'
import type { ConversationPreview } from '../../types/conversation'
import { useTranslation } from '../../i18n'
import { Plus } from 'lucide-react'
import './EmbeddedSidebar.css'

type DateGroupKey = 'group-today' | 'group-week' | 'group-month' | 'group-older'

interface ConversationGroup {
  key: DateGroupKey
  conversations: ConversationPreview[]
}

interface EmbeddedSidebarProps {
  isOpen: boolean
  conversations: ConversationPreview[]
  currentConversationId?: string
  onSelectConversation: (id: string) => void
  onCreateConversation: () => void
  isCreating: boolean
  configuration: Configuration
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
}

function groupConversationsByDate(conversations: ConversationPreview[]): ConversationGroup[] {
  const today = new Date()

  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 7)

  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)

  const categories: { key: DateGroupKey; filter: (date: Date) => boolean }[] = [
    {
      key: 'group-today',
      filter: (date: Date) => date > yesterday,
    },
    {
      key: 'group-week',
      filter: (date: Date) => date <= yesterday && date > sevenDaysAgo,
    },
    {
      key: 'group-month',
      filter: (date: Date) => date <= sevenDaysAgo && date > thirtyDaysAgo,
    },
    {
      key: 'group-older',
      filter: (date: Date) => date < thirtyDaysAgo,
    },
  ]

  return categories.reduce<ConversationGroup[]>((groups, category) => {
    const categoryConversations = conversations.filter((conv) => {
      const conversationLastUpdate = new Date(conv.updatedAt)
      return category.filter(conversationLastUpdate)
    })

    if (categoryConversations.length > 0) {
      groups.push({
        key: category.key,
        conversations: categoryConversations,
      })
    }

    return groups
  }, [])
}

export function EmbeddedSidebar({
  isOpen,
  conversations,
  currentConversationId,
  onSelectConversation,
  onCreateConversation,
  isCreating,
  configuration,
  isLoading,
  hasMore,
  onLoadMore,
}: EmbeddedSidebarProps) {
  const { t } = useTranslation()
  const groupedConversations = useMemo(
    () => groupConversationsByDate(conversations),
    [conversations]
  )

  return (
    <aside className={`embedded-sidebar ${isOpen ? '' : 'collapsed'}`}>
      {/* Bot info header */}
      <div className="sidebar-header">
        {configuration.botAvatar && (
          <img
            src={configuration.botAvatar}
            alt={configuration.botName || 'Bot'}
            className="sidebar-avatar"
          />
        )}
        <div className="sidebar-bot-info">
          <h2 className="sidebar-bot-name">{configuration.botName || 'Assistant'}</h2>
          {configuration.botDescription && (
            <p className="sidebar-bot-description">{configuration.botDescription}</p>
          )}
        </div>
      </div>

      {/* New conversation button */}
      <button
        className="new-conversation-btn"
        onClick={onCreateConversation}
        disabled={isCreating}
      >
        <Plus size={18} />
        {isCreating ? t('btn-creating') : t('btn-new-short')}
      </button>

      {/* Conversation list */}
      <div className="sidebar-conversations">
        {conversations.length === 0 && !isLoading && (
          <div className="sidebar-empty">
            <p>{t('state-no-conversations')}</p>
          </div>
        )}

        {groupedConversations.map((group) => (
          <div key={group.key} className="conversation-group">
            <div className="conversation-group-title">{t(group.key)}</div>
            {group.conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === currentConversationId}
                onClick={() => onSelectConversation(conv.id)}
              />
            ))}
          </div>
        ))}

        {isLoading && (
          <div className="sidebar-loading">
            <div className="spinner-small" />
          </div>
        )}

        {hasMore && !isLoading && (
          <button className="load-more-btn" onClick={onLoadMore}>
            {t('btn-load-more')}
          </button>
        )}
      </div>
    </aside>
  )
}
