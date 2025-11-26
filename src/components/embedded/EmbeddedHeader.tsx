import type { Configuration } from '@botpress/webchat'
import { PanelLeft, PanelLeftClose, SquarePen } from 'lucide-react'
import './EmbeddedHeader.css'

interface EmbeddedHeaderProps {
  configuration: Configuration
  onToggleSidebar: () => void
  sidebarOpen: boolean
  onCreateConversation: () => void
}

export function EmbeddedHeader({
  configuration,
  onToggleSidebar,
  sidebarOpen,
  onCreateConversation,
}: EmbeddedHeaderProps) {
  return (
    <header className="embedded-header">
      <button
        className="header-btn sidebar-toggle"
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
      </button>

      <h1 className="header-title">{configuration.botName || 'Chat'}</h1>

      <button
        className="header-btn new-chat-btn"
        onClick={onCreateConversation}
        aria-label="New conversation"
      >
        <SquarePen size={20} />
      </button>
    </header>
  )
}
