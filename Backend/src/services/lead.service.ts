import { eq, desc } from 'drizzle-orm';
import { db } from '../config/database';
import { leads } from '../db/schema';
import { randomUUID } from 'crypto';

export class LeadService {

    static async createLead(data: { name: string, email?: string, phone?: string, source?: string }) {
        const id = randomUUID();
        await db.insert(leads).values({
            id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            source: data.source || 'walk_in',
            status: 'new'
        });
        return { id, ...data };
    }

    static async listLeads() {
        return db.select().from(leads).orderBy(desc(leads.createdAt));
    }

    static async updateStatus(id: string, status: 'new' | 'contacted' | 'converted' | 'lost', notes?: string) {
        await db.update(leads)
            .set({ status, notes, followUpDate: new Date() }) // Bump follow up
            .where(eq(leads.id, id));
        return { id, status };
    }
}
