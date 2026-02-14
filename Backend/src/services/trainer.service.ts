// Trainer Service — Phase 2 (Availability, PT Sessions, Session Notes)
import { eq, and, desc, gte, lte, sql, ne } from 'drizzle-orm';
import { db } from '../config/database';
import {
  trainers,
  trainerAvailability,
  trainingSessions,
  sessionNotes,
  members,
  users,
} from '../db/schema';
import { randomUUID } from 'crypto';
import { NotFoundError, ValidationError, ConflictError } from '../utils/error-types';

export class TrainerService {
  // ── Trainer Profile ─────────────────────────────────

  /** List all active trainers with user info */
  static async listTrainers() {
    return db
      .select({
        id: trainers.id,
        userId: trainers.userId,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        specialization: trainers.specialization,
        bio: trainers.bio,
        certifications: trainers.certifications,
        yearsOfExperience: trainers.yearsOfExperience,
        hourlyRate: trainers.hourlyRate,
        rating: trainers.rating,
        maxClients: trainers.maxClients,
      })
      .from(trainers)
      .innerJoin(users, eq(trainers.userId, users.id))
      .where(eq(trainers.status, 'active'));
  }

  /** Get trainer by ID */
  static async getTrainerById(trainerId: string) {
    const [trainer] = await db
      .select()
      .from(trainers)
      .where(eq(trainers.id, trainerId))
      .limit(1);
    return trainer ?? null;
  }

  /** Get trainer by user ID */
  static async getTrainerByUserId(userId: string) {
    const [trainer] = await db
      .select()
      .from(trainers)
      .where(eq(trainers.userId, userId))
      .limit(1);
    return trainer ?? null;
  }

  /** Get assigned members for a trainer */
  static async getAssignedMembers(trainerId: string) {
    return db
      .select({
        id: members.id,
        userId: members.userId,
        memberCode: members.memberCode,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        experienceLevel: members.experienceLevel,
        fitnessGoals: members.fitnessGoals,
        isOnboarded: members.isOnboarded,
        joinDate: members.joinDate,
        status: members.status,
      })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(and(eq(members.assignedTrainerId, trainerId), eq(members.status, 'active')));
  }

  // ── Availability ────────────────────────────────────

  /** Set availability slots for a date */
  static async setAvailability(trainerId: string, data: {
    availableDate: string;
    startTime: string;
    endTime: string;
    slotDurationMinutes?: number;
  }) {
    const id = randomUUID();
    await db.insert(trainerAvailability).values({
      id,
      trainerId,
      availableDate: new Date(data.availableDate),
      startTime: data.startTime,
      endTime: data.endTime,
      slotDurationMinutes: data.slotDurationMinutes ?? 60,
    });
    return { id };
  }

  /** Get availability for a trainer within a date range */
  static async getAvailability(trainerId: string, startDate: string, endDate: string) {
    return db
      .select()
      .from(trainerAvailability)
      .where(
        and(
          eq(trainerAvailability.trainerId, trainerId),
          gte(trainerAvailability.availableDate, new Date(startDate)),
          lte(trainerAvailability.availableDate, new Date(endDate)),
        ),
      )
      .orderBy(trainerAvailability.availableDate);
  }

  /** Delete an availability slot */
  static async removeAvailability(slotId: string) {
    await db.delete(trainerAvailability).where(eq(trainerAvailability.id, slotId));
  }

  // ── Training Sessions ───────────────────────────────

  /** Book a personal training session */
  static async bookSession(data: {
    memberId: string;
    trainerId: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
  }) {
    // Check for time conflict on trainer side
    const existing = await db
      .select({ id: trainingSessions.id })
      .from(trainingSessions)
      .where(
        and(
          eq(trainingSessions.trainerId, data.trainerId),
          eq(trainingSessions.sessionDate, new Date(data.sessionDate)),
          eq(trainingSessions.startTime, data.startTime),
          ne(trainingSessions.status, 'cancelled_by_member'),
          ne(trainingSessions.status, 'cancelled_by_trainer'),
        ),
      )
      .limit(1);
    if (existing.length) throw new ConflictError('This time slot is already booked');

    const id = randomUUID();
    await db.insert(trainingSessions).values({
      id,
      memberId: data.memberId,
      trainerId: data.trainerId,
      sessionDate: new Date(data.sessionDate),
      startTime: data.startTime,
      endTime: data.endTime,
      status: 'booked',
    });
    return { id };
  }

  /** Get sessions for a trainer */
  static async getTrainerSessions(trainerId: string, startDate?: string, endDate?: string) {
    let query = db
      .select({
        session: trainingSessions,
        memberName: users.fullName,
        memberCode: members.memberCode,
      })
      .from(trainingSessions)
      .innerJoin(members, eq(trainingSessions.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .where(eq(trainingSessions.trainerId, trainerId))
      .orderBy(trainingSessions.sessionDate, trainingSessions.startTime);

    return query;
  }

  /** Get sessions for a member */
  static async getMemberSessions(memberId: string) {
    return db
      .select({
        session: trainingSessions,
        trainerName: users.fullName,
      })
      .from(trainingSessions)
      .innerJoin(trainers, eq(trainingSessions.trainerId, trainers.id))
      .innerJoin(users, eq(trainers.userId, users.id))
      .where(eq(trainingSessions.memberId, memberId))
      .orderBy(desc(trainingSessions.sessionDate));
  }

  /** Update session status */
  static async updateSessionStatus(
    sessionId: string,
    status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled_by_member' | 'cancelled_by_trainer' | 'no_show',
    reason?: string,
  ) {
    const updates: Record<string, any> = { status };
    if (status.startsWith('cancelled')) {
      updates.cancelledAt = new Date();
      updates.cancellationReason = reason ?? null;
    }
    await db
      .update(trainingSessions)
      .set(updates)
      .where(eq(trainingSessions.id, sessionId));
  }

  /** Add session notes (trainer completes session) */
  static async addSessionNotes(data: {
    sessionId: string;
    trainerId: string;
    performanceRating?: number;
    exercisesCompleted?: string[];
    weightProgression?: string;
    areasOfConcern?: string;
    recommendations?: string;
    nextSessionFocus?: string;
  }) {
    const id = randomUUID();
    await db.insert(sessionNotes).values({
      id,
      sessionId: data.sessionId,
      trainerId: data.trainerId,
      performanceRating: data.performanceRating ?? null,
      exercisesCompleted: data.exercisesCompleted ?? null,
      weightProgression: data.weightProgression ?? null,
      areasOfConcern: data.areasOfConcern ?? null,
      recommendations: data.recommendations ?? null,
      nextSessionFocus: data.nextSessionFocus ?? null,
    });
    return { id };
  }

  /** Get notes for a session */
  static async getSessionNotes(sessionId: string) {
    return db
      .select()
      .from(sessionNotes)
      .where(eq(sessionNotes.sessionId, sessionId));
  }
}
