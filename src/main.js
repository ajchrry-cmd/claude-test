// Import styles
import './styles/main.css';

// Import services
import firebaseService from './services/firebaseService.js';
import storageService from './services/storageService.js';
import voiceService from './services/voiceService.js';

// Import utilities
import { getTodayString } from './utils/dateUtils.js';
import { validateInspection } from './utils/validators.js';
import { vibrate } from './utils/domUtils.js';

// Import components
import { DemeritGrid } from './components/DemeritGrid.js';
import { ScoreDisplay } from './components/ScoreDisplay.js';

// Import configuration
import { INSPECTOR_NAMES, ROOM_RANGES } from './config/constants.js';
import { DEFAULT_SETTINGS } from './config/settings.js';

// Import state
import store from './state/store.js';

class DormInspectorApp {
    constructor() {
        this.demeritGrid = null;
        this.scoreDisplay = null;
        this.initialized = false;
    }

    async init() {
        console.log('🚀 Initializing Dorm Inspector (Modular)...');

        try {
            // Load settings from storage
            const savedSettings = storageService.get('settings', DEFAULT_SETTINGS);
            store.setSettings(savedSettings);

            // Apply theme
            this.applyTheme(savedSettings.theme);

            // Initialize Firebase
            const firebaseConnected = await firebaseService.initialize();
            store.setConnected(firebaseConnected);

            if (firebaseConnected) {
                // Load data from Firebase
                await this.loadData();
            } else {
                console.warn('Running in offline mode');
            }

            // Initialize voice service
            voiceService.initialize();
            voiceService.onMatch = (demeritName) => {
                if (this.demeritGrid) {
                    this.demeritGrid.selectDemerit(demeritName);
                }
            };

            voiceService.onTranscript = (transcript) => {
                const feedbackEl = document.getElementById('voice-transcript');
                if (feedbackEl) {
                    feedbackEl.textContent = transcript;
                }
            };

            voiceService.onStateChange = (isListening) => {
                const voiceBtn = document.getElementById('voice-btn');
                if (voiceBtn) {
                    voiceBtn.classList.toggle('listening', isListening);
                    voiceBtn.textContent = isListening ? '🔴' : '🎤';
                }

                const feedbackEl = document.getElementById('voice-feedback');
                if (feedbackEl) {
                    feedbackEl.style.display = isListening ? 'block' : 'none';
                }
            };

            // Build UI
            this.buildUI();

            // Setup event listeners
            this.setupEventListeners();

            // Subscribe to state changes
            this.setupStateSubscriptions();

            this.initialized = true;
            console.log('✅ Dorm Inspector initialized successfully!');
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.showError('Failed to initialize application');
        }
    }

    async loadData() {
        try {
            const inspections = await firebaseService.getInspections();
            store.setInspections(inspections);

            const lists = await firebaseService.getInspectionLists();
            store.setInspectionLists(lists);

            console.log(`Loaded ${inspections.length} inspections and ${lists.length} lists`);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    buildUI() {
        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="app-container">
                <!-- Header -->
                <header class="header">
                    <div class="header-content">
                        <h1 class="header-title">🏠 Dorm Inspector</h1>
                        <div style="color: white; font-size: 14px;" id="connection-status">
                            ${store.state.isConnected ? '🟢 Connected' : '🔴 Offline'}
                        </div>
                    </div>
                </header>

                <!-- Main Content -->
                <main class="main-content">
                    <!-- Navigation Tabs -->
                    <div class="nav-tabs">
                        <button class="nav-tab active" data-tab="inspect">🔍 Inspect</button>
                        <button class="nav-tab" data-tab="history">📋 History</button>
                        <button class="nav-tab" data-tab="lists">📅 Lists</button>
                    </div>

                    <!-- Inspect Section -->
                    <div id="inspect-section" class="section active">
                        <div class="card">
                            <!-- Form -->
                            <div class="form-group">
                                <label class="form-label">Room Number</label>
                                <select id="room-number" class="form-select">
                                    <option value="">Select Room Number</option>
                                    ${this.generateRoomOptions()}
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Inspector Name</label>
                                <select id="inspector-name" class="form-select">
                                    <option value="">Select Inspector</option>
                                    ${INSPECTOR_NAMES.map(name => `<option value="${name}">${name}</option>`).join('')}
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Inspection Date</label>
                                <input type="date" id="inspection-date" class="form-input" value="${getTodayString()}">
                            </div>

                            <!-- Score Display -->
                            <div id="score-container"></div>

                            <!-- Demerits -->
                            <div id="demerits-container"></div>

                            <!-- Actions -->
                            <div style="display: flex; gap: 12px; margin-top: 24px;">
                                <button id="submit-btn" class="btn btn-primary">💾 Save Inspection</button>
                                <button id="reset-btn" class="btn btn-secondary">🔄 Reset</button>
                            </div>
                        </div>
                    </div>

                    <!-- History Section -->
                    <div id="history-section" class="section">
                        <div class="card">
                            <h2 style="margin-bottom: 16px;">Recent Inspections</h2>
                            <div id="inspections-list">
                                ${this.renderInspectionsList()}
                            </div>
                        </div>
                    </div>

                    <!-- Lists Section -->
                    <div id="lists-section" class="section">
                        <div class="card">
                            <h2>Inspection Lists</h2>
                            <p style="color: var(--text-muted); margin-top: 12px;">
                                List management features coming soon...
                            </p>
                        </div>
                    </div>
                </main>

                <!-- Voice Control -->
                <div class="voice-control">
                    <button id="voice-btn" class="voice-btn">🎤</button>
                </div>

                <div id="voice-feedback" class="voice-feedback" style="display: none;">
                    <div style="font-weight: 600; margin-bottom: 8px;">Listening...</div>
                    <div id="voice-transcript" class="voice-transcript">Say a demerit name...</div>
                </div>
            </div>
        `;

        // Initialize components
        const demeritsContainer = document.getElementById('demerits-container');
        this.demeritGrid = new DemeritGrid(demeritsContainer);
        this.demeritGrid.render();
        this.demeritGrid.onChange = (demerits) => {
            this.handleDemeritChange(demerits);
        };

        const scoreContainer = document.getElementById('score-container');
        this.scoreDisplay = new ScoreDisplay(scoreContainer);
        this.scoreDisplay.render();
    }

    generateRoomOptions() {
        let options = '';
        for (let i = ROOM_RANGES.floor2.start; i <= ROOM_RANGES.floor2.end; i++) {
            options += `<option value="${i}">Room ${i}</option>`;
        }
        for (let i = ROOM_RANGES.floor3.start; i <= ROOM_RANGES.floor3.end; i++) {
            options += `<option value="${i}">Room ${i}</option>`;
        }
        return options;
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Submit button
        document.getElementById('submit-btn').addEventListener('click', () => {
            this.saveInspection();
        });

        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetForm();
        });

        // Voice button
        document.getElementById('voice-btn').addEventListener('click', () => {
            voiceService.toggle();
        });
    }

    setupStateSubscriptions() {
        // Update inspections list when inspections change
        store.subscribe('inspections', () => {
            const listEl = document.getElementById('inspections-list');
            if (listEl) {
                listEl.innerHTML = this.renderInspectionsList();
            }
        });

        // Update connection status
        store.subscribe('isConnected', (isConnected) => {
            const statusEl = document.getElementById('connection-status');
            if (statusEl) {
                statusEl.textContent = isConnected ? '🟢 Connected' : '🔴 Offline';
            }
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
        });

        // Update sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        const activeSection = document.getElementById(`${tabName}-section`);
        if (activeSection) {
            activeSection.classList.add('active');
        }

        store.setActiveTab(tabName);
    }

    handleDemeritChange(demerits) {
        this.scoreDisplay.update(demerits.regular, demerits.autoFailure);
    }

    async saveInspection() {
        const roomNumber = document.getElementById('room-number').value;
        const inspectorName = document.getElementById('inspector-name').value;
        const inspectionDate = document.getElementById('inspection-date').value;
        const demerits = this.demeritGrid.getSelected();
        const score = this.scoreDisplay.getResult();

        const inspection = {
            roomNumber,
            inspectorName,
            inspectionDate,
            demerits: demerits.regular,
            autoFailureDemerits: demerits.autoFailure,
            score: score.score,
            status: score.status,
            timestamp: new Date().toISOString()
        };

        // Validate
        const validation = validateInspection(inspection);
        if (!validation.isValid) {
            alert('Please fill in all required fields:\n' + validation.errors.join('\n'));
            return;
        }

        try {
            // Save to Firebase if connected
            if (store.state.isConnected) {
                const id = await firebaseService.saveInspection(inspection);
                inspection.id = id;
            } else {
                inspection.id = Date.now().toString();
            }

            // Update store
            store.addInspection(inspection);

            // Save to local storage as backup
            const allInspections = store.getInspections();
            storageService.save('inspections', allInspections);

            // Success feedback
            const settings = store.getSettings();
            if (settings.hapticFeedback) {
                vibrate([50, 50, 100]);
            }

            alert(`✅ Inspection saved successfully!\n\nRoom: ${roomNumber}\nScore: ${score.score}\nStatus: ${score.status}`);

            // Reset form
            this.resetForm();

            // Switch to history tab
            this.switchTab('history');
        } catch (error) {
            console.error('Error saving inspection:', error);
            alert('❌ Error saving inspection. Please try again.');
        }
    }

    resetForm() {
        document.getElementById('room-number').value = '';
        document.getElementById('inspector-name').value = '';
        document.getElementById('inspection-date').value = getTodayString();

        if (this.demeritGrid) {
            this.demeritGrid.reset();
        }

        if (this.scoreDisplay) {
            this.scoreDisplay.update([], []);
        }
    }

    renderInspectionsList() {
        const inspections = store.getInspections();

        if (inspections.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <div>No inspections yet. Create your first inspection!</div>
                </div>
            `;
        }

        return inspections.map(inspection => `
            <div class="card" style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="font-size: 18px;">Room ${inspection.roomNumber}</strong>
                        <div style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">
                            ${inspection.inspectorName} • ${inspection.inspectionDate}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 24px; font-weight: 800;">${inspection.score} pts</div>
                        <div style="
                            display: inline-block;
                            padding: 4px 12px;
                            border-radius: 6px;
                            font-size: 12px;
                            font-weight: 700;
                            background: ${inspection.status === 'OUTSTANDING' ? '#3b82f6' :
                                        inspection.status === 'PASSED' ? '#10b981' : '#ef4444'};
                            color: white;
                        ">
                            ${inspection.status}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    showError(message) {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div>${message}</div>
            </div>
        `;
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new DormInspectorApp();
        app.init();
    });
} else {
    const app = new DormInspectorApp();
    app.init();
}
