// QR Scanning and Door Access Service - UC-01, UC-04 - Drizzle ORM
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { db } from '../config/database';
import { members, accessLogs, users } from '../db/schema';
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
    attendanceId?: string;
    accessId?: string;
}

export class DoorAccessService {
    // UC-01: Scan QR Code and process entry/exit
    static async processQRScan(
        qrData: string,
        gateId: string,
        deviceId: string, // Not used in schema currently, maybe map to gateId/deviceId logic later
        location: string = 'Main Entrance' // Not used in schema
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
            const [result] = await db.select({
                member: members,
                user: users
            })
                .from(members)
                .innerJoin(users, eq(members.userId, users.id))
                .where(eq(members.id, memberId))
                .limit(1);

            if (!result || result.member.deletedAt) {
                await this.logDoorAccess(null, gateId, 'in', false, 'Member not found');
                return {
                    success: false,
                    accessGranted: false,
                    message: 'Member not found'
                };
            }

            const { member, user } = result;

            if (member.status !== 'active') {
                await this.logDoorAccess(memberId, gateId, 'in', false, 'Member account inactive');
                return {
                    success: false,
                    accessGranted: false,
                    memberId,
                    memberName: user.fullName,
                    message: 'Account is not active'
                };
            }

            // Step 3: Validate subscription (UC-02)
            const validation = await SubscriptionService.validateSubscription(memberId);

            if (!validation.valid) {
                await this.logDoorAccess(memberId, gateId, 'in', false, validation.reason);
                return {
                    success: true, // Scan success, access denied
                    accessGranted: false,
                    subscriptionValid: false,
                    memberId,
                    memberName: user.fullName,
                    message: validation.reason || 'Subscription invalid'
                };
            }

            // Step 4: Determine entry or exit
            const lastAttendance = await this.getLastAttendance(memberId);
            const eventType: 'in' | 'out' = !lastAttendance || lastAttendance.direction === 'out' ? 'in' : 'out';

            // Step 5: Record attendance (UC-04) & Log
            // Schema has consolidated accessLogs. We insert one record.
            const accessLog = await this.recordAccess(
                memberId, // uses userId in schema? Check schema: accessLogs.userId -> users.id. memberId maps to userId via members table.
                user.id, // passing userId explicitly
                eventType,
                gateId,
                true // authorized
            );

            logger.info('QR scan successful', {
                memberId,
                memberName: user.fullName,
                eventType,
                gateId,
                accessId: accessLog.id
            });

            return {
                success: true,
                accessGranted: true,
                subscriptionValid: true,
                memberId,
                memberName: user.fullName,
                message: eventType === 'in' ? 'Welcome to PowerWorld Gym!' : 'Thank you for visiting!',
                attendanceId: accessLog.id,
                accessId: accessLog.id
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

    // Record Access (Attendance)
    static async recordAccess(
        memberId: string,
        userId: string,
        direction: 'in' | 'out',
        gateId?: string,
        isAuthorized: boolean = true,
        denyReason?: string
    ) {
        // Schema: accessLogs { id, userId, gateId, timestamp, direction, isAuthorized, denyReason... }
        // We need userId.

        await db.insert(accessLogs).values({
            id: crypto.randomUUID(),
            userId: userId,
            gateId: gateId, // needs to match UUID format if gateId is UUID
            timestamp: new Date(),
            direction: direction,
            isAuthorized: isAuthorized,
            denyReason: denyReason
        });

        // Return mostly for compatibility or logging
        return { id: 'log-id-placeholder' };
    }

    // Log door access attempt (wrapper for recordAccess)
    private static async logDoorAccess(
        memberId: string | null,
        gateId: string,
        direction: 'in' | 'out',
        isAuthorized: boolean,
        reason?: string
    ) {
        let userId = null;
        if (memberId) {
            const [mem] = await db.select({ userId: members.userId }).from(members).where(eq(members.id, memberId)).limit(1);
            if (mem) userId = mem.userId;
        }

        if (userId) {
            await this.recordAccess(memberId!, userId, direction, gateId, isAuthorized, reason);
        }
        // If no user found, we might skip logging or log with null userId if schema allows. schema userId in accessLogs is notNull.
        // So we can only log if we have a user.
    }

    // Get last attendance record
    static async getLastAttendance(memberId: string) {
        // finding userId
        const [mem] = await db.select({ userId: members.userId }).from(members).where(eq(members.id, memberId)).limit(1);
        if (!mem) return null;

        const [record] = await db.select()
            .from(accessLogs)
            .where(and(
                eq(accessLogs.userId, mem.userId),
                eq(accessLogs.isAuthorized, true)
            ))
            .orderBy(desc(accessLogs.timestamp))
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
        // finding userId
        const [mem] = await db.select({ userId: members.userId }).from(members).where(eq(members.id, memberId)).limit(1);
        if (!mem) return [];

        const conditions = [
            eq(accessLogs.userId, mem.userId),
            eq(accessLogs.isAuthorized, true)
        ];
        if (startDate) conditions.push(gte(accessLogs.timestamp, startDate));
        if (endDate) conditions.push(lte(accessLogs.timestamp, endDate));

        const records = await db.select()
            .from(accessLogs)
            .where(and(...conditions))
            .orderBy(desc(accessLogs.timestamp))
            .limit(limit);

        return records;
    }

    // Get door access logs (for admin)
    static async getAccessLogs(
        startDate?: Date,
        endDate?: Date,
        status?: 'GRANTED' | 'DENIED', // maps to isAuthorized
        limit: number = 100
    ) {
        const conditions = [];
        if (startDate) conditions.push(gte(accessLogs.timestamp, startDate));
        if (endDate) conditions.push(lte(accessLogs.timestamp, endDate));
        if (status) conditions.push(eq(accessLogs.isAuthorized, status === 'GRANTED'));

        const logs = await db.select({
            accessLog: accessLogs,
            user: users
        })
            .from(accessLogs)
            .innerJoin(users, eq(accessLogs.userId, users.id)) // accessLogs has userId
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(accessLogs.timestamp))
            .limit(limit);

        return logs.map(({ accessLog, user }) => ({
            ...accessLog,
            memberName: user.fullName,
            email: user.email
        }));
    }
}
