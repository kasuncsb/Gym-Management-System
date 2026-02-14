// Shift Management Service — Phase 2
import { eq, and, desc, gte, lte, isNull } from 'drizzle-orm';
import { db } from '../config/database';
import { staffShifts, shiftOverrides, staff, users } from '../db/schema';
import { randomUUID } from 'crypto';
import { NotFoundError, ConflictError } from '../utils/error-types';

export class ShiftService {
  /** Create a staff shift */
  static async createShift(data: {
    staffId: string;
    dayOfWeek: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
    shiftStart: string;
    shiftEnd: string;
    shiftType?: 'morning' | 'evening' | 'split' | 'cover';
    effectiveFrom: string;
    effectiveUntil?: string;
  }) {
    const id = randomUUID();
    await db.insert(staffShifts).values({
      id,
      staffId: data.staffId,
      dayOfWeek: data.dayOfWeek,
      shiftStart: data.shiftStart,
      shiftEnd: data.shiftEnd,
      shiftType: data.shiftType ?? 'morning',
      isActive: true,
      effectiveFrom: new Date(data.effectiveFrom),
      effectiveUntil: data.effectiveUntil ? new Date(data.effectiveUntil) : null,
    });
    return { id };
  }

  /** Get shifts for a staff member */
  static async getStaffShifts(staffId: string, activeOnly = true) {
    const conds = [eq(staffShifts.staffId, staffId)];
    if (activeOnly) conds.push(eq(staffShifts.isActive, true));
    return db.select().from(staffShifts).where(and(...conds));
  }

  /** Get all shifts for a branch (with staff info) */
  static async getBranchShifts(branchId: string) {
    return db
      .select({
        shift: staffShifts,
        staffName: users.fullName,
        employeeCode: staff.employeeCode,
        designation: staff.designation,
      })
      .from(staffShifts)
      .innerJoin(staff, eq(staffShifts.staffId, staff.id))
      .innerJoin(users, eq(staff.userId, users.id))
      .where(and(eq(staff.branchId, branchId), eq(staffShifts.isActive, true)))
      .orderBy(staffShifts.dayOfWeek, staffShifts.shiftStart);
  }

  /** Update shift */
  static async updateShift(shiftId: string, data: Partial<{
    shiftStart: string;
    shiftEnd: string;
    shiftType: 'morning' | 'evening' | 'split' | 'cover';
    isActive: boolean;
    effectiveUntil: string;
  }>) {
    const updates: Record<string, any> = {};
    if (data.shiftStart) updates.shiftStart = data.shiftStart;
    if (data.shiftEnd) updates.shiftEnd = data.shiftEnd;
    if (data.shiftType) updates.shiftType = data.shiftType;
    if (data.isActive !== undefined) updates.isActive = data.isActive;
    if (data.effectiveUntil) updates.effectiveUntil = new Date(data.effectiveUntil);

    await db.update(staffShifts).set(updates).where(eq(staffShifts.id, shiftId));
  }

  /** Deactivate a shift */
  static async deactivateShift(shiftId: string) {
    await db.update(staffShifts).set({ isActive: false }).where(eq(staffShifts.id, shiftId));
  }

  // ── Shift Overrides ─────────────────────────────────

  /** Create a shift override (day off, extra shift, modified hours) */
  static async createOverride(data: {
    staffId: string;
    overrideDate: string;
    overrideType: 'day_off' | 'extra_shift' | 'modified_hours';
    shiftStart?: string;
    shiftEnd?: string;
    reason?: string;
    approvedBy?: string;
  }) {
    const id = randomUUID();
    await db.insert(shiftOverrides).values({
      id,
      staffId: data.staffId,
      overrideDate: new Date(data.overrideDate),
      overrideType: data.overrideType,
      shiftStart: data.shiftStart ?? null,
      shiftEnd: data.shiftEnd ?? null,
      reason: data.reason ?? null,
      approvedBy: data.approvedBy ?? null,
    });
    return { id };
  }

  /** Get overrides for a staff member */
  static async getStaffOverrides(staffId: string, startDate?: string, endDate?: string) {
    const conds = [eq(shiftOverrides.staffId, staffId)];
    if (startDate) conds.push(gte(shiftOverrides.overrideDate, new Date(startDate)));
    if (endDate) conds.push(lte(shiftOverrides.overrideDate, new Date(endDate)));
    return db.select().from(shiftOverrides).where(and(...conds)).orderBy(shiftOverrides.overrideDate);
  }

  /** Get all staff with their shift schedule (for manager view) */
  static async getAllStaffSchedules(branchId: string) {
    const staffList = await db
      .select({
        id: staff.id,
        userId: staff.userId,
        employeeCode: staff.employeeCode,
        designation: staff.designation,
        fullName: users.fullName,
      })
      .from(staff)
      .innerJoin(users, eq(staff.userId, users.id))
      .where(and(eq(staff.branchId, branchId), isNull(staff.deletedAt)));

    const shifts = await db
      .select()
      .from(staffShifts)
      .where(eq(staffShifts.isActive, true));

    // Group shifts by staffId
    const shiftMap = new Map<string, typeof shifts>();
    for (const s of shifts) {
      const arr = shiftMap.get(s.staffId) ?? [];
      arr.push(s);
      shiftMap.set(s.staffId, arr);
    }

    return staffList.map((s) => ({
      ...s,
      shifts: shiftMap.get(s.id) ?? [],
    }));
  }
}
