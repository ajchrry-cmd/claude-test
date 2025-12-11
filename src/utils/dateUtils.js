export function formatDate(date) {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

export function formatTime(date) {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function formatDateTime(date) {
    return `${formatDate(date)} ${formatTime(date)}`;
}

export function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

export function getDateRange(type) {
    const end = new Date();
    const start = new Date();

    switch (type) {
        case 'week':
            start.setDate(end.getDate() - 7);
            break;
        case 'month':
            start.setDate(end.getDate() - 30);
            break;
        case 'all':
            start.setFullYear(2000);
            break;
        default:
            return { start: null, end: null };
    }

    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
    };
}

export function isDateInRange(date, startDate, endDate) {
    if (!date) return false;
    const d = typeof date === 'string' ? new Date(date) : date;

    if (startDate && d < new Date(startDate)) return false;
    if (endDate && d > new Date(endDate)) return false;

    return true;
}
