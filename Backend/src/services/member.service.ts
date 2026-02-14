// Member Service — Phase 1 (Drizzle ORM)
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
  /** Self-register a new member */
  static async createMember(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    dateOfBirth?: string; // ISO date string
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  }) {
    if (!validateEmail(data.email)) throw new ValidationError('Invalid email format');

    const [existing] = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (existing) throw new ConflictError('Email already registered');

    let phone = data.phone;
    if (phone) {
      if (!validatePhone(phone)) throw new ValidationError('Invalid phone number format');
      phone = formatPhoneNumber(phone);
    }

    const passwordHash = await AuthService.hashPassword(data.password);

    const userId = randomUUID();
    const memberId = randomUUID();
    const memberCode = generateMemberId();
    const emailVerificationToken = randomUUID();

    // @ts-ignore — transaction type inference issue
    await db.transaction(async (tx: any) => {
      await tx.insert(users).values({
        id: userId,
        email: data.email,
        passwordHash,
        fullName: data.name,
        phone,
        dateOfBirth: data.dateOfBirth ?? null,
        role: 'member',
        isActive: true,
        isEmailVerified: false,
        emailVerificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 3600_000),
      });

      await tx.insert(members).values({
        id: memberId,
        userId,
        memberCode,
        emergencyContactName: data.emergencyContactName ?? null,
        emergencyContactPhone: data.emergencyContactPhone ?? null,
        status: 'incomplete',
        joinDate: new Date().toISOString().split('T')[0],
      });
    });

    try { await EmailService.sendVerificationEmail(data.email, emailVerificationToken); }
    catch { /* non-fatal */ }

    await AuditService.log(AuditAction.REGISTER, 'members', memberId, userId, {
      email: data.email, name: data.name, method: 'self-register',
    });

    return { memberId, memberCode, name: data.name, email: data.email };
  }

  /** Get member by members.id (includes user info + recent subscriptions) */
  static async getMemberById(memberId: string) {
    const [result] = await db
      .select({ member: members, user: users })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(and(eq(members.id, memberId), isNull(members.deletedAt)))
      .limit(1);

    if (!result) throw new NotFoundError('Member');
    const { member, user } = result;

    const memberSubscriptions = await db
      .select()
      .from(subscriptions)
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(and(eq(subscriptions.memberId, memberId), isNull(subscriptions.deletedAt)))
      .orderBy(desc(subscriptions.startDate))
      .limit(5);

    return {
      id: member.id,
      memberCode: member.memberCode,
      userId: member.userId,
      name: user.fullName,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      emergencyContactName: member.emergencyContactName,
      emergencyContactPhone: member.emergencyContactPhone,
      nicNumber: member.nicNumber,
      experienceLevel: member.experienceLevel,
      fitnessGoals: member.fitnessGoals,
      isOnboarded: member.isOnboarded,
      status: member.status,
      joinDate: member.joinDate,
      subscriptions: memberSubscriptions.map((s) => ({
        ...s.subscriptions,
        plan: s.subscription_plans,
      })),
    };
  }

  /** Get member by users.id (convenience for auth flows) */
  static async getMemberByUserId(userId: string) {
    const [member] = await db
      .select()
      .from(members)
      .where(and(eq(members.userId, userId), isNull(members.deletedAt)))
      .limit(1);

    if (!member) throw new NotFoundError('Member');
    return this.getMemberById(member.id);
  }

  /** Update member profile */
  static async updateMember(
    memberId: string,
    data: {
      name?: string;
      phone?: string;
      dateOfBirth?: string;
      gender?: 'male' | 'female' | 'prefer_not_to_say';
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      nicNumber?: string;
      experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'returning';
      fitnessGoals?: string[];
    },
  ) {
    const [existing] = await db.select({ userId: members.userId }).from(members).where(eq(members.id, memberId)).limit(1);
    if (!existing) throw new NotFoundError('Member');

    let phone = data.phone;
    if (phone) {
      if (!validatePhone(phone)) throw new ValidationError('Invalid phone number format');
      phone = formatPhoneNumber(phone);
    }

    // User-level updates
    const userUpdates: Record<string, any> = {};
    if (data.name) userUpdates.fullName = data.name;
    if (phone) userUpdates.phone = phone;
    if (data.dateOfBirth) userUpdates.dateOfBirth = data.dateOfBirth;
    if (data.gender) userUpdates.gender = data.gender;
    if (Object.keys(userUpdates).length > 0) {
      await db.update(users).set(userUpdates).where(eq(users.id, existing.userId));
    }

    // Member-level updates
    const memberUpdates: Record<string, any> = {};
    if (data.emergencyContactName) memberUpdates.emergencyContactName = data.emergencyContactName;
    if (data.emergencyContactPhone) memberUpdates.emergencyContactPhone = data.emergencyContactPhone;
    if (data.nicNumber) memberUpdates.nicNumber = data.nicNumber;
    if (data.experienceLevel) memberUpdates.experienceLevel = data.experienceLevel;
    if (data.fitnessGoals) memberUpdates.fitnessGoals = data.fitnessGoals;
    if (Object.keys(memberUpdates).length > 0) {
      await db.update(members).set(memberUpdates).where(eq(members.id, memberId));
    }

    await AuditService.log(AuditAction.UPDATE, 'members', memberId, existing.userId, {
      updatedFields: [...Object.keys(userUpdates), ...Object.keys(memberUpdates)],
    });

    return this.getMemberById(memberId);
  }

  /** List members with pagination (admin/manager) */
  static async getAllMembers(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = [isNull(members.deletedAt)];
    if (status) where.push(eq(members.status, status.toLowerCase() as any));

    const [membersList, [{ value: total }]] = await Promise.all([
      db.select({ member: members, user: users })
        .from(members)
        .innerJoin(users, eq(members.userId, users.id))
        .where(and(...where))
        .orderBy(desc(members.joinDate))
        .limit(limit)
        .offset(skip),
      db.select({ value: count() }).from(members).where(and(...where)),
    ]);

    const membersWithSubs = await Promise.all(
      membersList.map(async ({ member, user }) => {
        const today = new Date();
        const [activeSub] = await db
          .select()
          .from(subscriptions)
          .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
          .where(and(eq(subscriptions.memberId, member.id), eq(subscriptions.status, 'active'), gte(subscriptions.endDate, today)))
          .limit(1);

        return {
          id: member.id,
          memberCode: member.memberCode,
          name: user.fullName,
          email: user.email,
          phone: user.phone,
          joinDate: member.joinDate,
          status: member.status,
          subscription: activeSub
            ? { ...activeSub.subscriptions, plan: activeSub.subscription_plans }
            : null,
        };
      }),
    );

    return {
      members: membersWithSubs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Search members by name/email/code */
  static async searchMembers(query: string) {
    return db
      .select({
        id: members.id,
        memberCode: members.memberCode,
        name: users.fullName,
        email: users.email,
        phone: users.phone,
        status: members.status,
      })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(and(
        isNull(members.deletedAt),
        or(
          like(users.fullName, `%${query}%`),
          like(users.email, `%${query}%`),
          like(members.memberCode, `%${query}%`),
        ),
      ))
      .limit(20);
  }

  /** Update member status (admin) */
  static async updateMemberStatus(memberId: string, status: 'active' | 'inactive' | 'suspended') {
    await db.update(members).set({ status }).where(eq(members.id, memberId));

    const [mem] = await db.select({ userId: members.userId }).from(members).where(eq(members.id, memberId));
    await AuditService.log(AuditAction.UPDATE, 'members', memberId, mem?.userId ?? 'system', {
      action: 'change_status', newStatus: status,
    });

    return this.getMemberById(memberId);
  }

  /** Soft-delete member */
  static async deleteMember(memberId: string) {
    const [existing] = await db.select({ userId: members.userId }).from(members).where(eq(members.id, memberId));

    await db.update(members).set({ deletedAt: new Date(), status: 'inactive' }).where(eq(members.id, memberId));

    if (existing) {
      await db.update(users).set({ isActive: false }).where(eq(users.id, existing.userId));
    }

    await AuditService.log(AuditAction.DELETE, 'members', memberId, existing?.userId ?? 'system', { type: 'soft_delete' });
  }

  /** Dashboard statistics */
  static async getMemberStats() {
    const [totalResult, activeResult, inactiveResult, suspendedResult] = await Promise.all([
      db.select({ value: count() }).from(members).where(isNull(members.deletedAt)),
      db.select({ value: count() }).from(members).where(and(isNull(members.deletedAt), eq(members.status, 'active'))),
      db.select({ value: count() }).from(members).where(and(isNull(members.deletedAt), eq(members.status, 'inactive'))),
      db.select({ value: count() }).from(members).where(and(isNull(members.deletedAt), eq(members.status, 'suspended'))),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkedInToday = await db
      .selectDistinct({ userId: accessLogs.userId })
      .from(accessLogs)
      .where(and(eq(accessLogs.direction, 'in'), gte(accessLogs.scannedAt, today)));

    return {
      total: totalResult[0].value,
      active: activeResult[0].value,
      inactive: inactiveResult[0].value,
      suspended: suspendedResult[0].value,
      checkedInToday: checkedInToday.length,
    };
  }
}
