export interface ConversationPreview {
  id: string
  createdAt: string
  updatedAt: string
  lastMessage?: {
    text: string
    timestamp: string
    isFromBot: boolean
  }
}

export interface ConversationListConfig {
  initialLimit?: number
  enablePagination?: boolean
  collapseByDefault?: boolean
}
