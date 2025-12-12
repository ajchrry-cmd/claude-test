import store from '../state/store.js';
import storageService from '../services/storageService.js';
import { COLOR_PRESETS, DEFAULT_SETTINGS } from '../config/settings.js';

export class SettingsPanel {
    constructor(containerElement) {
        this.container = containerElement;
        this.onClose = null;
    }

    show() {
        const settings = store.getSettings();

        this.container.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target === this) window.closeSettings()">
                <div class="modal-content" style="max-width: 900px;">
                    <div class="modal-header">
                        <h2>⚙️ Settings</h2>
                        <button class="modal-close" onclick="window.closeSettings()">×</button>
                    </div>

                    <div class="modal-body">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                            <!-- Left Column -->
                            <div>
                                <!-- Theme Selection -->
                                <div class="settings-section">
                                    <h3 class="settings-section-title">🎨 Theme</h3>
                                    <div class="form-group">
                                        <label class="form-label">Theme Mode</label>
                                        <select id="theme-mode" class="form-select">
                                            <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                                            <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
                                        </select>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">Color Preset</label>
                                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px;">
                                            ${this.renderColorPresets(settings.activePreset)}
                                        </div>
                                    </div>
                                </div>

                                <!-- Appearance -->
                                <div class="settings-section">
                                    <h3 class="settings-section-title">✨ Appearance</h3>

                                    <div class="form-group">
                                        <label class="form-label">Density</label>
                                        <select id="density" class="form-select">
                                            <option value="compact" ${settings.density === 'compact' ? 'selected' : ''}>Compact</option>
                                            <option value="comfortable" ${settings.density === 'comfortable' ? 'selected' : ''}>Comfortable</option>
                                            <option value="spacious" ${settings.density === 'spacious' ? 'selected' : ''}>Spacious</option>
                                        </select>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">Border Radius: <span id="border-radius-value">${settings.borderRadius}px</span></label>
                                        <input type="range" id="border-radius" class="form-range" min="0" max="24" step="2" value="${settings.borderRadius}">
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">Zoom Level: <span id="zoom-level-value">${settings.zoomLevel}%</span></label>
                                        <input type="range" id="zoom-level" class="form-range" min="80" max="120" step="5" value="${settings.zoomLevel}">
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">Animation Speed</label>
                                        <select id="animation-speed" class="form-select">
                                            <option value="slow" ${settings.animationSpeed === 'slow' ? 'selected' : ''}>Slow</option>
                                            <option value="normal" ${settings.animationSpeed === 'normal' ? 'selected' : ''}>Normal</option>
                                            <option value="fast" ${settings.animationSpeed === 'fast' ? 'selected' : ''}>Fast</option>
                                            <option value="none" ${settings.animationSpeed === 'none' ? 'selected' : ''}>None</option>
                                        </select>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">Shadow Intensity</label>
                                        <select id="shadow-intensity" class="form-select">
                                            <option value="none" ${settings.shadowIntensity === 'none' ? 'selected' : ''}>None</option>
                                            <option value="subtle" ${settings.shadowIntensity === 'subtle' ? 'selected' : ''}>Subtle</option>
                                            <option value="normal" ${settings.shadowIntensity === 'normal' ? 'selected' : ''}>Normal</option>
                                            <option value="strong" ${settings.shadowIntensity === 'strong' ? 'selected' : ''}>Strong</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- Right Column -->
                            <div>
                                <!-- Behavior -->
                                <div class="settings-section">
                                    <h3 class="settings-section-title">⚡ Behavior</h3>

                                    <div class="form-group">
                                        <label class="form-label">Default View Mode</label>
                                        <select id="view-mode" class="form-select">
                                            <option value="card" ${settings.viewMode === 'card' ? 'selected' : ''}>Card View</option>
                                            <option value="list" ${settings.viewMode === 'list' ? 'selected' : ''}>List View</option>
                                            <option value="table" ${settings.viewMode === 'table' ? 'selected' : ''}>Table View</option>
                                        </select>
                                    </div>

                                    <div class="form-group">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="haptic-feedback" ${settings.hapticFeedback ? 'checked' : ''}>
                                            <span>Enable Haptic Feedback</span>
                                        </label>
                                    </div>
                                </div>

                                <!-- Field Visibility -->
                                <div class="settings-section">
                                    <h3 class="settings-section-title">👁️ Field Visibility</h3>
                                    <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 12px;">
                                        Control which fields are shown in inspection cards
                                    </p>

                                    <div class="form-group">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="show-room-number" ${settings.showFields.roomNumber ? 'checked' : ''}>
                                            <span>Room Number</span>
                                        </label>
                                    </div>

                                    <div class="form-group">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="show-shift" ${settings.showFields.shift ? 'checked' : ''}>
                                            <span>Shift Badge</span>
                                        </label>
                                    </div>

                                    <div class="form-group">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="show-gender" ${settings.showFields.gender ? 'checked' : ''}>
                                            <span>Gender Badge</span>
                                        </label>
                                    </div>

                                    <div class="form-group">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="show-date" ${settings.showFields.date ? 'checked' : ''}>
                                            <span>Date</span>
                                        </label>
                                    </div>

                                    <div class="form-group">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="show-inspector" ${settings.showFields.inspector ? 'checked' : ''}>
                                            <span>Inspector Name</span>
                                        </label>
                                    </div>

                                    <div class="form-group">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="show-score" ${settings.showFields.score ? 'checked' : ''}>
                                            <span>Score</span>
                                        </label>
                                    </div>

                                    <div class="form-group">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="show-violations" ${settings.showFields.violations ? 'checked' : ''}>
                                            <span>Violations List</span>
                                        </label>
                                    </div>

                                    <div class="form-group">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="show-notes" ${settings.showFields.notes ? 'checked' : ''}>
                                            <span>Notes</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="window.resetSettings()">🔄 Reset to Defaults</button>
                        <div style="display: flex; gap: 12px;">
                            <button class="btn btn-secondary" onclick="window.closeSettings()">Cancel</button>
                            <button class="btn btn-primary" onclick="window.saveSettings()">💾 Save Settings</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Setup event listeners for live preview
        this.setupLivePreview();

        // Show container
        this.container.style.display = 'block';
    }

    renderColorPresets(activePreset) {
        return Object.entries(COLOR_PRESETS).map(([name, colors]) => `
            <button
                class="color-preset-btn ${activePreset === name ? 'active' : ''}"
                data-preset="${name}"
                onclick="window.applyColorPreset('${name}')"
                title="${name.charAt(0).toUpperCase() + name.slice(1)}"
            >
                <div class="color-preset-circle" style="background: ${colors.primary};"></div>
                <div class="color-preset-circle" style="background: ${colors.secondary};"></div>
                <div class="color-preset-circle" style="background: ${colors.accent};"></div>
            </button>
        `).join('');
    }

    setupLivePreview() {
        // Border radius live update
        const borderRadiusInput = document.getElementById('border-radius');
        const borderRadiusValue = document.getElementById('border-radius-value');
        if (borderRadiusInput && borderRadiusValue) {
            borderRadiusInput.addEventListener('input', (e) => {
                borderRadiusValue.textContent = e.target.value + 'px';
                document.documentElement.style.setProperty('--border-radius', e.target.value + 'px');
            });
        }

        // Zoom level live update
        const zoomLevelInput = document.getElementById('zoom-level');
        const zoomLevelValue = document.getElementById('zoom-level-value');
        if (zoomLevelInput && zoomLevelValue) {
            zoomLevelInput.addEventListener('input', (e) => {
                zoomLevelValue.textContent = e.target.value + '%';
                document.body.style.zoom = e.target.value + '%';
            });
        }

        // Theme mode live update
        const themeMode = document.getElementById('theme-mode');
        if (themeMode) {
            themeMode.addEventListener('change', (e) => {
                document.documentElement.setAttribute('data-theme', e.target.value);
            });
        }
    }

    getSettings() {
        return {
            theme: document.getElementById('theme-mode')?.value || 'dark',
            activePreset: document.querySelector('.color-preset-btn.active')?.dataset.preset || 'default',
            density: document.getElementById('density')?.value || 'comfortable',
            borderRadius: parseInt(document.getElementById('border-radius')?.value) || 12,
            zoomLevel: parseInt(document.getElementById('zoom-level')?.value) || 100,
            animationSpeed: document.getElementById('animation-speed')?.value || 'normal',
            shadowIntensity: document.getElementById('shadow-intensity')?.value || 'normal',
            viewMode: document.getElementById('view-mode')?.value || 'card',
            hapticFeedback: document.getElementById('haptic-feedback')?.checked || false,
            showFields: {
                roomNumber: document.getElementById('show-room-number')?.checked || true,
                shift: document.getElementById('show-shift')?.checked || true,
                gender: document.getElementById('show-gender')?.checked || true,
                date: document.getElementById('show-date')?.checked || true,
                inspector: document.getElementById('show-inspector')?.checked || true,
                score: document.getElementById('show-score')?.checked || true,
                violations: document.getElementById('show-violations')?.checked || true,
                notes: document.getElementById('show-notes')?.checked || true
            },
            tutorialCompleted: store.getSettings().tutorialCompleted
        };
    }

    save() {
        const newSettings = this.getSettings();

        // Apply color preset
        const colors = COLOR_PRESETS[newSettings.activePreset];
        newSettings.customColors = {
            ...store.getSettings().customColors,
            primary: colors.primary,
            secondary: colors.secondary,
            accent: colors.accent
        };

        // Update store
        store.setSettings(newSettings);

        // Save to storage
        storageService.save('settings', newSettings);

        // Apply settings
        this.applySettings(newSettings);

        // Success feedback
        console.log('Settings saved successfully');
    }

    applySettings(settings) {
        // Apply theme
        document.documentElement.setAttribute('data-theme', settings.theme);

        // Apply colors
        Object.entries(settings.customColors).forEach(([key, value]) => {
            document.documentElement.style.setProperty(`--${key}`, value);
        });

        // Apply border radius
        document.documentElement.style.setProperty('--border-radius', settings.borderRadius + 'px');

        // Apply zoom
        document.body.style.zoom = settings.zoomLevel + '%';
    }

    reset() {
        store.setSettings({ ...DEFAULT_SETTINGS });
        storageService.save('settings', DEFAULT_SETTINGS);
        this.applySettings(DEFAULT_SETTINGS);
        this.show(); // Re-render with defaults
    }

    close() {
        this.container.style.display = 'none';
        this.container.innerHTML = '';
        if (this.onClose) {
            this.onClose();
        }
    }
}
