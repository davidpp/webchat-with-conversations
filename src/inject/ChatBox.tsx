/**
 * ChatBox component - Core chat UI
 *
 * Uses our custom EmbeddedLayout with conversation list and language switching
 */

import { FC, ComponentProps } from 'react'
import { getUseInjectStore } from './store'
import { TranslationProvider } from '../i18n/TranslationProvider'
import { EmbeddedLayout } from '../components/embedded/EmbeddedLayout'

// Import CSS as inline strings for Shadow DOM
import baseCssString from './styles/webchat.css?inline'
import embeddedLayoutCss from '../components/embedded/EmbeddedLayout.css?inline'
import embeddedSidebarCss from '../components/embedded/EmbeddedSidebar.css?inline'
import embeddedHeaderCss from '../components/embedded/EmbeddedHeader.css?inline'
import conversationItemCss from '../components/ConversationItem.css?inline'
import conversationListCss from '../components/ConversationList.css?inline'

export type ChatBoxProps = {
  mountType: 'embedded' | 'toggle' | 'fab'
} & ComponentProps<'div'>

/**
 * ChatBox component - renders our custom webchat with conversations
 */
export const ChatBox: FC<ChatBoxProps> = ({ mountType, className, ...props }) => {
  const useInjectStore = getUseInjectStore()

  const configuration = useInjectStore((state) => state.configuration)
  const clientId = useInjectStore((state) => state.clientId)
  const initialized = useInjectStore((state) => state.initialized)
  const currentLang = useInjectStore((state) => state.currentLang)

  const storageKey = `bp-webchat-${clientId}`

  if (!initialized || !clientId) {
    return null
  }

  return (
    <TranslationProvider initialLang={currentLang}>
      <div
        className={`bpChatBox bpReset ${className || ''}`}
        style={{ height: '100%', width: '100%' }}
        {...props}
      >
        {/* Inject all styles into shadow root */}
        <style>{baseCssString}</style>
        <style>{embeddedLayoutCss}</style>
        <style>{embeddedSidebarCss}</style>
        <style>{embeddedHeaderCss}</style>
        <style>{conversationItemCss}</style>
        <style>{conversationListCss}</style>
        <style>{`
          .bpChatBox {
            display: flex;
            flex-direction: column;
            background: white;
          }
          .embedded-layout {
            height: 100%;
            width: 100%;
          }
        `}</style>

        <EmbeddedLayout
          clientId={clientId}
          configuration={configuration}
          storageKey={storageKey}
        />
      </div>
    </TranslationProvider>
  )
}
