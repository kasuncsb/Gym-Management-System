// Member Service - Drizzle ORM
import { eq, and, isNull, or, like, gte, sql, count, desc } from 'drizzle-orm';
import { db } from '../config/database';
import { members, users, subscriptions, subscriptionPlans, accessLogs } from '../db/schema';
import { AuthService } from './auth.service';
import { NotFoundError, ConflictError, ValidationError } from '../utils/error-types';
import { validateEmail, validatePhone, formatPhoneNumber } from '../utils/validators';
import { AuditService, AuditAction } from './audit.service';
import { generateMemberId } from '../utils/id-generator';
import { randomUUID } from 'crypto';
import { EmailService } from './email.service';

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
            .from(users)
            .where(eq(users.email, data.email))
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

        // IDs
        const userId = randomUUID();
        const memberId = randomUUID();
        const memberCode = generateMemberId();
        const emailVerificationToken = randomUUID();

        // Transaction to create user and member
        // @ts-ignore - transaction type inference issue
        await db.transaction(async (tx) => {
            // 1. Create User
            await tx.insert(users).values({
                id: userId,
                email: data.email,
                passwordHash,
                fullName: data.name,
                phone: phone,
                role: 'member',
                isActive: true, // Account active, but email not verified
                isEmailVerified: false,
                emailVerificationToken: emailVerificationToken,
                emailVerificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            });

            // 2. Create Member Profile
            await tx.insert(members).values({
                id: memberId,
                userId: userId,
                memberCode: memberCode,
                dateOfBirth: data.dateOfBirth,
                emergencyContactName: data.emergencyContact,
                status: 'active',
                joinDate: new Date(),
            });
        });

        // Send verification email
        try {
            await EmailService.sendVerificationEmail(data.email, emailVerificationToken);
        } catch (error) {
            console.error('Failed to send verification email:', error);
        }

        // Log member registration
        await AuditService.log(
            AuditAction.REGISTER,
            'members',
            memberId,
            userId,
            { email: data.email, name: data.name, method: 'self-register' }
        );

        return {
            memberId,
            memberCode,
            name: data.name,
            email: data.email,
            joinDate: new Date()
        };
    }

    // Get member by ID
    static async getMemberById(memberId: string) {
        const [result] = await db.select({
            member: members,
            user: users
        })
            .from(members)
            .innerJoin(users, eq(members.userId, users.id))
            .where(and(
                eq(members.id, memberId),
                isNull(members.deletedAt)
            ))
            .limit(1);

        if (!result) {
            throw new NotFoundError('Member');
        }

        const { member, user } = result;

        // Get member's subscriptions separately
        const memberSubscriptions = await db.select()
            .from(subscriptions)
            .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
            .where(and(
                eq(subscriptions.memberId, memberId),
                isNull(subscriptions.deletedAt)
            ))
            .orderBy(desc(subscriptions.startDate))
            .limit(5);

        return {
            id: member.id,
            memberCode: member.memberCode,
            userId: member.userId,
            name: user.fullName,
            email: user.email,
            phone: user.phone,
            dateOfBirth: member.dateOfBirth,
            gender: member.gender,
            emergencyContact: member.emergencyContactName,
            status: member.status,
            joinDate: member.joinDate,
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
        // Fetch existing to get userId
        const [existing] = await db.select({ userId: members.userId })
            .from(members)
            .where(eq(members.id, memberId))
            .limit(1);

        if (!existing) throw new NotFoundError('Member');

        // Validate phone if provided
        let phone = data.phone;
        if (phone) {
            if (!validatePhone(phone)) {
                throw new ValidationError('Invalid phone number format');
            }
            phone = formatPhoneNumber(phone);
        }

        // Update User info
        const userUpdates: any = {};
        if (data.name) userUpdates.fullName = data.name;
        if (phone) userUpdates.phone = phone;

        if (Object.keys(userUpdates).length > 0) {
            await db.update(users)
                .set(userUpdates)
                .where(eq(users.id, existing.userId));
        }

        // Update Member info
        const memberUpdates: any = {};
        if (data.dateOfBirth) memberUpdates.dateOfBirth = data.dateOfBirth;
        if (data.emergencyContact) memberUpdates.emergencyContactName = data.emergencyContact;

        if (Object.keys(memberUpdates).length > 0) {
            await db.update(members)
                .set(memberUpdates)
                .where(eq(members.id, memberId));
        }

        // Log update
        await AuditService.log(
            AuditAction.UPDATE,
            'members',
            memberId,
            existing.userId, // User performing update (likely themselves, or admin context needed)
            {
                updatedFields: [
                    ...Object.keys(userUpdates),
                    ...Object.keys(memberUpdates)
                ]
            }
        );

        return this.getMemberById(memberId);
    }

    // Get all members (admin)
    static async getAllMembers(page: number = 1, limit: number = 20, status?: string) {
        const skip = (page - 1) * limit;

        const whereConditions = [isNull(members.deletedAt)];
        if (status) {
            // Lowercase status
            whereConditions.push(eq(members.status, status.toLowerCase() as any));
        }

        const [membersList, [{ value: total }]] = await Promise.all([
            db.select({
                member: members,
                user: users
            })
                .from(members)
                .innerJoin(users, eq(members.userId, users.id))
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
            membersList.map(async ({ member, user }) => {
                const [activeSub] = await db.select()
                    .from(subscriptions)
                    .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
                    .where(and(
                        eq(subscriptions.memberId, member.id),
                        eq(subscriptions.status, 'active'),
                        gte(subscriptions.endDate, new Date())
                    ))
                    .limit(1);

                return {
                    id: member.id,
                    memberCode: member.memberCode,
                    name: user.fullName,
                    email: user.email,
                    phone: user.phone,
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
            id: members.id,
            memberCode: members.memberCode,
            name: users.fullName,
            email: users.email,
            phone: users.phone,
            status: members.status
        })
            .from(members)
            .innerJoin(users, eq(members.userId, users.id))
            .where(and(
                isNull(members.deletedAt),
                or(
                    like(users.fullName, `%${query}%`),
                    like(users.email, `%${query}%`),
                    like(members.memberCode, `%${query}%`)
                )
            ))
            .limit(20);

        return membersList;
    }

    // Suspend/activate member (admin)
    static async updateMemberStatus(memberId: string, status: 'active' | 'inactive' | 'suspended') {
        const lowerStatus = status.toLowerCase() as 'active' | 'inactive' | 'suspended';

        await db.update(members)
            .set({ status: lowerStatus })
            .where(eq(members.id, memberId));

        // Get user ID for log
        const [mem] = await db.select({ userId: members.userId }).from(members).where(eq(members.id, memberId));

        await AuditService.log(
            AuditAction.UPDATE,
            'members',
            memberId,
            mem?.userId || 'unknown',
            { action: 'change_status', newStatus: lowerStatus }
        );

        return this.getMemberById(memberId);
    }

    // Soft delete member
    static async deleteMember(memberId: string) {
        await db.update(members)
            .set({
                deletedAt: new Date(),
                status: 'inactive'
            })
            .where(eq(members.id, memberId));

        const [existing] = await db.select({ userId: members.userId }).from(members).where(eq(members.id, memberId));
        if (existing) {
            await db.update(users)
                .set({
                    isActive: false
                })
                .where(eq(users.id, existing.userId));
        }

        await AuditService.log(
            AuditAction.DELETE,
            'members',
            memberId,
            existing?.userId || 'unknown',
            { type: 'soft_delete' }
        );
    }

    // Get member statistics
    static async getMemberStats() {
        const [totalResult, activeResult, inactiveResult, suspendedResult] = await Promise.all([
            db.select({ value: count() }).from(members).where(isNull(members.deletedAt)),
            db.select({ value: count() }).from(members).where(and(isNull(members.deletedAt), eq(members.status, 'active'))),
            db.select({ value: count() }).from(members).where(and(isNull(members.deletedAt), eq(members.status, 'inactive'))),
            db.select({ value: count() }).from(members).where(and(isNull(members.deletedAt), eq(members.status, 'suspended')))
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const checkedInToday = await db.selectDistinct({ memberId: accessLogs.userId })
            .from(accessLogs)
            .where(and(
                eq(accessLogs.direction, 'in'),
                gte(accessLogs.timestamp, today)
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
