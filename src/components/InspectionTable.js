import { formatDate } from '../utils/dateUtils.js';
import store from '../state/store.js';

export class InspectionTable {
    constructor() {
        this.onEdit = null;
        this.onDelete = null;
    }

    render(inspections) {
        if (!inspections || inspections.length === 0) {
            return `
                <div class="empty-state" style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
                    <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
                    <div>No inspections yet</div>
                </div>
            `;
        }

        const settings = store.getSettings();
        const cellPadding = settings.density === 'compact' ? '8px 12px' :
                           settings.density === 'spacious' ? '14px 18px' : '10px 14px';
        const fontSize = settings.density === 'compact' ? '13px' :
                        settings.density === 'spacious' ? '15px' : '14px';

        // Build headers based on visible fields
        let headers = '';
        if (settings.showFields.roomNumber) headers += `<th style="padding: ${cellPadding}; text-align: left; font-weight: 700; background: var(--surface-light); border-bottom: 2px solid var(--border); position: sticky; top: 0; z-index: 1;">Room</th>`;
        if (settings.showFields.date) headers += `<th style="padding: ${cellPadding}; text-align: left; font-weight: 700; background: var(--surface-light); border-bottom: 2px solid var(--border); position: sticky; top: 0; z-index: 1;">Date</th>`;
        if (settings.showFields.inspector) headers += `<th style="padding: ${cellPadding}; text-align: left; font-weight: 700; background: var(--surface-light); border-bottom: 2px solid var(--border); position: sticky; top: 0; z-index: 1;">Inspector</th>`;
        if (settings.showFields.score) headers += `<th style="padding: ${cellPadding}; text-align: center; font-weight: 700; background: var(--surface-light); border-bottom: 2px solid var(--border); position: sticky; top: 0; z-index: 1;">Score</th>`;
        if (settings.showFields.violations) headers += `<th style="padding: ${cellPadding}; text-align: center; font-weight: 700; background: var(--surface-light); border-bottom: 2px solid var(--border); position: sticky; top: 0; z-index: 1;">Violations</th>`;
        headers += `<th style="padding: ${cellPadding}; text-align: center; font-weight: 700; background: var(--surface-light); border-bottom: 2px solid var(--border); position: sticky; top: 0; z-index: 1;">Status</th>`;
        headers += `<th style="padding: ${cellPadding}; text-align: center; font-weight: 700; background: var(--surface-light); border-bottom: 2px solid var(--border); position: sticky; top: 0; z-index: 1;">Actions</th>`;

        // Build rows
        const rows = inspections.map(inspection => this.renderRow(inspection, settings, cellPadding, fontSize)).join('');

        return `
            <div class="inspection-table-container" style="overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: ${settings.borderRadius}px; border: 1px solid var(--border);">
                <table style="width: 100%; border-collapse: collapse; font-size: ${fontSize}; background: var(--surface); min-width: 600px;">
                    <thead>
                        <tr>
                            ${headers}
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderRow(inspection, settings, cellPadding, fontSize) {
        const roomProps = store.state.roomProperties[inspection.roomNumber] || {};
        const statusColor = inspection.status === 'OUTSTANDING' ? '#3b82f6' :
                           inspection.status === 'PASSED' ? '#10b981' : '#ef4444';

        let cells = '';

        // Room number with badges
        if (settings.showFields.roomNumber) {
            let badges = '';
            if (settings.showFields.shift && roomProps.shift) {
                const shiftColors = {
                    'S': '#10b981',
                    'T': '#f59e0b',
                    'R': '#ef4444'
                };
                const color = shiftColors[roomProps.shift] || '#94a3b8';
                badges += `<span style="margin-left: 6px; padding: 2px 6px; background: ${color}20; color: ${color}; border-radius: 4px; font-size: 10px; font-weight: 700;">${roomProps.shift}</span>`;
            }
            if (settings.showFields.gender && roomProps.gender) {
                const icon = roomProps.gender === 'Male' ? '👨' : '👩';
                badges += `<span style="margin-left: 4px;">${icon}</span>`;
            }
            cells += `<td style="padding: ${cellPadding}; border-bottom: 1px solid var(--border); font-weight: 600;">Room ${inspection.roomNumber}${badges}</td>`;
        }

        // Date
        if (settings.showFields.date) {
            cells += `<td style="padding: ${cellPadding}; border-bottom: 1px solid var(--border); color: var(--text-secondary);">${formatDate(inspection.inspectionDate)}</td>`;
        }

        // Inspector
        if (settings.showFields.inspector) {
            cells += `<td style="padding: ${cellPadding}; border-bottom: 1px solid var(--border);">${inspection.inspectorName || 'Unknown'}</td>`;
        }

        // Score
        if (settings.showFields.score) {
            cells += `<td style="padding: ${cellPadding}; border-bottom: 1px solid var(--border); text-align: center; font-weight: 700; font-size: 16px;">${inspection.score}</td>`;
        }

        // Violations count
        if (settings.showFields.violations) {
            const totalViolations = (inspection.demerits?.length || 0) + (inspection.autoFailureDemerits?.length || 0);
            cells += `<td style="padding: ${cellPadding}; border-bottom: 1px solid var(--border); text-align: center;">
                ${totalViolations > 0 ? `<span style="padding: 4px 8px; background: var(--surface-light); border-radius: 4px; font-weight: 600;">${totalViolations}</span>` : '-'}
            </td>`;
        }

        // Status badge
        cells += `<td style="padding: ${cellPadding}; border-bottom: 1px solid var(--border); text-align: center;">
            <span style="padding: 4px 12px; background: ${statusColor}; color: white; border-radius: 6px; font-size: 11px; font-weight: 700; display: inline-block;">
                ${inspection.status}
            </span>
        </td>`;

        // Actions
        cells += `<td style="padding: ${cellPadding}; border-bottom: 1px solid var(--border); text-align: center;">
            <div style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;">
                <button onclick="window.editInspection('${inspection.id}')" style="padding: 8px 12px; background: var(--warning); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; min-height: 32px; white-space: nowrap;">✏️ Edit</button>
                <button onclick="window.deleteInspection('${inspection.id}')" style="padding: 8px 12px; background: var(--error); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; min-height: 32px; white-space: nowrap;">🗑️ Delete</button>
            </div>
        </td>`;

        return `
            <tr style="transition: background 0.2s;" onmouseover="this.style.background='var(--surface-light)'" onmouseout="this.style.background='transparent'">
                ${cells}
            </tr>
        `;
    }
}
