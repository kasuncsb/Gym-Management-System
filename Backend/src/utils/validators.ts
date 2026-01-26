// Validation utilities for Sri Lankan context

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
    // Sri Lankan phone formats:
    // Mobile: +94771234567 or 0771234567
    // Landline: +94112345678 or 0112345678
    const phoneRegex = /^(\+94|0)?[17]\d{8}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

export function formatPhoneNumber(phone: string): string {
    // Normalize to +94 format
    const cleaned = phone.replace(/[\s-]/g, '');
    if (cleaned.startsWith('+94')) {
        return cleaned;
    }
    if (cleaned.startsWith('0')) {
        return `+94${cleaned.substring(1)}`;
    }
    if (cleaned.startsWith('94')) {
        return `+${cleaned}`;
    }
    return `+94${cleaned}`;
}

export function validateNIC(nic: string): boolean {
    // Sri Lankan NIC formats:
    // Old: 123456789V or 123456789X (9 digits + V/X)
    // New: 200012345678 (12 digits)
    const oldNicRegex = /^\d{9}[VvXx]$/;
    const newNicRegex = /^\d{12}$/;
    return oldNicRegex.test(nic) || newNicRegex.test(nic);
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

export function sanitizeInput(input: string): string {
    // Remove potential XSS threats
    return input
        .trim()
        .replace(/[<>]/g, '')
        .substring(0, 1000); // Max length
}

export function validateAmount(amount: number): boolean {
    return amount > 0 && amount < 1000000 && Number.isFinite(amount);
}

export function validateDateRange(startDate: Date, endDate: Date): boolean {
    return startDate <= endDate;
}
