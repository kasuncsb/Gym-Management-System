'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { Check, X, FileText, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PendingDocument {
    id: string;
    type: string;
    status: string;
    documentUrl: string;
    uploadedAt: string;
    member: {
        id: string;
        fullName: string;
        email: string;
        memberCode: string;
    };
}

export default function AdminDocumentsPage() {
    const router = useRouter();
    const [documents, setDocuments] = useState<PendingDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getPendingDocuments();
            if (response.data.success) {
                setDocuments(response.data.data);
            } else {
                setError('Failed to load documents');
            }
        } catch (err: any) {
            setError(err.message || 'Error loading documents');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleApprove = async (id: string) => {
        try {
            setProcessingId(id);
            await adminAPI.approveDocument(id);
            // Remove from list locally
            setDocuments(prev => prev.filter(doc => doc.id !== id));
        } catch (err: any) {
            alert(err.message || 'Failed to approve document');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        try {
            setProcessingId(id);
            await adminAPI.rejectDocument(id, reason);
            // Remove from list locally
            setDocuments(prev => prev.filter(doc => doc.id !== id));
        } catch (err: any) {
            alert(err.message || 'Failed to reject document');
        } finally {
            setProcessingId(null);
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'nic': return 'National ID';
            case 'passport': return 'Passport';
            case 'license': return 'Driving License';
            default: return type.toUpperCase();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    Document Approvals
                </h1>
                <button
                    onClick={fetchDocuments}
                    className="p-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors"
                >
                    Refresh
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 animate-pulse h-48"></div>
                    ))}
                </div>
            ) : documents.length === 0 ? (
                <div className="text-center py-12 bg-neutral-900/50 rounded-2xl border border-white/5">
                    <FileText className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <h3 className="text-lg font-medium text-white">No pending documents</h3>
                    <p className="text-gray-500 mt-2">All verification requests have been processed.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {documents.map((doc) => (
                        <div key={doc.id} className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-semibold text-white text-lg">{doc.member.fullName}</h3>
                                    <p className="text-sm text-gray-400">{doc.member.email}</p>
                                    <p className="text-xs text-xs text-gray-500 mt-1">{doc.member.memberCode}</p>
                                </div>
                                <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-medium rounded-lg border border-yellow-500/20">
                                    {getTypeLabel(doc.type)}
                                </span>
                            </div>

                            <div className="bg-black/30 rounded-xl p-4 mb-4 border border-white/5">
                                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                    <Calendar size={14} />
                                    <span>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                </div>
                                {/* Placeholder for document preview if URL is image */}
                                <div className="aspect-video bg-neutral-800 rounded-lg flex items-center justify-center text-gray-500 text-xs mt-2 relative overflow-hidden group">
                                    {/* Since we don't have real file upload yet, showing placeholder logic */}
                                    {doc.documentUrl ? (
                                        <img src={doc.documentUrl} alt="Document" className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
                                    ) : (
                                        <span>No Preview Available</span>
                                    )}
                                    <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold">View Full</span>
                                    </a>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleReject(doc.id)}
                                    disabled={processingId === doc.id}
                                    className="flex-1 py-2 px-4 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <X size={16} />
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleApprove(doc.id)}
                                    disabled={processingId === doc.id}
                                    className="flex-1 py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium shadow-lg shadow-emerald-500/20"
                                >
                                    <Check size={16} />
                                    Approve
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
