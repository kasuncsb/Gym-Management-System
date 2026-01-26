import { eq, and, isNull, or, gte, lte, desc } from 'drizzle-orm';
import { db } from '../config/database';
import { appointments, members, trainers, users } from '../db/schema';
import { NotFoundError, ConflictError, ValidationError } from '../utils/error-types';
import { randomUUID } from 'crypto';

export class AppointmentService {

    // Book an appointment (Member)
    static async createAppointment(
        memberId: string,
        data: {
            trainerId: string;
            startTime: Date;
            endTime: Date;
            type?: 'consultation' | 'training_session' | 'assessment' | 'other';
            notes?: string;
        }
    ) {
        // 1. Check if trainer exists
        const [trainer] = await db.select()
            .from(trainers)
            .where(eq(trainers.id, data.trainerId))
            .limit(1);

        if (!trainer) throw new NotFoundError('Trainer');

        // 2. Check availability (Simple overlap check)
        const overlapping = await db.select()
            .from(appointments)
            .where(and(
                eq(appointments.trainerId, data.trainerId),
                eq(appointments.status, 'confirmed'),
                or(
                    and(lte(appointments.startTime, data.startTime), gte(appointments.endTime, data.startTime)), // Starts during existing
                    and(lte(appointments.startTime, data.endTime), gte(appointments.endTime, data.endTime)), // Ends during existing
                    and(gte(appointments.startTime, data.startTime), lte(appointments.endTime, data.endTime)) // Encloses existing
                )
            ))
            .limit(1);

        if (overlapping.length > 0) {
            throw new ConflictError('Trainer is not available at this time');
        }

        // 3. Create Appointment
        const id = randomUUID();
        await db.insert(appointments).values({
            id,
            memberId,
            trainerId: data.trainerId,
            startTime: data.startTime,
            endTime: data.endTime,
            type: data.type || 'training_session',
            status: 'pending', // Requires trainer confirmation? Or confirmed by default? Let's say confirmed for now to satisfy MVP
            notes: data.notes
        });

        return { id, ...data, status: 'pending' };
    }

    // Get Member's Appointments
    static async getMemberAppointments(memberId: string) {
        return db.select({
            id: appointments.id,
            startTime: appointments.startTime,
            endTime: appointments.endTime,
            status: appointments.status,
            type: appointments.type,
            trainerName: users.fullName,
            notes: appointments.notes
        })
            .from(appointments)
            .innerJoin(trainers, eq(appointments.trainerId, trainers.id))
            .innerJoin(users, eq(trainers.userId, users.id))
            .where(eq(appointments.memberId, memberId))
            .orderBy(desc(appointments.startTime));
    }
}
