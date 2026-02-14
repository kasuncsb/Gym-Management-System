// Vitals / Member Metrics Service — Phase 2
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { db } from '../config/database';
import { memberMetrics, members } from '../db/schema';
import { randomUUID } from 'crypto';
import { NotFoundError, ValidationError } from '../utils/error-types';

export class VitalsService {
  /** Record a new vitals entry */
  static async recordVitals(data: {
    memberId: string;
    weight?: number;
    height?: number;
    bodyFatPercentage?: number;
    muscleMass?: number;
    restingHeartRate?: number;
    waistCircumference?: number;
    chestCircumference?: number;
    source?: 'manual' | 'trainer' | 'health_connect';
    notes?: string;
    recordedBy?: string;
  }) {
    // Verify member exists
    const [member] = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.id, data.memberId))
      .limit(1);
    if (!member) throw new NotFoundError('Member');

    // Auto-calculate BMI if weight and height are provided
    let bmi: number | undefined;
    if (data.weight && data.height) {
      const heightM = data.height / 100;
      bmi = parseFloat((data.weight / (heightM * heightM)).toFixed(1));
    }

    const id = randomUUID();
    await db.insert(memberMetrics).values({
      id,
      memberId: data.memberId,
      weight: data.weight?.toString() ?? null,
      height: data.height?.toString() ?? null,
      bodyFatPercentage: data.bodyFatPercentage?.toString() ?? null,
      muscleMass: data.muscleMass?.toString() ?? null,
      bmi: bmi?.toString() ?? null,
      restingHeartRate: data.restingHeartRate ?? null,
      waistCircumference: data.waistCircumference?.toString() ?? null,
      chestCircumference: data.chestCircumference?.toString() ?? null,
      source: data.source ?? 'manual',
      notes: data.notes ?? null,
      recordedBy: data.recordedBy ?? null,
    });

    return { id, bmi, ...data };
  }

  /** Get vitals history for a member */
  static async getVitalsHistory(memberId: string, limit = 50) {
    return db
      .select()
      .from(memberMetrics)
      .where(eq(memberMetrics.memberId, memberId))
      .orderBy(desc(memberMetrics.recordedAt))
      .limit(limit);
  }

  /** Get latest vitals for a member */
  static async getLatestVitals(memberId: string) {
    const [latest] = await db
      .select()
      .from(memberMetrics)
      .where(eq(memberMetrics.memberId, memberId))
      .orderBy(desc(memberMetrics.recordedAt))
      .limit(1);
    return latest ?? null;
  }

  /** Get vitals within a date range for trend charts */
  static async getVitalsTrend(memberId: string, startDate: Date, endDate: Date) {
    return db
      .select()
      .from(memberMetrics)
      .where(
        and(
          eq(memberMetrics.memberId, memberId),
          gte(memberMetrics.recordedAt, startDate),
          lte(memberMetrics.recordedAt, endDate),
        ),
      )
      .orderBy(memberMetrics.recordedAt);
  }

  /** Mark member as onboarded after first vitals collection */
  static async completeOnboarding(memberId: string) {
    await db
      .update(members)
      .set({ isOnboarded: true, onboardedAt: new Date() })
      .where(eq(members.id, memberId));
  }
}
