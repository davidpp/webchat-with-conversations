/**
 * Embeddable Webchat Script - ShadowPortal Version
 *
 * Usage on client's website:
 * <script src="https://your-vercel-app.com/inject.js"></script>
 * <script>
 *   window.botpress.init({
 *     clientId: 'xxx',
 *     botId: 'yyy',
 *     lang: 'en'
 *   })
 * </script>
 */

import { StrictMode } from 'react'
import { ShadowPortal } from '../components/ShadowPortal'
import { getUseInjectStore, type InitProps, type SupportedLanguage, type UserData } from './store'
import { webchatManager } from './mount'
import { Webchat } from './Webchat'
import { ChatBox } from './ChatBox'

// Type for the global window.botpress object
interface BotpressWebchat {
  init: (config: InitProps) => void
  open: () => void
  close: () => void
  toggle: () => void
  sendMessage: (text: string) => void
  sendEvent: (event: Record<string, unknown>) => void
  updateUser: (user: UserData) => Promise<void>
  on: (event: string, handler: (payload: unknown) => void) => () => void
  setLanguage: (lang: SupportedLanguage) => void
  getLanguage: () => SupportedLanguage
  // Read-only properties
  readonly initialized: boolean
  readonly state: string
  readonly clientId: string
  readonly botId: string
  readonly conversationId: string
  readonly configuration: Record<string, unknown>
}

/**
 * Create the global window.botpress object
 */
const createGlobalBotpress = (): BotpressWebchat => {
  const store = getUseInjectStore()
  const { on, _emit, init, open, close, toggle, setLanguage, getLanguage, setConversationId, updateUser } = store.getState()

  // When webchat is initialized, set up the webchatManager
  on('webchat:initialized', () => {
    const { configuration } = store.getState()

    webchatManager.init(
      {
        // Embedded mode - renders in user-provided container
        EmbeddedChat: ({ mountType }) => (
          <StrictMode>
            <ShadowPortal
              id="webchat-root"
              className="bpEmbeddedWebchat"
              style={{ height: '100%', width: '100%' }}
              aria-hidden="true"
              tabIndex={-1}
              title="Webchat"
            >
              <ChatBox mountType={mountType} />
            </ShadowPortal>
          </StrictMode>
        ),
        // FAB mode - floating action button
        FabChat: ({ mountType }) => (
          <StrictMode>
            <ShadowPortal id="fab-root">
              <Webchat mountType={mountType} />
            </ShadowPortal>
          </StrictMode>
        ),
      },
      {
        embeddedId: configuration.embeddedChatId,
        toggleId: configuration.toggleChatId,
      }
    )

    // Update webchatManager when config changes
    on('webchat:config', () => {
      const { configuration } = store.getState()
      webchatManager.updateConfig({
        embeddedId: configuration.embeddedChatId,
        toggleId: configuration.toggleChatId,
      })
    })
  })

  // Create the public API using Object.defineProperties for read-only props
  return Object.defineProperties({} as BotpressWebchat, {
    init: {
      value: init,
      writable: false,
    },
    open: {
      value: open,
      writable: false,
    },
    close: {
      value: close,
      writable: false,
    },
    toggle: {
      value: toggle,
      writable: false,
    },
    sendMessage: {
      value: (_text: string) => {
        // TODO: Implement via webchat hook
        console.warn('sendMessage not yet implemented in ShadowPortal version')
      },
      writable: false,
    },
    sendEvent: {
      value: (_event: Record<string, unknown>) => {
        // TODO: Implement via webchat hook
        console.warn('sendEvent not yet implemented in ShadowPortal version')
      },
      writable: false,
    },
    on: {
      value: on,
      writable: false,
    },
    setLanguage: {
      value: setLanguage,
      writable: false,
    },
    getLanguage: {
      value: getLanguage,
      writable: false,
    },
    updateUser: {
      value: updateUser,
      writable: false,
    },
    // Internal methods
    _emit: {
      value: _emit,
      writable: false,
    },
    _setConversationId: {
      value: setConversationId,
      writable: false,
    },
    // Read-only properties
    initialized: {
      get: () => store.getState().initialized,
    },
    state: {
      get: () => store.getState().state,
    },
    clientId: {
      get: () => store.getState().clientId ?? '',
    },
    botId: {
      get: () => store.getState().botId ?? '',
    },
    conversationId: {
      get: () => store.getState().conversationId ?? '',
    },
    configuration: {
      get: () => store.getState().configuration,
    },
    currentLang: {
      get: () => store.getState().currentLang,
    },
  })
}

// Create and assign the global botpress object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).botpress = createGlobalBotpress()
