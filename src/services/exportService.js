import * as XLSX from 'xlsx';

class ExportService {
    async exportToExcel(inspections) {
        try {
            const wb = XLSX.utils.book_new();

            // Summary Sheet
            const summaryData = this.generateSummaryData(inspections);
            const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

            // Detailed Inspections Sheet
            const inspectionsData = this.generateInspectionsData(inspections);
            const wsInspections = XLSX.utils.json_to_sheet(inspectionsData);
            XLSX.utils.book_append_sheet(wb, wsInspections, 'Inspections');

            // Violations Matrix Sheet
            const matrixData = this.generateViolationsMatrix(inspections);
            const wsMatrix = XLSX.utils.aoa_to_sheet(matrixData);
            XLSX.utils.book_append_sheet(wb, wsMatrix, 'Violations Matrix');

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `DormInspections_${timestamp}.xlsx`;

            // Download
            XLSX.writeFile(wb, filename);

            return true;
        } catch (error) {
            console.error('Excel export failed:', error);
            throw error;
        }
    }

    generateSummaryData(inspections) {
        const total = inspections.length;
        const outstanding = inspections.filter(i => i.status === 'OUTSTANDING').length;
        const passed = inspections.filter(i => i.status === 'PASSED').length;
        const failed = inspections.filter(i => i.status === 'FAILED').length;
        const passRate = total > 0 ? (((outstanding + passed) / total) * 100).toFixed(1) : 0;

        return [
            ['Dorm Inspection Report'],
            ['Generated:', new Date().toLocaleString()],
            [''],
            ['Summary Statistics'],
            ['Total Inspections', total],
            ['Outstanding', outstanding],
            ['Passed', passed],
            ['Failed', failed],
            ['Pass Rate', `${passRate}%`],
            [''],
            ['By Inspector'],
            ...this.getInspectorStats(inspections)
        ];
    }

    getInspectorStats(inspections) {
        const stats = {};
        inspections.forEach(insp => {
            const name = insp.inspectorName || 'Unknown';
            if (!stats[name]) {
                stats[name] = { total: 0, outstanding: 0, passed: 0, failed: 0 };
            }
            stats[name].total++;
            if (insp.status === 'OUTSTANDING') stats[name].outstanding++;
            else if (insp.status === 'PASSED') stats[name].passed++;
            else stats[name].failed++;
        });

        return Object.keys(stats).map(name => {
            const s = stats[name];
            const passRate = ((s.outstanding + s.passed) / s.total * 100).toFixed(1);
            return [name, s.total, s.outstanding, s.passed, s.failed, `${passRate}%`];
        });
    }

    generateInspectionsData(inspections) {
        return inspections.map(insp => ({
            'Room': insp.roomNumber,
            'Date': insp.inspectionDate,
            'Inspector': insp.inspectorName || 'Unknown',
            'Score': insp.score,
            'Status': insp.status,
            'Regular Violations': (insp.demerits || []).join(', '),
            'Auto-Failure Violations': (insp.autoFailureDemerits || []).join(', '),
            'Total Violations': (insp.demerits?.length || 0) + (insp.autoFailureDemerits?.length || 0)
        }));
    }

    generateViolationsMatrix(inspections) {
        // Count violations
        const violationCounts = {};
        inspections.forEach(insp => {
            if (insp.demerits) {
                insp.demerits.forEach(v => {
                    violationCounts[v] = (violationCounts[v] || 0) + 1;
                });
            }
            if (insp.autoFailureDemerits) {
                insp.autoFailureDemerits.forEach(v => {
                    violationCounts[v] = (violationCounts[v] || 0) + 1;
                });
            }
        });

        // Sort by frequency
        const sorted = Object.entries(violationCounts)
            .sort((a, b) => b[1] - a[1]);

        return [
            ['Violation Type', 'Count', 'Percentage'],
            ...sorted.map(([violation, count]) => {
                const percentage = ((count / inspections.length) * 100).toFixed(1);
                return [violation, count, `${percentage}%`];
            })
        ];
    }
}

export default new ExportService();
