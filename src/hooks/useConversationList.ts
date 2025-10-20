import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient, type Client } from '@botpress/webchat-client'
import type { ConversationPreview } from '../types/conversation'

interface UseConversationListProps {
  clientId: string
  userToken?: string
  apiUrl?: string
}

interface UseConversationListReturn {
  conversations: ConversationPreview[]
  isLoading: boolean
  error?: Error
  hasMore: boolean
  loadMore: () => Promise<void>
  createConversation: () => Promise<{ id: string; createdAt: string; updatedAt: string }>
  refreshPreviews: () => Promise<void>
}

export function useConversationList({
  clientId,
  userToken,
  apiUrl = 'https://webchat.botpress.cloud',
}: UseConversationListProps): UseConversationListReturn {
  const [conversations, setConversations] = useState<ConversationPreview[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error>()
  const [nextToken, setNextToken] = useState<string>()

  const client = useMemo<Client | null>(() => {
    if (!userToken) return null
    return createClient({ clientId, userKey: userToken, apiUrl })
  }, [clientId, userToken, apiUrl])

  const loadConversations = useCallback(async (append = false) => {
    if (!client) return

    setIsLoading(true)
    setError(undefined)

    try {
      // 1. Fetch conversation IDs
      const { conversations: convList, meta } = await client.listConversations({
        nextToken: append ? nextToken : undefined,
      })

      // 2. Fetch last message for each conversation (limit to first 5 to avoid too many calls)
      const conversationsToFetch = convList.slice(0, Math.min(5, convList.length))

      const withPreviews = await Promise.all(
        conversationsToFetch.map(async (conv) => {
          try {
            const { messages } = await client.listConversationMessages({
              conversationId: conv.id,
            })

            const lastMessage = messages[0]

            return {
              ...conv,
              lastMessage: lastMessage
                ? {
                    text: lastMessage.payload.type === 'text'
                      ? lastMessage.payload.text || ''
                      : `[${lastMessage.payload.type}]`,
                    timestamp: lastMessage.createdAt,
                    isFromBot: lastMessage.userId !== userToken,
                  }
                : undefined,
            }
          } catch (err) {
            console.error(`Failed to fetch messages for conversation ${conv.id}:`, err)
            return conv
          }
        })
      )

      // Add remaining conversations without previews
      const remainingConversations = convList.slice(conversationsToFetch.length)

      const allConversations = [...withPreviews, ...remainingConversations]

      if (append) {
        setConversations((prev) => [...prev, ...allConversations])
      } else {
        setConversations(allConversations)
      }

      setNextToken(meta.nextToken)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load conversations'))
    } finally {
      setIsLoading(false)
    }
  }, [client, nextToken, userToken])

  const loadMore = useCallback(async () => {
    if (nextToken && !isLoading) {
      await loadConversations(true)
    }
  }, [loadConversations, nextToken, isLoading])

  const createConversation = useCallback(async () => {
    if (!client) throw new Error('Client not initialized')

    const { conversation } = await client.createConversation()

    // Add to the top of the list
    setConversations((prev) => [
      {
        id: conversation.id,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
      ...prev,
    ])

    return conversation
  }, [client])

  const refreshPreviews = useCallback(async () => {
    await loadConversations(false)
  }, [loadConversations])

  useEffect(() => {
    if (client && userToken) {
      loadConversations(false)
    }
  }, [client, userToken])

  return {
    conversations,
    isLoading,
    error,
    hasMore: !!nextToken,
    loadMore,
    createConversation,
    refreshPreviews,
  }
}
