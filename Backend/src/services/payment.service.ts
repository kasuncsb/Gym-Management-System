// Payment Service — Phase 2
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { payments, subscriptions, members, users } from '../db/schema';
import { randomUUID } from 'crypto';
import { NotFoundError, ValidationError } from '../utils/error-types';

export class PaymentService {
  /** Record a payment and activate subscription */
  static async recordPayment(data: {
    memberId: string;
    subscriptionId: string;
    amount: number;
    paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'online';
    referenceNumber?: string;
    paymentDate: string;
    recordedBy: string;
    notes?: string;
  }) {
    // Verify subscription exists and belongs to member
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.id, data.subscriptionId), eq(subscriptions.memberId, data.memberId)))
      .limit(1);
    if (!sub) throw new NotFoundError('Subscription');

    const id = randomUUID();
    await db.insert(payments).values({
      id,
      memberId: data.memberId,
      subscriptionId: data.subscriptionId,
      amount: data.amount.toString(),
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber ?? null,
      paymentDate: new Date(data.paymentDate),
      status: 'completed',
      recordedBy: data.recordedBy,
      notes: data.notes ?? null,
    });

    // If subscription is pending_payment, activate it
    if (sub.status === 'pending_payment') {
      await db
        .update(subscriptions)
        .set({ status: 'active' })
        .where(eq(subscriptions.id, data.subscriptionId));
    }

    return { id, subscriptionActivated: sub.status === 'pending_payment' };
  }

  /** Get payment history for a member */
  static async getMemberPayments(memberId: string, limit = 50) {
    return db
      .select()
      .from(payments)
      .where(eq(payments.memberId, memberId))
      .orderBy(desc(payments.paymentDate))
      .limit(limit);
  }

  /** Get all payments (admin/manager) with member info */
  static async getAllPayments(page = 1, limit = 20, startDate?: string, endDate?: string) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (startDate) conditions.push(gte(payments.paymentDate, new Date(startDate)));
    if (endDate) conditions.push(lte(payments.paymentDate, new Date(endDate)));

    const where = conditions.length ? and(...conditions) : undefined;

    const rows = await db
      .select({
        payment: payments,
        memberName: users.fullName,
        memberCode: members.memberCode,
      })
      .from(payments)
      .innerJoin(members, eq(payments.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .where(where)
      .orderBy(desc(payments.paymentDate))
      .limit(limit)
      .offset(offset);

    // Count total
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(where);

    return { rows, total: Number(count) };
  }

  /** Record a refund */
  static async recordRefund(paymentId: string, reason?: string) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);
    if (!payment) throw new NotFoundError('Payment');

    await db
      .update(payments)
      .set({ status: 'refunded', notes: reason ? `Refund: ${reason}` : 'Refunded' })
      .where(eq(payments.id, paymentId));

    return { refunded: true };
  }

  /** Get today's revenue total */
  static async getTodayRevenue() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [result] = await db
      .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(payments)
      .where(and(gte(payments.paymentDate, today), eq(payments.status, 'completed')));
    return parseFloat(result?.total ?? '0');
  }
}
