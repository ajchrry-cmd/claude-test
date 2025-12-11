# Dorm Inspector - Modular Edition

A modern, modularized dormitory inspection management system built with vanilla JavaScript and ES6 modules.

## 🎉 What's New in v2.0

This is a **complete rewrite** of the original monolithic `index.html` into a modern, modular architecture.

### Before → After

| Aspect | Before (v1) | After (v2) |
|--------|------------|-----------|
| **Architecture** | 1 file (6045 lines) | Modular (25+ files) |
| **Testability** | 0% (untestable) | ✅ Unit testable |
| **Maintainability** | ❌ Very difficult | ✅ Easy |
| **Build Process** | None | Vite (modern) |
| **Code Reuse** | ❌ None | ✅ High |
| **Performance** | All code loads | Code splitting |

## 📁 Project Structure

```
dorm-inspector/
├── public/
│   └── index.html              # Minimal HTML entry
├── src/
│   ├── main.js                # Application entry point
│   ├── config/
│   │   ├── firebase.js        # Firebase configuration
│   │   ├── constants.js       # App constants
│   │   └── settings.js        # Default settings
│   ├── services/
│   │   ├── firebaseService.js # Firebase operations
│   │   ├── storageService.js  # localStorage wrapper
│   │   └── voiceService.js    # Voice recognition
│   ├── components/
│   │   ├── DemeritGrid.js     # Demerit selection grid
│   │   └── ScoreDisplay.js    # Score/status display
│   ├── utils/
│   │   ├── scoringUtils.js    # Score calculations
│   │   ├── dateUtils.js       # Date formatting
│   │   ├── validators.js      # Input validation
│   │   └── domUtils.js        # DOM helpers
│   ├── state/
│   │   └── store.js           # Centralized state
│   └── styles/
│       ├── main.css           # Main styles
│       ├── variables.css      # CSS variables
│       └── components.css     # Component styles
├── package.json
├── vite.config.js
└── README.md (this file)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
# Create optimized build
npm run build

# Preview production build
npm run preview
```

## ✨ Features

### Core Functionality
- ✅ **Room Inspections** - Create, edit, and manage inspections
- ✅ **Demerit Tracking** - Regular (1pt) and auto-failure (4pts) demerits
- ✅ **Scoring System** - Automatic score calculation and status
- ✅ **Firebase Sync** - Cloud data persistence
- ✅ **Offline Support** - localStorage backup
- ✅ **Voice Recognition** - Hands-free demerit selection
- ✅ **Theme Support** - Dark/light mode

### Technical Features
- 🎯 **Modular Architecture** - Clean separation of concerns
- 📦 **ES6 Modules** - Modern import/export
- 🔥 **Hot Module Reload** - Instant updates during development
- 🎨 **CSS Variables** - Dynamic theming
- 💾 **Centralized State** - Predictable data flow
- ✅ **Input Validation** - Form validation and sanitization

## 🏗️ Architecture Overview

### Services Layer

Handles external interactions:

```javascript
// Firebase operations
import firebaseService from './services/firebaseService.js';
await firebaseService.initialize();
const inspections = await firebaseService.getInspections();

// Local storage
import storageService from './services/storageService.js';
storageService.save('key', data);

// Voice recognition
import voiceService from './services/voiceService.js';
voiceService.onMatch = (demerit) => { /* handle */ };
voiceService.start();
```

### Components Layer

Reusable UI components:

```javascript
import { DemeritGrid } from './components/DemeritGrid.js';

const grid = new DemeritGrid(container);
grid.onChange = (demerits) => updateScore(demerits);
grid.render();
```

### Utilities Layer

Pure helper functions:

```javascript
import { calculateInspectionResult } from './utils/scoringUtils.js';

const result = calculateInspectionResult(regular, autoFailure);
// { score, status, color, isPassing }
```

### State Management

Centralized application state:

```javascript
import store from './state/store.js';

// Get state
const inspections = store.getInspections();

// Update state
store.addInspection(inspection);

// Subscribe to changes
store.subscribe('inspections', (inspections) => {
    // React to changes
});
```

## 📖 Usage Examples

### Creating an Inspection

```javascript
const inspection = {
    roomNumber: '201',
    inspectorName: 'Hoskins',
    inspectionDate: '2025-12-11',
    demerits: ['Bed not made or missing 341', 'Mirror'],
    autoFailureDemerits: ['HAZMAT'],
    score: 6,
    status: 'FAILED'
};

await firebaseService.saveInspection(inspection);
store.addInspection(inspection);
```

### Using Voice Recognition

```javascript
voiceService.onMatch = (demeritName) => {
    demeritGrid.selectDemerit(demeritName);
};

voiceService.start(); // Start listening
// Say "bed" → Selects "Bed not made or missing 341"
voiceService.stop(); // Stop listening
```

### Calculating Scores

```javascript
import { calculateInspectionResult } from './utils/scoringUtils.js';

const result = calculateInspectionResult(
    ['Bed', 'Mirror'],  // Regular: 2 points
    ['HAZMAT']          // Auto-failure: 4 points
);

console.log(result);
// {
//   score: 6,
//   status: 'FAILED',
//   color: '#ef4444',
//   statusClass: 'failed',
//   isPassing: false
// }
```

## 🔧 Configuration

### Firebase Setup

Edit `src/config/firebase.js` with your Firebase credentials:

```javascript
export const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-app.firebaseapp.com",
    projectId: "your-project-id",
    // ...
};
```

### Constants

Modify `src/config/constants.js` to customize:

- Demerit lists
- Inspector names
- Room ranges
- Score thresholds
- Point values

### Settings

Default settings in `src/config/settings.js`:

- Theme (dark/light)
- Colors and presets
- View modes
- Haptic feedback
- And more...

## 🎨 Theming

The app supports dynamic theming via CSS variables:

```css
/* Dark theme (default) */
:root {
    --primary: #6366f1;
    --background: #0f172a;
    --text-primary: #f1f5f9;
    /* ... */
}

/* Light theme */
[data-theme="light"] {
    --background: #f8fafc;
    --text-primary: #0f172a;
    /* ... */
}
```

Change theme programmatically:

```javascript
document.documentElement.setAttribute('data-theme', 'light');
```

## 📊 State Management

The app uses a simple but powerful state management pattern:

```javascript
// Get current state
const state = store.getState();

// Update state (triggers subscriptions)
store.setState({ isLoading: true });

// Subscribe to specific keys
const unsubscribe = store.subscribe('inspections', (newValue, oldValue) => {
    console.log('Inspections changed:', newValue);
});

// Unsubscribe when done
unsubscribe();

// Subscribe to all changes
store.subscribe('*', (newState, oldState) => {
    console.log('State changed');
});
```

## 🧪 Testing

The modular architecture makes testing straightforward:

```javascript
// Example: Test scoring utility
import { calculateScore, getStatus } from './utils/scoringUtils.js';

// Test score calculation
const score = calculateScore(['Bed'], ['HAZMAT']);
assert(score === 5); // 1 + 4

// Test status determination
assert(getStatus(0) === 'OUTSTANDING');
assert(getStatus(3) === 'PASSED');
assert(getStatus(4) === 'FAILED');
```

## 🚀 Deployment

### Build and Deploy

```bash
# Build for production
npm run build

# The dist/ folder contains optimized static files
# Upload to any static hosting:
# - Vercel
# - Netlify
# - GitHub Pages
# - Firebase Hosting
# - etc.
```

### Environment Variables

For production, use environment variables:

```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
```

Update `src/config/firebase.js`:

```javascript
export const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    // ...
};
```

## 📝 Development

### Hot Module Reload

Vite provides instant hot reload. Changes to JS, CSS, or HTML are reflected immediately without full page refresh.

### Code Organization

Follow these principles:

1. **One module, one responsibility**
2. **Import only what you need**
3. **Keep components small and focused**
4. **Use pure functions where possible**
5. **Centralize state in the store**

### Adding New Features

1. **Services**: Add to `src/services/` for external interactions
2. **Components**: Add to `src/components/` for UI elements
3. **Utilities**: Add to `src/utils/` for helper functions
4. **Configuration**: Add to `src/config/` for constants

## 🐛 Troubleshooting

### Firebase Connection Issues

- Check Firebase configuration in `src/config/firebase.js`
- Verify Firebase Security Rules allow read/write
- Check browser console for errors

### Voice Recognition Not Working

- Voice recognition requires HTTPS (or localhost)
- Only supported in Chrome, Edge, and Safari
- Requires microphone permissions

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf dist .vite
npm run build
```

## 🆚 Comparison with Original

### Original (index.html)
- ❌ 6,045 lines in single file
- ❌ 127 global functions
- ❌ No module system
- ❌ No build process
- ❌ Hard to test
- ❌ Difficult to maintain

### Modular (v2.0)
- ✅ 25+ organized files
- ✅ Modular functions
- ✅ ES6 modules
- ✅ Modern build (Vite)
- ✅ Unit testable
- ✅ Easy to maintain

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [ES6 Modules Guide](https://javascript.info/modules)
- [Firebase Web SDK](https://firebase.google.com/docs/web/setup)

## 📄 License

MIT License - feel free to use this code for your projects!

## 🤝 Contributing

This is a modular rewrite of the original Dorm Inspector application. Contributions, issues, and feature requests are welcome!

---

**Note:** The original monolithic `index.html` is still available in the repository for reference. Both versions work independently.
