'use client';

import { useState } from 'react';
import { memberAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, ArrowLeft, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

export default function DocumentUploadPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [type, setType] = useState('nic');
    const [fileUrl, setFileUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileUrl.trim()) {
            setError('Please provide a public file URL');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await memberAPI.uploadDocument({
                documentType: type,
                storageKey: fileUrl.trim()
            });

            if (response.data.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/member');
                }, 2000);
            } else {
                setError(response.data.message || 'Upload failed');
            }
        } catch (err: any) {
            setError(err.message || 'Error uploading document');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6">
                <div className="bg-neutral-900/50 border border-green-500/20 rounded-2xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="text-green-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Upload Successful!</h2>
                    <p className="text-gray-400 mb-6">Your document has been submitted for verification.</p>
                    <div className="text-sm text-gray-500">Redirecting to dashboard...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-md mx-auto mt-10">
                <Link href="/member" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Dashboard
                </Link>

                <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-xl bg-red-600/10 text-red-500">
                            <Upload size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                Verify Identity
                            </h1>
                            <p className="text-sm text-gray-500">Upload documents to unlock full access</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Document Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 transition-colors"
                            >
                                <option value="nic">National Identity Card (NIC)</option>
                                <option value="passport">Passport</option>
                                <option value="license">Driving License</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Upload File</label>
                            <div className={`
                                border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer relative
                                ${file ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}
                            `}>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                {file ? (
                                    <div className="flex flex-col items-center">
                                        <FileText className="text-green-500 mb-2" size={32} />
                                        <div className="text-sm font-medium text-white">{file.name}</div>
                                        <div className="text-xs text-green-500 mt-1">Ready to upload</div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <Upload className="text-gray-500 mb-2" size={32} />
                                        <div className="text-sm font-medium text-gray-300">Click to Select File</div>
                                        <div className="text-xs text-gray-500 mt-1">JPG, PNG, PDF up to 5MB</div>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-3">
                                Upload your file to a public storage provider and paste the link below.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Public File URL</label>
                            <div className="relative">
                                <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="url"
                                    value={fileUrl}
                                    onChange={(e) => setFileUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 pl-9 text-white focus:outline-none focus:border-red-500/50 transition-colors"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !fileUrl.trim()}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload size={20} />
                                    Submit for Verification
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
