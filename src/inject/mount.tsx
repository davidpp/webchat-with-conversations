import { createRoot, Root } from 'react-dom/client'
import { create } from 'zustand'

/**
 * Configuration for mounting the webchat
 */
type WebchatConfig = {
  readonly embeddedId?: string
  readonly toggleId?: string
}

/**
 * Components to render in different mount modes
 */
export type WebchatComponents = {
  readonly EmbeddedChat: React.ComponentType<{ mountType: 'embedded' }>
  readonly FabChat: React.ComponentType<{ mountType: 'toggle' | 'fab' }>
}

/**
 * State of the currently mounted webchat
 */
type MountedState = {
  readonly root: Root | null
  readonly element: Element | null
  readonly cleanup: (() => void) | null
  readonly mode: 'embedded' | 'toggle' | 'fab' | null
}

/**
 * Store type for the webchat manager
 */
type WebchatManagerStore = {
  readonly config: WebchatConfig
  readonly components: WebchatComponents | null
  readonly mounted: MountedState
  readonly observer: MutationObserver | null

  readonly init: (components: WebchatComponents, config?: WebchatConfig) => void
  readonly updateConfig: (config: WebchatConfig) => void
  readonly destroy: () => void
  readonly refresh: () => void
}

/**
 * Cleanup a mounted state (unmount React root and remove elements)
 */
const cleanupMounted = (mounted: MountedState | null): void => {
  if (!mounted) return

  mounted.cleanup?.()

  if (mounted.root) {
    mounted.root.unmount()
  }

  // Only remove the element if it was created by us (fab mode)
  if (mounted.mode === 'fab' && mounted.element) {
    mounted.element.remove()
  }
}

/**
 * Get or create the FAB wrapper element
 */
const getFabWrapper = (): HTMLDivElement => {
  const existing = document.querySelector('.bpChatContainer')
  if (existing) return existing as HTMLDivElement
  const wrapper = document.createElement('div')
  wrapper.classList.add('bpChatContainer')
  document.body.appendChild(wrapper)
  return wrapper
}

/**
 * Mount webchat in embedded mode (inside a user-provided container)
 */
const mountEmbedded = (
  element: Element,
  Component: React.ComponentType<{ mountType: 'embedded' }>
): MountedState => {
  const root = createRoot(element)
  root.render(<Component mountType="embedded" />)

  return {
    root,
    element,
    cleanup: null,
    mode: 'embedded',
  }
}

/**
 * Mount webchat in toggle mode (user-provided button triggers the chat)
 */
const mountToggle = (element: Element, components: WebchatComponents): MountedState => {
  const handler = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).botpress?.toggle) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).botpress.toggle()
    } else {
      console.warn('[WebchatManager] window.botpress.toggle not available')
    }
  }

  element.addEventListener('click', handler)

  const fab = mountFab(components.FabChat, 'toggle')
  return {
    root: fab.root,
    element,
    cleanup: () => {
      element.removeEventListener('click', handler)
      fab.cleanup?.()
    },
    mode: 'toggle',
  }
}

/**
 * Mount webchat in FAB mode (floating action button)
 */
const mountFab = (
  Component: React.ComponentType<{ mountType: 'toggle' | 'fab' }>,
  mountType: 'toggle' | 'fab'
): MountedState => {
  const wrapper = getFabWrapper()
  const root = createRoot(wrapper)
  root.render(<Component mountType={mountType} />)

  return {
    root,
    element: wrapper,
    cleanup: null,
    mode: mountType,
  }
}

/**
 * Determine the target mount mode based on config
 */
const getTargetMode = (config: WebchatConfig | null): 'embedded' | 'toggle' | 'fab' => {
  if (!config) return 'fab'
  if (config.embeddedId) return 'embedded'
  if (config.toggleId) return 'toggle'
  return 'fab'
}

/**
 * Zustand store for the webchat manager
 */
const webchatManagerStore = create<WebchatManagerStore>((set, get) => ({
  config: {},
  components: null,
  mounted: {
    root: null,
    element: null,
    cleanup: null,
    mode: null,
  },
  observer: null,

  init: (components: WebchatComponents, config: WebchatConfig = {}) => {
    // Destroy previous instance
    get().destroy()

    set({ components, config })

    // Create MutationObserver to watch for DOM changes
    const observer = new MutationObserver(() => {
      queueMicrotask(() => get().refresh())
    })

    set({ observer, mounted: { mode: null, root: null, element: null, cleanup: null } })

    // Watch document.body for ID attribute changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['id'],
    })

    // Initial mount
    get().refresh()
  },

  updateConfig: (config: WebchatConfig) => {
    set({ config })
    get().refresh()
  },

  destroy: () => {
    const { observer, mounted } = get()

    observer?.disconnect()
    cleanupMounted(mounted)

    set({
      config: {},
      components: null,
      mounted: {
        root: null,
        element: null,
        cleanup: null,
        mode: null,
      },
      observer: null,
    })
  },

  refresh: () => {
    const { config, components, mounted } = get()

    if (!components) return

    const targetMode = getTargetMode(config)
    let targetElement: Element | null = null

    if (targetMode === 'embedded' && config.embeddedId) {
      targetElement = document.getElementById(config.embeddedId)
    }

    if (targetMode === 'toggle' && config.toggleId) {
      targetElement = document.getElementById(config.toggleId)
    }

    // Check if we need to remount
    const modeChanged = mounted.mode !== targetMode
    const elementChanged = targetElement && mounted.element !== targetElement
    const elementRemoved = !targetElement && mounted.element !== null && targetMode !== 'fab'
    const elementAdded = targetElement && mounted.element === null && targetMode !== 'fab'

    const needsRemount = modeChanged || elementChanged || elementRemoved || elementAdded
    if (!needsRemount) return

    // Cleanup old mount
    cleanupMounted(mounted)

    // Mount appropriate component
    let newMounted: MountedState | null = null
    if (targetMode === 'embedded') {
      if (!targetElement) return
      newMounted = mountEmbedded(targetElement, components.EmbeddedChat)
    } else if (targetMode === 'toggle') {
      if (!targetElement) return
      newMounted = mountToggle(targetElement, components)
    } else if (targetMode === 'fab') {
      newMounted = mountFab(components.FabChat, 'fab')
    }

    set({ mounted: newMounted ?? { root: null, element: null, cleanup: null, mode: targetMode } })
  },
}))

/**
 * Public API for the webchat manager
 */
export const webchatManager = {
  init: (components: WebchatComponents, config?: WebchatConfig) =>
    webchatManagerStore.getState().init(components, config),

  updateConfig: (config: WebchatConfig) => webchatManagerStore.getState().updateConfig(config),

  destroy: () => webchatManagerStore.getState().destroy(),

  getState: () => ({
    config: webchatManagerStore.getState().config,
    mode: webchatManagerStore.getState().mounted?.mode ?? null,
    isActive: webchatManagerStore.getState().observer !== null,
  }),
} as const
