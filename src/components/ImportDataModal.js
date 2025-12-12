import store from '../state/store.js';
import storageService from '../services/storageService.js';
import firebaseService from '../services/firebaseService.js';
import { validateInspection } from '../utils/validators.js';

export class ImportDataModal {
    constructor(containerElement) {
        this.container = containerElement;
        this.parsedData = null;
        this.onClose = null;
    }

    show() {
        this.container.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target === this) window.closeImportData()">
                <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h2>📥 Import Inspections</h2>
                        <button class="modal-close" onclick="window.closeImportData()">×</button>
                    </div>

                    <div class="modal-body">
                        <!-- Info Banner -->
                        <div style="background: var(--primary-light); border-left: 4px solid var(--primary); padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                            <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--primary); margin-bottom: 8px;">
                                ℹ️ CSV Import Instructions
                            </div>
                            <div style="font-size: 14px; color: var(--text-secondary); line-height: 1.6;">
                                Import inspection data from CSV files. Your CSV file should have the following columns:
                                <br><br>
                                <strong>Required:</strong> roomNumber, inspectorName, inspectionDate, score, status
                                <br>
                                <strong>Optional:</strong> demerits, autoFailureDemerits, notes
                                <br><br>
                                <code style="background: var(--surface); padding: 2px 6px; border-radius: 4px; font-size: 12px;">
                                    status must be one of: PASSED, FAILED, or OUTSTANDING
                                </code>
                            </div>
                        </div>

                        <!-- File Upload -->
                        <div class="settings-section">
                            <h3 class="settings-section-title">1️⃣ Select CSV File</h3>
                            <div style="margin-bottom: 16px;">
                                <label class="btn btn-primary" style="cursor: pointer; display: inline-block;">
                                    📁 Choose CSV File
                                    <input type="file" id="import-csv-file" accept=".csv,.txt" style="display: none;" onchange="window.handleImportFileSelect()">
                                </label>
                                <div id="import-file-name" style="margin-top: 8px; font-size: 14px; color: var(--text-muted);">
                                    No file selected
                                </div>
                            </div>
                        </div>

                        <!-- Preview -->
                        <div id="import-preview-section" style="display: none;">
                            <div class="settings-section">
                                <h3 class="settings-section-title">2️⃣ Preview Data</h3>
                                <div id="import-preview" style="background: var(--surface-light); padding: 16px; border-radius: 8px; max-height: 300px; overflow: auto;">
                                    <!-- Preview content will be inserted here -->
                                </div>
                                <div id="import-stats" style="margin-top: 12px; font-size: 14px; color: var(--text-muted);">
                                    <!-- Stats will be inserted here -->
                                </div>
                            </div>

                            <!-- Import Options -->
                            <div class="settings-section">
                                <h3 class="settings-section-title">3️⃣ Import Options</h3>
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="import-skip-duplicates" checked>
                                        <span>Skip duplicate inspections (based on room + date)</span>
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="import-validate-strict" checked>
                                        <span>Strict validation (reject invalid rows)</span>
                                    </label>
                                </div>
                            </div>

                            <!-- Validation Errors -->
                            <div id="import-errors-section" style="display: none;">
                                <div class="settings-section">
                                    <h3 class="settings-section-title" style="color: var(--error);">⚠️ Validation Errors</h3>
                                    <div id="import-errors" style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid var(--error); padding: 12px; border-radius: 8px; max-height: 200px; overflow: auto; font-size: 13px; font-family: monospace;">
                                        <!-- Errors will be inserted here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="window.closeImportData()">Cancel</button>
                        <button id="import-confirm-btn" class="btn btn-primary" onclick="window.confirmImport()" style="display: none;">
                            ✅ Import <span id="import-count"></span> Inspections
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.container.style.display = 'block';
        this.parsedData = null;
    }

    handleFileSelect() {
        const fileInput = document.getElementById('import-csv-file');
        const file = fileInput?.files[0];

        if (!file) return;

        const fileNameEl = document.getElementById('import-file-name');
        if (fileNameEl) {
            fileNameEl.textContent = `Selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csvText = e.target.result;
                this.parseCSV(csvText);
            } catch (error) {
                alert('Error reading file: ' + error.message);
                console.error('File read error:', error);
            }
        };
        reader.readAsText(file);
    }

    parseCSV(csvText) {
        try {
            const lines = csvText.trim().split('\n');
            if (lines.length < 2) {
                alert('CSV file is empty or has no data rows');
                return;
            }

            // Parse header
            const header = this.parseCSVLine(lines[0]);
            const headerMap = {};
            header.forEach((col, idx) => {
                headerMap[col.trim().toLowerCase()] = idx;
            });

            // Parse rows
            const inspections = [];
            const errors = [];

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue; // Skip empty lines

                try {
                    const values = this.parseCSVLine(line);
                    const inspection = this.mapRowToInspection(values, headerMap, i + 1);

                    if (inspection) {
                        inspections.push(inspection);
                    }
                } catch (error) {
                    errors.push(`Row ${i + 1}: ${error.message}`);
                }
            }

            this.parsedData = { inspections, errors };
            this.displayPreview();
        } catch (error) {
            alert('Error parsing CSV: ' + error.message);
            console.error('CSV parse error:', error);
        }
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i++; // Skip next quote
                } else {
                    // Toggle quote mode
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // End of field
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        // Push last field
        result.push(current);

        return result;
    }

    mapRowToInspection(values, headerMap, rowNumber) {
        const getValue = (colName) => {
            const idx = headerMap[colName.toLowerCase()];
            return idx !== undefined ? values[idx]?.trim() : '';
        };

        // Required fields
        const roomNumber = getValue('roomnumber') || getValue('room');
        const inspectorName = getValue('inspectorname') || getValue('inspector');
        const inspectionDate = getValue('inspectiondate') || getValue('date');
        const score = getValue('score');
        const status = getValue('status');

        // Optional fields
        const demeritsStr = getValue('demerits');
        const autoFailureDemeritsStr = getValue('autofailuredemerits') || getValue('autofailure');
        const notes = getValue('notes');

        if (!roomNumber || !inspectorName || !inspectionDate || !score || !status) {
            throw new Error('Missing required fields (roomNumber, inspectorName, inspectionDate, score, status)');
        }

        // Validate status
        const validStatuses = ['PASSED', 'FAILED', 'OUTSTANDING'];
        const normalizedStatus = status.toUpperCase();
        if (!validStatuses.includes(normalizedStatus)) {
            throw new Error(`Invalid status "${status}". Must be one of: ${validStatuses.join(', ')}`);
        }

        // Parse demerits (expected as JSON array or comma-separated)
        let demerits = [];
        let autoFailureDemerits = [];

        if (demeritsStr) {
            try {
                demerits = JSON.parse(demeritsStr);
            } catch (e) {
                // Try comma-separated
                demerits = demeritsStr.split(',').map(d => d.trim()).filter(d => d);
            }
        }

        if (autoFailureDemeritsStr) {
            try {
                autoFailureDemerits = JSON.parse(autoFailureDemeritsStr);
            } catch (e) {
                // Try comma-separated
                autoFailureDemerits = autoFailureDemeritsStr.split(',').map(d => d.trim()).filter(d => d);
            }
        }

        return {
            roomNumber: roomNumber,
            inspectorName: inspectorName,
            inspectionDate: inspectionDate,
            demerits: demerits,
            autoFailureDemerits: autoFailureDemerits,
            score: parseInt(score) || 0,
            status: normalizedStatus,
            notes: notes || '',
            timestamp: new Date().toISOString()
        };
    }

    displayPreview() {
        if (!this.parsedData) return;

        const { inspections, errors } = this.parsedData;

        // Show preview section
        const previewSection = document.getElementById('import-preview-section');
        if (previewSection) {
            previewSection.style.display = 'block';
        }

        // Display preview
        const previewEl = document.getElementById('import-preview');
        if (previewEl && inspections.length > 0) {
            const previewCount = Math.min(5, inspections.length);
            previewEl.innerHTML = `
                <div style="font-size: 12px; margin-bottom: 12px; color: var(--text-muted);">
                    Showing first ${previewCount} of ${inspections.length} inspections:
                </div>
                <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                    <thead>
                        <tr style="background: var(--surface); border-bottom: 2px solid var(--border);">
                            <th style="padding: 8px; text-align: left;">Room</th>
                            <th style="padding: 8px; text-align: left;">Inspector</th>
                            <th style="padding: 8px; text-align: left;">Date</th>
                            <th style="padding: 8px; text-align: center;">Score</th>
                            <th style="padding: 8px; text-align: center;">Status</th>
                            <th style="padding: 8px; text-align: left;">Demerits</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${inspections.slice(0, previewCount).map(insp => `
                            <tr style="border-bottom: 1px solid var(--border);">
                                <td style="padding: 8px;">${insp.roomNumber}</td>
                                <td style="padding: 8px;">${insp.inspectorName}</td>
                                <td style="padding: 8px;">${insp.inspectionDate}</td>
                                <td style="padding: 8px; text-align: center;">${insp.score}</td>
                                <td style="padding: 8px; text-align: center;">
                                    <span style="
                                        padding: 2px 8px;
                                        border-radius: 4px;
                                        font-size: 11px;
                                        font-weight: 700;
                                        background: ${insp.status === 'PASSED' ? '#10b981' : insp.status === 'FAILED' ? '#ef4444' : '#f59e0b'};
                                        color: white;
                                    ">${insp.status}</span>
                                </td>
                                <td style="padding: 8px; font-size: 11px;">
                                    ${insp.demerits.length + insp.autoFailureDemerits.length} total
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        // Display stats
        const statsEl = document.getElementById('import-stats');
        if (statsEl) {
            const validCount = inspections.length;
            const errorCount = errors.length;
            statsEl.innerHTML = `
                ✅ <strong>${validCount}</strong> valid inspections
                ${errorCount > 0 ? `<span style="color: var(--error); margin-left: 16px;">⚠️ <strong>${errorCount}</strong> errors</span>` : ''}
            `;
        }

        // Display errors
        if (errors.length > 0) {
            const errorsSection = document.getElementById('import-errors-section');
            const errorsEl = document.getElementById('import-errors');
            if (errorsSection && errorsEl) {
                errorsSection.style.display = 'block';
                errorsEl.innerHTML = errors.map(err => `• ${err}`).join('<br>');
            }
        }

        // Show import button
        const importBtn = document.getElementById('import-confirm-btn');
        const importCount = document.getElementById('import-count');
        if (importBtn && importCount && inspections.length > 0) {
            importBtn.style.display = 'inline-block';
            importCount.textContent = inspections.length;
        }
    }

    async confirmImport() {
        if (!this.parsedData || this.parsedData.inspections.length === 0) {
            alert('No valid inspections to import');
            return;
        }

        const skipDuplicates = document.getElementById('import-skip-duplicates')?.checked;
        const strictValidation = document.getElementById('import-validate-strict')?.checked;

        try {
            const existingInspections = store.getInspections();
            const existingKeys = new Set(
                existingInspections.map(i => `${i.roomNumber}-${i.inspectionDate}`)
            );

            let imported = 0;
            let skipped = 0;
            let failed = 0;

            for (const inspection of this.parsedData.inspections) {
                // Check for duplicates
                const key = `${inspection.roomNumber}-${inspection.inspectionDate}`;
                if (skipDuplicates && existingKeys.has(key)) {
                    skipped++;
                    continue;
                }

                // Validate
                if (strictValidation) {
                    const validation = validateInspection(inspection);
                    if (!validation.isValid) {
                        console.warn('Validation failed for inspection:', inspection, validation.errors);
                        failed++;
                        continue;
                    }
                }

                // Save to Firebase if connected
                if (store.state.isConnected) {
                    try {
                        const id = await firebaseService.saveInspection(inspection);
                        inspection.id = id;
                    } catch (error) {
                        console.error('Firebase save failed for inspection:', inspection, error);
                        inspection.id = Date.now().toString() + '-' + imported;
                    }
                } else {
                    inspection.id = Date.now().toString() + '-' + imported;
                }

                // Add to store
                store.addInspection(inspection);
                imported++;
            }

            // Save to localStorage
            const allInspections = store.getInspections();
            storageService.save('inspections', allInspections);

            // Show summary
            let message = `✅ Import complete!\n\n`;
            message += `• Imported: ${imported}\n`;
            if (skipped > 0) message += `• Skipped (duplicates): ${skipped}\n`;
            if (failed > 0) message += `• Failed (validation): ${failed}\n`;

            alert(message);

            // Close modal
            this.close();

            // Refresh UI if there's a callback
            if (window.refreshAfterImport) {
                window.refreshAfterImport();
            }
        } catch (error) {
            console.error('Import failed:', error);
            alert('❌ Import failed: ' + error.message);
        }
    }

    close() {
        this.parsedData = null;
        this.container.style.display = 'none';
        this.container.innerHTML = '';
        if (this.onClose) {
            this.onClose();
        }
    }
}
