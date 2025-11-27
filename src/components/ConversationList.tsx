import type { ConversationPreview } from '../types/conversation'
import { ConversationItem } from './ConversationItem'
import { useTranslation } from '../i18n'
import './ConversationList.css'

interface ConversationListProps {
  conversations: ConversationPreview[]
  currentConversationId?: string
  onSelectConversation: (id: string) => void
  onLoadMore?: () => void
  hasMore: boolean
  isLoading: boolean
}

export function ConversationList({
  conversations,
  currentConversationId,
  onSelectConversation,
  onLoadMore,
  hasMore,
  isLoading,
}: ConversationListProps) {
  const { t } = useTranslation()

  if (conversations.length === 0 && !isLoading) {
    return (
      <div className="conversation-list-empty">
        <p>{t('state-no-conversations')}</p>
        <p className="conversation-list-empty-hint">{t('state-empty-hint')}</p>
      </div>
    )
  }

  return (
    <div className="conversation-list">
      <div className="conversation-list-items">
        {conversations.map((conv) => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            isActive={conv.id === currentConversationId}
            onClick={() => onSelectConversation(conv.id)}
          />
        ))}
      </div>

      {isLoading && (
        <div className="conversation-list-loading">
          <div className="spinner" />
          <span>{t('state-loading-list')}</span>
        </div>
      )}

      {hasMore && !isLoading && onLoadMore && (
        <button className="conversation-list-load-more" onClick={onLoadMore}>
          {t('btn-load-more')}
        </button>
      )}
    </div>
  )
}
