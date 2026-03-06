'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, getErrorMessage } from '@/lib/api';
import {
    Dumbbell, ChevronRight, ChevronLeft, Loader2, CheckCircle,
    AlertCircle, Flame, Zap, Wind, Activity, Heart, Upload, FileImage
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3;

interface OnboardData {
    // Step 2 – Experience
    experienceLevel: 'beginner' | 'intermediate' | 'advanced' | '';
    previousWorkouts: string;
    // Step 3 – Goals & Vitals
    fitnessGoals: string;
    bloodType: string;
    medicalConditions: string;
    allergies: string;
}

const GOALS = [
    { id: 'fat_burn', label: 'Fat Burn', icon: Flame, desc: 'Lose weight and reduce body fat' },
    { id: 'muscle_gain', label: 'Muscle Gain', icon: Zap, desc: 'Build strength and muscle mass' },
    { id: 'endurance', label: 'Endurance', icon: Wind, desc: 'Improve stamina and cardio' },
    { id: 'flexibility', label: 'Flexibility', icon: Activity, desc: 'Enhance mobility and flexibility' },
    { id: 'general', label: 'General Fitness', icon: Heart, desc: 'Overall health and wellness' },
];

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Onboard() {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<OnboardData>({
        experienceLevel: '',
        previousWorkouts: '',
        fitnessGoals: '',
        bloodType: '',
        medicalConditions: '',
        allergies: '',
    });

    const update = (field: keyof OnboardData, value: string) =>
        setData(prev => ({ ...prev, [field]: value }));

    const canProceedStep1 = data.experienceLevel !== '';
    const canProceedStep2 = data.fitnessGoals !== '';

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
        setIsLoading(true);
        setError('');
        try {
            await authAPI.completeOnboarding({
                experienceLevel: data.experienceLevel as 'beginner' | 'intermediate' | 'advanced',
                previousWorkouts: data.previousWorkouts || undefined,
                fitnessGoals: data.fitnessGoals || undefined,
                bloodType: data.bloodType || undefined,
                medicalConditions: data.medicalConditions || undefined,
                allergies: data.allergies || undefined,
            });
            // Upload NIC docs (files held from step 1)
            const formData = new FormData();
            formData.append('nic_front', nicFront!);
            formData.append('nic_back', nicBack!);
            await authAPI.uploadIdDocuments(formData);
            router.push('/dashboard');
        } catch (err) {
            setError(getErrorMessage(err));
            setIsLoading(false);
        }
    };

const stepLabels = ['ID Verification', 'Experience', 'Goals & Vitals'];

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-red-600/30">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-700/20 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[128px]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
            </div>

            <div className="w-full max-w-2xl relative z-10">
                {/* Logo */}
                <div className="flex items-center gap-2 mb-10 justify-center">
                    <div className="w-10 h-10 rounded-xl bg-red-700 flex items-center justify-center">
                        <Dumbbell className="text-white" size={22} />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">Power<span className="text-red-500">World</span></span>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {stepLabels.map((label, i) => {
                        const stepNum = (i + 1) as Step;
                        const isActive = step === stepNum;
                        const isDone = step > stepNum;
                        return (
                            <div key={i} className="flex items-center gap-2">
                                <div className="flex flex-col items-center gap-1">
                                    <div className={cn(
                                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                                        isDone ? 'bg-emerald-500 text-white' :
                                            isActive ? 'bg-red-600 text-white' :
                                                'bg-zinc-800 text-zinc-500'
                                    )}>
                                        {isDone ? <CheckCircle size={16} /> : stepNum}
                                    </div>
                                    <span className={cn('text-xs hidden sm:block', isActive ? 'text-white' : 'text-zinc-500')}>
                                        {label}
                                    </span>
                                </div>
                                {i < stepLabels.length - 1 && (
                                    <div className={cn('w-12 h-0.5 mb-5 mx-1 transition-all', isDone ? 'bg-emerald-500' : 'bg-zinc-800')} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Card */}
                <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl">
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    {/* ── STEP 1: ID Verification ── */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">Identity Verification 🪪</h2>
                                <p className="text-zinc-400">Upload your National Identity Card (NIC) front and back. Files must be clear, well-lit, and under 5MB each.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* NIC Front */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-300">NIC Front <span className="text-red-500">*</span></label>
                                    <label className={cn(
                                        'flex flex-col items-center justify-center h-40 rounded-2xl border-2 border-dashed cursor-pointer transition-all overflow-hidden relative',
                                        nicFront ? 'border-emerald-500/50' : 'border-zinc-700 hover:border-zinc-500'
                                    )}>
                                        {nicFrontPreview ? (
                                            <img src={nicFrontPreview} alt="NIC Front" className="absolute inset-0 w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-zinc-500">
                                                <Upload size={28} />
                                                <span className="text-xs">Click to upload</span>
                                                <span className="text-xs">JPEG / PNG / WebP</span>
                                            </div>
                                        )}
                                        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                                            onChange={e => handleFile('front', e.target.files?.[0] ?? null)} />
                                    </label>
                                    {nicFront && <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle size={12} /> {nicFront.name}</p>}
                                </div>

                                {/* NIC Back */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-300">NIC Back <span className="text-red-500">*</span></label>
                                    <label className={cn(
                                        'flex flex-col items-center justify-center h-40 rounded-2xl border-2 border-dashed cursor-pointer transition-all overflow-hidden relative',
                                        nicBack ? 'border-emerald-500/50' : 'border-zinc-700 hover:border-zinc-500'
                                    )}>
                                        {nicBackPreview ? (
                                            <img src={nicBackPreview} alt="NIC Back" className="absolute inset-0 w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-zinc-500">
                                                <FileImage size={28} />
                                                <span className="text-xs">Click to upload</span>
                                                <span className="text-xs">JPEG / PNG / WebP</span>
                                            </div>
                                        )}
                                        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                                            onChange={e => handleFile('back', e.target.files?.[0] ?? null)} />
                                    </label>
                                    {nicBack && <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle size={12} /> {nicBack.name}</p>}
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700">
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Documents are stored securely and only reviewed by authorised PowerWorld Gyms staff.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Experience ── */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">Your Experience 💪</h2>
                                <p className="text-zinc-400">Tell us about your gym experience so we can tailor your workout plan.</p>
                            </div>

                            <div className="grid gap-3">
                                {[
                                    { value: 'beginner', label: 'New to Gym', desc: "I've never seriously trained before", emoji: '🌱' },
                                    { value: 'intermediate', label: 'Some Experience', desc: "I've trained before but not consistently", emoji: '🔥' },
                                    { value: 'advanced', label: 'Seasoned Athlete', desc: "I train regularly and know my way around", emoji: '⚡' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => update('experienceLevel', opt.value)}
                                        className={cn(
                                            'w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-4',
                                            data.experienceLevel === opt.value
                                                ? 'border-red-600 bg-red-600/10'
                                                : 'border-zinc-800 bg-black/30 hover:border-zinc-700'
                                        )}
                                    >
                                        <span className="text-2xl">{opt.emoji}</span>
                                        <div>
                                            <p className="font-semibold text-white">{opt.label}</p>
                                            <p className="text-sm text-zinc-400">{opt.desc}</p>
                                        </div>
                                        {data.experienceLevel === opt.value && (
                                            <CheckCircle size={20} className="text-red-500 ml-auto shrink-0" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {(data.experienceLevel === 'intermediate' || data.experienceLevel === 'advanced') && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <label className="text-sm font-medium text-zinc-300">
                                        Tell us about your previous training <span className="text-zinc-500">(optional)</span>
                                    </label>
                                    <textarea
                                        value={data.previousWorkouts}
                                        onChange={e => update('previousWorkouts', e.target.value)}
                                        rows={3}
                                        placeholder="e.g., 2 years of weightlifting, focused on hypertrophy..."
                                        className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all resize-none"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── STEP 3: Goals & Vitals ── */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">What's your goal? 🎯</h2>
                                <p className="text-zinc-400">We'll use this to personalise your workout plan.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {GOALS.map(goal => (
                                    <button
                                        key={goal.id}
                                        type="button"
                                        onClick={() => update('fitnessGoals', goal.id)}
                                        className={cn(
                                            'p-4 rounded-2xl border text-left transition-all',
                                            data.fitnessGoals === goal.id
                                                ? 'border-red-600 bg-red-600/10'
                                                : 'border-zinc-800 bg-black/30 hover:border-zinc-700'
                                        )}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <goal.icon size={18} className={data.fitnessGoals === goal.id ? 'text-red-400' : 'text-zinc-400'} />
                                            <span className="font-semibold text-white text-sm">{goal.label}</span>
                                        </div>
                                        <p className="text-xs text-zinc-500">{goal.desc}</p>
                                    </button>
                                ))}
                            </div>

                            <div className="border-t border-zinc-800 pt-5 space-y-4">
                                <p className="text-sm text-zinc-500 font-medium uppercase tracking-wider">Optional — Health Info</p>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-sm text-zinc-400">Blood Type</label>
                                        <select
                                            value={data.bloodType}
                                            onChange={e => update('bloodType', e.target.value)}
                                            className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all text-sm"
                                        >
                                            <option value="" className="bg-zinc-900">Unknown</option>
                                            {BLOOD_TYPES.map(bt => (
                                                <option key={bt} value={bt} className="bg-zinc-900">{bt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm text-zinc-400">Medical Conditions</label>
                                    <input
                                        type="text"
                                        value={data.medicalConditions}
                                        onChange={e => update('medicalConditions', e.target.value)}
                                        placeholder="e.g., Hypertension, Diabetes (leave blank if none)"
                                        className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2.5 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all text-sm"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm text-zinc-400">Allergies</label>
                                    <input
                                        type="text"
                                        value={data.allergies}
                                        onChange={e => update('allergies', e.target.value)}
                                        placeholder="e.g., Penicillin, Latex (leave blank if none)"
                                        className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2.5 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all text-sm"
                                    />
                                </div>

                                <div className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700">
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        By completing onboarding, you confirm that the information provided is accurate.
                                        Your data is only used to personalise your fitness experience.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-800">
                        {step > 1 ? (
                            <button
                                type="button"
                                onClick={() => { setStep(prev => (prev - 1) as Step); setError(''); }}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-sm font-medium"
                            >
                                <ChevronLeft size={18} /> Back
                            </button>
                        ) : (
                            <div />
                        )}

                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold shadow-lg shadow-red-600/25 transition-all"
                            >
                                Continue <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className={cn(
                                    'flex items-center gap-2 px-6 py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold shadow-lg shadow-red-600/25 transition-all',
                                    isLoading && 'opacity-70 cursor-not-allowed'
                                )}
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle size={18} /> Complete Setup</>}
                            </button>
                        )}
                    </div>
                </div>

                    <p className="text-center text-zinc-600 text-sm mt-6">
                        Step {step} of 3 · PowerWorld Gyms, Kiribathgoda
                    </p>
            </div>
        </div>
    );
}
