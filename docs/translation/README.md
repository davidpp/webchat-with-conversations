# Lightweight i18n via CSS Variables

## Overview

This document describes a translation system that uses **CSS custom properties as the data source**, enabling:

- Runtime language switching without page reload
- External stylesheet overrides (no code changes needed)
- Easy package updates (translations are external)
- Full string interpolation support

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  External CSS (client override)                               │
│  :root[data-lang="fr"] { --t-btn-new: "Nouvelle conv" }      │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  Default CSS (shipped with package)                           │
│  :root { --t-btn-new: "New Conversation" }                   │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  cssReader.ts                                                 │
│  Reads CSS variables via getComputedStyle()                  │
│  Returns Record<TranslationKey, string>                      │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  TranslationProvider.tsx (React Context)                      │
│  Provides t() function to components                          │
│  t('btn-new') → "New Conversation"                           │
│  t('time-mins', { n: 5 }) → "5m ago"                         │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  Components                                                   │
│  Use useTranslation() hook                                   │
│  <button>{t('btn-new')}</button>                             │
└──────────────────────────────────────────────────────────────┘
```

---

## Why CSS Variables?

### User Requirements

1. **Runtime language switching** - Change language without page reload
2. **CSS-based overrides** - No code changes, lightweight customization
3. **All user-visible strings** - ~50 strings total
4. **Package update safe** - Translations are external to code

### Alternatives Considered

| Approach | CSS Override | Runtime Switch | Interpolation | Accessibility | Package Safe |
|----------|-------------|----------------|---------------|---------------|--------------|
| **CSS + JS Hybrid** | ✅ Full | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Pure CSS content:** | ✅ Full | ✅ Yes | ❌ No | ❌ WCAG issues | ⚠️ Partial |
| **Config Props** | ❌ Via props | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

**Pure CSS `content:` approach was rejected** due to:
- Cannot handle string interpolation (e.g., "5m ago")
- Accessibility issues (WCAG 1.3.1 violations)
- Cannot translate aria-labels, placeholders, title attributes
- Screen reader inconsistencies across browsers

---

## String Inventory

### Buttons (7 strings)

| Key | Default (English) |
|-----|-------------------|
| `btn-new-conversation` | `+ New Conversation` |
| `btn-new-short` | `New Conversation` |
| `btn-creating` | `Creating...` |
| `btn-load-more` | `Load More` |
| `btn-initialize` | `Initialize Webchat` |
| `btn-loading` | `Loading...` |
| `btn-load-default` | `Load Default Configuration` |

### Headers/Labels (8 strings)

| Key | Default (English) |
|-----|-------------------|
| `header-conversations` | `Conversations` |
| `header-chat` | `Chat` |
| `label-client-id` | `Client ID or Script URL` |
| `label-embedded` | `Embedded mode` |
| `label-embedded-hint` | `Full-page chat with collapsible sidebar (like ChatGPT)` |
| `title-init` | `Initialize Webchat` |
| `subtitle-init` | `Enter a Botpress client ID or script URL to get started` |
| `label-or` | `or` |

### States/Messages (10 strings)

| Key | Default (English) |
|-----|-------------------|
| `state-connecting` | `Connecting...` |
| `state-failed` | `Failed to connect` |
| `state-no-conversations` | `No conversations yet` |
| `state-empty-hint` | `Click "New Conversation" to start` |
| `state-loading-list` | `Loading conversations...` |
| `state-new-conversation` | `New conversation` |
| `error-no-input` | `Please enter a client ID or URL` |
| `error-no-config` | `No default client ID configured in environment` |
| `error-fetch` | `Failed to fetch script: {status}` |
| `error-generic` | `An error occurred` |

### Time/Date (8 strings) - with interpolation

| Key | Default (English) | Interpolation |
|-----|-------------------|---------------|
| `time-just-now` | `Just now` | - |
| `time-mins` | `{n}m ago` | `{n}` = minutes |
| `time-hours` | `{n}h ago` | `{n}` = hours |
| `time-days` | `{n}d ago` | `{n}` = days |
| `group-today` | `Today` | - |
| `group-week` | `This Week` | - |
| `group-month` | `This Month` | - |
| `group-older` | `Older` | - |

### Aria Labels (6 strings)

| Key | Default (English) |
|-----|-------------------|
| `aria-back` | `Back to conversations` |
| `aria-close` | `Close` |
| `aria-open-sidebar` | `Open sidebar` |
| `aria-close-sidebar` | `Close sidebar` |
| `aria-new-conversation` | `New conversation` |
| `aria-conversations` | `Conversations` |

### Placeholders (3 strings)

| Key | Default (English) |
|-----|-------------------|
| `placeholder-input` | `e.g., abc123 or https://files.bpcontent.cloud/...` |
| `example-client-id` | `f0119422-b733-4b07-8cf5-b23e84305127` |
| `example-script-url` | `https://files.bpcontent.cloud/YYYY/MM/DD/HH/...` |

**Total: ~42 translatable strings**

---

## File Structure

```
src/
├── i18n/
│   ├── index.ts                 # Public exports
│   ├── types.ts                 # TranslationKey union type
│   ├── defaults.ts              # Fallback English values
│   ├── translations.css         # Default CSS variables
│   ├── cssReader.ts             # getComputedStyle() reader
│   ├── interpolate.ts           # {n} template replacement
│   └── TranslationProvider.tsx  # React context + useTranslation hook
└── components/
    └── ... (components use useTranslation hook)
```

---

## How It Works

### 1. CSS Variables as Data Source

All translation strings are defined as CSS custom properties with `--t-` prefix:

- Default values in `translations.css` (shipped with package)
- Language overrides use `data-lang` attribute selector
- Clients can override via external stylesheet

### 2. JavaScript Reads CSS Variables

The `cssReader.ts` module:
- Uses `getComputedStyle(document.documentElement)` to read values
- Strips surrounding quotes from CSS string values
- Falls back to hardcoded defaults if CSS variable not found

### 3. React Context Provides Translations

The `TranslationProvider`:
- Reads all translations on mount
- Caches in React state for performance
- Re-reads when `data-lang` attribute changes
- Watches for new stylesheets via MutationObserver
- Provides `t()` function and `setLang()` to components

### 4. Interpolation for Dynamic Values

Template strings use `{key}` syntax:
- `{n}m ago` + `{ n: 5 }` → `5m ago`
- `Failed to fetch: {status}` + `{ status: '404' }` → `Failed to fetch: 404`

---

## Client Override Patterns

### Pattern 1: External Stylesheet

```html
<link rel="stylesheet" href="webchat-fr.css">
<script>
  document.documentElement.setAttribute('data-lang', 'fr')
</script>
```

### Pattern 2: Botpress Configuration

```javascript
window.botpress.init({
  clientId: "xxx",
  configuration: {
    additionalStylesheetUrl: "https://cdn.example.com/webchat-fr.css"
  }
})
```

### Pattern 3: Inline Styles

```html
<style>
  :root[data-lang="de"] {
    --t-btn-new-conversation: '+ Neues Gespräch';
    --t-state-connecting: 'Verbindung wird hergestellt...';
  }
</style>
```

### Pattern 4: Runtime Switching

```javascript
// From within a component
const { setLang } = useTranslation()
setLang('fr') // Switches all UI to French
```

---

## Migration Plan

### Phase 1: Infrastructure

1. Create `src/i18n/types.ts` - TranslationKey union type
2. Create `src/i18n/defaults.ts` - Fallback English values object
3. Create `src/i18n/translations.css` - All default CSS variables
4. Create `src/i18n/cssReader.ts` - CSS variable reader functions
5. Create `src/i18n/interpolate.ts` - Template interpolation utility
6. Create `src/i18n/TranslationProvider.tsx` - React context + hook
7. Create `src/i18n/index.ts` - Public exports

### Phase 2: Component Migration

| Order | Component | Strings |
|-------|-----------|---------|
| 1 | `main.tsx` | Wrap app with TranslationProvider |
| 2 | `ConversationItem.tsx` | Time interpolation (most complex) |
| 3 | `ConversationList.tsx` | Empty states, loading, load more |
| 4 | `EmbeddedSidebar.tsx` | Date groups, buttons, empty state |
| 5 | `EmbeddedHeader.tsx` | Aria labels |
| 6 | `EmbeddedLayout.tsx` | Connection states |
| 7 | `WebchatWithConversations.tsx` | Buttons, states |
| 8 | `UnifiedHeader.tsx` | Title, aria labels |
| 9 | `InitializationForm.tsx` | Labels, errors (optional - internal) |

### Phase 3: Documentation

1. Add example French translation file (`webchat-fr.css`)
2. Update project README with translation instructions
3. Document CSS variable naming convention

---

## Critical Files to Modify

### New Files (Create)

- `src/i18n/types.ts`
- `src/i18n/defaults.ts`
- `src/i18n/translations.css`
- `src/i18n/cssReader.ts`
- `src/i18n/interpolate.ts`
- `src/i18n/TranslationProvider.tsx`
- `src/i18n/index.ts`
- `docs/translation/webchat-fr.css` (example)

### Existing Files (Modify)

- `src/main.tsx` - Wrap with TranslationProvider
- `src/components/ConversationItem.tsx` - Time strings
- `src/components/ConversationList.tsx` - Empty states
- `src/components/EmbeddedSidebar.tsx` - Date groups
- `src/components/EmbeddedHeader.tsx` - Aria labels
- `src/components/EmbeddedLayout.tsx` - States
- `src/components/WebchatWithConversations.tsx` - Buttons
- `src/components/UnifiedHeader.tsx` - Title, aria

---

## Key Benefits

| Benefit | Description |
|---------|-------------|
| **CSS-based overrides** | No code changes needed, just add stylesheet |
| **Runtime switching** | Change `data-lang` attribute, UI updates instantly |
| **Package update safe** | Translations live in external CSS files |
| **Full interpolation** | `{n}m ago` works correctly with any language |
| **Accessibility** | Aria labels properly supported (not CSS content:) |
| **Type-safe** | TranslationKey union type catches typos |
| **Zero dependencies** | No i18n library needed |
| **Performance** | Translations cached in React state |

---

## Technical Considerations

### Performance

- `getComputedStyle()` called once on language change, not per render
- Translations cached in React state
- MutationObserver detects new stylesheets automatically
- `requestAnimationFrame` ensures CSS is applied before reading

### Edge Cases

- **Missing CSS variable**: Falls back to hardcoded English default
- **Missing interpolation value**: Returns placeholder unchanged (`{n}`)
- **Quotes in CSS values**: Automatically stripped (both single and double)
- **SSR/Node.js**: Would need fallback (no document available)

### CSS Variable Naming Convention

- Prefix: `--t-` (for "translation")
- Categories: `btn-`, `state-`, `time-`, `group-`, `aria-`, `label-`, `error-`
- Format: kebab-case
- Examples: `--t-btn-new-conversation`, `--t-time-mins`, `--t-aria-close`

---

## Example: French Translation File

See `webchat-fr.css` for a complete French translation example.

Key patterns:
- Time: `il y a {n} min` (instead of `{n}m ago`)
- Groups: `Aujourd'hui`, `Cette semaine`, `Ce mois-ci`
- Buttons: `Nouvelle conversation`, `Charger plus`
