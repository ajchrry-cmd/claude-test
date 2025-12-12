import store from '../state/store.js';
import storageService from '../services/storageService.js';

export class TemplatesModal {
    constructor(containerElement, demeritGrid) {
        this.container = containerElement;
        this.demeritGrid = demeritGrid;
        this.onClose = null;
        this.onTemplateLoad = null;
    }

    show() {
        const templates = this.getTemplates();

        this.container.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target === this) window.closeTemplates()">
                <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h2>📋 Inspection Templates</h2>
                        <button class="modal-close" onclick="window.closeTemplates()">×</button>
                    </div>

                    <div class="modal-body">
                        <!-- Info Banner -->
                        <div style="background: var(--primary-light); border-left: 4px solid var(--primary); padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                            <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--primary); margin-bottom: 8px;">
                                ℹ️ Inspection Templates
                            </div>
                            <div style="font-size: 14px; color: var(--text-secondary);">
                                Save common violation patterns as templates and apply them quickly during inspections.
                            </div>
                        </div>

                        <!-- Create New Template -->
                        <div class="settings-section">
                            <h3 class="settings-section-title">➕ Create New Template</h3>
                            <div style="display: flex; gap: 12px; align-items: flex-end;">
                                <div class="form-group" style="flex: 1; margin-bottom: 0;">
                                    <label class="form-label">Template Name</label>
                                    <input type="text" id="template-name" class="form-input" placeholder="e.g., Common Violations, Weekend Rounds" style="width: 100%;">
                                </div>
                                <button class="btn btn-primary" onclick="window.saveCurrentAsTemplate()" style="white-space: nowrap;">
                                    💾 Save Current Selection
                                </button>
                            </div>
                            <div style="margin-top: 8px; font-size: 13px; color: var(--text-muted);">
                                ${this.getCurrentSelectionSummary()}
                            </div>
                        </div>

                        <!-- Saved Templates -->
                        <div class="settings-section">
                            <h3 class="settings-section-title">📚 Saved Templates (${templates.length})</h3>

                            ${templates.length === 0 ? `
                                <div class="empty-state" style="padding: 40px; text-align: center;">
                                    <div class="empty-state-icon">📋</div>
                                    <div style="color: var(--text-muted); margin-top: 12px;">
                                        No templates saved yet. Select some demerits and save your first template!
                                    </div>
                                </div>
                            ` : `
                                <div style="display: grid; gap: 12px;">
                                    ${templates.map((template, idx) => this.renderTemplate(template, idx)).join('')}
                                </div>
                            `}
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="window.closeTemplates()">Close</button>
                    </div>
                </div>
            </div>
        `;

        this.container.style.display = 'block';
    }

    renderTemplate(template, index) {
        const totalDemerits = (template.demerits?.length || 0) + (template.autoFailureDemerits?.length || 0);
        const createdDate = template.createdAt ? new Date(template.createdAt).toLocaleDateString() : 'Unknown';

        return `
            <div class="template-card" style="
                background: var(--surface-light);
                padding: 16px;
                border-radius: 8px;
                border: 2px solid var(--border);
                transition: all 0.2s;
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div style="flex: 1;">
                        <h4 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                            ${template.name}
                        </h4>
                        <div style="font-size: 12px; color: var(--text-muted);">
                            Created ${createdDate} • ${totalDemerits} violation${totalDemerits !== 1 ? 's' : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary btn-small" onclick="window.loadTemplate(${index})" title="Load this template">
                            📥 Load
                        </button>
                        <button class="btn btn-danger btn-small" onclick="window.deleteTemplate(${index})" title="Delete this template">
                            🗑️
                        </button>
                    </div>
                </div>

                <!-- Demerits List -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    ${template.demerits && template.demerits.length > 0 ? `
                        <div>
                            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">
                                REGULAR DEMERITS (${template.demerits.length})
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
                                ${template.demerits.slice(0, 3).map(d => `• ${d}`).join('<br>')}
                                ${template.demerits.length > 3 ? `<br><span style="color: var(--text-muted);">...and ${template.demerits.length - 3} more</span>` : ''}
                            </div>
                        </div>
                    ` : ''}

                    ${template.autoFailureDemerits && template.autoFailureDemerits.length > 0 ? `
                        <div>
                            <div style="font-size: 11px; font-weight: 700; color: var(--error); margin-bottom: 6px;">
                                AUTO-FAILURE (${template.autoFailureDemerits.length})
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
                                ${template.autoFailureDemerits.slice(0, 3).map(d => `• ${d}`).join('<br>')}
                                ${template.autoFailureDemerits.length > 3 ? `<br><span style="color: var(--text-muted);">...and ${template.autoFailureDemerits.length - 3} more</span>` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getCurrentSelectionSummary() {
        if (!this.demeritGrid) {
            return 'No demerits selected';
        }

        const selected = this.demeritGrid.getSelected();
        const regularCount = selected.regular?.length || 0;
        const autoFailCount = selected.autoFailure?.length || 0;
        const total = regularCount + autoFailCount;

        if (total === 0) {
            return 'No demerits currently selected';
        }

        return `Currently selected: ${regularCount} regular + ${autoFailCount} auto-failure = ${total} total violations`;
    }

    getTemplates() {
        return storageService.get('inspectionTemplates', []);
    }

    saveTemplate(name) {
        if (!name || !name.trim()) {
            alert('Please enter a template name');
            return;
        }

        if (!this.demeritGrid) {
            alert('Cannot access demerit grid');
            return;
        }

        const selected = this.demeritGrid.getSelected();
        const totalDemerits = (selected.regular?.length || 0) + (selected.autoFailure?.length || 0);

        if (totalDemerits === 0) {
            alert('Please select at least one demerit before saving a template');
            return;
        }

        const template = {
            name: name.trim(),
            demerits: selected.regular || [],
            autoFailureDemerits: selected.autoFailure || [],
            createdAt: new Date().toISOString()
        };

        const templates = this.getTemplates();
        templates.push(template);
        storageService.save('inspectionTemplates', templates);

        // Clear input
        const input = document.getElementById('template-name');
        if (input) {
            input.value = '';
        }

        // Refresh UI
        this.show();

        alert(`✅ Template "${template.name}" saved with ${totalDemerits} violation(s)`);
    }

    loadTemplate(index) {
        const templates = this.getTemplates();
        const template = templates[index];

        if (!template) {
            alert('Template not found');
            return;
        }

        if (!this.demeritGrid) {
            alert('Cannot access demerit grid');
            return;
        }

        // Clear current selection
        this.demeritGrid.clearSelection();

        // Load template demerits
        const regular = template.demerits || [];
        const autoFailure = template.autoFailureDemerits || [];

        regular.forEach(demerit => {
            this.demeritGrid.selectDemerit(demerit);
        });

        autoFailure.forEach(demerit => {
            this.demeritGrid.selectDemerit(demerit);
        });

        // Close modal
        this.close();

        // Notify via callback
        if (this.onTemplateLoad) {
            this.onTemplateLoad(template);
        }

        alert(`✅ Loaded template "${template.name}" with ${regular.length + autoFailure.length} violation(s)`);
    }

    deleteTemplate(index) {
        const templates = this.getTemplates();
        const template = templates[index];

        if (!template) {
            alert('Template not found');
            return;
        }

        const confirmed = confirm(`Are you sure you want to delete the template "${template.name}"?`);
        if (!confirmed) return;

        templates.splice(index, 1);
        storageService.save('inspectionTemplates', templates);

        // Refresh UI
        this.show();

        alert(`✅ Template "${template.name}" deleted`);
    }

    clearAllTemplates() {
        const templates = this.getTemplates();

        if (templates.length === 0) {
            alert('No templates to clear');
            return;
        }

        const confirmed = confirm(`Are you sure you want to delete all ${templates.length} template(s)? This cannot be undone.`);
        if (!confirmed) return;

        storageService.save('inspectionTemplates', []);

        // Refresh UI
        this.show();

        alert('✅ All templates cleared');
    }

    close() {
        this.container.style.display = 'none';
        this.container.innerHTML = '';
        if (this.onClose) {
            this.onClose();
        }
    }
}
