import React, { HTMLAttributes, ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type ShadowPortalProps = {
  children: ReactNode
  disableShadow?: boolean
} & HTMLAttributes<HTMLDivElement>

/**
 * ShadowPortal - Renders children into a Shadow DOM for style isolation
 *
 * Uses React Portal to render children into a container inside a Shadow Root.
 * This provides complete CSS isolation from the host page while maintaining
 * React's component tree and event handling.
 *
 * @param children - React children to render inside the shadow root
 * @param disableShadow - If true, renders directly without shadow DOM (for testing)
 * @param props - Additional div props passed to the host element
 */
export const ShadowPortal: React.FC<ShadowPortalProps> = ({
  children,
  disableShadow = import.meta.env.MODE === 'test', // for testing using jsdom
  ...props
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [container, setContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const containerEl = document.createElement('div')
    containerEl.style.height = '100%'
    containerEl.style.width = '100%'

    if (disableShadow) {
      host.appendChild(containerEl)
    } else {
      const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
      shadow.appendChild(containerEl)
    }

    setContainer(containerEl)

    return () => {
      if (containerEl.parentNode) {
        containerEl.parentNode.removeChild(containerEl)
      }
      setContainer(null)
    }
  }, [disableShadow])

  return (
    <div {...props} ref={hostRef}>
      {container ? createPortal(children, container) : null}
    </div>
  )
}
