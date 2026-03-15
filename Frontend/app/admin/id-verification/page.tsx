'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check, X, FileImage, Loader2 } from 'lucide-react';
import { PageHeader, Card, Modal, Textarea, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { authAPI } from '@/lib/api';

interface IdSubmission {
    id: string;
    fullName: string;
    email: string;
    memberCode: string | null;
    idVerificationStatus: string | null;
    idVerificationNote: string | null;
    idSubmittedAt: string | null;
}

export default function AdminIdVerificationPage() {
    const toast = useToast();
    const [submissions, setSubmissions] = useState<IdSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [verifyOpen, setVerifyOpen] = useState(false);
    const [selected, setSelected] = useState<IdSubmission | null>(null);
    const [action, setAction] = useState<'approved' | 'rejected'>('approved');
    const [note, setNote] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);
    const [docModalOpen, setDocModalOpen] = useState(false);
    const [docMember, setDocMember] = useState<IdSubmission | null>(null);
    const [docFrontUrl, setDocFrontUrl] = useState<string | null>(null);
    const [docBackUrl, setDocBackUrl] = useState<string | null>(null);
    const [docLoading, setDocLoading] = useState(false);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const res = await authAPI.getIdSubmissions();
            setSubmissions(res.data.data ?? []);
        } catch {
            toast.error('Error', 'Failed to load ID submissions');
            setSubmissions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const openVerify = (s: IdSubmission, act: 'approved' | 'rejected') => {
        setSelected(s);
        setAction(act);
        setNote('');
        setVerifyOpen(true);
    };

    const openDocModal = useCallback(async (s: IdSubmission) => {
        setDocMember(s);
        setDocModalOpen(true);
        setDocFrontUrl(null);
        setDocBackUrl(null);
        setDocLoading(true);
        try {
            const [frontBlob, backBlob] = await Promise.all([
                authAPI.getIdDocumentBlob(s.id, 'front'),
                authAPI.getIdDocumentBlob(s.id, 'back'),
            ]);
            setDocFrontUrl(URL.createObjectURL(frontBlob));
            setDocBackUrl(URL.createObjectURL(backBlob));
        } catch {
            toast.error('Error', 'Failed to load ID documents');
        } finally {
            setDocLoading(false);
        }
    }, [toast]);

    const closeDocModal = useCallback(() => {
        setDocModalOpen(false);
        if (docFrontUrl) URL.revokeObjectURL(docFrontUrl);
        if (docBackUrl) URL.revokeObjectURL(docBackUrl);
        setDocFrontUrl(null);
        setDocBackUrl(null);
        setDocMember(null);
    }, [docFrontUrl, docBackUrl]);

    const handleVerify = async () => {
        if (!selected) return;
        if (action === 'rejected' && !note.trim()) {
            toast.error('Validation Error', 'Note is required when rejecting');
            return;
        }
        setSubmitLoading(true);
        try {
            await authAPI.adminVerifyId(selected.id, action, action === 'rejected' ? note : undefined);
            toast.success(action === 'approved' ? 'ID Approved' : 'ID Rejected', `Verification updated for ${selected.fullName}`);
            setVerifyOpen(false);
            setSelected(null);
            fetchSubmissions();
        } catch (e: unknown) {
            const msg = e && typeof e === 'object' && 'response' in e
                ? (e as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
                : 'Failed to verify';
            toast.error('Error', String(msg));
        } finally {
            setSubmitLoading(false);
        }
    };

    const pending = submissions.filter(s => s.idVerificationStatus === 'pending' || !s.idVerificationStatus);
    const verified = submissions.filter(s => s.idVerificationStatus === 'approved');
    const rejected = submissions.filter(s => s.idVerificationStatus === 'rejected');

    return (
        <div className="space-y-8">
            <PageHeader
                title="ID Verification"
                subtitle="Review and verify member NIC submissions"
            />

            <div className="grid grid-cols-3 gap-4">
                <Card padding="md" className="text-center">
                    <p className="text-2xl font-bold text-amber-400">{pending.length}</p>
                    <p className="text-zinc-500 text-xs">Pending</p>
                </Card>
                <Card padding="md" className="text-center">
                    <p className="text-2xl font-bold text-emerald-400">{verified.length}</p>
                    <p className="text-zinc-500 text-xs">Approved</p>
                </Card>
                <Card padding="md" className="text-center">
                    <p className="text-2xl font-bold text-red-400">{rejected.length}</p>
                    <p className="text-zinc-500 text-xs">Rejected</p>
                </Card>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <Card padding="none">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-700">
                                    <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Member</th>
                                    <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Code</th>
                                    <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Submitted</th>
                                    <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Status</th>
                                    <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Documents</th>
                                    <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map(s => (
                                    <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                        <td className="px-6 py-4">
                                            <p className="text-white font-semibold">{s.fullName}</p>
                                            <p className="text-zinc-500 text-xs">{s.email}</p>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400">{s.memberCode ?? '—'}</td>
                                        <td className="px-6 py-4 text-zinc-400">{s.idSubmittedAt ? new Date(s.idSubmittedAt).toLocaleDateString() : '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                                s.idVerificationStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                                                s.idVerificationStatus === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                                'bg-amber-500/20 text-amber-400'
                                            }`}>
                                                {s.idVerificationStatus ?? 'pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                type="button"
                                                onClick={() => openDocModal(s)}
                                                className="text-zinc-400 hover:text-white text-sm font-medium flex items-center gap-1"
                                            >
                                                <FileImage size={14} /> View
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            {(s.idVerificationStatus === 'pending' || !s.idVerificationStatus) && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => openVerify(s, 'approved')} className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1">
                                                        <Check size={14} /> Approve
                                                    </button>
                                                    <button onClick={() => openVerify(s, 'rejected')} className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-1">
                                                        <X size={14} /> Reject
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {submissions.length === 0 && (
                        <div className="py-12 text-center text-zinc-500">No ID submissions found.</div>
                    )}
                </Card>
            )}

            <Modal isOpen={docModalOpen} onClose={closeDocModal} title="ID Documents" description={docMember ? docMember.fullName : ''} size="lg">
                <div className="space-y-4">
                    {docLoading ? (
                        <div className="flex items-center justify-center py-12 gap-2 text-zinc-400">
                            <Loader2 size={24} className="animate-spin" /> Loading documents...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">NIC Front</p>
                                {docFrontUrl ? (
                                    <img src={docFrontUrl} alt="NIC Front" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 object-contain max-h-80" />
                                ) : (
                                    <div className="w-full h-40 rounded-xl border border-zinc-700 bg-zinc-800/50 flex items-center justify-center text-zinc-500 text-sm">Failed to load</div>
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">NIC Back</p>
                                {docBackUrl ? (
                                    <img src={docBackUrl} alt="NIC Back" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 object-contain max-h-80" />
                                ) : (
                                    <div className="w-full h-40 rounded-xl border border-zinc-700 bg-zinc-800/50 flex items-center justify-center text-zinc-500 text-sm">Failed to load</div>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end pt-2">
                        <LoadingButton variant="secondary" onClick={closeDocModal}>Close</LoadingButton>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={verifyOpen} onClose={() => setVerifyOpen(false)} title={action === 'approved' ? 'Approve ID' : 'Reject ID'} description={selected ? `Verifying ${selected.fullName}` : ''} size="sm">
                <div className="space-y-4">
                    {action === 'rejected' && (
                        <Textarea
                            label="Note (required for rejection)"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Reason for rejection"
                            required
                        />
                    )}
                    {action === 'approved' && (
                        <p className="text-zinc-400 text-sm">Confirm approval of this member&apos;s ID documents.</p>
                    )}
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setVerifyOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton
                            loading={submitLoading}
                            onClick={handleVerify}
                            variant={action === 'rejected' ? 'danger' : 'primary'}
                        >
                            {action === 'approved' ? 'Approve' : 'Reject'}
                        </LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
