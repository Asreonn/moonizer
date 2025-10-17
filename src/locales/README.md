# Simple Modular Translation System

## 🎯 System Design

A clean, simple system where individual JSON files in the `en/` directory are automatically loaded and combined by the LanguageProvider.

## 📁 Directory Structure

```
src/locales/
├── en/                        # English translation modules
│   ├── app.json              # App-wide strings (title, subtitle)
│   ├── nav.json              # Navigation menu items
│   ├── errors.json           # Error messages
│   ├── panels.json           # Panel-specific content
│   ├── inspector-core.json   # Core inspector functionality
│   └── inspector-actions.json # Inspector actions & operations
└── README.md                 # This file
```

## 🔧 How It Works

The `LanguageProvider` automatically loads all JSON modules:

1. **Core modules** → Top-level translation keys
   - `app.json` → `t('app.title')`
   - `nav.json` → `t('nav.home')`
   - `errors.json` → `t('errors.csv.parseError')`
   - `panels.json` → `t('panels.dataView.title')`

2. **Inspector modules** → Nested under `inspector`
   - `inspector-core.json` → `t('inspector.core.title')`
   - `inspector-actions.json` → `t('inspector.actions.general.duplicate')`

## 📝 Adding New Modules

### Step 1: Create JSON File
```bash
# Create new module file
touch src/locales/en/features.json
```

### Step 2: Add Translations
```json
{
  "feature1": {
    "title": "My Feature",
    "description": "Feature description"
  },
  "feature2": {
    "action": "Do Something"
  }
}
```

### Step 3: Use in Components
```typescript
const { t } = useLanguage();
t('features.feature1.title') // "My Feature"
```

**That's it!** No build step, no configuration. The system automatically discovers and loads the new module.

## 🌍 Multi-Language Support

To add a new language (future):

```bash
# Create language directory
mkdir src/locales/es

# Copy English structure
cp src/locales/en/*.json src/locales/es/

# Translate individual files
nano src/locales/es/app.json
```

The LanguageProvider will automatically support the new language.

## 💡 Module Organization Guidelines

### Core Modules (Top-level)
- `app.json` - Application identity & branding
- `nav.json` - Navigation & menu items
- `errors.json` - All error messages
- `panels.json` - Panel titles, descriptions, states

### Feature Modules (Prefixed)
- `inspector-core.json` - Basic inspector functionality
- `inspector-actions.json` - Inspector operations
- `dataview-*.json` - Data view related translations
- `forms-*.json` - Form-related translations

### Key Structure
```json
{
  "section": {
    "subsection": {
      "item": "Translation text",
      "template": "Hello {{name}}, you have {{count}} items"
    }
  }
}
```

## 🚀 System Benefits

✅ **Zero Configuration** - Just add JSON files  
✅ **Automatic Discovery** - No need to register modules  
✅ **Small Files** - Easy to navigate and edit  
✅ **Git Friendly** - Clean diffs, no merge conflicts  
✅ **Multi-language Ready** - Simple to add new languages  
✅ **Performance** - Cached loading with minimal overhead  

## 🔄 Migration from Old System

The site is already fully tagged with `t()` calls. This system seamlessly replaces the old monolithic approach:

```typescript
// These calls work exactly the same
t('app.title')
t('inspector.core.summary.types.numeric')
t('errors.csv.parseError')
```

No component changes needed - just organize translations into logical JSON modules.

## 🆕 Adding Non-Expected JSON Modules

The system automatically discovers any JSON file you add to the `en/` directory. There are two patterns:

### Pattern 1: Top-Level Modules
Any JSON file becomes a top-level translation namespace:

```bash
# Create any JSON file
touch src/locales/en/dashboard.json
touch src/locales/en/settings.json
touch src/locales/en/user-profile.json
```

```json
// dashboard.json
{
  "title": "Dashboard",
  "widgets": {
    "chart": "Chart Widget",
    "table": "Data Table"
  }
}
```

**Access with:** `t('dashboard.title')`, `t('dashboard.widgets.chart')`

### Pattern 2: Prefixed Modules (Auto-Nested)
Files with specific prefixes are automatically nested:

```bash
# These get nested under 'inspector'
touch src/locales/en/inspector-charts.json
touch src/locales/en/inspector-filters.json

# These get nested under 'forms'  
touch src/locales/en/forms-validation.json
touch src/locales/en/forms-inputs.json
```

**Access with:** 
- `t('inspector.charts.title')` (from inspector-charts.json)
- `t('forms.validation.required')` (from forms-validation.json)

### Current Auto-Nesting Rules

The LanguageProvider automatically nests modules with these prefixes:

- `inspector-*.json` → `inspector.*`
- `forms-*.json` → `forms.*` 
- `dataview-*.json` → `dataview.*`

### Adding New Auto-Nesting Rules

To add support for new prefixed modules, update the LanguageProvider:

```typescript
// In LanguageProvider.tsx, add to the nested modules section:
const nestedModules = [
  { prefix: 'inspector-', namespace: 'inspector' },
  { prefix: 'forms-', namespace: 'forms' },
  { prefix: 'charts-', namespace: 'charts' },  // Add this
  { prefix: 'reports-', namespace: 'reports' } // Add this
];
```

### Examples of Flexible Module Addition

```bash
# Feature-specific modules
touch src/locales/en/data-export.json     → t('data-export.formats.csv')
touch src/locales/en/user-management.json → t('user-management.roles.admin')

# Component-specific modules  
touch src/locales/en/modals.json          → t('modals.confirm.title')
touch src/locales/en/tooltips.json        → t('tooltips.save.description')

# Workflow-specific modules
touch src/locales/en/onboarding.json      → t('onboarding.step1.title')
touch src/locales/en/notifications.json   → t('notifications.success.saved')
```

**Zero configuration needed** - just create the JSON file and start using `t()` calls with the filename as the namespace!