// Member Service - Drizzle ORM
import { eq, and, isNull, or, like, gte, sql, count, desc } from 'drizzle-orm';
import { db } from '../config/database';
import { members, subscriptions, subscriptionPlans, attendance } from '../db/schema';
import { AuthService } from './auth.service';
import { NotFoundError, ConflictError, ValidationError } from '../utils/error-types';
import { validateEmail, validatePhone, formatPhoneNumber } from '../utils/validators';
import { generateQRToken } from '../utils/qr-generator';
import { generateMemberId } from '../utils/id-generator';

export class MemberService {
    // Create new member (registration)
    static async createMember(data: {
        name: string;
        email: string;
        password: string;
        phone?: string;
        dateOfBirth?: Date;
        emergencyContact?: string;
    }) {
        // Validate email
        if (!validateEmail(data.email)) {
            throw new ValidationError('Invalid email format');
        }

        // Check if email already exists
        const [existing] = await db.select()
            .from(members)
            .where(eq(members.email, data.email))
            .limit(1);

        if (existing) {
            throw new ConflictError('Email already registered');
        }

        // Validate and format phone
        let phone = data.phone;
        if (phone) {
            if (!validatePhone(phone)) {
                throw new ValidationError('Invalid phone number format');
            }
            phone = formatPhoneNumber(phone);
        }

        // Hash password
        const passwordHash = await AuthService.hashPassword(data.password);

        // Generate member ID and QR token
        const memberId = generateMemberId();
        const qrCodeToken = generateQRToken(memberId);

        // Create member
        await db.insert(members).values({
            memberId,
            name: data.name,
            email: data.email,
            passwordHash,
            phone,
            dateOfBirth: data.dateOfBirth,
            emergencyContact: data.emergencyContact,
            qrCodeToken,
            status: 'ACTIVE',
            joinDate: new Date(),
        });

        return {
            memberId,
            name: data.name,
            email: data.email,
            joinDate: new Date()
        };
    }

    // Get member by ID
    static async getMemberById(memberId: string) {
        const [member] = await db.select()
            .from(members)
            .where(and(
                eq(members.memberId, memberId),
                isNull(members.deletedAt)
            ))
            .limit(1);

        if (!member) {
            throw new NotFoundError('Member');
        }

        // Get member's subscriptions separately
        const memberSubscriptions = await db.select()
            .from(subscriptions)
            .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.planId))
            .where(and(
                eq(subscriptions.memberId, memberId),
                isNull(subscriptions.deletedAt)
            ))
            .orderBy(desc(subscriptions.createdAt))
            .limit(5);

        return {
            ...member,
            subscriptions: memberSubscriptions.map(s => ({
                ...s.subscriptions,
                plan: s.subscription_plans
            }))
        };
    }

    // Update member profile
    static async updateMember(
        memberId: string,
        data: {
            name?: string;
            phone?: string;
            dateOfBirth?: Date;
            emergencyContact?: string;
        }
    ) {
        // Validate phone if provided
        let phone = data.phone;
        if (phone) {
            if (!validatePhone(phone)) {
                throw new ValidationError('Invalid phone number format');
            }
            phone = formatPhoneNumber(phone);
        }

        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (phone) updateData.phone = phone;
        if (data.dateOfBirth) updateData.dateOfBirth = data.dateOfBirth;
        if (data.emergencyContact) updateData.emergencyContact = data.emergencyContact;

        await db.update(members)
            .set(updateData)
            .where(eq(members.memberId, memberId));

        const [updated] = await db.select()
            .from(members)
            .where(eq(members.memberId, memberId))
            .limit(1);

        return updated;
    }

    // Get all members (admin)
    static async getAllMembers(page: number = 1, limit: number = 20, status?: string) {
        const skip = (page - 1) * limit;

        const whereConditions = [isNull(members.deletedAt)];
        if (status) {
            whereConditions.push(eq(members.status, status as any));
        }

        const [membersList, [{ value: total }]] = await Promise.all([
            db.select()
                .from(members)
                .where(and(...whereConditions))
                .orderBy(desc(members.joinDate))
                .limit(limit)
                .offset(skip),
            db.select({ value: count() })
                .from(members)
                .where(and(...whereConditions))
        ]);

        // Get active subscription for each member
        const membersWithSubs = await Promise.all(
            membersList.map(async (member) => {
                const [activeSub] = await db.select()
                    .from(subscriptions)
                    .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.planId))
                    .where(and(
                        eq(subscriptions.memberId, member.memberId),
                        eq(subscriptions.status, 'ACTIVE'),
                        gte(subscriptions.endDate, new Date())
                    ))
                    .limit(1);

                return {
                    memberId: member.memberId,
                    name: member.name,
                    email: member.email,
                    phone: member.phone,
                    joinDate: member.joinDate,
                    status: member.status,
                    subscriptions: activeSub ? [{
                        ...activeSub.subscriptions,
                        plan: activeSub.subscription_plans
                    }] : []
                };
            })
        );

        return {
            members: membersWithSubs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    // Search members
    static async searchMembers(query: string) {
        const membersList = await db.select({
            memberId: members.memberId,
            name: members.name,
            email: members.email,
            phone: members.phone,
            status: members.status
        })
            .from(members)
            .where(and(
                isNull(members.deletedAt),
                or(
                    like(members.name, `%${query}%`),
                    like(members.email, `%${query}%`),
                    like(members.memberId, `%${query}%`)
                )
            ))
            .limit(20);

        return membersList;
    }

    // Suspend/activate member (admin)
    static async updateMemberStatus(memberId: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') {
        await db.update(members)
            .set({ status })
            .where(eq(members.memberId, memberId));

        const [member] = await db.select()
            .from(members)
            .where(eq(members.memberId, memberId))
            .limit(1);

        return member;
    }

    // Soft delete member
    static async deleteMember(memberId: string) {
        await db.update(members)
            .set({
                deletedAt: new Date(),
                status: 'INACTIVE'
            })
            .where(eq(members.memberId, memberId));
    }

    // Get member statistics
    static async getMemberStats() {
        const [totalResult, activeResult, inactiveResult, suspendedResult] = await Promise.all([
            db.select({ value: count() }).from(members).where(isNull(members.deletedAt)),
            db.select({ value: count() }).from(members).where(and(isNull(members.deletedAt), eq(members.status, 'ACTIVE'))),
            db.select({ value: count() }).from(members).where(and(isNull(members.deletedAt), eq(members.status, 'INACTIVE'))),
            db.select({ value: count() }).from(members).where(and(isNull(members.deletedAt), eq(members.status, 'SUSPENDED')))
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const checkedInToday = await db.selectDistinct({ memberId: attendance.memberId })
            .from(attendance)
            .where(and(
                eq(attendance.eventType, 'IN'),
                gte(attendance.timestamp, today)
            ));

        return {
            total: totalResult[0].value,
            active: activeResult[0].value,
            inactive: inactiveResult[0].value,
            suspended: suspendedResult[0].value,
            checkedInToday: checkedInToday.length
        };
    }
}
