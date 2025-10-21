# Webchat with Conversations

A standalone React application that extends `@botpress/webchat` with a conversation list view, allowing users to manage multiple conversations.

## Features

- ✅ List all user conversations in dedicated view
- ✅ Switch between conversations seamlessly
- ✅ Create new conversations
- ✅ Show last message preview for each conversation
- ✅ Responsive design (mobile & desktop)
- ✅ View switching (list ↔ chat) with back button
- ✅ Dynamic configuration from Botpress scripts
- ✅ Shareable demo URLs
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

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open**: http://localhost:5173

## Initialization Options

The app supports multiple ways to initialize the webchat:

### 1. Interactive Form (Default)
If no configuration is provided, the app shows an initialization form where you can enter:
- **Client ID**: Just the ID for basic configuration
- **Script URL**: Full Botpress script URL for complete configuration

### 2. URL Parameters
Share demos with specific configurations using URL parameters:

```bash
# Using a Botpress script URL directly
http://localhost:5173/?https://files.bpcontent.cloud/2025/10/20/21/20251020211011-0T1QYFJQ.js

# Using script parameter
http://localhost:5173/?script=https://files.bpcontent.cloud/2025/10/20/21/20251020211011-0T1QYFJQ.js

# Using just a client ID
http://localhost:5173/?clientId=f0119422-b733-4b07-8cf5-b23e84305127
```

### 3. Environment Variable
Set a default client ID in `.env`:

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_BOTPRESS_CLIENT_ID=your-actual-client-id
```

### Priority Order
1. URL parameters (highest priority)
2. Environment variable
3. Interactive form (fallback)

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
