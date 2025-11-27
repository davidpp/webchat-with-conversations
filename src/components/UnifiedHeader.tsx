import { ChevronLeft, X } from 'lucide-react'
import type { Configuration } from '@botpress/webchat'
import { useTranslation } from '../i18n'
import './UnifiedHeader.css'

interface UnifiedHeaderProps {
  variant: 'chat' | 'list'
  configuration: Pick<Configuration, 'botName' | 'botAvatar' | 'botDescription'>
  onClose: () => void
  onBack?: () => void
  showBackButton?: boolean
}

export function UnifiedHeader({
  variant,
  configuration,
  onClose,
  onBack,
  showBackButton = false
}: UnifiedHeaderProps) {
  const { t } = useTranslation()
  const title = variant === 'list' ? t('header-conversations') : (configuration.botName || 'Bot')
  const showDescription = variant === 'chat' && configuration.botDescription

  return (
    <div className="unified-header bpReset">
      <div className="unified-header-content">
        {/* Back button - only in chat view when enabled */}
        {variant === 'chat' && showBackButton && (
          <button
            className="unified-header-action unified-header-back"
            onClick={onBack}
            aria-label={t('aria-back')}
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {/* Avatar - shown in both views for consistent layout */}
        {configuration.botAvatar && (
          <span className="unified-header-avatar">
            <img
              className="unified-header-avatar-image"
              src={configuration.botAvatar}
              alt={variant === 'list' ? t('aria-conversations') : (configuration.botName || 'Bot')}
            />
          </span>
        )}

        {/* Title and description */}
        <div className="unified-header-info">
          <h2 className="unified-header-title">{title}</h2>
          {showDescription && (
            <p className="unified-header-description">{configuration.botDescription}</p>
          )}
        </div>

        {/* Close button - always visible */}
        <button
          className="unified-header-action unified-header-close"
          onClick={onClose}
          aria-label={t('aria-close')}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}