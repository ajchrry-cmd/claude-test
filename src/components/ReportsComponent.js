import { isDateInRange, formatDate } from '../utils/dateUtils.js';
import store from '../state/store.js';

export class ReportsComponent {
    constructor(containerElement) {
        this.container = containerElement;
        this.startDate = null;
        this.endDate = null;
    }

    render() {
        const inspections = this.getFilteredInspections();

        this.container.innerHTML = `
            <div class="card">
                <div class="card-header" style="margin-bottom: 24px;">
                    <h2 style="font-size: 24px; font-weight: 800; color: var(--text-primary);">📈 Inspection Reports</h2>
                </div>

                <!-- Date Filters -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                    <div class="form-group">
                        <label class="form-label">Start Date</label>
                        <input type="date" id="report-start-date" class="form-input" value="${this.startDate || ''}" onchange="window.updateReportDates()">
                    </div>
                    <div class="form-group">
                        <label class="form-label">End Date</label>
                        <input type="date" id="report-end-date" class="form-input" value="${this.endDate || ''}" onchange="window.updateReportDates()">
                    </div>
                </div>

                <!-- Quick Filters -->
                <div style="display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap;">
                    <button class="btn btn-secondary btn-small" onclick="window.setReportRange('week')">Last 7 Days</button>
                    <button class="btn btn-secondary btn-small" onclick="window.setReportRange('month')">Last 30 Days</button>
                    <button class="btn btn-secondary btn-small" onclick="window.setReportRange('all')">All Time</button>
                    <button class="btn btn-secondary btn-small" onclick="window.clearReportRange()">Clear Filter</button>
                </div>

                <!-- Report Content -->
                <div id="report-content">
                    ${this.renderReport(inspections)}
                </div>
            </div>
        `;
    }

    getFilteredInspections() {
        let inspections = store.getInspections();

        if (this.startDate || this.endDate) {
            inspections = inspections.filter(insp =>
                isDateInRange(insp.inspectionDate, this.startDate, this.endDate)
            );
        }

        return inspections;
    }

    renderReport(inspections) {
        if (inspections.length === 0) {
            return '<p style="text-align: center; color: var(--text-muted); padding: 40px;">No data available for selected date range</p>';
        }

        const total = inspections.length;
        const outstanding = inspections.filter(i => i.status === 'OUTSTANDING').length;
        const passed = inspections.filter(i => i.status === 'PASSED').length;
        const failed = inspections.filter(i => i.status === 'FAILED').length;
        const passRate = (((outstanding + passed) / total) * 100).toFixed(1);

        let html = `
            <!-- Summary Stats -->
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 32px;">
                <div class="stat-card" style="background: var(--surface-light); padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 36px; font-weight: 800; color: var(--text-primary);">${total}</div>
                    <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-top: 4px;">Total</div>
                </div>
                <div class="stat-card" style="background: var(--surface-light); padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 36px; font-weight: 800; color: #3b82f6;">${outstanding}</div>
                    <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-top: 4px;">Outstanding</div>
                </div>
                <div class="stat-card" style="background: var(--surface-light); padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 36px; font-weight: 800; color: var(--success);">${passed}</div>
                    <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-top: 4px;">Passed</div>
                </div>
                <div class="stat-card" style="background: var(--surface-light); padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 36px; font-weight: 800; color: var(--error);">${failed}</div>
                    <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-top: 4px;">Failed</div>
                </div>
                <div class="stat-card" style="background: var(--surface-light); padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 36px; font-weight: 800; color: var(--text-primary);">${passRate}%</div>
                    <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-top: 4px;">Pass Rate</div>
                </div>
            </div>
        `;

        // Pass Rate Trend Chart
        html += this.renderPassRateTrend(inspections);

        // Inspector Performance
        html += this.renderInspectorPerformance(inspections);

        // Top Violations
        html += this.renderTopViolations(inspections);

        return html;
    }

    renderPassRateTrend(inspections) {
        const dateGroups = {};
        inspections.forEach(insp => {
            const date = insp.inspectionDate;
            if (!dateGroups[date]) {
                dateGroups[date] = { total: 0, passed: 0, outstanding: 0, failed: 0 };
            }
            dateGroups[date].total++;
            if (insp.status === 'OUTSTANDING') dateGroups[date].outstanding++;
            else if (insp.status === 'PASSED') dateGroups[date].passed++;
            else dateGroups[date].failed++;
        });

        const sortedDates = Object.keys(dateGroups).sort();
        const trendData = sortedDates.map(date => {
            const group = dateGroups[date];
            const passRate = (((group.outstanding + group.passed) / group.total) * 100).toFixed(1);
            return { date, passRate: parseFloat(passRate), total: group.total };
        });

        if (trendData.length === 0) return '';

        const barGap = trendData.length > 20 ? '2px' : '6px';

        return `
            <div style="background: var(--surface); padding: 24px; border-radius: 12px; margin-bottom: 24px; border: 1px solid var(--border);">
                <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--text-primary);">📊 Pass Rate Trend</h3>
                <div style="background: var(--background); border-radius: 8px; padding: 20px; min-height: 260px;">
                    <div style="display: flex; align-items: flex-end; gap: ${barGap}; height: 200px;">
                        ${trendData.map(point => {
                            const heightPx = Math.max((point.passRate / 100) * 180, 5);
                            const color = point.passRate >= 90 ? '#10b981' : point.passRate >= 70 ? '#f59e0b' : '#ef4444';
                            return `
                                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; min-width: 20px;">
                                    <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 6px; font-weight: 600;">${point.passRate}%</div>
                                    <div style="width: 100%; background: ${color}; height: ${heightPx}px; border-radius: 6px 6px 0 0; transition: opacity 0.3s; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"
                                         onmouseover="this.style.opacity='0.7'"
                                         onmouseout="this.style.opacity='1'"
                                         title="${formatDate(point.date)}: ${point.passRate}% (${point.total} inspections)">
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div style="display: flex; gap: ${barGap}; margin-top: 12px;">
                        ${trendData.map(point => `
                            <div style="flex: 1; min-width: 20px; font-size: 9px; color: var(--text-muted); text-align: center; ${trendData.length > 15 ? 'writing-mode: vertical-rl; transform: rotate(180deg); margin-top: 6px;' : ''}">${new Date(point.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</div>
                        `).join('')}
                    </div>
                </div>
                <div style="text-align: center; margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border); font-size: 12px; color: var(--text-secondary);">
                    <span style="display: inline-block; width: 14px; height: 14px; background: #10b981; border-radius: 3px; vertical-align: middle; margin-right: 6px;"></span> ≥90%
                    <span style="display: inline-block; width: 14px; height: 14px; background: #f59e0b; border-radius: 3px; vertical-align: middle; margin: 0 6px 0 16px;"></span> 70-89%
                    <span style="display: inline-block; width: 14px; height: 14px; background: #ef4444; border-radius: 3px; vertical-align: middle; margin: 0 6px 0 16px;"></span> <70%
                </div>
            </div>
        `;
    }

    renderInspectorPerformance(inspections) {
        const inspectorStats = {};
        inspections.forEach(insp => {
            const inspector = insp.inspectorName || 'Unknown';
            if (!inspectorStats[inspector]) {
                inspectorStats[inspector] = { total: 0, passed: 0, outstanding: 0, failed: 0, totalScore: 0 };
            }
            inspectorStats[inspector].total++;
            inspectorStats[inspector].totalScore += insp.score || 0;
            if (insp.status === 'OUTSTANDING') inspectorStats[inspector].outstanding++;
            else if (insp.status === 'PASSED') inspectorStats[inspector].passed++;
            else inspectorStats[inspector].failed++;
        });

        const inspectorData = Object.keys(inspectorStats).map(name => ({
            name,
            ...inspectorStats[name],
            passRate: (((inspectorStats[name].outstanding + inspectorStats[name].passed) / inspectorStats[name].total) * 100).toFixed(1),
            avgScore: (inspectorStats[name].totalScore / inspectorStats[name].total).toFixed(1)
        })).sort((a, b) => b.total - a.total);

        if (inspectorData.length === 0) return '';

        return `
            <div style="background: var(--surface); padding: 24px; border-radius: 12px; margin-bottom: 24px; border: 1px solid var(--border);">
                <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--text-primary);">👥 Inspector Performance</h3>
                <div style="display: grid; gap: 14px;">
                    ${inspectorData.map(inspector => {
                        const outstandingPct = (inspector.outstanding / inspector.total) * 100;
                        const passedPct = (inspector.passed / inspector.total) * 100;
                        const failedPct = (inspector.failed / inspector.total) * 100;
                        const passRateColor = inspector.passRate >= 90 ? '#10b981' : inspector.passRate >= 70 ? '#f59e0b' : '#ef4444';
                        return `
                            <div style="background: var(--surface-light); padding: 16px; border-radius: 10px; border: 1px solid var(--border);">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                    <div style="font-weight: 700; font-size: 15px; color: var(--text-primary);">${inspector.name}</div>
                                    <div style="font-size: 13px; color: var(--text-muted);">${inspector.total} inspections</div>
                                </div>
                                <div style="display: flex; gap: 4px; margin-bottom: 10px; height: 32px;">
                                    ${inspector.outstanding > 0 ? `
                                        <div style="width: ${outstandingPct}%; min-width: 30px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: white; position: relative; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);">
                                            ${inspector.outstanding}
                                            <div style="position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); font-size: 9px; color: var(--text-muted); white-space: nowrap;">Outstanding</div>
                                        </div>
                                    ` : ''}
                                    ${inspector.passed > 0 ? `
                                        <div style="width: ${passedPct}%; min-width: 30px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: white; position: relative; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);">
                                            ${inspector.passed}
                                            <div style="position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); font-size: 9px; color: var(--text-muted); white-space: nowrap;">Passed</div>
                                        </div>
                                    ` : ''}
                                    ${inspector.failed > 0 ? `
                                        <div style="width: ${failedPct}%; min-width: 30px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: white; position: relative; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);">
                                            ${inspector.failed}
                                            <div style="position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); font-size: 9px; color: var(--text-muted); white-space: nowrap;">Failed</div>
                                        </div>
                                    ` : ''}
                                </div>
                                <div style="display: flex; gap: 20px; font-size: 13px; color: var(--text-muted); margin-top: 26px; padding-top: 10px; border-top: 1px solid var(--border);">
                                    <div>Pass Rate: <span style="color: ${passRateColor}; font-weight: 700;">${inspector.passRate}%</span></div>
                                    <div>Avg Score: <span style="font-weight: 700; color: var(--text-primary);">${inspector.avgScore}</span></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    renderTopViolations(inspections) {
        const violationCounts = {};
        inspections.forEach(insp => {
            if (insp.demerits) {
                insp.demerits.forEach(d => {
                    violationCounts[d] = (violationCounts[d] || 0) + 1;
                });
            }
            if (insp.autoFailureDemerits) {
                insp.autoFailureDemerits.forEach(d => {
                    violationCounts[d] = (violationCounts[d] || 0) + 1;
                });
            }
        });

        const topViolations = Object.entries(violationCounts)
            .map(([name, count]) => ({ name, count, percentage: ((count / inspections.length) * 100).toFixed(1) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        if (topViolations.length === 0) return '';

        const maxCount = topViolations[0].count;

        return `
            <div style="background: var(--surface); padding: 24px; border-radius: 12px; margin-bottom: 24px; border: 1px solid var(--border);">
                <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--text-primary);">⚠️ Most Common Violations</h3>
                <div style="display: grid; gap: 10px;">
                    ${topViolations.map((violation, index) => {
                        const widthPct = (violation.count / maxCount) * 100;
                        const barColor = index === 0 ? '#ef4444' : index < 3 ? '#f59e0b' : '#6366f1';
                        return `
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                    <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">${violation.name}</div>
                                    <div style="font-size: 12px; color: var(--text-muted);">${violation.count} times (${violation.percentage}%)</div>
                                </div>
                                <div style="background: var(--background); border-radius: 6px; height: 28px; overflow: hidden; position: relative;">
                                    <div style="width: ${widthPct}%; height: 100%; background: linear-gradient(90deg, ${barColor}, ${barColor}dd); border-radius: 6px; transition: width 0.5s ease; display: flex; align-items: center; justify-content: flex-end; padding-right: 12px;">
                                        <span style="font-size: 12px; font-weight: 700; color: white;">${violation.count}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    updateDateRange(startDate, endDate) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.render();
    }
}
