import store from '../state/store.js';
import storageService from '../services/storageService.js';
import firebaseService from '../services/firebaseService.js';
import { DEFAULT_SETTINGS } from '../config/settings.js';

export class AdminPanel {
    constructor(containerElement) {
        this.container = containerElement;
        this.onClose = null;
    }

    show() {
        this.container.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target === this) window.closeAdminPanel()">
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <h2>🔧 Admin Panel</h2>
                        <button class="modal-close" onclick="window.closeAdminPanel()">×</button>
                    </div>

                    <div class="modal-body">
                        <div style="background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                            <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #f59e0b; margin-bottom: 8px;">
                                ⚠️ Caution
                            </div>
                            <div style="font-size: 14px; color: var(--text-secondary);">
                                These operations cannot be undone. Make sure you have backups before proceeding.
                            </div>
                        </div>

                        <!-- Database Statistics -->
                        <div class="settings-section">
                            <h3 class="settings-section-title">📊 Database Statistics</h3>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
                                ${this.renderStats()}
                            </div>
                        </div>

                        <!-- Data Export/Import -->
                        <div class="settings-section">
                            <h3 class="settings-section-title">💾 Data Management</h3>

                            <button class="btn btn-primary" onclick="window.exportAllData()" style="width: 100%; margin-bottom: 8px;">
                                📥 Export All Data (JSON)
                            </button>

                            <div style="margin-bottom: 8px;">
                                <label class="btn btn-secondary" style="width: 100%; cursor: pointer; display: block; text-align: center;">
                                    📤 Import Data (JSON)
                                    <input type="file" id="import-file" accept=".json" style="display: none;" onchange="window.importData()">
                                </label>
                            </div>

                            <button class="btn btn-secondary" onclick="window.downloadBackup()" style="width: 100%;">
                                💿 Download Full Backup
                            </button>
                        </div>

                        <!-- Bulk Operations -->
                        <div class="settings-section">
                            <h3 class="settings-section-title">🗑️ Bulk Operations</h3>

                            <button class="btn btn-danger" onclick="window.adminDeleteAllInspections()" style="width: 100%; margin-bottom: 8px;">
                                🗑️ Delete All Inspections
                            </button>

                            <button class="btn btn-danger" onclick="window.adminClearRoomProperties()" style="width: 100%; margin-bottom: 8px;">
                                🏠 Clear All Room Properties
                            </button>

                            <button class="btn btn-danger" onclick="window.adminDeleteAllLists()" style="width: 100%; margin-bottom: 8px;">
                                📋 Delete All Inspection Lists
                            </button>

                            <button class="btn btn-warning" onclick="window.adminResetSettings()" style="width: 100%; margin-bottom: 8px;">
                                ⚙️ Reset All Settings
                            </button>

                            <button class="btn btn-danger" onclick="window.adminNuclearOption()" style="width: 100%;">
                                ☢️ Nuclear Option (Delete Everything)
                            </button>
                        </div>

                        <!-- Firebase Operations -->
                        ${store.state.isConnected ? `
                            <div class="settings-section">
                                <h3 class="settings-section-title">☁️ Firebase Operations</h3>

                                <button class="btn btn-primary" onclick="window.syncToFirebase()" style="width: 100%; margin-bottom: 8px;">
                                    ⬆️ Force Sync to Firebase
                                </button>

                                <button class="btn btn-primary" onclick="window.syncFromFirebase()" style="width: 100%;">
                                    ⬇️ Force Sync from Firebase
                                </button>
                            </div>
                        ` : ''}

                        <!-- Cache Management -->
                        <div class="settings-section">
                            <h3 class="settings-section-title">🧹 Cache Management</h3>

                            <button class="btn btn-secondary" onclick="window.clearLocalStorage()" style="width: 100%; margin-bottom: 8px;">
                                🗑️ Clear LocalStorage
                            </button>

                            <button class="btn btn-secondary" onclick="window.reloadApp()" style="width: 100%;">
                                🔄 Reload Application
                            </button>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="window.closeAdminPanel()">Close</button>
                    </div>
                </div>
            </div>
        `;

        this.container.style.display = 'block';
    }

    renderStats() {
        const inspections = store.getInspections();
        const lists = store.getInspectionLists();
        const roomProps = store.getRoomProperties();
        const roomPropsCount = Object.keys(roomProps).length;

        return `
            <div class="stat-card" style="background: var(--surface-light); padding: 16px; border-radius: 8px; text-align: center;">
                <div style="font-size: 28px; font-weight: 800; color: var(--primary);">${inspections.length}</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Inspections</div>
            </div>
            <div class="stat-card" style="background: var(--surface-light); padding: 16px; border-radius: 8px; text-align: center;">
                <div style="font-size: 28px; font-weight: 800; color: var(--secondary);">${lists.length}</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Lists</div>
            </div>
            <div class="stat-card" style="background: var(--surface-light); padding: 16px; border-radius: 8px; text-align: center;">
                <div style="font-size: 28px; font-weight: 800; color: var(--accent);">${roomPropsCount}</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Rooms Configured</div>
            </div>
        `;
    }

    close() {
        this.container.style.display = 'none';
        this.container.innerHTML = '';
        if (this.onClose) {
            this.onClose();
        }
    }

    // Data export
    exportAllData() {
        const data = {
            inspections: store.getInspections(),
            lists: store.getInspectionLists(),
            roomProperties: store.getRoomProperties(),
            settings: store.getSettings(),
            exportedAt: new Date().toISOString(),
            version: '2.0'
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dorm-inspector-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('✅ Data exported successfully!');
    }

    // Data import
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                if (data.inspections) store.setInspections(data.inspections);
                if (data.lists) store.setInspectionLists(data.lists);
                if (data.roomProperties) {
                    store.setState({ roomProperties: data.roomProperties });
                }
                if (data.settings) store.setSettings(data.settings);

                // Save to localStorage
                storageService.save('inspections', data.inspections || []);
                storageService.save('inspectionLists', data.lists || []);
                storageService.save('roomProperties', data.roomProperties || {});
                storageService.save('settings', data.settings || DEFAULT_SETTINGS);

                alert('✅ Data imported successfully! Reloading...');
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                console.error('Import failed:', error);
                alert('❌ Import failed: Invalid file format');
            }
        };
        reader.readAsText(file);
    }
}
