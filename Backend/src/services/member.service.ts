// Member Service - Drizzle ORM
import { eq, and, isNull, or, like, gte, sql, count, desc } from 'drizzle-orm';
import { db } from '../config/database';
import { members, users, subscriptions, subscriptionPlans, accessLogs } from '../db/schema';
import { AuthService } from './auth.service';
import { NotFoundError, ConflictError, ValidationError } from '../utils/error-types';
import { validateEmail, validatePhone, formatPhoneNumber } from '../utils/validators';
import { generateQRToken } from '../utils/qr-generator';
import { generateMemberId } from '../utils/id-generator';
import { randomUUID } from 'crypto';

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
        const qrCodeToken = generateQRToken(memberId);

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
                isActive: true,
            });

            // 2. Create Member Profile
            await tx.insert(members).values({
                id: memberId,
                userId: userId,
                memberCode: memberCode,
                dateOfBirth: data.dateOfBirth,
                emergencyContactName: data.emergencyContact, // mapped from input
                // medicalConditions? not in input
                qrCode: qrCodeToken, // Schema has qrCode, input generates qrCodeToken. Mapping to qrCode column for now.
                status: 'active',
                joinDate: new Date(),
            });
        });

        return {
            memberId, // Return the internal ID or memberCode? Usually internal ID for API consistency
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
            // Schema check: subscriptions has no createdAt. It has startDate.
            // But wait, my task plan didn't check for createdAt in subscriptions.
            // I'll use startDate for ordering.
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

        // Also update user? Or keep user active?
        // Usually if member is deleted, we might keep user to allow login but show "No active membership"?
        // Or if this is a "Hard" soft delete, deactivating user is safer.

        const [existing] = await db.select({ userId: members.userId }).from(members).where(eq(members.id, memberId));
        if (existing) {
            await db.update(users)
                .set({
                    isActive: false
                })
                .where(eq(users.id, existing.userId));
        }
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

        const checkedInToday = await db.selectDistinct({ memberId: accessLogs.userId }) // Schema has userId in accessLogs, not memberId directly?
            // Wait, accessLogs has userId. members has userId. So we can link them.
            // But the stats probably want count of distinct members (users) who accessed.
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
