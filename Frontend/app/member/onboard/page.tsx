'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, getErrorMessage, opsAPI } from '@/lib/api';
import { useAuth, dashboardPathForRole } from '@/context/AuthContext';
import {
    ChevronRight, ChevronLeft, Loader2, CheckCircle,
    AlertCircle, Flame, Zap, Wind, Activity, Heart, Upload, FileImage,
    Dumbbell, Target, Leaf, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3;

interface OnboardData {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced' | '';
    fitnessGoals: string;
    age: string;
    weightKg: string;
    heightCm: string;
}

const GOALS = [
    { id: 'fat_burn', label: 'Fat Burn', icon: Flame },
    { id: 'muscle_gain', label: 'Muscle Gain', icon: Zap },
    { id: 'endurance', label: 'Endurance', icon: Wind },
    { id: 'flexibility', label: 'Flexibility', icon: Activity },
    { id: 'general', label: 'General Fitness', icon: Heart },
];

export default function Onboard() {
    const router = useRouter();
    const { isLoading: authLoading, isAuthenticated, user, refreshUser } = useAuth();
    const [step, setStep] = useState<Step>(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<OnboardData>({
        experienceLevel: '',
        fitnessGoals: '',
        age: '',
        weightKg: '',
        heightCm: '',
    });

    const update = (field: keyof OnboardData, value: string) =>
        setData(prev => ({ ...prev, [field]: value }));

    // BUG-11 fix: Guard against unauthenticated access and non-member roles.
    // Enforce flow: verify email first, then onboard. Dashboard only after onboarding.
    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) { router.replace('/login'); return; }
        if (user && user.role !== 'member') { router.replace(dashboardPathForRole(user.role)); return; }
        if (user?.role === 'member' && !user?.emailVerified) { router.replace('/member/verify-email'); }
    }, [authLoading, isAuthenticated, user, router]);

    // Step 1 — ID document type and files
    type DocType = 'nic' | 'driving_license' | 'passport';
    const [documentType, setDocumentType] = useState<DocType>('nic');
    const [docFront, setDocFront] = useState<File | null>(null);
    const [docBack, setDocBack] = useState<File | null>(null);
    const [docFrontPreview, setDocFrontPreview] = useState('');
    const [docBackPreview, setDocBackPreview] = useState('');
    const [idUploaded, setIdUploaded] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [uploadedFrontName, setUploadedFrontName] = useState<string | null>(null);
    const [uploadedBackName, setUploadedBackName] = useState<string | null>(null);

    const isPassport = documentType === 'passport';
    const needsTwoFiles = !isPassport;

    const handleFile = (field: 'front' | 'back', file: File | null) => {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setError('File must be under 5MB'); return; }
        if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
        const url = URL.createObjectURL(file);
        if (field === 'front') { setDocFront(file); setDocFrontPreview(url); }
        else { setDocBack(file); setDocBackPreview(url); }
        setError('');
    };

    const canUploadStep1 = isPassport ? !!docFront : !!docFront && !!docBack;
    const canProceedStep2 = data.experienceLevel !== '';
    const canProceedStep3 = data.fitnessGoals !== '';

    const handleUploadIdDocs = async () => {
        if (!canUploadStep1) {
            setError(isPassport ? 'Please select your passport image.' : 'Please select both front and back images.');
            return;
        }
        setUploading(true);
        setError('');
        setUploadProgress(0);
        try {
            const formData = new FormData();
            formData.append('document_type', documentType);
            formData.append('nic_front', docFront!);
            if (!isPassport && docBack) formData.append('nic_back', docBack);
            await authAPI.uploadIdDocuments(formData, {
                onUploadProgress: (e) => {
                    const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
                    setUploadProgress(pct);
                },
            });
            setUploadedFrontName(docFront!.name);
            if (!isPassport && docBack) setUploadedBackName(docBack.name);
            setIdUploaded(true);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleNext = (skipId = false) => {
        if (step === 1) {
            if (!skipId && !idUploaded) { setError('Please upload your documents first, or skip for now.'); return; }
        } else if (step === 2 && !canProceedStep2) { setError('Please select your experience level.'); return; }
        else if (step === 3 && !canProceedStep3) { setError('Please select at least one fitness goal.'); return; }
        setError('');
        setStep(prev => (prev + 1) as Step);
    };

    const toggleGoal = (goalId: string) => {
        const current = data.fitnessGoals ? data.fitnessGoals.split(',') : [];
        const idx = current.indexOf(goalId);
        let next: string[];
        if (idx >= 0) {
            next = current.filter((g) => g !== goalId);
        } else {
            next = [...current, goalId];
        }
        update('fitnessGoals', next.join(','));
    };

    const handleSubmit = async () => {
        if (!canProceedStep3) {
            setError('Please select at least one fitness goal.');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await authAPI.completeOnboarding({
                experienceLevel: data.experienceLevel as 'beginner' | 'intermediate' | 'advanced',
                fitnessGoals: data.fitnessGoals || undefined,
            });
            const weight = Number(data.weightKg);
            const height = Number(data.heightCm);
            const bmi = weight > 0 && height > 0 ? Number((weight / ((height / 100) ** 2)).toFixed(1)) : undefined;
            if (weight > 0 || height > 0 || bmi) {
                await opsAPI.addMetric({
                    weightKg: weight > 0 ? weight : undefined,
                    heightCm: height > 0 ? height : undefined,
                    bmi,
                    notes: data.age ? `Age: ${data.age}` : undefined,
                });
            }
            await refreshUser();
            router.push('/member/dashboard');
        } catch (err) {
            setError(getErrorMessage(err));
            setSubmitting(false);
        }
    };

const stepLabels = ['ID Verification', 'Experience', 'Goals'];

    return (
        <div className="min-h-screen bg-app text-white flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-red-600/30">
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#3c3c3c35_1px,transparent_1px),linear-gradient(to_bottom,#3c3c3c35_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,transparent_40%,black_90%)] pointer-events-none" />

            <div className="w-full max-w-xl relative z-10">
                <div className="flex items-center justify-center gap-2 mb-6">
                    {stepLabels.map((label, i) => {
                        const stepNum = (i + 1) as Step;
                        const isActive = step === stepNum;
                        const isDone = step > stepNum;
                        return (
                            <div key={i} className="flex items-center gap-1.5">
                                <div className="flex flex-col items-center gap-0.5">
                                    <div className={cn(
                                        'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                                        isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-500'
                                    )}>
                                        {isDone ? <CheckCircle size={18} /> : stepNum}
                                    </div>
                                    <span className={cn('text-xs hidden sm:block', isActive ? 'text-white' : 'text-zinc-500')}>{label}</span>
                                </div>
                                {i < stepLabels.length - 1 && (
                                    <div className={cn('w-8 sm:w-12 h-0.5 mb-5 mx-0.5', isDone ? 'bg-emerald-500' : 'bg-zinc-800')} />
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="bg-zinc-800/80 backdrop-blur-xl border border-zinc-700 rounded-3xl p-8 shadow-2xl" id="onboard-card">
                    {error && (
                        <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2" id="onboard-error" role="alert">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-5" id="onboard-step-1">
                            <div>
                                <h2 className="text-xl font-bold text-white">Identity Verification</h2>
                                <p className="text-zinc-400 text-sm mt-1">
                                    {documentType === 'nic' && 'Upload front and back of your National Identity Card. Clear images, under 5MB each.'}
                                    {documentType === 'driving_license' && 'Upload front and back of your Driving License. Clear images, under 5MB each.'}
                                    {documentType === 'passport' && 'Upload the photo page of your Passport. Clear image, under 5MB.'}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="onboard-doc-type" className="text-sm font-medium text-zinc-300">Document type</label>
                                <div className="relative">
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={18} />
                                    <select
                                        id="onboard-doc-type"
                                        value={documentType}
                                        onChange={e => { setDocumentType(e.target.value as DocType); setDocFront(null); setDocBack(null); setDocFrontPreview(''); setDocBackPreview(''); setIdUploaded(false); setUploadedFrontName(null); setUploadedBackName(null); setError(''); }}
                                        className="w-full appearance-none bg-zinc-800/80 border border-zinc-700 rounded-xl py-2.5 pl-4 pr-10 text-white focus:outline-none focus:border-red-600 text-sm cursor-pointer"
                                        aria-label="Document type"
                                    >
                                        <option value="nic" className="bg-zinc-900">National Identity Card</option>
                                        <option value="driving_license" className="bg-zinc-900">Driving License</option>
                                        <option value="passport" className="bg-zinc-900">Passport</option>
                                    </select>
                                </div>
                            </div>
                            <div className={cn('grid gap-4', needsTwoFiles ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1')}>
                                <div className="space-y-1.5">
                                    <label htmlFor="onboard-nic-front" className="text-sm font-medium text-zinc-300">
                                        {isPassport ? 'Passport (photo page)' : 'Front'}
                                    </label>
                                    <label htmlFor="onboard-nic-front" className={cn(
                                        'flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden relative',
                                        docFront ? 'border-emerald-500/50' : 'border-zinc-700 hover:border-zinc-500'
                                    )}>
                                        {docFrontPreview ? (
                                            <img src={docFrontPreview} alt="Front" className="absolute inset-0 w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1.5 text-zinc-500">
                                                <Upload size={24} />
                                                <span className="text-xs">Image files</span>
                                            </div>
                                        )}
                                        <input id="onboard-nic-front" type="file" accept="image/*" className="sr-only" aria-label={isPassport ? 'Passport' : 'Front'}
                                            onChange={e => handleFile('front', e.target.files?.[0] ?? null)} />
                                    </label>
                                    {idUploaded && uploadedFrontName ? (
                                        <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle size={12} /> {uploadedFrontName}</p>
                                    ) : docFront && !idUploaded ? (
                                        <p className="text-xs text-zinc-400">{docFront.name}</p>
                                    ) : null}
                                </div>
                                {needsTwoFiles && (
                                    <div className="space-y-1.5">
                                        <label htmlFor="onboard-nic-back" className="text-sm font-medium text-zinc-300">Back</label>
                                        <label htmlFor="onboard-nic-back" className={cn(
                                            'flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden relative',
                                            docBack ? 'border-emerald-500/50' : 'border-zinc-700 hover:border-zinc-500'
                                        )}>
                                            {docBackPreview ? (
                                                <img src={docBackPreview} alt="Back" className="absolute inset-0 w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-1.5 text-zinc-500">
                                                    <FileImage size={24} />
                                                    <span className="text-xs">Image files</span>
                                                </div>
                                            )}
                                            <input id="onboard-nic-back" type="file" accept="image/*" className="sr-only" aria-label="Back"
                                                onChange={e => handleFile('back', e.target.files?.[0] ?? null)} />
                                        </label>
                                        {idUploaded && uploadedBackName ? (
                                            <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle size={12} /> {uploadedBackName}</p>
                                        ) : docBack && !idUploaded ? (
                                            <p className="text-xs text-zinc-400">{docBack.name}</p>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                            {uploading && (
                                <div className="space-y-1">
                                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                    </div>
                                    <p className="text-xs text-zinc-500">Uploading… {uploadProgress}%</p>
                                </div>
                            )}
                            <p className="text-xs text-zinc-500">Stored securely; reviewed by staff only.</p>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5" id="onboard-step-2">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Dumbbell size={22} className="text-red-500 shrink-0" /> Experience
                                </h2>
                                <p className="text-zinc-400 text-sm mt-1">Select your level.</p>
                            </div>
                            <div className="grid gap-2" role="group" aria-labelledby="onboard-experience-label">
                                <span id="onboard-experience-label" className="sr-only">Experience level</span>
                                {[
                                    { value: 'beginner', label: 'New to gym', icon: Leaf },
                                    { value: 'intermediate', label: 'Some experience', icon: Flame },
                                    { value: 'advanced', label: 'Regular training', icon: Zap },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        id={`onboard-experience-${opt.value}`}
                                        type="button"
                                        onClick={() => update('experienceLevel', opt.value)}
                                        className={cn(
                                            'w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3',
                                            data.experienceLevel === opt.value ? 'border-red-600 bg-red-600/10' : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                        )}
                                    >
                                        <opt.icon size={22} className={data.experienceLevel === opt.value ? 'text-red-500' : 'text-zinc-500'} />
                                        <span className="font-medium text-white">{opt.label}</span>
                                        {data.experienceLevel === opt.value && <CheckCircle size={20} className="text-red-500 ml-auto shrink-0" />}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                <div>
                                    <label htmlFor="onboard-age" className="block text-sm font-medium text-zinc-300 mb-1">Age</label>
                                    <input id="onboard-age" type="number" value={data.age} onChange={(e) => update('age', e.target.value)} className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-red-600" placeholder="e.g. 28" />
                                </div>
                                <div>
                                    <label htmlFor="onboard-weight" className="block text-sm font-medium text-zinc-300 mb-1">Weight (kg)</label>
                                    <input id="onboard-weight" type="number" value={data.weightKg} onChange={(e) => update('weightKg', e.target.value)} className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-red-600" placeholder="e.g. 74" />
                                </div>
                                <div>
                                    <label htmlFor="onboard-height" className="block text-sm font-medium text-zinc-300 mb-1">Height (cm)</label>
                                    <input id="onboard-height" type="number" value={data.heightCm} onChange={(e) => update('heightCm', e.target.value)} className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-red-600" placeholder="e.g. 172" />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-5" id="onboard-step-3">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Target size={22} className="text-red-500 shrink-0" /> Fitness Goals
                                </h2>
                                <p className="text-zinc-400 text-sm mt-1">Pick one or more goals (tap to select/deselect).</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="group" aria-labelledby="onboard-goals-label">
                                <span id="onboard-goals-label" className="sr-only">Fitness goals</span>
                                {GOALS.map(goal => {
                                    const selected = data.fitnessGoals.split(',').includes(goal.id);
                                    return (
                                        <button
                                            key={goal.id}
                                            id={`onboard-goal-${goal.id}`}
                                            type="button"
                                            onClick={() => toggleGoal(goal.id)}
                                            className={cn(
                                                'p-3 rounded-xl border text-left transition-all flex items-center gap-2',
                                                selected ? 'border-red-600 bg-red-600/10' : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                            )}
                                        >
                                            <goal.icon size={18} className={selected ? 'text-red-400' : 'text-zinc-400'} />
                                            <span className="font-medium text-white text-sm">{goal.label}</span>
                                            {selected && <CheckCircle size={16} className="text-red-500 ml-auto shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-6 pt-5 border-t border-zinc-700">
                        {step > 1 ? (
                            <button
                                id="onboard-back"
                                type="button"
                                onClick={() => { setStep(prev => (prev - 1) as Step); setError(''); }}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all text-sm font-medium"
                            >
                                <ChevronLeft size={18} /> Back
                            </button>
                        ) : <div />}
                        {step === 1 ? (
                            <div className="flex items-center gap-3">
                                <button
                                    id="onboard-skip-id"
                                    type="button"
                                    onClick={() => handleNext(true)}
                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 transition-all text-sm font-medium"
                                >
                                    Skip for now
                                </button>
                                {idUploaded ? (
                                    <button
                                        id="onboard-continue"
                                        type="button"
                                        onClick={() => handleNext()}
                                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all"
                                    >
                                        Continue <ChevronRight size={18} />
                                    </button>
                                ) : (
                                    <button
                                        id="onboard-upload"
                                        type="button"
                                        onClick={handleUploadIdDocs}
                                        disabled={!canUploadStep1 || uploading}
                                        className={cn(
                                            'flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all',
                                            (!canUploadStep1 || uploading) && 'opacity-70 cursor-not-allowed'
                                        )}
                                    >
                                        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                                        Upload documents
                                    </button>
                                )}
                            </div>
                        ) : step < 3 ? (
                            <button
                                id="onboard-continue"
                                type="button"
                                onClick={() => handleNext()}
                                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all"
                            >
                                Continue <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button
                                id="onboard-submit"
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting}
                                className={cn(
                                    'flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all',
                                    submitting && 'opacity-70 cursor-not-allowed'
                                )}
                            >
                                {submitting ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle size={18} /> Complete</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
