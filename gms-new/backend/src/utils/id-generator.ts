// ID Generator for PowerWorld Gyms
// Format: PWG-{LOCATION}-{TYPE}-{SEQUENCE}
// Example: PWG-KBT-MEM-00001

import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 5);

const LOCATION_CODE = process.env.GYM_LOCATION_CODE || 'KBT'; // Kiribathgoda

export function generateMemberId(): string {
    return `PWG-${LOCATION_CODE}-MEM-${nanoid()}`;
}

export function generateTrainerId(): string {
    return `PWG-${LOCATION_CODE}-TRN-${nanoid()}`;
}

export function generateStaffId(): string {
    return `PWG-${LOCATION_CODE}-STF-${nanoid()}`;
}

export function generateSubscriptionId(): string {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    return `PWG-SUB-${date}-${nanoid()}`;
}

export function generatePaymentId(): string {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    return `PWG-PAY-${date}-${nanoid()}`;
}

export function generateAppointmentId(): string {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    return `PWG-APT-${date}-${nanoid()}`;
}

export function generateWorkoutId(): string {
    return `PWG-WRK-${nanoid()}`;
}

export function generateEquipmentId(): string {
    return `PWG-EQP-${nanoid()}`;
}
