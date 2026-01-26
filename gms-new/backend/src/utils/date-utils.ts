// Date and time utilities for Sri Lankan timezone (UTC+5:30)

export function getNow(): Date {
    return new Date();
}

export function toSriLankaTime(date: Date): Date {
    // Convert to Sri Lanka timezone
    const offset = 5.5 * 60; // UTC+5:30 in minutes
    const localTime = new Date(date.getTime() + offset * 60 * 1000);
    return localTime;
}

export function formatDate(date: Date): string {
    // Format: YYYY-MM-DD
    return date.toISOString().split('T')[0];
}

export function formatDateTime(date: Date): string {
    // Format: YYYY-MM-DD HH:MM:SS
    return date.toISOString().replace('T', ' ').substring(0, 19);
}

export function formatTime(date: Date): string {
    // Format: HH:MM:SS
    return date.toISOString().substring(11, 19);
}

export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export function addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

export function getDaysDifference(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isExpired(expiryDate: Date): boolean {
    return expiryDate < new Date();
}

export function getStartOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

export function getEndOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
}

export function parseTime(timeString: string): { hours: number; minutes: number } {
    // Parse HH:MM format
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
}

export function isWithinBusinessHours(time: Date, openTime: string = '05:30', closeTime: string = '22:00'): boolean {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const currentMinutes = hours * 60 + minutes;

    const opening = parseTime(openTime);
    const closing = parseTime(closeTime);
    const openMinutes = opening.hours * 60 + opening.minutes;
    const closeMinutes = closing.hours * 60 + closing.minutes;

    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}
