import { DemeritGrid } from './DemeritGrid.js';
import { ScoreDisplay } from './ScoreDisplay.js';
import { getTodayString } from '../utils/dateUtils.js';
import { validateInspection } from '../utils/validators.js';
import store from '../state/store.js';

export class EditInspectionModal {
    constructor() {
        this.demeritGrid = null;
        this.scoreDisplay = null;
        this.currentInspection = null;
        this.onSave = null;
        this.onCancel = null;
    }

    show(inspection) {
        this.currentInspection = inspection;
        this.render();
        this.initializeComponents();

        // Show modal
        const modal = document.getElementById('edit-inspection-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    hide() {
        const modal = document.getElementById('edit-inspection-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        this.currentInspection = null;
    }

    render() {
        // Create modal if it doesn't exist
        let modal = document.getElementById('edit-inspection-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'edit-inspection-modal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-backdrop" onclick="window.closeEditModal()"></div>
            <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid var(--border);">
                    <h2 style="font-size: 24px; font-weight: 800; color: var(--text-primary);">
                        ✏️ Edit Inspection - Room ${this.currentInspection.roomNumber}
                    </h2>
                    <button onclick="window.closeEditModal()" class="icon-button" style="background: var(--surface-light); border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 24px; cursor: pointer; color: var(--text-primary);">×</button>
                </div>

                <div class="modal-body">
                    <!-- Form Fields -->
                    <div class="form-group">
                        <label class="form-label">Room Number</label>
                        <input type="text" id="edit-room-number" class="form-input" value="${this.currentInspection.roomNumber}" readonly style="background: var(--surface-light); cursor: not-allowed;">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Inspector Name</label>
                        <input type="text" id="edit-inspector-name" class="form-input" value="${this.currentInspection.inspectorName || ''}">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Inspection Date</label>
                        <input type="date" id="edit-inspection-date" class="form-input" value="${this.currentInspection.inspectionDate || getTodayString()}">
                    </div>

                    <!-- Score Display -->
                    <div id="edit-score-container"></div>

                    <!-- Demerits Grid -->
                    <div id="edit-demerits-container"></div>

                    <!-- Notes (if any) -->
                    <div class="form-group" style="margin-top: 24px;">
                        <label class="form-label">Notes (Optional)</label>
                        <textarea id="edit-notes" class="form-input" rows="3" placeholder="Additional notes about this inspection..." style="resize: vertical; font-family: inherit;">${this.currentInspection.notes || ''}</textarea>
                    </div>

                    <!-- Actions -->
                    <div style="display: flex; gap: 12px; margin-top: 24px; padding-top: 24px; border-top: 2px solid var(--border);">
                        <button onclick="window.closeEditModal()" class="btn btn-secondary" style="flex: 1;">
                            ❌ Cancel
                        </button>
                        <button onclick="window.saveEditedInspection()" class="btn btn-primary" style="flex: 2;">
                            💾 Save Changes
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    initializeComponents() {
        // Initialize demerit grid
        const demeritsContainer = document.getElementById('edit-demerits-container');
        if (demeritsContainer) {
            this.demeritGrid = new DemeritGrid(demeritsContainer);
            this.demeritGrid.render();

            // Set existing selections
            this.demeritGrid.setSelected(
                this.currentInspection.demerits || [],
                this.currentInspection.autoFailureDemerits || []
            );

            // Update score on change
            this.demeritGrid.onChange = (demerits) => {
                if (this.scoreDisplay) {
                    this.scoreDisplay.update(demerits.regular, demerits.autoFailure);
                }
            };
        }

        // Initialize score display
        const scoreContainer = document.getElementById('edit-score-container');
        if (scoreContainer) {
            this.scoreDisplay = new ScoreDisplay(scoreContainer);
            this.scoreDisplay.render();
            this.scoreDisplay.update(
                this.currentInspection.demerits || [],
                this.currentInspection.autoFailureDemerits || []
            );
        }
    }

    getUpdatedInspection() {
        const demerits = this.demeritGrid ? this.demeritGrid.getSelected() : { regular: [], autoFailure: [] };
        const scoreResult = this.scoreDisplay ? this.scoreDisplay.getResult() : { score: 0, status: 'OUTSTANDING' };

        return {
            ...this.currentInspection,
            inspectorName: document.getElementById('edit-inspector-name')?.value || '',
            inspectionDate: document.getElementById('edit-inspection-date')?.value || getTodayString(),
            demerits: demerits.regular,
            autoFailureDemerits: demerits.autoFailure,
            score: scoreResult.score,
            status: scoreResult.status,
            notes: document.getElementById('edit-notes')?.value || '',
            updatedAt: new Date().toISOString()
        };
    }

    async save() {
        const updatedInspection = this.getUpdatedInspection();

        // Validate
        const validation = validateInspection(updatedInspection);
        if (!validation.isValid) {
            alert('Please fill in all required fields:\n' + validation.errors.join('\n'));
            return false;
        }

        if (this.onSave) {
            await this.onSave(updatedInspection);
        }

        this.hide();
        return true;
    }
}
