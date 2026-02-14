// Equipment Service — Phase 1 (Drizzle ORM)
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../config/database';
import { equipment, maintenanceLogs, equipmentIssues } from '../db/schema';
import { randomUUID } from 'crypto';

export class EquipmentService {
  /** Add new equipment */
  static async addEquipment(data: {
    name: string;
    category: 'cardio' | 'strength_machine' | 'free_weight' | 'bench' | 'accessory' | 'other';
    branchId: string;
    serialNumber?: string;
    manufacturer?: string;
    model?: string;
    purchaseDate?: string;
    purchasePrice?: string;
    locationZone?: string;
  }) {
    const id = randomUUID();
    await db.insert(equipment).values({
      id,
      branchId: data.branchId,
      name: data.name,
      category: data.category,
      serialNumber: data.serialNumber ?? null,
      manufacturer: data.manufacturer ?? null,
      model: data.model ?? null,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      purchasePrice: data.purchasePrice ?? null,
      locationZone: data.locationZone ?? null,
      status: 'operational',
    });
    return { id, ...data };
  }

  /** List equipment (optionally filtered by branch) */
  static async listEquipment(branchId?: string) {
    if (branchId) {
      return db.select().from(equipment).where(eq(equipment.branchId, branchId));
    }
    return db.select().from(equipment);
  }

  /** Get single equipment by ID */
  static async getEquipmentById(id: string) {
    const [item] = await db.select().from(equipment).where(eq(equipment.id, id)).limit(1);
    return item ?? null;
  }

  /** Report an equipment issue */
  static async reportIssue(data: {
    equipmentId: string;
    reportedBy: string;
    issueType: 'malfunction' | 'damage' | 'noise' | 'safety_concern' | 'missing_part' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }) {
    const id = randomUUID();
    await db.insert(equipmentIssues).values({
      id,
      equipmentId: data.equipmentId,
      reportedBy: data.reportedBy,
      issueType: data.issueType,
      severity: data.severity,
      description: data.description,
      status: 'open',
    });

    // If severity is high/critical, mark equipment
    if (data.severity === 'high' || data.severity === 'critical') {
      await db.update(equipment).set({ status: 'needs_maintenance' }).where(eq(equipment.id, data.equipmentId));
    }

    return { id, ...data };
  }

  /** Log a maintenance action */
  static async logMaintenance(equipmentId: string, data: {
    description: string;
    cost?: number;
    performedBy?: string;
    statusAfter: 'operational' | 'needs_more_work';
    issueId?: string;
    loggedBy?: string;
  }) {
    const id = randomUUID();
    await db.insert(maintenanceLogs).values({
      id,
      equipmentId,
      issueId: data.issueId ?? null,
      description: data.description,
      cost: data.cost != null ? data.cost.toString() : null,
      performedBy: data.performedBy ?? null,
      statusAfter: data.statusAfter,
      loggedBy: data.loggedBy ?? null,
    });

    // Update equipment status
    const newStatus = data.statusAfter === 'operational' ? 'operational' : 'under_maintenance';
    await db
      .update(equipment)
      .set({ status: newStatus, lastMaintenanceDate: new Date() })
      .where(eq(equipment.id, equipmentId));

    // If linked to an issue and resolved, close it
    if (data.issueId && data.statusAfter === 'operational') {
      await db
        .update(equipmentIssues)
        .set({ status: 'resolved', resolvedAt: new Date(), resolvedBy: data.loggedBy ?? null })
        .where(eq(equipmentIssues.id, data.issueId));
    }

    return { id, equipmentId };
  }

  /** Get open issues */
  static async getOpenIssues(branchId?: string) {
    const rows = await db
      .select({ issue: equipmentIssues, equip: { name: equipment.name, branchId: equipment.branchId } })
      .from(equipmentIssues)
      .innerJoin(equipment, eq(equipmentIssues.equipmentId, equipment.id))
      .where(eq(equipmentIssues.status, 'open'))
      .orderBy(desc(equipmentIssues.createdAt));

    if (branchId) return rows.filter((r) => r.equip.branchId === branchId);
    return rows;
  }
}
