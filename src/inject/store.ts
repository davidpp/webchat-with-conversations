import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// Supported languages
export type SupportedLanguage = 'en' | 'de' | 'fr'

// State types
export type StateProps = 'initial' | 'opened' | 'closed'

// Configuration type (simplified from Botpress)
export type WebchatConfiguration = {
  botName?: string
  botDescription?: string
  botAvatar?: string
  composerPlaceholder?: string
  color?: string
  variant?: 'solid' | 'soft'
  themeMode?: 'light' | 'dark'
  fontFamily?: string
  radius?: number
  embeddedChatId?: string
  toggleChatId?: string
}

// Init props
export type InitProps = {
  clientId: string
  botId?: string
  configuration?: WebchatConfiguration
  lang?: SupportedLanguage
}

// Event types
export type Events = {
  'webchat:initialized': Record<string, never>
  'webchat:ready': Record<string, never>
  'webchat:opened': Record<string, never>
  'webchat:closed': Record<string, never>
  'webchat:config': { configuration: WebchatConfiguration }
  'languageChanged': { language: SupportedLanguage }
  message: unknown
  error: unknown
  '*': { type: string; payload: unknown }
}

// Simple event emitter
type EventHandler<T = unknown> = (event: T) => void

class EventEmitter<E extends Record<string, unknown>> {
  private handlers = new Map<keyof E | '*', Set<EventHandler>>()

  on<K extends keyof E>(type: K, handler: EventHandler<E[K]>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler as EventHandler)
    return () => this.handlers.get(type)?.delete(handler as EventHandler)
  }

  emit<K extends keyof E>(type: K, event: E[K]): void {
    // Emit to specific handlers
    this.handlers.get(type)?.forEach((handler) => handler(event))
    // Emit to wildcard handlers
    this.handlers.get('*')?.forEach((handler) => handler({ type, payload: event }))
  }
}

// User data type for updateUser
export type UserData = {
  data?: Record<string, unknown>
}

// Store type
export type InjectStore = {
  // State
  state: StateProps
  initialized: boolean
  clientId?: string
  botId?: string
  conversationId?: string
  configuration: WebchatConfiguration
  currentLang: SupportedLanguage
  error?: { type: string; message: string }
  userData?: UserData

  // Event emitter
  eventEmitter: EventEmitter<Events>

  // Webchat client reference (set by ChatBox)
  _webchatClient?: {
    updateUser?: (data: UserData) => Promise<void>
  }

  // Methods
  init: (props: InitProps) => void
  setConfiguration: (configuration: Partial<WebchatConfiguration>) => void
  open: () => void
  close: () => void
  toggle: () => void
  setLanguage: (lang: SupportedLanguage) => void
  getLanguage: () => SupportedLanguage
  setConversationId: (id: string | undefined) => void
  updateUser: (data: UserData) => void
  _setWebchatClient: (client: InjectStore['_webchatClient']) => void

  // Event methods
  on: <K extends keyof Events>(type: K, handler: EventHandler<Events[K]>) => () => void
  _emit: <K extends keyof Events>(type: K, event: Events[K]) => void
}

// Default configuration
const defaultConfiguration: WebchatConfiguration = {
  botName: 'Bot',
  variant: 'solid',
  themeMode: 'light',
  radius: 1,
}

// Create store
const createInjectStore = () =>
  create<InjectStore>()(
    devtools(
      (set, get) => ({
        // Initial state
        state: 'initial' as StateProps,
        initialized: false,
        clientId: undefined,
        botId: undefined,
        conversationId: undefined,
        configuration: { ...defaultConfiguration },
        currentLang: 'en' as SupportedLanguage,
        error: undefined,
        userData: undefined,
        eventEmitter: new EventEmitter<Events>(),
        _webchatClient: undefined,

        // Initialize webchat
        init: (props: InitProps) => {
          if (get().initialized) {
            console.warn('Webchat is already initialized')
            return
          }

          const { clientId, botId, configuration, lang } = props

          if (!clientId) {
            set({ error: { type: 'configuration', message: 'Client ID is required' } })
            return
          }

          set({
            clientId,
            botId,
            currentLang: lang || 'en',
            configuration: { ...defaultConfiguration, ...configuration },
            initialized: true,
            state: 'closed',
          })

          get().eventEmitter.emit('webchat:initialized', {})
        },

        // Update configuration
        setConfiguration: (configuration: Partial<WebchatConfiguration>) => {
          set({
            configuration: { ...get().configuration, ...configuration },
          })
          get().eventEmitter.emit('webchat:config', { configuration: get().configuration })
        },

        // Open webchat
        open: () => {
          set({ state: 'opened' })
          get().eventEmitter.emit('webchat:opened', {})
        },

        // Close webchat
        close: () => {
          set({ state: 'closed' })
          get().eventEmitter.emit('webchat:closed', {})
        },

        // Toggle webchat
        toggle: () => {
          if (get().state === 'opened') {
            get().close()
          } else {
            get().open()
          }
        },

        // Set language
        setLanguage: (lang: SupportedLanguage) => {
          set({ currentLang: lang })
          get().eventEmitter.emit('languageChanged', { language: lang })
        },

        // Get language
        getLanguage: () => get().currentLang,

        // Set conversation ID
        setConversationId: (id: string | undefined) => {
          set({ conversationId: id })
        },

        // Update user data (sends to bot via client)
        updateUser: async (userData: UserData) => {
          set({ userData })
          const client = get()._webchatClient
          if (client?.updateUser) {
            try {
              await client.updateUser(userData)
            } catch (err) {
              console.error('Failed to update user:', err)
            }
          }
        },

        // Set webchat client reference (called by EmbeddedLayout)
        _setWebchatClient: (client: InjectStore['_webchatClient']) => {
          set({ _webchatClient: client })
        },

        // Subscribe to events
        on: <K extends keyof Events>(type: K, handler: EventHandler<Events[K]>) => {
          return get().eventEmitter.on(type, handler)
        },

        // Emit events (internal)
        _emit: <K extends keyof Events>(type: K, event: Events[K]) => {
          get().eventEmitter.emit(type, event)
        },
      }),
      { name: 'webchat-inject-store' }
    )
  )

// Singleton pattern for store instance
type BoundInjectStore = ReturnType<typeof createInjectStore>

class InjectStoreSingleton {
  private static _instances: Record<string, BoundInjectStore> = {}

  public static getInstance(name = 'webchat-inject-store'): BoundInjectStore {
    if (!InjectStoreSingleton._instances[name]) {
      InjectStoreSingleton._instances[name] = createInjectStore()
    }
    return InjectStoreSingleton._instances[name]
  }

  public static reset(name = 'webchat-inject-store'): void {
    delete InjectStoreSingleton._instances[name]
  }
}

export const getUseInjectStore = InjectStoreSingleton.getInstance
export const resetInjectStore = InjectStoreSingleton.reset
