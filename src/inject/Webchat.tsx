/**
 * Webchat component for FAB mode
 *
 * Handles the FAB button and the open/closed webchat container
 */

import { FC } from 'react'
import { Fab, StylesheetProvider } from '@botpress/webchat'
import { getUseInjectStore } from './store'
import { ChatBox } from './ChatBox'
import { TranslationProvider } from '../i18n/TranslationProvider'

// Import CSS as inline strings for Shadow DOM
// Note: Copied from @botpress/webchat/dist/style.css since package doesn't export it
import baseCssString from './styles/webchat.css?inline'

export type WebchatProps = {
  mountType: 'toggle' | 'fab'
}

/**
 * Webchat component - FAB mode wrapper
 *
 * Renders:
 * - FAB button (when mountType is 'fab')
 * - ChatBox (when opened)
 */
export const Webchat: FC<WebchatProps> = ({ mountType }) => {
  const useInjectStore = getUseInjectStore()
  const toggle = useInjectStore((state) => state.toggle)
  const state = useInjectStore((state) => state.state)
  const configuration = useInjectStore((state) => state.configuration)
  const currentLang = useInjectStore((state) => state.currentLang)

  const isOpen = state === 'opened'
  const isClosed = state === 'closed'

  return (
    <TranslationProvider initialLang={currentLang}>
      {/* Inject base styles into shadow root */}
      <style>{baseCssString}</style>
      <style>{`
        .bpWebchatContainer {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 999999;
        }

        .bpWebchatWrapper {
          transition: all 0.3s ease;
        }

        .bpWebchatWrapper.bpClosed {
          width: 60px;
          height: 60px;
        }

        .bpWebchatWrapper.bpOpen {
          width: 400px;
          height: 600px;
          max-width: calc(100vw - 40px);
          max-height: calc(100vh - 100px);
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          overflow: hidden;
        }

        .bpFabWrapper {
          position: relative;
        }

        .bpFab {
          cursor: pointer;
          border-radius: 50%;
          overflow: hidden;
          width: 60px;
          height: 60px;
        }

        @media (max-width: 480px) {
          .bpWebchatWrapper.bpOpen {
            width: 100%;
            height: 100%;
            max-width: 100%;
            max-height: 100%;
            bottom: 0;
            right: 0;
            border-radius: 0;
            position: fixed;
            top: 0;
            left: 0;
          }
        }
      `}</style>

      <div className="bpWebchatContainer">
        {/* Chat window */}
        <div className={`bpWebchatWrapper ${isOpen ? 'bpOpen' : 'bpClosed'}`}>
          {isOpen && <ChatBox mountType={mountType} />}

          {/* FAB button when closed */}
          {isClosed && mountType === 'fab' && (
            <div className="bpFabWrapper">
              <div className="bpFab" onClick={toggle}>
                <Fab />
              </div>
            </div>
          )}
        </div>

        {/* FAB button when open (for closing) */}
        {isOpen && mountType === 'fab' && (
          <div className="bpFabWrapper" style={{ position: 'absolute', bottom: 0, right: 0 }}>
            <div className="bpFab" onClick={toggle}>
              <Fab />
            </div>
          </div>
        )}
      </div>

      {/* StylesheetProvider loads fonts and CSS variables */}
      <StylesheetProvider {...configuration} />
    </TranslationProvider>
  )
}
