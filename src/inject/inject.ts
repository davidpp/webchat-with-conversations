/**
 * Embeddable Webchat Script
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
 *
 * For CDN hosting where inject.js is on a different domain than the embed app:
 * <script src="https://cdn.example.com/inject.js"></script>
 * <script>
 *   window.botpress.init({
 *     clientId: 'xxx',
 *     host: 'https://webchat-app.example.com'  // Where the /embed route lives
 *   })
 * </script>
 */

// Get the base URL from the script src (used as default if no host specified)
const getScriptOrigin = () => {
  const scripts = document.getElementsByTagName('script')
  for (let i = scripts.length - 1; i >= 0; i--) {
    const src = scripts[i].src
    if (src.includes('inject.js')) {
      return new URL(src).origin
    }
  }
  // Fallback for development
  return 'http://localhost:5173'
}

type SupportedLanguage = 'en' | 'de' | 'fr'

interface InitConfig {
  clientId: string
  botId?: string
  lang?: SupportedLanguage
  configuration?: Record<string, unknown>
  host?: string // Custom host URL for the embed app (for CDN deployments)
}

type EventHandler = (payload: unknown) => void

class BotpressWebchat {
  private iframe: HTMLIFrameElement | null = null
  private wrapper: HTMLDivElement | null = null
  private config: InitConfig | null = null
  private eventHandlers: Map<string, Set<EventHandler>> = new Map()
  private pendingMessages: Array<{ type: string; payload: unknown }> = []
  private currentLang: SupportedLanguage = 'en'
  private isOpen: boolean = false
  private webchatUrl: string = ''

  public _ready: boolean = false

  constructor() {
    // Listen for messages from iframe
    window.addEventListener('message', this.handleMessage.bind(this))
  }

  init(config: InitConfig) {
    if (this.iframe) {
      console.warn('Botpress webchat is already initialized')
      return
    }

    this.config = config
    this.currentLang = config.lang || 'en'
    this.webchatUrl = config.host || getScriptOrigin()
    this.createWrapper()
    this.createIframe()
    this.injectStyles()
  }

  private createWrapper() {
    this.wrapper = document.createElement('div')
    this.wrapper.id = 'bp-webchat-wrapper'
    this.wrapper.className = 'bp-webchat-wrapper bp-webchat-closed'
    document.body.appendChild(this.wrapper)
  }

  private createIframe() {
    if (!this.config || !this.wrapper) return

    const params = new URLSearchParams({
      clientId: this.config.clientId,
      ...(this.config.botId && { botId: this.config.botId }),
      lang: this.currentLang,
      iframe: 'true', // Signal that we're in iframe mode
    })

    // Pass configuration as JSON if provided
    if (this.config.configuration) {
      params.set('config', JSON.stringify(this.config.configuration))
    }

    this.iframe = document.createElement('iframe')
    this.iframe.id = 'bp-webchat-iframe'
    this.iframe.className = 'bp-webchat-iframe'
    this.iframe.src = `${this.webchatUrl}/embed?${params}`
    this.iframe.allow = 'microphone'
    this.iframe.setAttribute('aria-label', 'Chat widget')

    this.wrapper.appendChild(this.iframe)
  }

  private injectStyles() {
    if (document.getElementById('bp-webchat-styles')) return

    const style = document.createElement('style')
    style.id = 'bp-webchat-styles'
    style.textContent = `
      .bp-webchat-wrapper {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        transition: all 0.3s ease;
      }

      .bp-webchat-wrapper.bp-webchat-closed {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        overflow: hidden;
      }

      .bp-webchat-wrapper.bp-webchat-open {
        width: 400px;
        height: 600px;
        max-width: calc(100vw - 40px);
        max-height: calc(100vh - 100px);
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      }

      .bp-webchat-iframe {
        width: 100%;
        height: 100%;
        border: none;
        background: white;
        border-radius: inherit;
      }

      @media (max-width: 480px) {
        .bp-webchat-wrapper.bp-webchat-open {
          width: 100%;
          height: 100%;
          max-width: 100%;
          max-height: 100%;
          bottom: 0;
          right: 0;
          border-radius: 0;
        }
      }
    `
    document.head.appendChild(style)
  }

  private handleMessage(event: MessageEvent) {
    // Only accept messages from our iframe
    if (!this.iframe || event.source !== this.iframe.contentWindow) return

    const { type, payload } = event.data || {}
    if (!type) return

    switch (type) {
      case 'bp:ready':
        this._ready = true
        // Send any pending messages
        this.pendingMessages.forEach(msg => this.postToIframe(msg.type, msg.payload))
        this.pendingMessages = []
        break

      case 'bp:fabClick':
        this.toggle()
        break

      case 'bp:event':
        this._emit(payload.event, payload.data)
        break

      default:
        // Forward other events to handlers
        if (type.startsWith('bp:')) {
          this._emit(type.replace('bp:', ''), payload)
        }
    }
  }

  private postToIframe(type: string, payload?: unknown) {
    if (!this.iframe?.contentWindow) {
      this.pendingMessages.push({ type, payload })
      return
    }

    if (!this._ready) {
      this.pendingMessages.push({ type, payload })
      return
    }

    this.iframe.contentWindow.postMessage({ type, payload }, this.webchatUrl)
  }

  // Public API methods

  open() {
    if (!this.wrapper) return
    this.wrapper.classList.remove('bp-webchat-closed')
    this.wrapper.classList.add('bp-webchat-open')
    this.isOpen = true
    this.postToIframe('bp:open')
    this._emit('webchat:opened', {})
  }

  close() {
    if (!this.wrapper) return
    this.wrapper.classList.remove('bp-webchat-open')
    this.wrapper.classList.add('bp-webchat-closed')
    this.isOpen = false
    this.postToIframe('bp:close')
    this._emit('webchat:closed', {})
  }

  toggle() {
    if (this.isOpen) {
      this.close()
    } else {
      this.open()
    }
  }

  sendMessage(text: string) {
    this.postToIframe('bp:sendMessage', { text })
  }

  sendEvent(event: Record<string, unknown>) {
    this.postToIframe('bp:sendEvent', event)
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(event)?.delete(handler)
    }
  }

  setLanguage(lang: SupportedLanguage) {
    this.currentLang = lang
    this.postToIframe('bp:setLanguage', { lang })
    this._emit('languageChanged', { language: lang })
  }

  getLanguage(): SupportedLanguage {
    return this.currentLang
  }

  // Internal event emitter
  _emit(event: string, payload: unknown) {
    // Emit to specific handlers
    this.eventHandlers.get(event)?.forEach(handler => handler(payload))
    // Emit to wildcard handlers
    this.eventHandlers.get('*')?.forEach(handler => handler({ type: event, payload }))
  }
}

// Create global instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).botpress = new BotpressWebchat()
