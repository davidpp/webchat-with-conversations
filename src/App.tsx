import { WebchatWithConversations } from './components/WebchatWithConversations'
import type { Configuration } from '@botpress/webchat'
import './App.css'

// Client ID from Botpress Dashboard
const CLIENT_ID = import.meta.env.VITE_BOTPRESS_CLIENT_ID || '44246de9-1d1b-462c-8ef3-1ce39e65d89a'

// Configuration extracted from Botpress webchat init
const configuration: Configuration = {
  botName: 'Assistant',
  botDescription: 'Ask AI a question about the documentation.',
  botAvatar: 'https://files.bpcontent.cloud/2025/06/16/20/20250616204038-BRUW6C2R.svg',
  composerPlaceholder: 'Ask a question...',
  website: {},
  email: {
    title: '',
    link: '',
  },
  phone: {},
  termsOfService: {
    title: 'Terms of service',
    link: '',
  },
  privacyPolicy: {},
  color: '#0588F0',
  variant: 'solid',
  headerVariant: 'glass',
  themeMode: 'light',
  fontFamily: 'inter',
  radius: 3,
  feedbackEnabled: true,
  footer: '[⚡️ by Botpress](https://botpress.com/?from=webchat)',
  additionalStylesheetUrl: 'https://files.bpcontent.cloud/2025/06/13/14/20250613145950-XC43YPI7.css',
  allowFileUpload: true,
}

function App() {
  return (
    <WebchatWithConversations
      clientId={CLIENT_ID}
      configuration={configuration}
      enableConversationList={true}
      storageKey="demo-webchat"
    />
  )
}

export default App
