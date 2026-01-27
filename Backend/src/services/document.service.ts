// Document Service - Handles document uploads and verification
import { db } from '../config/database';
import { memberDocuments, members, users } from '../db/schema';
import { eq, isNull, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// For now, using local storage simulation. In production, replace with Oracle Object Storage SDK.
// Oracle OCI SDK would be: import { ObjectStorageClient } from 'oci-objectstorage';

interface DocumentUpload {
    memberId: string;
    type: 'nic' | 'passport' | 'waiver' | 'contract';
    fileUrl: string;
}

interface DocumentWithMember {
    id: string;
    memberId: string;
    memberName: string;
    memberEmail: string;
    type: string;
    fileUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    signedAt: Date | null;
    reviewedAt: Date | null;
    reviewedBy: string | null;
    rejectionReason: string | null;
}

export class DocumentService {
    // Upload document metadata (actual file upload handled by storage service)
    static async createDocument(data: DocumentUpload): Promise<{ id: string }> {
        const id = nanoid();

        await db.insert(memberDocuments).values({
            id,
            memberId: data.memberId,
            type: data.type,
            fileUrl: data.fileUrl,
            signedAt: new Date(),
        });

        return { id };
    }

    // Get pending documents for admin approval
    static async getPendingDocuments(): Promise<DocumentWithMember[]> {
        const results = await db
            .select({
                id: memberDocuments.id,
                memberId: memberDocuments.memberId,
                memberName: users.fullName,
                memberEmail: users.email,
                type: memberDocuments.type,
                fileUrl: memberDocuments.fileUrl,
                signedAt: memberDocuments.signedAt,
            })
            .from(memberDocuments)
            .innerJoin(members, eq(members.id, memberDocuments.memberId))
            .innerJoin(users, eq(users.id, members.userId))
            .where(
                // Filter for documents not yet reviewed (no status field in schema, so using signedAt as proxy)
                isNull(memberDocuments.signedAt)
            );

        // Transform to match interface (schema doesn't have status field yet)
        return results.map(r => ({
            ...r,
            status: 'pending' as const,
            reviewedAt: null,
            reviewedBy: null,
            rejectionReason: null,
        }));
    }

    // Get documents by member
    static async getMemberDocuments(memberId: string): Promise<any[]> {
        return db
            .select()
            .from(memberDocuments)
            .where(eq(memberDocuments.memberId, memberId));
    }

    // Update member verification status
    static async updateMemberVerificationStatus(
        memberId: string,
        isVerified: boolean
    ): Promise<void> {
        await db
            .update(members)
            .set({
                status: isVerified ? 'active' : 'pending'
            })
            .where(eq(members.id, memberId));
    }

    // Check if member is verified
    static async isMemberVerified(memberId: string): Promise<boolean> {
        const [member] = await db
            .select({ status: members.status })
            .from(members)
            .where(eq(members.id, memberId))
            .limit(1);

        return member?.status === 'active';
    }
}
