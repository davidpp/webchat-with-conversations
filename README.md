# Webchat with Conversations

A standalone React application that extends `@botpress/webchat` with a conversation list sidebar, allowing users to manage multiple conversations.

## Features

- ✅ List all user conversations
- ✅ Switch between conversations
- ✅ Create new conversations
- ✅ Show last message preview for each conversation
- ✅ Responsive design (mobile & desktop)
- ✅ Collapsible conversation sidebar
- ✅ Built on top of official `@botpress/webchat` package

## Prerequisites

- Node.js 18+
- npm
- A Botpress bot with webchat integration enabled
- Webchat Client ID (webhook ID from Botpress Dashboard)

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Botpress Client ID:
   ```env
   VITE_BOTPRESS_CLIENT_ID=your-actual-client-id
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open**: http://localhost:5173

## Project Structure

```
src/
├── components/
│   ├── ConversationItem.tsx         # Individual list item
│   ├── ConversationList.tsx         # List container
│   ├── ConversationListPanel.tsx    # Sidebar panel
│   └── WebchatWithConversations.tsx # Main wrapper
├── hooks/
│   └── useConversationList.ts       # Conversation management
├── types/
│   └── conversation.ts              # TypeScript types
└── App.tsx                          # Application entry
```

## Usage

```tsx
import { WebchatWithConversations } from './components/WebchatWithConversations'
import type { Configuration } from '@botpress/webchat'

const config: Configuration = {
  botName: 'My Bot',
  themeColor: '#2563eb',
}

function App() {
  return (
    <WebchatWithConversations
      clientId="your-client-id"
      configuration={config}
      enableConversationList={true}
      defaultOpen={true}
    />
  )
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `clientId` | `string` | Yes | - | Botpress webchat client ID |
| `configuration` | `Configuration` | Yes | - | Webchat configuration |
| `apiUrl` | `string` | No | `https://webchat.botpress.cloud` | API URL |
| `storageKey` | `string` | No | - | localStorage key |
| `enableConversationList` | `boolean` | No | `true` | Show sidebar |
| `defaultOpen` | `boolean` | No | `false` | Start open |

## Building for Production

```bash
npm run build
```

Deploy the `dist/` folder to any static hosting service.

## Known Limitations

- No conversation search (API limitation)
- No unread counts (API limitation)
- No custom titles (uses message preview)

## Troubleshooting

**"Failed to connect"**
- Verify `VITE_BOTPRESS_CLIENT_ID` is correct
- Check bot has webchat integration enabled
- Ensure bot is published

**Conversations not loading**
- Open DevTools → Network tab
- Check for failed API calls
- Verify webchat integration is active

## License

MIT
