import { SCORE_THRESHOLDS, POINTS } from '../config/constants.js';

export function calculateScore(regularDemerits = [], autoFailureDemerits = []) {
    const regularPoints = regularDemerits.length * POINTS.REGULAR_DEMERIT;
    const autoFailurePoints = autoFailureDemerits.length * POINTS.AUTO_FAILURE;
    return regularPoints + autoFailurePoints;
}

export function getStatus(score) {
    if (score === SCORE_THRESHOLDS.OUTSTANDING) {
        return 'OUTSTANDING';
    } else if (score <= SCORE_THRESHOLDS.PASSED_MAX) {
        return 'PASSED';
    } else {
        return 'FAILED';
    }
}

export function getStatusColor(status) {
    const colors = {
        'OUTSTANDING': '#3b82f6',
        'PASSED': '#10b981',
        'FAILED': '#ef4444'
    };
    return colors[status] || '#94a3b8';
}

export function getStatusClass(status) {
    return status.toLowerCase();
}

export function calculateInspectionResult(regularDemerits, autoFailureDemerits) {
    const score = calculateScore(regularDemerits, autoFailureDemerits);
    const status = getStatus(score);
    const color = getStatusColor(status);

    return {
        score,
        status,
        color,
        statusClass: getStatusClass(status),
        isPassing: status !== 'FAILED'
    };
}
