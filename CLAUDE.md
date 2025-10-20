# CLAUDE.md

This file provides guidance to Claude Code when working with this standalone webchat-with-conversations project.

## Project Overview

This is a **standalone React application** that extends the official Botpress webchat with conversation list functionality. It's designed for direct client delivery and operates independently from the main Botpress monorepo.

### Purpose

Add conversation management UI to Botpress webchat, allowing users to:
- View all their conversations in a sidebar
- Switch between conversations
- Create new conversations
- See message previews for each conversation

## Architecture

### Relationship to Botpress Monorepo

This project **uses** but **does not modify** the official Botpress packages:

```
webchat-with-conversations (this project)
│
├── Uses: @botpress/webchat (from npm)
│   └── Source: /Users/davidpaquet/Projects/botpress/genisys/packages/webchat-components
│
└── Uses: @botpress/webchat-client (from npm)
    └── Source: /Users/davidpaquet/Projects/botpress/genisys/packages/webchat-client
```

**Important**: This project does NOT contain or modify the Botpress source code. It imports published packages from npm.

### Source of Truth

For understanding the underlying webchat API and components:

1. **Primary Reference**: `/Users/davidpaquet/Projects/botpress/guides/WEBCHAT_API_GUIDE.md`
   - Complete API documentation
   - `useWebchat` hook usage
   - Event system
   - Custom events
   - Architecture details

2. **Source Code**: `/Users/davidpaquet/Projects/botpress/genisys/packages/webchat-components/`
   - React components implementation
   - `useWebchat` hook source
   - Type definitions
   - Stores (Zustand)

3. **Client API**: `/Users/davidpaquet/Projects/botpress/genisys/packages/webchat-client/`
   - Low-level HTTP client
   - `listConversations()` API
   - `createConversation()` API
   - Type definitions

## Project Structure

```
webchat-with-conversations/
├── src/
│   ├── components/
│   │   ├── ConversationItem.tsx         # Individual list item
│   │   ├── ConversationList.tsx         # List container
│   │   ├── ConversationListPanel.tsx    # Sidebar wrapper
│   │   └── WebchatWithConversations.tsx # Main component (wraps @botpress/webchat)
│   ├── hooks/
│   │   └── useConversationList.ts       # Manages conversation list state
│   ├── types/
│   │   └── conversation.ts              # TypeScript interfaces
│   └── App.tsx                          # Demo application
├── .env.example                         # Environment template
├── README.md                            # User documentation
├── DELIVERY_NOTES.md                    # Client delivery guide
└── CLAUDE.md                            # This file
```

## Key Design Decisions

### Why Standalone Project?

1. **Client Delivery**: Easier to package and send to clients
2. **Independence**: No dependency on Botpress monorepo
3. **Simplicity**: Standard React + Vite setup
4. **Customization**: Clients can modify without affecting Botpress core

### Why Not Built in Genisys?

- This is a **custom solution** for specific client needs
- **Not generic enough** for inclusion in official `@botpress/webchat`
- **Easier to customize** as standalone code
- **Faster delivery** without PR/review process

## Implementation Strategy

### What We Built

**Custom Components** (NOT in @botpress/webchat):
- `ConversationItem` - Displays individual conversation with preview
- `ConversationList` - Container with pagination
- `ConversationListPanel` - Collapsible sidebar
- `WebchatWithConversations` - Wrapper that orchestrates everything

**Custom Hook**:
- `useConversationList` - Fetches conversations and previews using `@botpress/webchat-client`

### What We Reused

**From @botpress/webchat**:
- `useWebchat` hook - Manages active conversation
- `Configuration` type - Configuration object
- All UI components (MessageList, Composer, etc.)

**From @botpress/webchat-client**:
- `createClient()` - HTTP client factory
- `listConversations()` - Fetch conversation list
- `listConversationMessages()` - Fetch message previews
- `createConversation()` - Create new conversation

## API Usage Patterns

### Conversation Switching

```typescript
// Pass different conversationId to useWebchat
const [currentConversationId, setCurrentConversationId] = useState()

const webchat = useWebchat({
  clientId,
  conversationId: currentConversationId, // ← This changes
})

// When user clicks conversation:
setCurrentConversationId(newId)
// useWebchat automatically:
// 1. Cleans up old SSE connection
// 2. Creates new connection
// 3. Fetches messages for new conversation
```

### Fetching Conversation Previews

```typescript
// 1. Get conversation IDs
const { conversations } = await client.listConversations({ limit: 10 })

// 2. For each conversation, get last message
for (const conv of conversations.slice(0, 5)) {
  const { messages } = await client.listConversationMessages({
    conversationId: conv.id,
    limit: 1  // Only fetch last message
  })
  // Use messages[0] as preview
}
```

**Performance Note**: Only fetch previews for first 5 conversations to avoid too many API calls.

## Constraints & Limitations

### API Limitations (Cannot Change)

From WEBCHAT_API_GUIDE.md, the `listConversations` API returns:
```typescript
{
  conversations: Array<{
    id: string
    createdAt: string
    updatedAt: string
  }>
}
```

**What's NOT Available**:
- ❌ Conversation titles/names
- ❌ Last message preview (must fetch separately)
- ❌ Unread message counts
- ❌ Message count per conversation
- ❌ Search/filter endpoint

**Workarounds Implemented**:
- Use last message text as conversation "title"
- Fetch last message separately for previews
- Sort by `updatedAt` for most recent first
- Generate avatar initials from message text

### Design Decisions

Based on API constraints:

1. **No Search**: API doesn't support it, excluded from UI
2. **No Unread Counts**: API doesn't track, excluded from UI
3. **Generic Titles**: Use message preview instead of custom names
4. **Limited Preview Fetching**: Only first 5 to avoid API overload
5. **Pagination**: Load 10 conversations at a time

## Development Guidelines

### When Modifying This Project

1. **Check WEBCHAT_API_GUIDE.md** first for API capabilities
2. **Use existing @botpress/webchat components** whenever possible
3. **Don't modify** the webchat packages (they're from npm)
4. **Keep it simple** - this is for client delivery

### Adding Features

**Before adding a feature, ask**:
1. Does the API support this? (Check WEBCHAT_API_GUIDE.md)
2. Can we use existing webchat components? (Check genisys source)
3. Is this specific to this client or generic? (If generic, consider PR to Botpress)

### Testing Changes

```bash
# 1. Test locally
npm run dev

# 2. Test build
npm run build
npm run preview

# 3. Verify with real bot
# Set VITE_BOTPRESS_CLIENT_ID in .env to real client ID
```

## Common Tasks

### Update Webchat Packages

```bash
npm update @botpress/webchat @botpress/webchat-client
```

Check for breaking changes in:
- `/Users/davidpaquet/Projects/botpress/genisys/packages/webchat-components/CHANGELOG.md`

### Add Custom Styling

Modify CSS files:
- `ConversationItem.css` - List item styles
- `ConversationList.css` - List container styles
- `ConversationListPanel.css` - Sidebar styles
- `WebchatWithConversations.css` - Main layout

### Debug API Issues

1. Check browser DevTools → Network tab
2. Look for calls to `webchat.botpress.cloud`
3. Verify headers include `x-user-key`
4. Check response status codes

Common issues:
- 401: Invalid client ID or user key
- 404: Conversation doesn't exist
- 429: Rate limit exceeded

## References

### Documentation

- **API Guide**: `/Users/davidpaquet/Projects/botpress/guides/WEBCHAT_API_GUIDE.md`
- **PRD**: `/Users/davidpaquet/Projects/botpress/genisys/2025-10-20-webchat-conversation-list-prd.md`
- **README**: `./README.md` (in this project)
- **Delivery Notes**: `./DELIVERY_NOTES.md` (in this project)

### Source Code

**Official Packages** (read-only, for reference):
- Webchat Components: `/Users/davidpaquet/Projects/botpress/genisys/packages/webchat-components/`
- Webchat Client: `/Users/davidpaquet/Projects/botpress/genisys/packages/webchat-client/`
- Webchat API: `/Users/davidpaquet/Projects/botpress/echo/packages/webchat-api/`

**This Project** (modify as needed):
- Components: `./src/components/`
- Hooks: `./src/hooks/`
- Types: `./src/types/`

## Important Notes

### Do NOT

- ❌ Modify files in `/Users/davidpaquet/Projects/botpress/` (different project)
- ❌ Import from relative paths to genisys packages (use npm packages)
- ❌ Add features that require backend API changes
- ❌ Commit node_modules or .env files

### DO

- ✅ Use npm packages: `@botpress/webchat` and `@botpress/webchat-client`
- ✅ Keep implementation simple for client customization
- ✅ Document any new features in README.md
- ✅ Test with real Botpress bot before delivery

## Troubleshooting

### "Cannot find module '@botpress/webchat'"

```bash
npm install
```

### Types not resolving correctly

```bash
npm install --save-dev @types/react @types/react-dom
```

### API calls failing

1. Verify `.env` has correct `VITE_BOTPRESS_CLIENT_ID`
2. Check bot is published in Botpress Dashboard
3. Verify webchat integration is enabled
4. Check browser console for detailed errors

### Conversations not loading

1. Open DevTools → Network tab
2. Look for `listConversations` call
3. Check response data
4. Verify user has conversations (create one in bot first)

## Version Information

- **React**: 18.x
- **TypeScript**: 5.x
- **Vite**: 5.x
- **@botpress/webchat**: Latest from npm
- **@botpress/webchat-client**: Latest from npm

## Questions?

When Claude needs help with this project:

1. **API Questions**: Check `/Users/davidpaquet/Projects/botpress/guides/WEBCHAT_API_GUIDE.md`
2. **Component Questions**: Check genisys source: `/Users/davidpaquet/Projects/botpress/genisys/packages/webchat-components/`
3. **Client API**: Check `/Users/davidpaquet/Projects/botpress/genisys/packages/webchat-client/`
4. **This Project**: Check `README.md` and `DELIVERY_NOTES.md` in this folder

---

**Last Updated**: 2025-10-20
**Maintainer**: For client delivery and customization
