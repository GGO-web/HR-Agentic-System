# Translation Guidelines

## Overview
This project uses react-i18next for internationalization. All hardcoded text must be extracted to translation files.

## Translation File Structure
- Location: `apps/web/src/i18n/locales/en.json`
- Keys follow hierarchical structure: `section.subsection.key`
- Example: `common.loading`, `header.hrManager`, `dashboard.hr.title`

## Adding New Text

### 1. Add Translation Key
First, add the translation key to `apps/web/src/i18n/locales/en.json`:

```json
{
  "section": {
    "subsection": {
      "newKey": "Your text here"
    }
  }
}
```

### 2. Use in Component
Import and use the translation hook:

```typescript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  
  return (
    <div>
      <h1>{t('section.subsection.newKey')}</h1>
      <p>{t('common.loading')}</p>
    </div>
  )
}
```

## Key Naming Conventions

### Common Keys
- `common.*` - Reusable text like buttons, status messages
- `navigation.*` - Navigation elements
- `header.*` - Header component text
- `footer.*` - Footer component text

### Feature-Specific Keys
- `auth.*` - Authentication related text
- `dashboard.*` - Dashboard components
- `interview.*` - Interview flow components
- `jobDescription.*` - Job description forms and lists

### Component-Specific Keys
- Use descriptive, hierarchical names
- Example: `interview.flow.loading`, `interview.questionDisplay.playQuestion`

## Best Practices

1. **Never use hardcoded text** - Always use translation keys
2. **Use meaningful key names** - Keys should be self-documenting
3. **Group related keys** - Use hierarchical structure for organization
4. **Reuse common keys** - Use `common.*` keys for repeated text
5. **Test translations** - Ensure all keys are properly translated

## Examples

### ✅ Good
```typescript
const { t } = useTranslation()
return <button>{t('common.submit')}</button>
```

### ❌ Bad
```typescript
return <button>Submit</button>
```

### ✅ Good
```typescript
const { t } = useTranslation()
return <h1>{t('dashboard.hr.title')}</h1>
```

### ❌ Bad
```typescript
return <h1>HR Dashboard</h1>
```

## Adding New Languages

1. Create new locale file: `apps/web/src/i18n/locales/[lang].json`
2. Add language to resources in `apps/web/src/i18n/index.ts`
3. Translate all keys in the new locale file

## Common Translation Keys

### Buttons
- `common.submit` - Submit
- `common.cancel` - Cancel
- `common.save` - Save
- `common.edit` - Edit
- `common.delete` - Delete
- `common.add` - Add
- `common.continue` - Continue

### Status
- `common.loading` - Loading...
- `common.error` - Error
- `common.success` - Success
- `common.warning` - Warning

### Navigation
- `navigation.dashboard` - Dashboard
- `navigation.signIn` - Sign In
- `navigation.signUp` - Sign Up
- `navigation.signOut` - Sign Out
