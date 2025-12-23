/**
 * All available translation keys.
 * Prefix convention:
 * - btn-: Buttons
 * - header-: Headers
 * - label-: Form labels
 * - state-: UI states
 * - error-: Error messages
 * - time-: Relative time
 * - group-: Date groups
 * - aria-: Accessibility labels
 * - placeholder-: Input placeholders
 */
export type TranslationKey =
  // Buttons
  | 'btn-new-conversation'
  | 'btn-new-short'
  | 'btn-creating'
  | 'btn-load-more'
  | 'btn-initialize'
  | 'btn-loading'
  | 'btn-load-default'
  | 'btn-reload'
  | 'btn-back'
  // Headers / Labels
  | 'header-conversations'
  | 'header-chat'
  | 'label-client-id'
  | 'label-embedded'
  | 'label-embedded-hint'
  | 'title-init'
  | 'subtitle-init'
  | 'label-or'
  | 'label-examples'
  | 'label-client-id-example'
  | 'label-script-url-example'
  // States / Messages
  | 'state-connecting'
  | 'state-failed'
  | 'state-no-conversations'
  | 'state-empty-hint'
  | 'state-loading'
  | 'state-loading-list'
  | 'state-new-conversation'
  // Errors
  | 'error-no-input'
  | 'error-no-config'
  | 'error-generic'
  // Time (with interpolation)
  | 'time-just-now'
  | 'time-mins'
  | 'time-hours'
  | 'time-days'
  // Date groups
  | 'group-today'
  | 'group-week'
  | 'group-month'
  | 'group-older'
  // Aria labels
  | 'aria-back'
  | 'aria-close'
  | 'aria-open-sidebar'
  | 'aria-close-sidebar'
  | 'aria-new-conversation'
  | 'aria-conversations'
  // Placeholders
  | 'placeholder-input'
  | 'placeholder-composer'
  // Webchat internal (CSS overrides)
  | 'date-today'
  | 'date-yesterday'

/**
 * Values for string interpolation.
 * Used with templates like "{n}m ago"
 */
export type InterpolationValues = Record<string, string | number>
