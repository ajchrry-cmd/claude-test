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
import { InspectionCard } from './components/InspectionCard.js';
import { InspectionTable } from './components/InspectionTable.js';
import { EditInspectionModal } from './components/EditInspectionModal.js';
import { ReportsComponent } from './components/ReportsComponent.js';
import { SettingsPanel } from './components/SettingsPanel.js';
import { RoomGrid } from './components/RoomGrid.js';
import { AdminPanel } from './components/AdminPanel.js';

// Import services
import exportService from './services/exportService.js';

// Import configuration
import { INSPECTOR_NAMES, ROOM_RANGES } from './config/constants.js';
import { DEFAULT_SETTINGS } from './config/settings.js';

// Import state
import store from './state/store.js';

class DormInspectorApp {
    constructor() {
        this.demeritGrid = null;
        this.scoreDisplay = null;
        this.inspectionCard = new InspectionCard();
        this.inspectionTable = new InspectionTable();
        this.editModal = null;
        this.reportsComponent = null;
        this.settingsPanel = null;
        this.roomGrid = null;
        this.adminPanel = null;
        this.adminClickCount = 0;
        this.adminClickTimeout = null;
        this.viewMode = 'card'; // 'card', 'list', 'table'
        this.searchQuery = '';
        this.filterStatus = 'all';
        this.filterInspector = 'all';
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
                        <h1 class="header-title" id="header-title" style="cursor: pointer; user-select: none;" onclick="window.handleAdminClick()">🏠 Dorm Inspector</h1>
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <div style="color: white; font-size: 14px;" id="connection-status">
                                ${store.state.isConnected ? '🟢 Connected' : '🔴 Offline'}
                            </div>
                            <button id="settings-btn" class="btn btn-secondary btn-small" style="background: rgba(255,255,255,0.2); border: none; color: white;">
                                ⚙️ Settings
                            </button>
                        </div>
                    </div>
                </header>

                <!-- Main Content -->
                <main class="main-content">
                    <!-- Navigation Tabs -->
                    <div class="nav-tabs">
                        <button class="nav-tab active" data-tab="inspect">🔍 Inspect</button>
                        <button class="nav-tab" data-tab="history">📋 History</button>
                        <button class="nav-tab" data-tab="reports">📊 Reports</button>
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

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <div class="form-group">
                                    <label class="form-label">Shift</label>
                                    <select id="room-shift" class="form-select">
                                        <option value="">Select Shift</option>
                                        <option value="S">S - Swing</option>
                                        <option value="T">T - Day</option>
                                        <option value="R">R - Relief</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Gender</label>
                                    <select id="room-gender" class="form-select">
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Inspection Date</label>
                                <input type="date" id="inspection-date" class="form-input" value="${getTodayString()}">
                            </div>

                            <div class="form-group">
                                <label class="form-label">Notes (Optional)</label>
                                <textarea id="inspection-notes" class="form-input" rows="3" placeholder="Add any additional notes or observations about this inspection..."></textarea>
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
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
                                <h2 style="margin: 0;">Inspection History</h2>
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    <button id="export-excel-btn" class="btn btn-secondary btn-small" style="display: flex; align-items: center; gap: 6px;">
                                        📊 Export Excel
                                    </button>
                                    <div style="display: flex; gap: 4px; background: var(--surface-light); padding: 4px; border-radius: 8px;">
                                        <button class="view-mode-btn active" data-view="card" title="Card View">🎴</button>
                                        <button class="view-mode-btn" data-view="list" title="List View">📋</button>
                                        <button class="view-mode-btn" data-view="table" title="Table View">📊</button>
                                    </div>
                                </div>
                            </div>

                            <!-- Search and Filters -->
                            <div style="background: var(--surface-light); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                                    <div class="form-group" style="margin-bottom: 0;">
                                        <input type="text" id="search-input" class="form-input" placeholder="🔍 Search by room, inspector, or notes..." oninput="window.updateSearch()">
                                    </div>
                                    <div class="form-group" style="margin-bottom: 0;">
                                        <select id="filter-status" class="form-select" onchange="window.updateFilters()">
                                            <option value="all">All Status</option>
                                            <option value="OUTSTANDING">Outstanding</option>
                                            <option value="PASSED">Passed</option>
                                            <option value="FAILED">Failed</option>
                                        </select>
                                    </div>
                                    <div class="form-group" style="margin-bottom: 0;">
                                        <select id="filter-inspector" class="form-select" onchange="window.updateFilters()">
                                            <option value="all">All Inspectors</option>
                                            ${INSPECTOR_NAMES.map(name => `<option value="${name}">${name}</option>`).join('')}
                                        </select>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    <span style="font-size: 14px; color: var(--text-muted);" id="results-count"></span>
                                    <button class="btn btn-secondary btn-small" onclick="window.clearFilters()" style="margin-left: auto;">✕ Clear Filters</button>
                                </div>
                            </div>

                            <div id="inspections-list">
                                ${this.renderInspectionsList()}
                            </div>
                        </div>
                    </div>

                    <!-- Reports Section -->
                    <div id="reports-section" class="section">
                        <div id="reports-container"></div>
                    </div>

                    <!-- Lists Section -->
                    <div id="lists-section" class="section">
                        <div id="room-grid-container"></div>
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

                <!-- Settings Panel Container -->
                <div id="settings-container" style="display: none;"></div>

                <!-- Admin Panel Container -->
                <div id="admin-container" style="display: none;"></div>
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

        // Initialize reports component
        const reportsContainer = document.getElementById('reports-container');
        this.reportsComponent = new ReportsComponent(reportsContainer);
        this.reportsComponent.render();

        // Initialize settings panel
        const settingsContainer = document.getElementById('settings-container');
        this.settingsPanel = new SettingsPanel(settingsContainer);

        // Initialize room grid
        const roomGridContainer = document.getElementById('room-grid-container');
        this.roomGrid = new RoomGrid(roomGridContainer);
        this.roomGrid.render();

        // Initialize admin panel
        const adminContainer = document.getElementById('admin-container');
        this.adminPanel = new AdminPanel(adminContainer);

        // Setup global functions for onclick handlers
        window.editInspection = (id) => this.editInspection(id);
        window.deleteInspection = (id) => this.deleteInspection(id);
        window.openSettings = () => this.openSettings();
        window.closeSettings = () => this.closeSettings();
        window.saveSettings = () => this.saveSettings();
        window.resetSettings = () => this.resetSettings();
        window.applyColorPreset = (preset) => this.applyColorPreset(preset);
        window.toggleRoom = (roomNumber) => this.toggleRoom(roomNumber);
        window.selectAllRooms = () => this.selectAllRooms();
        window.clearSelection = () => this.clearSelection();
        window.updateRoomFilters = () => this.updateRoomFilters();
        window.createInspectionList = () => this.createInspectionList();
        window.loadInspectionList = (id) => this.loadInspectionList(id);
        window.deleteInspectionList = (id) => this.deleteInspectionList(id);
        window.updateReportDates = () => this.updateReportDates();
        window.setReportRange = (range) => this.setReportRange(range);
        window.clearReportRange = () => this.clearReportRange();
        window.updateSearch = () => this.updateSearch();
        window.updateFilters = () => this.updateFilters();
        window.clearFilters = () => this.clearFilters();
        window.handleAdminClick = () => this.handleAdminClick();
        window.closeAdminPanel = () => this.closeAdminPanel();
        window.exportAllData = () => this.exportAllData();
        window.importData = () => this.importData();
        window.downloadBackup = () => this.exportAllData();
        window.adminDeleteAllInspections = () => this.adminDeleteAllInspections();
        window.adminClearRoomProperties = () => this.adminClearRoomProperties();
        window.adminDeleteAllLists = () => this.adminDeleteAllLists();
        window.adminResetSettings = () => this.adminResetSettings();
        window.adminNuclearOption = () => this.adminNuclearOption();
        window.syncToFirebase = () => this.syncToFirebase();
        window.syncFromFirebase = () => this.syncFromFirebase();
        window.clearLocalStorage = () => this.clearLocalStorage();
        window.reloadApp = () => window.location.reload();
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

        // Settings button
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.openSettings();
        });

        // View mode buttons
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.getAttribute('data-view');
                this.switchViewMode(view);
            });
        });

        // Export Excel button
        document.getElementById('export-excel-btn').addEventListener('click', async () => {
            await this.exportToExcel();
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
        const shift = document.getElementById('room-shift').value;
        const gender = document.getElementById('room-gender').value;
        const notes = document.getElementById('inspection-notes').value.trim();
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
            notes: notes || '',
            timestamp: new Date().toISOString()
        };

        // Save room properties to store
        if (roomNumber && (shift || gender)) {
            const roomProps = store.state.roomProperties[roomNumber] || {};
            if (shift) roomProps.shift = shift;
            if (gender) roomProps.gender = gender;
            store.setState({
                roomProperties: {
                    ...store.state.roomProperties,
                    [roomNumber]: roomProps
                }
            });
            storageService.save('roomProperties', store.state.roomProperties);
        }

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
        document.getElementById('room-shift').value = '';
        document.getElementById('room-gender').value = '';
        document.getElementById('inspection-notes').value = '';

        if (this.demeritGrid) {
            this.demeritGrid.reset();
        }

        if (this.scoreDisplay) {
            this.scoreDisplay.update([], []);
        }
    }

    renderInspectionsList() {
        let inspections = store.getInspections();

        // Apply filters
        inspections = this.applyFilters(inspections);

        // Update results count
        const countEl = document.getElementById('results-count');
        if (countEl) {
            const total = store.getInspections().length;
            const filtered = inspections.length;
            if (filtered === total) {
                countEl.textContent = `Showing all ${total} inspection${total !== 1 ? 's' : ''}`;
            } else {
                countEl.textContent = `Showing ${filtered} of ${total} inspection${total !== 1 ? 's' : ''}`;
            }
        }

        if (inspections.length === 0) {
            const hasFilters = this.searchQuery || this.filterStatus !== 'all' || this.filterInspector !== 'all';
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <div>${hasFilters ? 'No inspections match your filters' : 'No inspections yet. Create your first inspection!'}</div>
                </div>
            `;
        }

        // Render based on view mode
        if (this.viewMode === 'card') {
            return this.inspectionCard.renderList(inspections);
        } else if (this.viewMode === 'table') {
            return this.inspectionTable.render(inspections);
        } else {
            // List view (simple)
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
    }

    switchViewMode(view) {
        this.viewMode = view;

        // Update button states
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-view') === view);
        });

        // Re-render inspections list
        const listEl = document.getElementById('inspections-list');
        if (listEl) {
            listEl.innerHTML = this.renderInspectionsList();
        }
    }

    async exportToExcel() {
        const inspections = store.getInspections();

        if (inspections.length === 0) {
            alert('No inspections to export!');
            return;
        }

        try {
            await exportService.exportToExcel(inspections);
            alert('✅ Excel file downloaded successfully!');
        } catch (error) {
            console.error('Export failed:', error);
            alert('❌ Export failed: ' + error.message);
        }
    }

    editInspection(id) {
        const inspection = store.getInspections().find(i => i.id === id);
        if (!inspection) {
            alert('Inspection not found!');
            return;
        }

        // Create modal if not exists
        if (!this.editModal) {
            this.editModal = new EditInspectionModal();
        }

        // Set callback for saving
        this.editModal.onSave = async (updatedInspection) => {
            try {
                // Update in Firebase if connected
                if (store.state.isConnected) {
                    await firebaseService.updateInspection(id, updatedInspection);
                }

                // Update in store
                store.updateInspection(id, updatedInspection);

                // Save to local storage
                storageService.save('inspections', store.getInspections());

                alert('✅ Inspection updated successfully!');

                // Re-render list
                const listEl = document.getElementById('inspections-list');
                if (listEl) {
                    listEl.innerHTML = this.renderInspectionsList();
                }

                // Update reports if on reports tab
                if (this.reportsComponent && store.state.activeTab === 'reports') {
                    this.reportsComponent.render();
                }
            } catch (error) {
                console.error('Update failed:', error);
                alert('❌ Failed to update inspection: ' + error.message);
            }
        };

        // Show modal with inspection data
        this.editModal.show(inspection);
    }

    deleteInspection(id) {
        const inspection = store.getInspections().find(i => i.id === id);
        if (!inspection) {
            alert('Inspection not found!');
            return;
        }

        const confirmed = confirm(
            `Are you sure you want to delete this inspection?\n\n` +
            `Room: ${inspection.roomNumber}\n` +
            `Date: ${inspection.inspectionDate}\n` +
            `Score: ${inspection.score}\n` +
            `Status: ${inspection.status}`
        );

        if (!confirmed) return;

        try {
            // Delete from Firebase if connected
            if (store.state.isConnected) {
                firebaseService.deleteInspection(id);
            }

            // Remove from store
            store.deleteInspection(id);

            // Save to local storage
            storageService.save('inspections', store.getInspections());

            // Success feedback
            const settings = store.getSettings();
            if (settings.hapticFeedback) {
                vibrate([100]);
            }

            alert('✅ Inspection deleted successfully!');

            // Re-render list
            const listEl = document.getElementById('inspections-list');
            if (listEl) {
                listEl.innerHTML = this.renderInspectionsList();
            }

            // Update reports if on reports tab
            if (this.reportsComponent && store.state.activeTab === 'reports') {
                this.reportsComponent.render();
            }
        } catch (error) {
            console.error('Delete failed:', error);
            alert('❌ Failed to delete inspection: ' + error.message);
        }
    }

    openSettings() {
        if (this.settingsPanel) {
            this.settingsPanel.show();
        }
    }

    closeSettings() {
        if (this.settingsPanel) {
            this.settingsPanel.close();
        }
    }

    saveSettings() {
        if (this.settingsPanel) {
            this.settingsPanel.save();
            this.settingsPanel.close();

            // Re-render inspections list to apply new settings
            const listEl = document.getElementById('inspections-list');
            if (listEl) {
                listEl.innerHTML = this.renderInspectionsList();
            }

            // Update reports if needed
            if (this.reportsComponent && store.state.activeTab === 'reports') {
                this.reportsComponent.render();
            }

            alert('✅ Settings saved successfully!');
        }
    }

    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            if (this.settingsPanel) {
                this.settingsPanel.reset();
                alert('✅ Settings reset to defaults!');
            }
        }
    }

    applyColorPreset(preset) {
        // Update active preset button
        document.querySelectorAll('.color-preset-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.preset === preset);
        });
    }

    toggleRoom(roomNumber) {
        if (this.roomGrid) {
            this.roomGrid.toggleRoom(roomNumber);
        }
    }

    selectAllRooms() {
        if (this.roomGrid) {
            this.roomGrid.selectAll();
        }
    }

    clearSelection() {
        if (this.roomGrid) {
            this.roomGrid.clearSelection();
        }
    }

    updateRoomFilters() {
        if (this.roomGrid) {
            this.roomGrid.updateFilters();
        }
    }

    createInspectionList() {
        if (!this.roomGrid) return;

        const selectedRooms = this.roomGrid.getSelectedRooms();
        if (selectedRooms.length === 0) {
            alert('Please select at least one room!');
            return;
        }

        const name = prompt(`Enter a name for this inspection list (${selectedRooms.length} rooms):`);
        if (!name) return;

        const list = {
            id: Date.now().toString(),
            name: name,
            rooms: selectedRooms,
            createdAt: new Date().toISOString(),
            lastUsed: null
        };

        // Update store
        store.addInspectionList(list);

        // Save to Firebase if connected
        if (store.state.isConnected) {
            firebaseService.saveInspectionLists(store.getInspectionLists());
        }

        // Save to local storage
        storageService.save('inspectionLists', store.getInspectionLists());

        alert(`✅ Inspection list "${name}" created with ${selectedRooms.length} rooms!`);

        // Re-render
        this.roomGrid.render();
    }

    loadInspectionList(id) {
        const list = store.getInspectionLists().find(l => l.id === id);
        if (!list) {
            alert('List not found!');
            return;
        }

        if (this.roomGrid) {
            this.roomGrid.loadList(list.rooms);
            alert(`✅ Loaded "${list.name}" with ${list.rooms.length} rooms`);
        }
    }

    deleteInspectionList(id) {
        const list = store.getInspectionLists().find(l => l.id === id);
        if (!list) {
            alert('List not found!');
            return;
        }

        const confirmed = confirm(`Are you sure you want to delete "${list.name}"?`);
        if (!confirmed) return;

        // Remove from store
        store.deleteInspectionList(id);

        // Save to Firebase if connected
        if (store.state.isConnected) {
            firebaseService.saveInspectionLists(store.getInspectionLists());
        }

        // Save to local storage
        storageService.save('inspectionLists', store.getInspectionLists());

        alert(`✅ List "${list.name}" deleted!`);

        // Re-render
        if (this.roomGrid) {
            this.roomGrid.render();
        }
    }

    updateReportDates() {
        if (this.reportsComponent) {
            const startDate = document.getElementById('report-start-date')?.value;
            const endDate = document.getElementById('report-end-date')?.value;
            this.reportsComponent.startDate = startDate || null;
            this.reportsComponent.endDate = endDate || null;
            this.reportsComponent.render();
        }
    }

    setReportRange(range) {
        if (!this.reportsComponent) return;

        const today = new Date();
        let startDate = null;

        if (range === 'week') {
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            startDate = weekAgo.toISOString().split('T')[0];
        } else if (range === 'month') {
            const monthAgo = new Date(today);
            monthAgo.setDate(monthAgo.getDate() - 30);
            startDate = monthAgo.toISOString().split('T')[0];
        }

        this.reportsComponent.startDate = startDate;
        this.reportsComponent.endDate = null;
        this.reportsComponent.render();
    }

    clearReportRange() {
        if (this.reportsComponent) {
            this.reportsComponent.startDate = null;
            this.reportsComponent.endDate = null;
            this.reportsComponent.render();
        }
    }

    applyFilters(inspections) {
        let filtered = [...inspections];

        // Apply search query
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(insp =>
                insp.roomNumber?.toString().toLowerCase().includes(query) ||
                insp.inspectorName?.toLowerCase().includes(query) ||
                insp.notes?.toLowerCase().includes(query)
            );
        }

        // Apply status filter
        if (this.filterStatus !== 'all') {
            filtered = filtered.filter(insp => insp.status === this.filterStatus);
        }

        // Apply inspector filter
        if (this.filterInspector !== 'all') {
            filtered = filtered.filter(insp => insp.inspectorName === this.filterInspector);
        }

        return filtered;
    }

    updateSearch() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            this.searchQuery = searchInput.value.trim();
            this.refreshInspectionsList();
        }
    }

    updateFilters() {
        const statusFilter = document.getElementById('filter-status');
        const inspectorFilter = document.getElementById('filter-inspector');

        if (statusFilter) {
            this.filterStatus = statusFilter.value;
        }

        if (inspectorFilter) {
            this.filterInspector = inspectorFilter.value;
        }

        this.refreshInspectionsList();
    }

    clearFilters() {
        this.searchQuery = '';
        this.filterStatus = 'all';
        this.filterInspector = 'all';

        const searchInput = document.getElementById('search-input');
        const statusFilter = document.getElementById('filter-status');
        const inspectorFilter = document.getElementById('filter-inspector');

        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = 'all';
        if (inspectorFilter) inspectorFilter.value = 'all';

        this.refreshInspectionsList();
    }

    refreshInspectionsList() {
        const listEl = document.getElementById('inspections-list');
        if (listEl) {
            listEl.innerHTML = this.renderInspectionsList();
        }
    }

    // Admin Panel Methods
    handleAdminClick() {
        this.adminClickCount++;

        // Reset counter after 2 seconds
        clearTimeout(this.adminClickTimeout);
        this.adminClickTimeout = setTimeout(() => {
            this.adminClickCount = 0;
        }, 2000);

        // Open admin panel after 5 clicks
        if (this.adminClickCount >= 5) {
            this.adminClickCount = 0;
            this.openAdminPanel();
        }
    }

    openAdminPanel() {
        if (this.adminPanel) {
            this.adminPanel.show();
        }
    }

    closeAdminPanel() {
        if (this.adminPanel) {
            this.adminPanel.close();
        }
    }

    exportAllData() {
        if (this.adminPanel) {
            this.adminPanel.exportAllData();
        }
    }

    importData() {
        const fileInput = document.getElementById('import-file');
        if (fileInput && fileInput.files.length > 0 && this.adminPanel) {
            this.adminPanel.importData(fileInput.files[0]);
        }
    }

    adminDeleteAllInspections() {
        const confirmed = confirm(
            '⚠️ WARNING: This will permanently delete ALL inspections!\n\n' +
            'This action cannot be undone. Are you absolutely sure?'
        );

        if (!confirmed) return;

        const doubleConfirm = confirm('Are you REALLY sure? Type your confirmation by clicking OK.');
        if (!doubleConfirm) return;

        try {
            // Delete from Firebase
            if (store.state.isConnected) {
                firebaseService.deleteAllInspections();
            }

            // Clear from store
            store.setInspections([]);

            // Clear from localStorage
            storageService.save('inspections', []);

            alert('✅ All inspections deleted successfully!');

            // Refresh UI
            this.refreshInspectionsList();
            if (this.reportsComponent) {
                this.reportsComponent.render();
            }
            if (this.adminPanel) {
                this.adminPanel.show(); // Re-render to update stats
            }
        } catch (error) {
            console.error('Delete all failed:', error);
            alert('❌ Failed to delete inspections: ' + error.message);
        }
    }

    adminClearRoomProperties() {
        const confirmed = confirm('Are you sure you want to clear all room properties (shift/gender)?');
        if (!confirmed) return;

        try {
            store.setState({ roomProperties: {} });
            storageService.save('roomProperties', {});

            alert('✅ Room properties cleared!');

            if (this.roomGrid) {
                this.roomGrid.render();
            }
            if (this.adminPanel) {
                this.adminPanel.show();
            }
        } catch (error) {
            console.error('Clear room properties failed:', error);
            alert('❌ Failed: ' + error.message);
        }
    }

    adminDeleteAllLists() {
        const confirmed = confirm('Are you sure you want to delete all inspection lists?');
        if (!confirmed) return;

        try {
            // Clear from store
            store.setInspectionLists([]);

            // Clear from Firebase
            if (store.state.isConnected) {
                firebaseService.saveInspectionLists([]);
            }

            // Clear from localStorage
            storageService.save('inspectionLists', []);

            alert('✅ All lists deleted!');

            if (this.roomGrid) {
                this.roomGrid.render();
            }
            if (this.adminPanel) {
                this.adminPanel.show();
            }
        } catch (error) {
            console.error('Delete lists failed:', error);
            alert('❌ Failed: ' + error.message);
        }
    }

    adminResetSettings() {
        const confirmed = confirm('Reset all settings to defaults?');
        if (!confirmed) return;

        try {
            store.setSettings({ ...DEFAULT_SETTINGS });
            storageService.save('settings', DEFAULT_SETTINGS);

            if (this.settingsPanel) {
                this.settingsPanel.applySettings(DEFAULT_SETTINGS);
            }

            alert('✅ Settings reset to defaults!');
        } catch (error) {
            console.error('Reset settings failed:', error);
            alert('❌ Failed: ' + error.message);
        }
    }

    adminNuclearOption() {
        const confirmed = confirm(
            '☢️ NUCLEAR OPTION ☢️\n\n' +
            'This will DELETE EVERYTHING:\n' +
            '- All inspections\n' +
            '- All lists\n' +
            '- All room properties\n' +
            '- All settings\n\n' +
            'This CANNOT be undone!\n\n' +
            'Are you absolutely sure?'
        );

        if (!confirmed) return;

        const verification = prompt('Type "DELETE EVERYTHING" to confirm:');
        if (verification !== 'DELETE EVERYTHING') {
            alert('Cancelled - verification text did not match');
            return;
        }

        try {
            // Clear everything
            store.setInspections([]);
            store.setInspectionLists([]);
            store.setState({ roomProperties: {} });
            store.setSettings({ ...DEFAULT_SETTINGS });

            // Clear localStorage
            storageService.save('inspections', []);
            storageService.save('inspectionLists', []);
            storageService.save('roomProperties', {});
            storageService.save('settings', DEFAULT_SETTINGS);

            // Clear Firebase if connected
            if (store.state.isConnected) {
                firebaseService.deleteAllInspections();
                firebaseService.saveInspectionLists([]);
            }

            alert('☢️ Everything has been deleted. Reloading...');
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error('Nuclear option failed:', error);
            alert('❌ Failed: ' + error.message);
        }
    }

    async syncToFirebase() {
        if (!store.state.isConnected) {
            alert('❌ Not connected to Firebase!');
            return;
        }

        try {
            const inspections = store.getInspections();
            const lists = store.getInspectionLists();

            // Save all data to Firebase
            for (const inspection of inspections) {
                await firebaseService.saveInspection(inspection);
            }

            await firebaseService.saveInspectionLists(lists);

            alert(`✅ Synced ${inspections.length} inspections and ${lists.length} lists to Firebase!`);
        } catch (error) {
            console.error('Sync to Firebase failed:', error);
            alert('❌ Sync failed: ' + error.message);
        }
    }

    async syncFromFirebase() {
        if (!store.state.isConnected) {
            alert('❌ Not connected to Firebase!');
            return;
        }

        try {
            const inspections = await firebaseService.getInspections();
            const lists = await firebaseService.getInspectionLists();

            store.setInspections(inspections);
            store.setInspectionLists(lists);

            storageService.save('inspections', inspections);
            storageService.save('inspectionLists', lists);

            alert(`✅ Synced ${inspections.length} inspections and ${lists.length} lists from Firebase!`);

            // Refresh UI
            this.refreshInspectionsList();
            if (this.roomGrid) {
                this.roomGrid.render();
            }
            if (this.adminPanel) {
                this.adminPanel.show();
            }
        } catch (error) {
            console.error('Sync from Firebase failed:', error);
            alert('❌ Sync failed: ' + error.message);
        }
    }

    clearLocalStorage() {
        const confirmed = confirm('Clear all localStorage data? This will not affect Firebase data.');
        if (!confirmed) return;

        try {
            localStorage.clear();
            alert('✅ LocalStorage cleared! Reloading...');
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error('Clear localStorage failed:', error);
            alert('❌ Failed: ' + error.message);
        }
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
