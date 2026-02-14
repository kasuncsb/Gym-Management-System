// Document Service — Phase 1 (Drizzle ORM)
// Handles identity-verification document uploads and admin review.
import { db } from '../config/database';
import { memberDocuments, members, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export class DocumentService {
  /** Create a new document record (upload metadata) */
  static async createDocument(data: {
    memberId: string;
    documentType: 'nic_front' | 'nic_back' | 'selfie_with_nic' | 'student_id' | 'other';
    storageKey: string;
    originalFilename?: string;
    mimeType?: string;
    fileSizeBytes?: number;
  }) {
    const id = randomUUID();
    await db.insert(memberDocuments).values({
      id,
      memberId: data.memberId,
      documentType: data.documentType,
      storageKey: data.storageKey,
      originalFilename: data.originalFilename ?? null,
      mimeType: data.mimeType ?? null,
      fileSizeBytes: data.fileSizeBytes ?? null,
      verificationStatus: 'pending_review',
    });
    return { id };
  }

  /** Get documents pending admin review */
  static async getPendingDocuments() {
    return db
      .select({
        id: memberDocuments.id,
        memberId: memberDocuments.memberId,
        memberName: users.fullName,
        memberEmail: users.email,
        documentType: memberDocuments.documentType,
        storageKey: memberDocuments.storageKey,
        originalFilename: memberDocuments.originalFilename,
        verificationStatus: memberDocuments.verificationStatus,
        uploadedAt: memberDocuments.uploadedAt,
      })
      .from(memberDocuments)
      .innerJoin(members, eq(members.id, memberDocuments.memberId))
      .innerJoin(users, eq(users.id, members.userId))
      .where(eq(memberDocuments.verificationStatus, 'pending_review'));
  }

  /** Get all documents for a member */
  static async getMemberDocuments(memberId: string) {
    return db.select().from(memberDocuments).where(eq(memberDocuments.memberId, memberId));
  }

  /** Approve a document */
  static async approveDocument(documentId: string, reviewerId: string) {
    await db
      .update(memberDocuments)
      .set({ verificationStatus: 'verified', reviewedBy: reviewerId, reviewedAt: new Date() })
      .where(eq(memberDocuments.id, documentId));
  }

  /** Reject a document */
  static async rejectDocument(
    documentId: string,
    reviewerId: string,
    reason: 'blurry' | 'incomplete' | 'mismatch' | 'expired_nic' | 'wrong_document' | 'custom',
    note?: string,
  ) {
    await db
      .update(memberDocuments)
      .set({
        verificationStatus: 'rejected',
        rejectionReason: reason,
        rejectionNote: note ?? null,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      })
      .where(eq(memberDocuments.id, documentId));
  }

  /** Check if all required docs are verified for a member */
  static async areAllDocsVerified(memberId: string): Promise<boolean> {
    const docs = await db
      .select({ status: memberDocuments.verificationStatus })
      .from(memberDocuments)
      .where(eq(memberDocuments.memberId, memberId));

    if (docs.length === 0) return false;
    return docs.every((d) => d.status === 'verified');
  }

  /** Update member verification status */
  static async updateMemberVerificationStatus(memberId: string, isVerified: boolean) {
    await db
      .update(members)
      .set({ status: isVerified ? 'active' : 'incomplete' })
      .where(eq(members.id, memberId));
  }
}
