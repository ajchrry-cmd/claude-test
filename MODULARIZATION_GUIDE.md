# Modularization Guide: Dorm Inspector Application

## Table of Contents
1. [Current State Analysis](#current-state-analysis)
2. [Proposed Architecture](#proposed-architecture)
3. [Migration Strategy](#migration-strategy)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [Code Examples](#code-examples)
6. [Build Setup](#build-setup)
7. [Testing Strategy](#testing-strategy)
8. [Deployment](#deployment)

---

## Current State Analysis

### What We Have
- **Single File:** 6,045 lines of HTML, CSS, and JavaScript
- **127 Functions:** All in global scope
- **20+ Global Variables:** Scattered state management
- **No Modules:** Everything tightly coupled
- **No Build Process:** Direct HTML file

### Problems This Causes
1. **Difficult to navigate** - Finding specific code is challenging
2. **Hard to test** - No isolated units to test
3. **Merge conflicts** - Team collaboration is difficult
4. **No code reuse** - Cannot share utilities across projects
5. **Poor performance** - Everything loads at once
6. **Difficult refactoring** - Changes have unpredictable side effects

---

## Proposed Architecture

### Modern Modular Structure

```
dorm-inspector/
├── public/
│   ├── index.html          # Minimal HTML entry point
│   └── favicon.ico
├── src/
│   ├── main.js            # Application entry point
│   ├── config/
│   │   ├── firebase.js    # Firebase configuration
│   │   ├── constants.js   # App constants (demerits, etc.)
│   │   └── settings.js    # Default settings
│   ├── services/
│   │   ├── firebaseService.js    # Firebase operations
│   │   ├── dataService.js        # Data CRUD operations
│   │   ├── exportService.js      # Excel export
│   │   ├── voiceService.js       # Voice recognition
│   │   └── storageService.js     # localStorage operations
│   ├── components/
│   │   ├── InspectionForm.js     # Main inspection form
│   │   ├── InspectionList.js     # Display inspections
│   │   ├── InspectionCard.js     # Single inspection card
│   │   ├── RoomSelector.js       # Room selection UI
│   │   ├── DemeritGrid.js        # Demerit selection grid
│   │   ├── ScoreDisplay.js       # Score/status display
│   │   ├── ReportCharts.js       # Analytics charts
│   │   ├── ScheduleManager.js    # Room list management
│   │   ├── SettingsPanel.js      # Settings UI
│   │   └── Tutorial.js           # Tutorial system
│   ├── utils/
│   │   ├── dateUtils.js          # Date formatting
│   │   ├── validators.js         # Input validation
│   │   ├── scoringUtils.js       # Score calculations
│   │   └── domUtils.js           # DOM helpers
│   ├── state/
│   │   └── store.js              # Centralized state management
│   └── styles/
│       ├── main.css              # Base styles
│       ├── variables.css         # CSS variables
│       ├── components.css        # Component styles
│       └── themes.css            # Theme definitions
├── package.json
├── vite.config.js         # Build configuration
└── README.md
```

### Architecture Principles

1. **Separation of Concerns:** Each module has a single responsibility
2. **ES6 Modules:** Use import/export for dependencies
3. **Dependency Injection:** Pass dependencies rather than using globals
4. **Pure Functions:** Minimize side effects where possible
5. **Single Source of Truth:** Centralized state management

---

## Migration Strategy

### Approach: Gradual Migration (Recommended)

Rather than rewriting everything at once, we'll migrate incrementally:

**Phase 1: Setup & Configuration** (1-2 days)
- Set up build tooling (Vite)
- Extract configuration files
- Create project structure

**Phase 2: Extract Services** (2-3 days)
- Firebase service
- Data service
- Storage service
- Export service

**Phase 3: Modularize Utilities** (1-2 days)
- Date utilities
- Validators
- Scoring logic
- DOM helpers

**Phase 4: Split Components** (3-5 days)
- Extract UI components
- Create component interfaces
- Wire up components

**Phase 5: State Management** (2-3 days)
- Implement centralized store
- Migrate global variables
- Add state subscriptions

**Phase 6: Extract Styles** (1-2 days)
- Separate CSS into modules
- Organize by component
- Clean up duplicates

**Phase 7: Testing & Polish** (2-3 days)
- Add unit tests
- Fix bugs
- Optimize performance

**Total Estimated Time:** 12-20 days for full migration

---

## Step-by-Step Implementation

### Step 1: Initialize Modern Project Structure

```bash
# Create new project structure
mkdir dorm-inspector-refactored
cd dorm-inspector-refactored

# Initialize npm project
npm init -y

# Install build tools
npm install --save-dev vite

# Install dependencies
npm install firebase xlsx

# Create directory structure
mkdir -p src/{config,services,components,utils,state,styles}
mkdir public
```

### Step 2: Setup Vite Build Tool

**vite.config.js:**
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
```

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### Step 3: Create Minimal HTML Entry Point

**public/index.html:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dorm Inspector</title>
</head>
<body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
</body>
</html>
```

### Step 4: Extract Configuration

**src/config/firebase.js:**
```javascript
export const firebaseConfig = {
    apiKey: "AIzaSyCEzhO5BhgZrlLnnlfJoQ-jOnpHaa6hfHI",
    authDomain: "dorm-inspection-system.firebaseapp.com",
    projectId: "dorm-inspection-system",
    storageBucket: "dorm-inspection-system.firebasestorage.app",
    messagingSenderId: "996691705980",
    appId: "1:996691705980:web:5c93d55fa107baf14dc9f9",
    measurementId: "G-CJ8QZSEQ36"
};
```

**src/config/constants.js:**
```javascript
export const DEMERITS = [
    'Bed not made or missing 341',
    'Mirror',
    'Vanity/Sink',
    'Dirty tile or Carpet',
    'Foul odor',
    'High dust or excessive clutter',
    'Trash',
    'Fridge, freezer, or microwave',
    'Shower curtain',
    'Bathtub/shower',
    'Excessive mold build-up',
    'Toilet',
    'Dirty bathroom tile, rugs, or towels'
];

export const AUTO_FAILURE_DEMERITS = [
    'HAZMAT',
    'Unsecured wall locker or keys',
    'Unsecured valuables or uniforms',
    'Unsecured prescription medications',
    'Unsecured Tobacco',
    'Unsecured perishable food',
    'Contraband',
    'Safety items/open window',
    'To-go container/pizza box'
];

export const INSPECTOR_NAMES = [
    'Hoskins',
    'Troope',
    'Smith',
    'Cherry',
    'Avila',
    'Young',
    'Grier'
];

export const ROOM_RANGES = {
    floor2: { start: 201, end: 299 },
    floor3: { start: 301, end: 399 }
};

export const SCORE_THRESHOLDS = {
    OUTSTANDING: 0,
    PASSED_MAX: 3,
    FAILED_MIN: 4
};
```

**src/config/settings.js:**
```javascript
export const DEFAULT_SETTINGS = {
    theme: 'dark',
    hapticFeedback: true,
    zoomLevel: 100,
    customColors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#ec4899',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
    },
    activePreset: 'default',
    tutorialCompleted: false,
    viewMode: 'card',
    density: 'comfortable',
    borderRadius: 12,
    animationSpeed: 'normal',
    shadowIntensity: 'normal',
    showFields: {
        roomNumber: true,
        shift: true,
        gender: true,
        date: true,
        inspector: true,
        score: true,
        violations: true,
        notes: true
    }
};
```

---

## Code Examples

### Service Layer Example

**src/services/firebaseService.js:**
```javascript
import { firebaseConfig } from '../config/firebase.js';

class FirebaseService {
    constructor() {
        this.db = null;
        this.isConnected = false;
    }

    async initialize() {
        try {
            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            this.db = firebase.firestore();
            this.isConnected = true;

            console.log('Firebase initialized successfully');
            return true;
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.isConnected = false;
            return false;
        }
    }

    async saveInspection(inspection) {
        if (!this.isConnected) {
            throw new Error('Firebase not connected');
        }

        try {
            const docRef = await this.db.collection('inspections').add({
                ...inspection,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error saving inspection:', error);
            throw error;
        }
    }

    async getInspections() {
        if (!this.isConnected) {
            throw new Error('Firebase not connected');
        }

        try {
            const snapshot = await this.db.collection('inspections')
                .orderBy('timestamp', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching inspections:', error);
            throw error;
        }
    }

    async updateInspection(id, data) {
        if (!this.isConnected) {
            throw new Error('Firebase not connected');
        }

        try {
            await this.db.collection('inspections').doc(id).update(data);
        } catch (error) {
            console.error('Error updating inspection:', error);
            throw error;
        }
    }

    async deleteInspection(id) {
        if (!this.isConnected) {
            throw new Error('Firebase not connected');
        }

        try {
            await this.db.collection('inspections').doc(id).delete();
        } catch (error) {
            console.error('Error deleting inspection:', error);
            throw error;
        }
    }
}

export default new FirebaseService();
```

**src/services/storageService.js:**
```javascript
class StorageService {
    constructor(storageKey = 'dormInspector') {
        this.storageKey = storageKey;
    }

    save(key, data) {
        try {
            const stored = this.getAll();
            stored[key] = data;
            localStorage.setItem(this.storageKey, JSON.stringify(stored));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    get(key, defaultValue = null) {
        try {
            const stored = this.getAll();
            return stored[key] !== undefined ? stored[key] : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }

    getAll() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error parsing localStorage:', error);
            return {};
        }
    }

    remove(key) {
        try {
            const stored = this.getAll();
            delete stored[key];
            localStorage.setItem(this.storageKey, JSON.stringify(stored));
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }

    clear() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
}

export default new StorageService();
```

**src/services/voiceService.js:**
```javascript
import { DEMERITS, AUTO_FAILURE_DEMERITS } from '../config/constants.js';

class VoiceService {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.onTranscript = null;
        this.onMatch = null;
        this.onError = null;
    }

    initialize() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported');
            return false;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('')
                .toLowerCase();

            if (this.onTranscript) {
                this.onTranscript(transcript);
            }

            const matches = this.matchTranscriptToDemerits(transcript);
            if (matches.length > 0 && this.onMatch) {
                matches.forEach(match => this.onMatch(match));
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (this.onError) {
                this.onError(event.error);
            }
            this.stop();
        };

        this.recognition.onend = () => {
            if (this.isListening) {
                this.recognition.start();
            }
        };

        return true;
    }

    start() {
        if (!this.recognition) {
            if (!this.initialize()) {
                return false;
            }
        }

        try {
            this.recognition.start();
            this.isListening = true;
            return true;
        } catch (error) {
            console.error('Error starting voice recognition:', error);
            return false;
        }
    }

    stop() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.isListening = false;
    }

    toggle() {
        if (this.isListening) {
            this.stop();
        } else {
            this.start();
        }
        return this.isListening;
    }

    matchTranscriptToDemerits(transcript) {
        const demeritKeywords = this.buildKeywordMap();
        const matches = [];

        for (const [keyword, demeritName] of Object.entries(demeritKeywords)) {
            if (transcript.includes(keyword)) {
                matches.push(demeritName);
            }
        }

        return matches;
    }

    buildKeywordMap() {
        return {
            // Regular demerits
            'bed': 'Bed not made or missing 341',
            '341': 'Bed not made or missing 341',
            'mirror': 'Mirror',
            'vanity': 'Vanity/Sink',
            'sink': 'Vanity/Sink',
            'tile': 'Dirty tile or Carpet',
            'carpet': 'Dirty tile or Carpet',
            'dirty': 'Dirty tile or Carpet',
            'odor': 'Foul odor',
            'smell': 'Foul odor',
            'foul': 'Foul odor',
            'dust': 'High dust or excessive clutter',
            'clutter': 'High dust or excessive clutter',
            'trash': 'Trash',
            'garbage': 'Trash',
            'fridge': 'Fridge, freezer, or microwave',
            'freezer': 'Fridge, freezer, or microwave',
            'microwave': 'Fridge, freezer, or microwave',
            'shower curtain': 'Shower curtain',
            'curtain': 'Shower curtain',
            'bathtub': 'Bathtub/shower',
            'tub': 'Bathtub/shower',
            'shower': 'Bathtub/shower',
            'mold': 'Excessive mold build-up',
            'toilet': 'Toilet',
            'bathroom tile': 'Dirty bathroom tile, rugs, or towels',
            'rugs': 'Dirty bathroom tile, rugs, or towels',
            'towels': 'Dirty bathroom tile, rugs, or towels',
            // Auto-failure demerits
            'hazmat': 'HAZMAT',
            'locker': 'Unsecured wall locker or keys',
            'keys': 'Unsecured wall locker or keys',
            'valuables': 'Unsecured valuables or uniforms',
            'uniforms': 'Unsecured valuables or uniforms',
            'medication': 'Unsecured prescription medications',
            'tobacco': 'Unsecured Tobacco',
            'cigarettes': 'Unsecured Tobacco',
            'perishable': 'Unsecured perishable food',
            'contraband': 'Contraband',
            'window': 'Safety items/open window',
            'pizza': 'To-go container/pizza box'
        };
    }
}

export default new VoiceService();
```

### Utility Functions Example

**src/utils/scoringUtils.js:**
```javascript
import { SCORE_THRESHOLDS } from '../config/constants.js';

export function calculateScore(regularDemerits = [], autoFailureDemerits = []) {
    const regularPoints = regularDemerits.length * 1;
    const autoFailurePoints = autoFailureDemerits.length * 4;
    return regularPoints + autoFailurePoints;
}

export function getStatus(score) {
    if (score === SCORE_THRESHOLDS.OUTSTANDING) {
        return 'OUTSTANDING';
    } else if (score <= SCORE_THRESHOLDS.PASSED_MAX) {
        return 'PASSED';
    } else {
        return 'FAILED';
    }
}

export function getStatusColor(status) {
    const colors = {
        'OUTSTANDING': '#3b82f6',
        'PASSED': '#10b981',
        'FAILED': '#ef4444'
    };
    return colors[status] || '#94a3b8';
}

export function getStatusClass(status) {
    return status.toLowerCase();
}
```

**src/utils/dateUtils.js:**
```javascript
export function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

export function formatTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function formatDateTime(date) {
    return `${formatDate(date)} ${formatTime(date)}`;
}

export function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

export function getDateRange(type) {
    const end = new Date();
    const start = new Date();

    switch (type) {
        case 'week':
            start.setDate(end.getDate() - 7);
            break;
        case 'month':
            start.setDate(end.getDate() - 30);
            break;
        case 'all':
            start.setFullYear(2000);
            break;
        default:
            return { start: null, end: null };
    }

    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
    };
}
```

**src/utils/validators.js:**
```javascript
export function validateRoomNumber(roomNumber) {
    const num = parseInt(roomNumber);
    return (num >= 201 && num <= 299) || (num >= 301 && num <= 399);
}

export function validateInspection(inspection) {
    const errors = [];

    if (!inspection.roomNumber) {
        errors.push('Room number is required');
    } else if (!validateRoomNumber(inspection.roomNumber)) {
        errors.push('Invalid room number');
    }

    if (!inspection.inspectorName) {
        errors.push('Inspector name is required');
    }

    if (!inspection.inspectionDate) {
        errors.push('Inspection date is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

export function sanitizeInput(input) {
    if (typeof input !== 'string') return input;

    // Basic XSS prevention
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}
```

### Component Example

**src/components/DemeritGrid.js:**
```javascript
import { DEMERITS, AUTO_FAILURE_DEMERITS } from '../config/constants.js';

export class DemeritGrid {
    constructor(container) {
        this.container = container;
        this.selectedDemerits = new Set();
        this.selectedAutoFailures = new Set();
        this.onChange = null;
    }

    render() {
        this.container.innerHTML = `
            <div class="demerits-section">
                <h3>Regular Demerits (1 point each)</h3>
                <div id="regular-demerits" class="demerits-grid"></div>
            </div>
            <div class="demerits-section">
                <h3>Auto-Failure Demerits (4 points each)</h3>
                <div id="auto-failure-demerits" class="demerits-grid"></div>
            </div>
        `;

        this.renderDemerits();
    }

    renderDemerits() {
        const regularContainer = this.container.querySelector('#regular-demerits');
        const autoContainer = this.container.querySelector('#auto-failure-demerits');

        regularContainer.innerHTML = '';
        autoContainer.innerHTML = '';

        DEMERITS.forEach((demerit, index) => {
            const item = this.createDemeritItem(demerit, index, 'regular');
            regularContainer.appendChild(item);
        });

        AUTO_FAILURE_DEMERITS.forEach((demerit, index) => {
            const item = this.createDemeritItem(demerit, index, 'auto-failure');
            autoContainer.appendChild(item);
        });
    }

    createDemeritItem(text, index, type) {
        const item = document.createElement('div');
        item.className = `demerit-item ${type === 'auto-failure' ? 'auto-failure' : ''}`;
        item.setAttribute('data-index', index);
        item.setAttribute('data-type', type);

        item.innerHTML = `
            <div class="demerit-checkbox"></div>
            <div class="demerit-text">${text}</div>
        `;

        item.addEventListener('click', () => {
            this.toggleDemerit(text, type, item);
        });

        return item;
    }

    toggleDemerit(demerit, type, element) {
        element.classList.toggle('checked');

        if (type === 'auto-failure') {
            if (this.selectedAutoFailures.has(demerit)) {
                this.selectedAutoFailures.delete(demerit);
            } else {
                this.selectedAutoFailures.add(demerit);
            }
        } else {
            if (this.selectedDemerits.has(demerit)) {
                this.selectedDemerits.delete(demerit);
            } else {
                this.selectedDemerits.add(demerit);
            }
        }

        if (this.onChange) {
            this.onChange({
                regular: Array.from(this.selectedDemerits),
                autoFailure: Array.from(this.selectedAutoFailures)
            });
        }
    }

    selectDemerit(demeritName) {
        const items = this.container.querySelectorAll('.demerit-item');
        items.forEach(item => {
            const text = item.querySelector('.demerit-text');
            if (text && text.textContent.trim() === demeritName) {
                if (!item.classList.contains('checked')) {
                    item.click();
                }
            }
        });
    }

    getSelected() {
        return {
            regular: Array.from(this.selectedDemerits),
            autoFailure: Array.from(this.selectedAutoFailures)
        };
    }

    reset() {
        this.selectedDemerits.clear();
        this.selectedAutoFailures.clear();
        const items = this.container.querySelectorAll('.demerit-item');
        items.forEach(item => item.classList.remove('checked'));

        if (this.onChange) {
            this.onChange({ regular: [], autoFailure: [] });
        }
    }
}
```

### State Management Example

**src/state/store.js:**
```javascript
class Store {
    constructor() {
        this.state = {
            inspections: [],
            settings: null,
            activeTab: 'inspect',
            editingInspection: null,
            inspectionLists: [],
            activeListId: null,
            isLoading: false
        };

        this.listeners = new Map();
    }

    getState() {
        return { ...this.state };
    }

    setState(updates) {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...updates };

        // Notify listeners
        Object.keys(updates).forEach(key => {
            if (this.listeners.has(key)) {
                this.listeners.get(key).forEach(callback => {
                    callback(this.state[key], prevState[key]);
                });
            }
        });
    }

    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);

        // Return unsubscribe function
        return () => {
            this.listeners.get(key).delete(callback);
        };
    }

    // Specific getters
    getInspections() {
        return [...this.state.inspections];
    }

    getSettings() {
        return { ...this.state.settings };
    }

    // Specific setters
    setInspections(inspections) {
        this.setState({ inspections });
    }

    addInspection(inspection) {
        this.setState({
            inspections: [...this.state.inspections, inspection]
        });
    }

    updateInspection(id, updates) {
        this.setState({
            inspections: this.state.inspections.map(insp =>
                insp.id === id ? { ...insp, ...updates } : insp
            )
        });
    }

    deleteInspection(id) {
        this.setState({
            inspections: this.state.inspections.filter(insp => insp.id !== id)
        });
    }

    setSettings(settings) {
        this.setState({ settings });
    }

    updateSettings(updates) {
        this.setState({
            settings: { ...this.state.settings, ...updates }
        });
    }
}

export default new Store();
```

### Main Application Entry Point

**src/main.js:**
```javascript
import './styles/main.css';
import firebaseService from './services/firebaseService.js';
import storageService from './services/storageService.js';
import voiceService from './services/voiceService.js';
import store from './state/store.js';
import { DEFAULT_SETTINGS } from './config/settings.js';
import { DemeritGrid } from './components/DemeritGrid.js';
// Import other components...

class App {
    constructor() {
        this.initialized = false;
    }

    async init() {
        try {
            // Load settings from storage
            const settings = storageService.get('settings', DEFAULT_SETTINGS);
            store.setSettings(settings);

            // Initialize Firebase
            await firebaseService.initialize();

            // Load inspections
            const inspections = await firebaseService.getInspections();
            store.setInspections(inspections);

            // Initialize voice service
            voiceService.initialize();
            voiceService.onMatch = (demeritName) => {
                this.handleVoiceMatch(demeritName);
            };

            // Setup UI
            this.setupUI();

            // Subscribe to state changes
            this.setupStateSubscriptions();

            this.initialized = true;
            console.log('App initialized successfully');
        } catch (error) {
            console.error('App initialization failed:', error);
        }
    }

    setupUI() {
        // Create main layout
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="app-container">
                <header class="header">
                    <h1>Dorm Inspector</h1>
                </header>
                <main class="main-content">
                    <div id="inspect-section"></div>
                </main>
            </div>
        `;

        // Initialize components
        const demeritContainer = document.getElementById('demerits-container');
        this.demeritGrid = new DemeritGrid(demeritContainer);
        this.demeritGrid.render();
        this.demeritGrid.onChange = (demerits) => {
            this.handleDemeritChange(demerits);
        };
    }

    setupStateSubscriptions() {
        store.subscribe('inspections', (inspections) => {
            this.updateInspectionsList(inspections);
        });

        store.subscribe('settings', (settings) => {
            this.applySettings(settings);
        });
    }

    handleVoiceMatch(demeritName) {
        if (this.demeritGrid) {
            this.demeritGrid.selectDemerit(demeritName);
        }
    }

    handleDemeritChange(demerits) {
        // Update score display, etc.
        console.log('Demerits changed:', demerits);
    }

    updateInspectionsList(inspections) {
        // Re-render inspections list
        console.log('Inspections updated:', inspections.length);
    }

    applySettings(settings) {
        // Apply theme, etc.
        document.documentElement.setAttribute('data-theme', settings.theme);
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new App();
        app.init();
    });
} else {
    const app = new App();
    app.init();
}
```

---

## Build Setup

### Package.json

```json
{
  "name": "dorm-inspector",
  "version": "2.0.0",
  "description": "Dormitory inspection management system",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "eslint": "^8.0.0"
  },
  "dependencies": {
    "firebase": "^9.23.0",
    "xlsx": "^0.18.5"
  }
}
```

### ESLint Configuration

**.eslintrc.json:**
```json
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "no-unused-vars": "warn",
    "no-console": "off",
    "semi": ["error", "always"],
    "quotes": ["error", "single"]
  }
}
```

---

## Testing Strategy

### Unit Test Example

**tests/utils/scoringUtils.test.js:**
```javascript
import { describe, it, expect } from 'vitest';
import { calculateScore, getStatus } from '../src/utils/scoringUtils.js';

describe('scoringUtils', () => {
    describe('calculateScore', () => {
        it('should calculate score correctly with no demerits', () => {
            expect(calculateScore([], [])).toBe(0);
        });

        it('should calculate score with regular demerits', () => {
            expect(calculateScore(['Bed', 'Mirror'], [])).toBe(2);
        });

        it('should calculate score with auto-failure demerits', () => {
            expect(calculateScore([], ['HAZMAT'])).toBe(4);
        });

        it('should calculate score with both types', () => {
            expect(calculateScore(['Bed', 'Mirror'], ['HAZMAT'])).toBe(6);
        });
    });

    describe('getStatus', () => {
        it('should return OUTSTANDING for 0 points', () => {
            expect(getStatus(0)).toBe('OUTSTANDING');
        });

        it('should return PASSED for 1-3 points', () => {
            expect(getStatus(1)).toBe('PASSED');
            expect(getStatus(3)).toBe('PASSED');
        });

        it('should return FAILED for 4+ points', () => {
            expect(getStatus(4)).toBe('FAILED');
            expect(getStatus(10)).toBe('FAILED');
        });
    });
});
```

---

## Deployment

### Build for Production

```bash
# Build optimized production bundle
npm run build

# Output will be in /dist folder
# Upload contents of /dist to your web server
```

### Environment Variables

**Create .env file:**
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
# etc...
```

**Update firebase.js to use env vars:**
```javascript
export const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    // ...
};
```

---

## Migration Checklist

### Phase 1: Setup
- [ ] Create new project directory
- [ ] Initialize npm project
- [ ] Install Vite and dependencies
- [ ] Create folder structure
- [ ] Setup build configuration
- [ ] Create minimal HTML entry point

### Phase 2: Extract Configuration
- [ ] Extract firebase.js
- [ ] Extract constants.js
- [ ] Extract settings.js
- [ ] Test imports work correctly

### Phase 3: Create Services
- [ ] Create FirebaseService
- [ ] Create StorageService
- [ ] Create VoiceService
- [ ] Create ExportService
- [ ] Test each service independently

### Phase 4: Create Utilities
- [ ] Create scoringUtils.js
- [ ] Create dateUtils.js
- [ ] Create validators.js
- [ ] Create domUtils.js
- [ ] Add unit tests for utilities

### Phase 5: Create Components
- [ ] Create DemeritGrid component
- [ ] Create InspectionForm component
- [ ] Create InspectionList component
- [ ] Create ScoreDisplay component
- [ ] Create ReportCharts component
- [ ] Wire up components

### Phase 6: State Management
- [ ] Create Store
- [ ] Migrate global variables to store
- [ ] Setup subscriptions
- [ ] Test state updates

### Phase 7: Extract Styles
- [ ] Extract main.css
- [ ] Extract variables.css
- [ ] Extract component styles
- [ ] Extract theme styles

### Phase 8: Testing & Polish
- [ ] Add unit tests
- [ ] Test all features
- [ ] Fix bugs
- [ ] Optimize performance
- [ ] Update documentation

---

## Benefits After Modularization

### Developer Experience
✅ Easier to find and modify code
✅ Better IDE autocomplete and type hints
✅ Faster development iterations
✅ Easier onboarding for new developers

### Code Quality
✅ Testable units
✅ Less duplication
✅ Better separation of concerns
✅ Easier to refactor

### Performance
✅ Code splitting (load only what's needed)
✅ Tree shaking (remove unused code)
✅ Smaller initial bundle
✅ Faster page loads

### Maintainability
✅ Isolated changes
✅ Easier debugging
✅ Better version control
✅ Fewer merge conflicts

---

## Next Steps

1. **Review this guide** and decide on migration approach
2. **Create a new branch** for the modularization work
3. **Start with Phase 1** (setup and configuration)
4. **Migrate incrementally** - don't try to do everything at once
5. **Test frequently** - ensure features still work after each phase
6. **Get feedback** - share progress and get input
7. **Document** - keep track of what's been migrated

---

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [ES6 Modules Guide](https://javascript.info/modules)
- [Firebase Web SDK](https://firebase.google.com/docs/web/setup)
- [Vitest Testing Framework](https://vitest.dev/)
- [Modern JavaScript](https://javascript.info/)

---

**Need Help?** This is a significant refactoring project. Start small, test often, and don't hesitate to ask questions!
