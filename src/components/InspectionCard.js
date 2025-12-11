import { formatDate } from '../utils/dateUtils.js';
import store from '../state/store.js';

export class InspectionCard {
    constructor() {
        this.onEdit = null;
        this.onDelete = null;
    }

    render(inspection) {
        const settings = store.getSettings();
        const roomProps = store.state.roomProperties[inspection.roomNumber] || {};

        const statusClass = inspection.status === 'OUTSTANDING' ? 'outstanding' :
                           inspection.status === 'PASSED' ? 'pass' : 'fail';
        const statusColor = statusClass === 'outstanding' ? '#3b82f6' :
                           statusClass === 'pass' ? '#10b981' : '#ef4444';

        const padding = settings.density === 'compact' ? '12px' :
                       settings.density === 'spacious' ? '20px' : '16px';
        const fontSize = settings.density === 'compact' ? '13px' :
                        settings.density === 'spacious' ? '15px' : '14px';

        let badges = '';
        if (settings.showFields.shift && roomProps.shift) {
            const shiftColors = {
                'S': { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' },
                'T': { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' },
                'R': { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' }
            };
            const colors = shiftColors[roomProps.shift] || { bg: 'rgba(148, 163, 184, 0.2)', text: '#94a3b8' };
            badges += `<span style="padding: 3px 8px; background: ${colors.bg}; border-radius: 4px; font-size: 11px; font-weight: 700; color: ${colors.text}; margin-left: 6px;">${roomProps.shift}</span>`;
        }
        if (settings.showFields.gender && roomProps.gender) {
            const genderIcon = roomProps.gender === 'Male' ? '👨' : '👩';
            badges += `<span style="margin-left: 6px; font-size: 12px;">${genderIcon}</span>`;
        }

        let details = '';
        if (settings.showFields.date) {
            details += `<div style="display: flex; align-items: center; gap: 8px;"><span>📅</span><span>${formatDate(inspection.inspectionDate)}</span></div>`;
        }
        if (settings.showFields.inspector) {
            details += `<div style="display: flex; align-items: center; gap: 8px;"><span>👤</span><span>${inspection.inspectorName || 'Unknown'}</span></div>`;
        }
        if (settings.showFields.score) {
            details += `<div style="display: flex; align-items: center; gap: 8px;"><span>📊</span><span>${inspection.score} points</span></div>`;
        }
        if (settings.showFields.violations && (inspection.demerits?.length > 0 || inspection.autoFailureDemerits?.length > 0)) {
            const totalViolations = (inspection.demerits?.length || 0) + (inspection.autoFailureDemerits?.length || 0);
            details += `<div style="display: flex; align-items: center; gap: 8px;"><span>⚠️</span><span>${totalViolations} violation${totalViolations !== 1 ? 's' : ''}</span></div>`;
        }

        return `
            <div class="inspection-card ${statusClass}" style="padding: ${padding}; margin-bottom: 12px; background: var(--surface); border: 1px solid var(--border); border-left: 4px solid ${statusColor}; border-radius: ${settings.borderRadius}px; box-shadow: var(--card-shadow);">
                <div class="inspection-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div>
                        <h3 class="inspection-title" style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin: 0;">
                            Room ${inspection.roomNumber}${badges}
                        </h3>
                    </div>
                    <span class="inspection-badge ${statusClass}" style="padding: 6px 12px; background: ${statusColor}; color: white; border-radius: 6px; font-size: 12px; font-weight: 700;">
                        ${inspection.status}
                    </span>
                </div>
                <div style="display: grid; gap: 8px; font-size: ${fontSize}; color: var(--text-secondary); margin-bottom: 12px;">
                    ${details}
                </div>
                ${this.renderViolations(inspection, settings)}
                <div class="inspection-actions" style="display: flex; gap: 8px; margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border);">
                    <button class="btn btn-warning btn-small" onclick="window.editInspection('${inspection.id}')" style="flex: 1;">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-danger btn-small" onclick="window.deleteInspection('${inspection.id}')" style="flex: 1;">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
    }

    renderViolations(inspection, settings) {
        if (!settings.showFields.violations) return '';

        let violations = '';
        if (inspection.demerits && inspection.demerits.length > 0) {
            violations += `
                <div style="margin-top: 8px;">
                    <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">VIOLATIONS (1pt each):</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                        ${inspection.demerits.map(d => `<span style="padding: 4px 8px; background: var(--surface-light); border-radius: 4px; font-size: 11px;">${d}</span>`).join('')}
                    </div>
                </div>
            `;
        }
        if (inspection.autoFailureDemerits && inspection.autoFailureDemerits.length > 0) {
            violations += `
                <div style="margin-top: 8px;">
                    <div style="font-size: 12px; font-weight: 700; color: var(--error); margin-bottom: 4px;">AUTO-FAILURE (4pts each):</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                        ${inspection.autoFailureDemerits.map(d => `<span style="padding: 4px 8px; background: rgba(239, 68, 68, 0.2); border-radius: 4px; font-size: 11px; color: var(--error); font-weight: 600;">${d}</span>`).join('')}
                    </div>
                </div>
            `;
        }
        return violations;
    }

    renderList(inspections) {
        return inspections.map(insp => this.render(insp)).join('');
    }
}
