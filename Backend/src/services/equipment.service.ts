import { eq } from 'drizzle-orm';
import { db } from '../config/database';
import { equipment, maintenanceLogs } from '../db/schema';
import { randomUUID } from 'crypto';

export class EquipmentService {

    static async addEquipment(data: {
        name: string;
        type: string;
        serialNumber?: string;
        branchId?: string;
    }) {
        const id = randomUUID();
        await db.insert(equipment).values({
            id,
            name: data.name,
            type: data.type,
            serialNumber: data.serialNumber,
            branchId: data.branchId,
            status: 'operational',
            purchaseDate: new Date()
        });
        return { id, ...data };
    }

    static async listEquipment(branchId?: string) {
        let query = db.select().from(equipment);
        if (branchId) {
            query = query.where(eq(equipment.branchId, branchId)) as any;
        }
        return query;
    }

    static async logMaintenance(equipmentId: string, data: { description: string, cost: number, performedBy: string }) {
        const id = randomUUID();
        await db.insert(maintenanceLogs).values({
            id,
            equipmentId,
            description: data.description,
            cost: data.cost.toString(),
            performedBy: data.performedBy,
            performedAt: new Date()
        });

        // Update status
        await db.update(equipment).set({ status: 'maintenance' }).where(eq(equipment.id, equipmentId));
        return { id, equipmentId, ...data };
    }
}
