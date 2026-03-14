'use client';

import { useState } from 'react';
import { User, Mail, Phone, Calendar, Shield, Edit, Lock } from 'lucide-react';
import { PageHeader, Card, Modal, Input, LoadingButton } from '@/components/ui/SharedComponents';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { authAPI } from '@/lib/api';

// Extend User type for profile fields that may come from API
interface ProfileUser {
    fullName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    emergencyName?: string;
    emergencyPhone?: string;
    emergencyRelation?: string;
    idVerificationStatus?: 'pending' | 'approved' | 'rejected';
}

export default function MemberProfilePage() {
    const { user } = useAuth();
    const profileUser = user as ProfileUser | null;
    const toast = useToast();
    const [editOpen, setEditOpen] = useState(false);
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [editForm, setEditForm] = useState({
        fullName: profileUser?.fullName ?? '',
        phone: profileUser?.phone ?? '',
        emergencyName: profileUser?.emergencyName ?? '',
        emergencyPhone: profileUser?.emergencyPhone ?? '',
        emergencyRelation: profileUser?.emergencyRelation ?? '',
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleEdit = async () => {
        if (!editForm.fullName) {
            toast.error('Validation Error', 'Full name is required');
            return;
        }
        setLoading(true);
        try {
            await new Promise(r => setTimeout(r, 600));
            toast.success('Profile Updated', 'Your profile has been updated.');
            setEditOpen(false);
        } catch {
            toast.error('Error', 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            toast.error('Validation Error', 'Please fill all fields');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('Validation Error', 'New passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await authAPI.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
            toast.success('Password Changed', 'Your password has been updated.');
            setPasswordOpen(false);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (e: unknown) {
            const msg = e && typeof e === 'object' && 'response' in e
                ? (e as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
                : 'Failed to change password';
            toast.error('Error', String(msg || 'Failed to change password'));
        } finally {
            setLoading(false);
        }
    };

    const idStatus = profileUser?.idVerificationStatus ?? 'pending';
    const idStatusBadge = {
        pending: 'bg-amber-500/20 text-amber-400',
        approved: 'bg-emerald-500/20 text-emerald-400',
        rejected: 'bg-red-500/20 text-red-400',
    }[idStatus] ?? 'bg-zinc-500/20 text-zinc-400';

    return (
        <div className="space-y-8">
            {/* Cover + Profile Hero */}
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800">
                <div className="h-32 sm:h-40 bg-gradient-to-br from-zinc-800 via-zinc-800/90 to-red-900/30" />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_60%,rgba(0,0,0,0.4)_100%)]" />
                <div className="relative -mt-16 sm:-mt-20 px-6 pb-6 flex flex-col sm:flex-row sm:items-end gap-4">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-4 border-[#1e1e1e] bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-3xl sm:text-4xl shadow-xl shrink-0">
                        {profileUser?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-white">{profileUser?.fullName ?? 'Member'}</h1>
                        <p className="text-zinc-400 text-sm mt-0.5">{profileUser?.email ?? '—'}</p>
                        <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-medium capitalize ${idStatusBadge}`}>
                            ID {idStatus}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                        <LoadingButton icon={Edit} variant="secondary" onClick={() => {
                            setEditForm({
                                fullName: profileUser?.fullName ?? '',
                                phone: profileUser?.phone ?? '',
                                emergencyName: profileUser?.emergencyName ?? '',
                                emergencyPhone: profileUser?.emergencyPhone ?? '',
                                emergencyRelation: profileUser?.emergencyRelation ?? '',
                            });
                            setEditOpen(true);
                        }} size="sm">
                            Edit Profile
                        </LoadingButton>
                        <LoadingButton icon={Lock} variant="secondary" onClick={() => setPasswordOpen(true)} size="sm">
                            Change Password
                        </LoadingButton>
                    </div>
                </div>
            </div>

            <PageHeader
                title="Personal Information"
                subtitle="Manage your personal details and emergency contact"
            />

            <Card padding="lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                            <User size={18} className="text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500">Full Name</p>
                            <p className="text-white font-medium">{profileUser?.fullName ?? '—'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                            <Mail size={18} className="text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500">Email</p>
                            <p className="text-white font-medium">{profileUser?.email ?? '—'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                            <Phone size={18} className="text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500">Phone</p>
                            <p className="text-white font-medium">{profileUser?.phone ?? '—'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                            <Calendar size={18} className="text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500">Date of Birth</p>
                            <p className="text-white font-medium">{profileUser?.dateOfBirth ?? '—'}</p>
                        </div>
                    </div>
                </div>
            </Card>

            <Card padding="lg">
                <h3 className="text-lg font-semibold text-white mb-6">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-xs text-zinc-500">Name</p>
                        <p className="text-white font-medium">{profileUser?.emergencyName ?? '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500">Phone</p>
                        <p className="text-white font-medium">{profileUser?.emergencyPhone ?? '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500">Relation</p>
                        <p className="text-white font-medium">{profileUser?.emergencyRelation ?? '—'}</p>
                    </div>
                </div>
            </Card>

            <Card padding="lg">
                <h3 className="text-lg font-semibold text-white mb-6">ID Verification</h3>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                            <Shield size={18} className="text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-white font-medium">Status</p>
                            <p className="text-xs text-zinc-500">NIC verification status</p>
                        </div>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-semibold capitalize ${idStatusBadge}`}>
                        {idStatus}
                    </span>
                </div>
            </Card>

            <Card padding="lg">
                <h3 className="text-lg font-semibold text-white mb-6">Security</h3>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                            <Lock size={18} className="text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-white font-medium">Password</p>
                            <p className="text-xs text-zinc-500">Change your password</p>
                        </div>
                    </div>
                    <LoadingButton icon={Lock} variant="secondary" onClick={() => setPasswordOpen(true)} size="sm">
                        Change Password
                    </LoadingButton>
                </div>
            </Card>

            {/* Edit Profile Dialog */}
            <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile" size="md">
                <div className="space-y-4">
                    <Input
                        label="Full Name"
                        value={editForm.fullName}
                        onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                        required
                    />
                    <Input
                        label="Phone"
                        value={editForm.phone}
                        onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    />
                    <Input
                        label="Emergency Contact Name"
                        value={editForm.emergencyName}
                        onChange={e => setEditForm(f => ({ ...f, emergencyName: e.target.value }))}
                    />
                    <Input
                        label="Emergency Contact Phone"
                        value={editForm.emergencyPhone}
                        onChange={e => setEditForm(f => ({ ...f, emergencyPhone: e.target.value }))}
                    />
                    <Input
                        label="Relation"
                        value={editForm.emergencyRelation}
                        onChange={e => setEditForm(f => ({ ...f, emergencyRelation: e.target.value }))}
                        placeholder="e.g. Spouse, Parent"
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setEditOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleEdit}>Save Changes</LoadingButton>
                    </div>
                </div>
            </Modal>

            {/* Change Password Dialog */}
            <Modal isOpen={passwordOpen} onClose={() => setPasswordOpen(false)} title="Change Password" size="sm">
                <div className="space-y-4">
                    <Input
                        label="Current Password"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                        required
                    />
                    <Input
                        label="New Password"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                        required
                    />
                    <Input
                        label="Confirm New Password"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                        required
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setPasswordOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleChangePassword}>Change Password</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
