import type { TranslationKey } from './types'

/**
 * Default English translations.
 * Used as fallback when CSS variable is not defined.
 */
export const DEFAULTS: Record<TranslationKey, string> = {
  // Buttons
  'btn-new-conversation': '+ New Conversation',
  'btn-new-short': 'New Conversation',
  'btn-creating': 'Creating...',
  'btn-load-more': 'Load More',
  'btn-initialize': 'Initialize Webchat',
  'btn-loading': 'Loading...',
  'btn-load-default': 'Load Default Configuration',
  'btn-reload': 'Reload Page',
  'btn-back': 'Back',

  // Headers / Labels
  'header-conversations': 'Conversations',
  'header-chat': 'Chat',
  'label-client-id': 'Client ID or Script URL',
  'label-embedded': 'Embedded mode',
  'label-embedded-hint': 'Full-page chat with collapsible sidebar (like ChatGPT)',
  'title-init': 'Initialize Webchat',
  'subtitle-init': 'Enter a Botpress client ID or script URL to get started',
  'label-or': 'or',
  'label-examples': 'Examples:',
  'label-client-id-example': 'Client ID:',
  'label-script-url-example': 'Script URL:',

  // States / Messages
  'state-connecting': 'Connecting...',
  'state-failed': 'Failed to connect',
  'state-no-conversations': 'No conversations yet',
  'state-empty-hint': 'Click "New Conversation" to start',
  'state-loading': 'Loading...',
  'state-loading-list': 'Loading conversations...',
  'state-new-conversation': 'New conversation',

  // Errors
  'error-no-input': 'Please enter a client ID or URL',
  'error-no-config': 'No default client ID configured in environment',
  'error-generic': 'An error occurred',

  // Time (with interpolation)
  'time-just-now': 'Just now',
  'time-mins': '{n}m ago',
  'time-hours': '{n}h ago',
  'time-days': '{n}d ago',

  // Date groups
  'group-today': 'Today',
  'group-week': 'This Week',
  'group-month': 'This Month',
  'group-older': 'Older',

  // Aria labels
  'aria-back': 'Back to conversations',
  'aria-close': 'Close',
  'aria-open-sidebar': 'Open sidebar',
  'aria-close-sidebar': 'Close sidebar',
  'aria-new-conversation': 'New conversation',
  'aria-conversations': 'Conversations',

  // Placeholders
  'placeholder-input': 'e.g., abc123 or https://files.bpcontent.cloud/...',
  'placeholder-composer': 'Ask a question...',

  // Webchat internal (CSS overrides)
  'date-today': 'Today',
  'date-yesterday': 'Yesterday',
}
