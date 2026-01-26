// QR Scanning and Door Access Service - UC-01, UC-04 - Drizzle ORM
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { db } from '../config/database';
import { members, attendance, doorAccess } from '../db/schema';
import { SubscriptionService } from './subscription.service';
import { parseQRCode, validateQRToken } from '../utils/qr-generator';
import logger from '../config/logger';

export interface ScanResult {
    success: boolean;
    memberId?: string;
    memberName?: string;
    accessGranted?: boolean;
    subscriptionValid?: boolean;
    message: string;
    attendanceId?: number;
    accessId?: number;
}

export class DoorAccessService {
    // UC-01: Scan QR Code and process entry/exit
    static async processQRScan(
        qrData: string,
        gateId: string,
        deviceId: string,
        location: string = 'Main Entrance'
    ): Promise<ScanResult> {
        try {
            // Step 1: Parse and validate QR code
            let memberId: string;

            // Try parsing as JSON (from QR code image)
            const qrParsed = parseQRCode(qrData);
            if (qrParsed.valid && qrParsed.memberId) {
                memberId = qrParsed.memberId;
            } else {
                // Try parsing as token string
                const tokenValidation = validateQRToken(qrData);
                if (!tokenValidation.valid || !tokenValidation.memberId) {
                    return {
                        success: false,
                        accessGranted: false,
                        message: tokenValidation.reason || 'Invalid QR code'
                    };
                }
                memberId = tokenValidation.memberId;
            }

            // Step 2: Get member details
            const [member] = await db.select({
                memberId: members.memberId,
                name: members.name,
                status: members.status,
                deletedAt: members.deletedAt
            })
                .from(members)
                .where(eq(members.memberId, memberId))
                .limit(1);

            if (!member || member.deletedAt) {
                await this.logDoorAccess(null, gateId, 'ENTRY', 'DENIED', 'Member not found');
                return {
                    success: false,
                    accessGranted: false,
                    message: 'Member not found'
                };
            }

            if (member.status !== 'ACTIVE') {
                await this.logDoorAccess(memberId, gateId, 'ENTRY', 'DENIED', 'Member account inactive');
                return {
                    success: false,
                    accessGranted: false,
                    memberId,
                    memberName: member.name,
                    message: 'Account is not active'
                };
            }

            // Step 3: Validate subscription (UC-02)
            const validation = await SubscriptionService.validateSubscription(memberId);

            if (!validation.valid) {
                await this.logDoorAccess(memberId, gateId, 'ENTRY', 'DENIED', validation.reason);
                return {
                    success: true,
                    accessGranted: false,
                    subscriptionValid: false,
                    memberId,
                    memberName: member.name,
                    message: validation.reason || 'Subscription invalid'
                };
            }

            // Step 4: Determine entry or exit
            const lastAttendance = await this.getLastAttendance(memberId);
            const eventType = !lastAttendance || lastAttendance.eventType === 'OUT' ? 'IN' : 'OUT';

            // Step 5: Record attendance (UC-04)
            const attendanceRecord = await this.recordAttendance(
                memberId,
                eventType,
                gateId,
                deviceId,
                location
            );

            // Step 6: Log door access
            const accessLog = await this.logDoorAccess(memberId, gateId, eventType === 'IN' ? 'ENTRY' : 'EXIT', 'GRANTED');

            logger.info('QR scan successful', {
                memberId,
                memberName: member.name,
                eventType,
                gateId,
                accessId: accessLog.accessId
            });

            return {
                success: true,
                accessGranted: true,
                subscriptionValid: true,
                memberId,
                memberName: member.name,
                message: eventType === 'IN' ? 'Welcome to PowerWorld Gym!' : 'Thank you for visiting!',
                attendanceId: attendanceRecord.attendanceId,
                accessId: accessLog.accessId
            };

        } catch (error) {
            logger.error('QR scan failed', { error, qrData, gateId });
            return {
                success: false,
                accessGranted: false,
                message: 'System error occurred. Please contact staff.'
            };
        }
    }

    // UC-04: Record attendance timestamp
    static async recordAttendance(
        memberId: string,
        eventType: 'IN' | 'OUT',
        gateId?: string,
        deviceId?: string,
        location?: string
    ) {
        const [record] = await db.insert(attendance)
            .values({
                memberId,
                eventType,
                gateId,
                deviceId,
                location,
                timestamp: new Date()
            })
            .$returningId();

        return {
            attendanceId: record.attendanceId,
            memberId,
            eventType,
            timestamp: new Date()
        };
    }

    // Log door access attempt
    private static async logDoorAccess(
        memberId: string | null,
        doorId: string,
        accessType: 'ENTRY' | 'EXIT',
        status: 'GRANTED' | 'DENIED',
        reason?: string
    ) {
        const [accessRecord] = await db.insert(doorAccess)
            .values({
                memberId,
                doorId,
                accessType,
                status,
                reason,
                accessTime: new Date()
            })
            .$returningId();

        return {
            accessId: accessRecord.accessId,
            memberId,
            doorId,
            status
        };
    }

    // Get last attendance record
    static async getLastAttendance(memberId: string) {
        const [record] = await db.select()
            .from(attendance)
            .where(eq(attendance.memberId, memberId))
            .orderBy(desc(attendance.timestamp))
            .limit(1);

        return record;
    }

    // Get attendance history
    static async getAttendanceHistory(
        memberId: string,
        startDate?: Date,
        endDate?: Date,
        limit: number = 50
    ) {
        const conditions = [eq(attendance.memberId, memberId)];
        if (startDate) conditions.push(gte(attendance.timestamp, startDate));
        if (endDate) conditions.push(lte(attendance.timestamp, endDate));

        const records = await db.select()
            .from(attendance)
            .where(and(...conditions))
            .orderBy(desc(attendance.timestamp))
            .limit(limit);

        return records;
    }

    // Get door access logs (for admin)
    static async getAccessLogs(
        startDate?: Date,
        endDate?: Date,
        status?: 'GRANTED' | 'DENIED',
        limit: number = 100
    ) {
        const conditions = [];
        if (startDate) conditions.push(gte(doorAccess.accessTime, startDate));
        if (endDate) conditions.push(lte(doorAccess.accessTime, endDate));
        if (status) conditions.push(eq(doorAccess.status, status));

        const logs = await db.select()
            .from(doorAccess)
            .leftJoin(members, eq(doorAccess.memberId, members.memberId))
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(doorAccess.accessTime))
            .limit(limit);

        return logs.map(log => ({
            ...log.door_access,
            member: log.members ? {
                memberId: log.members.memberId,
                name: log.members.name,
                email: log.members.email
            } : null
        }));
    }
}
