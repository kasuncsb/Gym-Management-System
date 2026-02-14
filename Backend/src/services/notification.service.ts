// Notification Service — Phase 2
import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { notifications } from '../db/schema';
import { randomUUID } from 'crypto';

export class NotificationService {
  /** Create a notification */
  static async create(data: {
    userId: string;
    title: string;
    body: string;
    type: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
    actionUrl?: string;
  }) {
    const id = randomUUID();
    await db.insert(notifications).values({
      id,
      userId: data.userId,
      title: data.title,
      body: data.body,
      type: data.type,
      priority: data.priority ?? 'normal',
      actionUrl: data.actionUrl ?? null,
      isRead: false,
    });
    return { id };
  }

  /** Create notifications for multiple users */
  static async createBulk(
    userIds: string[],
    data: { title: string; body: string; type: string; priority?: 'low' | 'normal' | 'high' | 'critical'; actionUrl?: string },
  ) {
    if (!userIds.length) return;
    const rows = userIds.map((userId) => ({
      id: randomUUID(),
      userId,
      title: data.title,
      body: data.body,
      type: data.type,
      priority: data.priority ?? ('normal' as const),
      actionUrl: data.actionUrl ?? null,
      isRead: false,
    }));
    await db.insert(notifications).values(rows);
  }

  /** Get notifications for a user */
  static async getUserNotifications(userId: string, limit = 50, unreadOnly = false) {
    const conds = [eq(notifications.userId, userId)];
    if (unreadOnly) conds.push(eq(notifications.isRead, false));

    return db
      .select()
      .from(notifications)
      .where(and(...conds))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  /** Get unread count */
  static async getUnreadCount(userId: string) {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return Number(result?.count ?? 0);
  }

  /** Mark notification as read */
  static async markRead(notificationId: string, userId: string) {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  }

  /** Mark all as read for a user */
  static async markAllRead(userId: string) {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  /** Delete old notifications (cleanup, > 90 days) */
  static async cleanupOld(daysOld = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);
    // We don't hard delete; just mark old reads for potential pruning
    // In production, this would be a cron job
    return { note: 'Cleanup placeholder — implement as cron' };
  }
}
