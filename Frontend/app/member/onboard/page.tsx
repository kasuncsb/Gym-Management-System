'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, getErrorMessage } from '@/lib/api';
import { useAuth, dashboardPathForRole } from '@/context/AuthContext';
import {
    ChevronRight, ChevronLeft, Loader2, CheckCircle,
    AlertCircle, Flame, Zap, Wind, Activity, Heart, Upload, FileImage,
    CreditCard, Dumbbell, Target, Leaf
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3;

interface OnboardData {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced' | '';
    fitnessGoals: string;
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

    // Step 4 — NIC document state
    const [nicFront, setNicFront] = useState<File | null>(null);
    const [nicBack, setNicBack] = useState<File | null>(null);
    const [nicFrontPreview, setNicFrontPreview] = useState('');
    const [nicBackPreview, setNicBackPreview] = useState('');

    const handleFile = (field: 'front' | 'back', file: File | null) => {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setError('File must be under 5MB'); return; }
        const url = URL.createObjectURL(file);
        if (field === 'front') { setNicFront(file); setNicFrontPreview(url); }
        else { setNicBack(file); setNicBackPreview(url); }
        setError('');
    };

    const canProceedStep2 = data.experienceLevel !== '';
    const canProceedStep3 = data.fitnessGoals !== '';

    const handleNext = () => {
        if (step === 1 && (!nicFront || !nicBack)) { setError('Please upload both NIC front and back images.'); return; }
        if (step === 2 && !canProceedStep2) { setError('Please select your experience level.'); return; }
        if (step === 3 && !canProceedStep3) { setError('Please select at least one fitness goal.'); return; }
        setError('');
        setStep(prev => (prev + 1) as Step);
    };

    // Two-phase submit: NIC upload already done on step 1 advance (we hold files)
    // Final phase: save profile data → redirect
    const handleSubmit = async () => {
        if (!canProceedStep3) {
            setError('Please select at least one fitness goal.');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            // BUG-12 fix: Upload NIC documents FIRST, then mark onboarding complete.
            // Previously, onboarding was saved first — if OCI upload failed, the
            // DB would have isOnboarded=true but no ID documents (inconsistent state).
            const formData = new FormData();
            formData.append('nic_front', nicFront!);
            formData.append('nic_back', nicBack!);
            await authAPI.uploadIdDocuments(formData);

            await authAPI.completeOnboarding({
                experienceLevel: data.experienceLevel as 'beginner' | 'intermediate' | 'advanced',
                fitnessGoals: data.fitnessGoals || undefined,
            });
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

                <div className="bg-zinc-800/80 backdrop-blur-xl border border-zinc-700 rounded-3xl p-8 shadow-2xl">
                    {error && (
                        <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <CreditCard size={22} className="text-red-500 shrink-0" /> Identity Verification
                                </h2>
                                <p className="text-zinc-400 text-sm mt-1">NIC front and back. Clear images, under 5MB each.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <span className="text-sm font-medium text-zinc-300">NIC Front</span>
                                    <label className={cn(
                                        'flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden relative',
                                        nicFront ? 'border-emerald-500/50' : 'border-zinc-700 hover:border-zinc-500'
                                    )}>
                                        {nicFrontPreview ? (
                                            <img src={nicFrontPreview} alt="NIC Front" className="absolute inset-0 w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1.5 text-zinc-500">
                                                <Upload size={24} />
                                                <span className="text-xs">JPEG / PNG / WebP</span>
                                            </div>
                                        )}
                                        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                                            onChange={e => handleFile('front', e.target.files?.[0] ?? null)} />
                                    </label>
                                    {nicFront && <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle size={12} /> {nicFront.name}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <span className="text-sm font-medium text-zinc-300">NIC Back</span>
                                    <label className={cn(
                                        'flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden relative',
                                        nicBack ? 'border-emerald-500/50' : 'border-zinc-700 hover:border-zinc-500'
                                    )}>
                                        {nicBackPreview ? (
                                            <img src={nicBackPreview} alt="NIC Back" className="absolute inset-0 w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1.5 text-zinc-500">
                                                <FileImage size={24} />
                                                <span className="text-xs">JPEG / PNG / WebP</span>
                                            </div>
                                        )}
                                        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                                            onChange={e => handleFile('back', e.target.files?.[0] ?? null)} />
                                    </label>
                                    {nicBack && <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle size={12} /> {nicBack.name}</p>}
                                </div>
                            </div>
                            <p className="text-xs text-zinc-500">Stored securely; reviewed by staff only.</p>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Dumbbell size={22} className="text-red-500 shrink-0" /> Experience
                                </h2>
                                <p className="text-zinc-400 text-sm mt-1">Select your level.</p>
                            </div>
                            <div className="grid gap-2">
                                {[
                                    { value: 'beginner', label: 'New to gym', icon: Leaf },
                                    { value: 'intermediate', label: 'Some experience', icon: Flame },
                                    { value: 'advanced', label: 'Regular training', icon: Zap },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
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
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Target size={22} className="text-red-500 shrink-0" /> Fitness goal
                                </h2>
                                <p className="text-zinc-400 text-sm mt-1">Pick at least one.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {GOALS.map(goal => (
                                    <button
                                        key={goal.id}
                                        type="button"
                                        onClick={() => update('fitnessGoals', goal.id)}
                                        className={cn(
                                            'p-3 rounded-xl border text-left transition-all flex items-center gap-2',
                                            data.fitnessGoals === goal.id ? 'border-red-600 bg-red-600/10' : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                        )}
                                    >
                                        <goal.icon size={18} className={data.fitnessGoals === goal.id ? 'text-red-400' : 'text-zinc-400'} />
                                        <span className="font-medium text-white text-sm">{goal.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-6 pt-5 border-t border-zinc-700">
                        {step > 1 ? (
                            <button
                                type="button"
                                onClick={() => { setStep(prev => (prev - 1) as Step); setError(''); }}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all text-sm font-medium"
                            >
                                <ChevronLeft size={18} /> Back
                            </button>
                        ) : <div />}
                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all"
                            >
                                Continue <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button
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
