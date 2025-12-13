# Quick Start: Modularization Example

This is a practical example showing how to extract ONE piece of functionality from the monolithic `index.html` into a modular structure. Use this as a starting point.

## Example: Extracting the Scoring Logic

### Step 1: Create Project Structure

```bash
mkdir -p modular-demo/src/{utils,config}
cd modular-demo
npm init -y
npm install --save-dev vite
```

### Step 2: Create the Files

**File: src/config/constants.js**
```javascript
export const SCORE_THRESHOLDS = {
    OUTSTANDING: 0,
    PASSED_MAX: 3,
    FAILED_MIN: 4
};

export const POINTS = {
    REGULAR_DEMERIT: 1,
    AUTO_FAILURE: 4
};
```

**File: src/utils/scoringUtils.js**
```javascript
import { SCORE_THRESHOLDS, POINTS } from '../config/constants.js';

export function calculateScore(regularDemerits = [], autoFailureDemerits = []) {
    const regularPoints = regularDemerits.length * POINTS.REGULAR_DEMERIT;
    const autoFailurePoints = autoFailureDemerits.length * POINTS.AUTO_FAILURE;
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

// NEW: This was scattered throughout the code before
export function calculateInspectionResult(regularDemerits, autoFailureDemerits) {
    const score = calculateScore(regularDemerits, autoFailureDemerits);
    const status = getStatus(score);
    const color = getStatusColor(status);

    return {
        score,
        status,
        color,
        isPassing: status !== 'FAILED'
    };
}
```

**File: src/main.js**
```javascript
import { calculateInspectionResult } from './utils/scoringUtils.js';

// Example usage
const result = calculateInspectionResult(
    ['Bed', 'Mirror'],  // Regular demerits
    ['HAZMAT']          // Auto-failure demerits
);

console.log('Score:', result.score);        // 6
console.log('Status:', result.status);      // FAILED
console.log('Color:', result.color);        // #ef4444
console.log('Passing:', result.isPassing);  // false

// Use in the UI
document.getElementById('score').textContent = result.score;
document.getElementById('status').textContent = result.status;
document.getElementById('status').style.color = result.color;
```

**File: public/index.html**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Scoring Demo</title>
</head>
<body>
    <h1>Inspection Score</h1>
    <div>
        Score: <span id="score">-</span>
    </div>
    <div>
        Status: <span id="status">-</span>
    </div>

    <script type="module" src="/src/main.js"></script>
</body>
</html>
```

**File: vite.config.js**
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  build: {
    outDir: '../dist',
  },
});
```

**File: package.json**
```json
{
  "name": "dorm-inspector-modular",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

### Step 3: Run It

```bash
npm run dev
```

Open http://localhost:5173 and you'll see the modular code working!

## What We Gained

### Before (Monolithic)
```javascript
// In the huge index.html file, scoring logic was scattered:

// Line 2500: Constants mixed with other code
const OUTSTANDING = 0;

// Line 3100: Score calculation in one function
function updateScore() {
    let score = 0;
    document.querySelectorAll('.demerit-item.checked').forEach(item => {
        if (item.dataset.type === 'auto-failure') {
            score += 4;
        } else {
            score += 1;
        }
    });
    // ... more code ...
}

// Line 3800: Status logic in another function
function getStatus(score) {
    if (score === 0) return 'OUTSTANDING';
    if (score <= 3) return 'PASSED';
    return 'FAILED';
}

// Line 4200: Colors in yet another place
function renderInspection(inspection) {
    const color = inspection.status === 'OUTSTANDING' ? '#3b82f6' :
                  inspection.status === 'PASSED' ? '#10b981' : '#ef4444';
    // ...
}
```

### After (Modular)
```javascript
// Clean import
import { calculateInspectionResult } from './utils/scoringUtils.js';

// Single function call
const result = calculateInspectionResult(regular, autoFailure);

// Everything you need
result.score      // The score
result.status     // The status
result.color      // The color
result.isPassing  // Boolean helper
```

## Benefits You Get Immediately

1. **Testable**: Can test scoring logic independently
2. **Reusable**: Import from anywhere in the app
3. **Maintainable**: One place to update scoring rules
4. **Type-safe**: Easy to add TypeScript later
5. **Tree-shakeable**: Unused code is removed in production

## Test It

**File: src/utils/scoringUtils.test.js**
```javascript
import { describe, it, expect } from 'vitest';
import { calculateInspectionResult } from './scoringUtils.js';

describe('Scoring', () => {
    it('calculates outstanding correctly', () => {
        const result = calculateInspectionResult([], []);
        expect(result.score).toBe(0);
        expect(result.status).toBe('OUTSTANDING');
        expect(result.isPassing).toBe(true);
    });

    it('calculates failure correctly', () => {
        const result = calculateInspectionResult(['Bed'], ['HAZMAT']);
        expect(result.score).toBe(5);
        expect(result.status).toBe('FAILED');
        expect(result.isPassing).toBe(false);
    });
});
```

Run tests: `npm test`

## Next Steps

1. **Extract Firebase service** - Move all Firebase code to `services/firebaseService.js`
2. **Extract Voice service** - Move voice recognition to `services/voiceService.js`
3. **Extract Components** - Move UI components to `components/`
4. **Gradually migrate** - One piece at a time

## Common Questions

**Q: Can I use this alongside the old code?**
A: Yes! You can run both in parallel during migration. Import the new modules in the old `index.html` using `<script type="module">`.

**Q: What if I need to access global variables?**
A: Create a state management module (see `store.js` in the main guide) and migrate globals one by one.

**Q: How do I handle dependencies?**
A: Use ES6 imports. Vite will bundle everything automatically.

**Q: What about CSS?**
A: You can `import './styles.css'` directly in JavaScript files. Vite handles it.

## Real Migration Example

Here's how you'd migrate the `updateScore()` function from the old code:

**Old code (lines 3080-3130 in index.html):**
```javascript
function updateScore() {
    let score = 0;
    const regularDemerits = [];
    const autoFailureDemerits = [];

    document.querySelectorAll('.demerit-item.checked[data-type="regular"]').forEach(item => {
        const text = item.querySelector('.demerit-text').textContent;
        regularDemerits.push(text);
        score += 1;
    });

    document.querySelectorAll('.demerit-item.checked[data-type="auto-failure"]').forEach(item => {
        const text = item.querySelector('.demerit-text').textContent;
        autoFailureDemerits.push(text);
        score += 4;
    });

    let status = 'FAILED';
    if (score === 0) status = 'OUTSTANDING';
    else if (score <= 3) status = 'PASSED';

    document.getElementById('score-number').textContent = score;
    document.getElementById('status-text').textContent = status;

    // Update colors...
}
```

**New code (using modules):**
```javascript
import { calculateInspectionResult } from './utils/scoringUtils.js';

function updateScore() {
    // Get selected demerits (DOM logic stays here)
    const regularDemerits = Array.from(
        document.querySelectorAll('.demerit-item.checked[data-type="regular"]')
    ).map(item => item.querySelector('.demerit-text').textContent);

    const autoFailureDemerits = Array.from(
        document.querySelectorAll('.demerit-item.checked[data-type="auto-failure"]')
    ).map(item => item.querySelector('.demerit-text').textContent);

    // Use the module (business logic is extracted)
    const result = calculateInspectionResult(regularDemerits, autoFailureDemerits);

    // Update UI (DOM logic stays here)
    document.getElementById('score-number').textContent = result.score;
    document.getElementById('status-text').textContent = result.status;
    document.getElementById('status-text').style.color = result.color;
}
```

**What improved:**
- ✅ Scoring logic is now testable
- ✅ Can reuse scoring logic elsewhere
- ✅ Easier to modify scoring rules
- ✅ Clearer separation of concerns (DOM vs logic)

---

This example shows the PATTERN. Apply it to each piece of functionality, one at a time!
