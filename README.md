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
- ✅ **Internationalization (i18n)** - EN, DE, FR with runtime switching
- ✅ **Embedded mode** - Full-page chat with sidebar (ChatGPT-style)
- ✅ **Global API** - `window.botpress.setLanguage()` for external control

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
http://localhost:5173/?https://files.bpcontent.cloud/[your-script-url].js

# Using script parameter
http://localhost:5173/?script=https://files.bpcontent.cloud/[your-script-url].js

# Using just a client ID
http://localhost:5173/?clientId=your-client-id-here
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
│   ├── UnifiedHeader.tsx            # Unified header component
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
| `enableConversationList` | `boolean` | No | `true` | Show conversation list |

## Building for Production

```bash
npm run build
```

Deploy the `dist/` folder to any static hosting service.

## Internationalization (i18n)

The webchat supports multiple languages via CSS custom properties. Built-in languages: **English**, **German**, **French**.

### Setting Language via URL

```
https://your-domain.com/?lang=de
https://your-domain.com/ledvance?lang=fr
```

### Setting Language via JavaScript

The app exposes a global `window.botpress` API for language control:

```javascript
// Change language at runtime
window.botpress.setLanguage('de')  // 'en' | 'de' | 'fr'

// Get current language
window.botpress.getLanguage()  // returns 'en', 'de', or 'fr'

// Listen for language changes
const unsubscribe = window.botpress.on('languageChanged', (data) => {
  console.log('Language changed to:', data.language)
})

// Unsubscribe when done
unsubscribe()
```

### Integration with Language Selector

```html
<select id="lang" onchange="window.botpress.setLanguage(this.value)">
  <option value="en">English</option>
  <option value="de">Deutsch</option>
  <option value="fr">Français</option>
</select>
```

### Adding New Languages

1. Create a new CSS file in `public/translations/webchat-{lang}.css`
2. Copy the structure from `webchat-de.css` or `webchat-fr.css`
3. Translate all `--t-*` CSS variables
4. Add the language code to the `SupportedLanguage` type in `src/i18n/TranslationProvider.tsx`

Example translation file structure:
```css
:root[data-lang="es"] {
  --t-btn-new-conversation: '+ Nueva conversación';
  --t-btn-creating: 'Creando...';
  --t-group-today: 'Hoy';
  /* ... other translations */
}
```

See `docs/translation/README.md` for the complete translation guide.

## Embedded Mode

For full-page embedded chat (like ChatGPT), use the `/ledvance` route or add `?mode=embedded` to any URL:

```
https://your-domain.com/?script=YOUR_SCRIPT_URL&mode=embedded
```

Features:
- Collapsible sidebar with conversation history
- Date-grouped conversations (Today, This Week, etc.)
- Language switcher in header
- Responsive mobile layout

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
