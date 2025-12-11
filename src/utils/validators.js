import { ROOM_RANGES } from '../config/constants.js';

export function validateRoomNumber(roomNumber) {
    const num = parseInt(roomNumber);
    return (num >= ROOM_RANGES.floor2.start && num <= ROOM_RANGES.floor2.end) ||
           (num >= ROOM_RANGES.floor3.start && num <= ROOM_RANGES.floor3.end);
}

export function validateInspection(inspection) {
    const errors = [];

    if (!inspection.roomNumber) {
        errors.push('Room number is required');
    } else if (!validateRoomNumber(inspection.roomNumber)) {
        errors.push('Invalid room number');
    }

    if (!inspection.inspectorName) {
        errors.push('Inspector name is required');
    }

    if (!inspection.inspectionDate) {
        errors.push('Inspection date is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

export function sanitizeInput(input) {
    if (typeof input !== 'string') return input;

    // Basic XSS prevention
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}
