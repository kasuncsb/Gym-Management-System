"use client";

import { useState, useEffect } from "react";
import { FileText, Check, X, Calendar, RefreshCw, Eye } from "lucide-react";
import { adminAPI, getErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader, Card, EmptyState, ErrorAlert, Badge, Modal, LoadingButton } from "@/components/ui/SharedComponents";

interface PendingDocument {
    id: string;
    type: string;
    status: string;
    documentUrl: string;
    uploadedAt: string;
    member: { id: string; fullName: string; email: string; memberCode: string };
}

const TYPE_LABELS: Record<string, string> = { nic: "National ID", passport: "Passport", license: "Driving License" };

export default function AdminDocumentsPage() {
    const toast = useToast();
    const [documents, setDocuments] = useState<PendingDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectModal, setRejectModal] = useState<PendingDocument | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejecting, setRejecting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const fetchDocuments = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await adminAPI.getPendingDocuments();
            setDocuments(res.data.data || []);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDocuments(); }, []);

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        try {
            await adminAPI.approveDocument(id);
            setDocuments(prev => prev.filter(d => d.id !== id));
            toast.success("Document approved", "Member verification has been approved.");
        } catch (err) {
            toast.error("Approval failed", getErrorMessage(err));
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async () => {
        if (!rejectModal || !rejectReason.trim()) return;
        setRejecting(true);
        try {
            await adminAPI.rejectDocument(rejectModal.id, rejectReason);
            setDocuments(prev => prev.filter(d => d.id !== rejectModal.id));
            toast.success("Document rejected", "Rejection reason has been sent to the member.");
            setRejectModal(null);
            setRejectReason("");
        } catch (err) {
            toast.error("Rejection failed", getErrorMessage(err));
        } finally {
            setRejecting(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 page-enter">
                <div className="space-y-2"><Skeleton className="h-8 w-52" /><Skeleton className="h-4 w-72" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 page-enter">
            <PageHeader title="Document Approvals" subtitle={`${documents.length} pending verification${documents.length !== 1 ? "s" : ""}`}>
                <LoadingButton onClick={fetchDocuments} variant="secondary" size="sm"><RefreshCw size={16} className="mr-1.5" /> Refresh</LoadingButton>
            </PageHeader>

            {error && <ErrorAlert message={error} onRetry={fetchDocuments} />}

            {documents.length === 0 ? (
                <Card><EmptyState icon={FileText} title="No pending documents" description="All verification requests have been processed." /></Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-in">
                    {documents.map(doc => (
                        <Card key={doc.id} className="flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-semibold text-white">{doc.member.fullName}</h3>
                                    <p className="text-xs text-zinc-500">{doc.member.email}</p>
                                    <p className="text-xs text-zinc-600 mt-0.5">{doc.member.memberCode}</p>
                                </div>
                                <Badge variant="warning">{TYPE_LABELS[doc.type] || doc.type.toUpperCase()}</Badge>
                            </div>

                            <div className="bg-black/40 rounded-xl p-3 mb-4 border border-zinc-800 flex-1">
                                <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                                    <Calendar size={12} />
                                    Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                                </div>
                                <div
                                    className="aspect-video bg-zinc-900 rounded-lg flex items-center justify-center relative overflow-hidden group cursor-pointer"
                                    onClick={() => doc.documentUrl && setPreviewUrl(doc.documentUrl)}
                                >
                                    {doc.documentUrl ? (
                                        <>
                                            <img src={doc.documentUrl} alt="Document" className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition">
                                                <span className="flex items-center gap-1.5 bg-white text-black px-3 py-1.5 rounded-full text-xs font-bold"><Eye size={12} /> View Full</span>
                                            </div>
                                        </>
                                    ) : (
                                        <span className="text-xs text-zinc-600">No Preview Available</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <LoadingButton
                                    onClick={() => setRejectModal(doc)}
                                    disabled={processingId === doc.id}
                                    variant="ghost"
                                    className="flex-1 text-red-400 border-red-500/20 border hover:bg-red-500/10"
                                >
                                    <X size={16} className="mr-1.5" /> Reject
                                </LoadingButton>
                                <LoadingButton
                                    onClick={() => handleApprove(doc.id)}
                                    loading={processingId === doc.id}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                                >
                                    <Check size={16} className="mr-1.5" /> Approve
                                </LoadingButton>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Reject Modal (replaces prompt()) */}
            <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setRejectReason(""); }} title="Reject Document" description={`Provide a reason for rejecting ${rejectModal?.member.fullName}'s document.`}>
                <div className="space-y-4">
                    <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all resize-none"
                        placeholder="e.g. Document is blurry, please re-upload a clearer version..."
                        autoFocus
                    />
                    <div className="flex justify-end gap-3">
                        <button onClick={() => { setRejectModal(null); setRejectReason(""); }} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Cancel</button>
                        <LoadingButton loading={rejecting} onClick={handleReject} disabled={!rejectReason.trim()} variant="danger">Reject Document</LoadingButton>
                    </div>
                </div>
            </Modal>

            {/* Image Preview Modal */}
            <Modal isOpen={!!previewUrl} onClose={() => setPreviewUrl(null)} title="Document Preview" size="lg">
                {previewUrl && <img src={previewUrl} alt="Document" className="w-full rounded-xl" />}
            </Modal>
        </div>
    );
}
