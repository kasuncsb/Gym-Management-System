// Notification Scheduler Service — Phase 3
// Automated notification triggers: subscription renewals, trainer reminders, session follow-ups
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { db } from '../config/database';
import {
  subscriptions, subscriptionPlans, members, users,
  trainingSessions, trainers, notifications,
} from '../db/schema';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import logger from '../config/logger';

export class NotificationScheduler {
  /**
   * Check for upcoming subscription renewals and send reminder notifications.
   * Should be called daily (via cron or manual trigger).
   * Sends reminders at 7 days, 3 days, and 1 day before expiry.
   */
  static async processRenewalReminders() {
    const now = new Date();
    const reminders = [
      { daysBeforeExpiry: 7, label: '1 week' },
      { daysBeforeExpiry: 3, label: '3 days' },
      { daysBeforeExpiry: 1, label: 'tomorrow' },
    ];

    let totalSent = 0;

    for (const reminder of reminders) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + reminder.daysBeforeExpiry);
      const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      // Find subs expiring on that date that are still active
      const expiringSubs = await db
        .select({
          subId: subscriptions.id,
          memberId: subscriptions.memberId,
          userId: members.userId,
          fullName: users.fullName,
          email: users.email,
          planName: subscriptionPlans.name,
          endDate: subscriptions.endDate,
        })
        .from(subscriptions)
        .innerJoin(members, eq(subscriptions.memberId, members.id))
        .innerJoin(users, eq(members.userId, users.id))
        .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
        .where(and(
          eq(subscriptions.status, 'active'),
          gte(subscriptions.endDate, dayStart),
          lte(subscriptions.endDate, dayEnd),
        ));

      for (const sub of expiringSubs) {
        // Check if we already sent this reminder (avoid duplicates)
        const [existing] = await db
          .select({ id: notifications.id })
          .from(notifications)
          .where(and(
            eq(notifications.userId, sub.userId),
            eq(notifications.type, 'subscription_renewal'),
            sql`${notifications.body} LIKE '%expires ${reminder.label}%'`,
          ))
          .limit(1);

        if (existing) continue; // Already notified

        await NotificationService.create({
          userId: sub.userId,
          title: 'Subscription Renewal Reminder',
          body: `Your ${sub.planName} subscription expires ${reminder.label}. Renew now to keep your access.`,
          type: 'subscription_renewal',
          priority: reminder.daysBeforeExpiry <= 1 ? 'high' : 'normal',
          actionUrl: '/member/subscription',
        });

        // Also attempt email notification
        try {
          await EmailService.sendGenericEmail(
            sub.email,
            `Subscription Renewal — Expires ${reminder.label}`,
            `Hi ${sub.fullName},\n\nYour ${sub.planName} subscription at Power World Gyms expires ${reminder.label}.\n\nPlease visit the gym or renew through your member portal to continue your fitness journey.\n\nPower World Gyms — Kiribathgoda`,
          );
        } catch {
          // Email failure shouldn't stop notification processing
          logger.warn(`Failed to send renewal email to ${sub.email}`);
        }

        totalSent++;
      }
    }

    return { remindersSent: totalSent };
  }

  /**
   * Send session reminders to trainers and members.
   * Sends reminders for sessions scheduled within the next 24 hours.
   */
  static async processSessionReminders() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find upcoming sessions
    const upcomingSessions = await db
      .select({
        sessionId: trainingSessions.id,
        trainerId: trainingSessions.trainerId,
        memberId: trainingSessions.memberId,
        sessionDate: trainingSessions.sessionDate,
        startTime: trainingSessions.startTime,
        trainerUserId: trainers.userId,
        trainerName: sql<string>`(SELECT full_name FROM users WHERE id = ${trainers.userId})`,
        memberUserId: members.userId,
        memberName: sql<string>`(SELECT full_name FROM users WHERE id = ${members.userId})`,
      })
      .from(trainingSessions)
      .innerJoin(trainers, eq(trainingSessions.trainerId, trainers.id))
      .innerJoin(members, eq(trainingSessions.memberId, members.id))
      .where(and(
        eq(trainingSessions.status, 'booked'),
        gte(trainingSessions.sessionDate, now),
        lte(trainingSessions.sessionDate, tomorrow),
      ));

    let sent = 0;
    for (const session of upcomingSessions) {
      // Notify trainer
      await NotificationService.create({
        userId: session.trainerUserId,
        title: 'Upcoming PT Session',
        body: `You have a session with ${session.memberName} on ${new Date(session.sessionDate).toLocaleDateString('en-LK')} at ${session.startTime}.`,
        type: 'session_reminder',
        priority: 'normal',
        actionUrl: '/staff-dashboard/sessions',
      });

      // Notify member
      await NotificationService.create({
        userId: session.memberUserId,
        title: 'Upcoming PT Session',
        body: `Your session with ${session.trainerName} is on ${new Date(session.sessionDate).toLocaleDateString('en-LK')} at ${session.startTime}.`,
        type: 'session_reminder',
        priority: 'normal',
        actionUrl: '/member/trainers',
      });

      sent += 2;
    }

    return { remindersSent: sent, sessions: upcomingSessions.length };
  }

  /**
   * Send post-session follow-up notifications.
   * For completed sessions in the last 24 hours where no follow-up was sent.
   */
  static async processSessionFollowUps() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const completedSessions = await db
      .select({
        sessionId: trainingSessions.id,
        memberUserId: members.userId,
        trainerName: sql<string>`(SELECT full_name FROM users WHERE id = ${trainers.userId})`,
      })
      .from(trainingSessions)
      .innerJoin(trainers, eq(trainingSessions.trainerId, trainers.id))
      .innerJoin(members, eq(trainingSessions.memberId, members.id))
      .where(and(
        eq(trainingSessions.status, 'completed'),
        gte(trainingSessions.sessionDate, yesterday),
      ));

    let sent = 0;
    for (const session of completedSessions) {
      // Check if follow-up already sent
      const [existing] = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(and(
          eq(notifications.userId, session.memberUserId),
          eq(notifications.type, 'session_followup'),
          sql`${notifications.body} LIKE '%session with ${session.trainerName}%'`,
          gte(notifications.createdAt, yesterday),
        ))
        .limit(1);

      if (existing) continue;

      await NotificationService.create({
        userId: session.memberUserId,
        title: 'How Was Your Session?',
        body: `Your recent session with ${session.trainerName} is complete. Keep up the great work! Log your workout to track progress.`,
        type: 'session_followup',
        priority: 'low',
        actionUrl: '/member/workouts',
      });
      sent++;
    }

    return { followUpsSent: sent };
  }

  /**
   * Process all scheduled notifications — master entry point.
   * In production, called from a cron job every hour or triggered via API.
   */
  static async processAll() {
    const results = {
      renewals: await this.processRenewalReminders(),
      sessionReminders: await this.processSessionReminders(),
      sessionFollowUps: await this.processSessionFollowUps(),
      processedAt: new Date().toISOString(),
    };
    logger.info('Notification scheduler completed', results);
    return results;
  }
}
