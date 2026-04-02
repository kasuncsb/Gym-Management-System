 "use client";

import { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Calendar, Shield, Edit, Lock, Camera, Loader2, Upload, FileImage, LogOut } from 'lucide-react';
import { PageHeader, Card, Modal, Input, LoadingButton } from '@/components/ui/SharedComponents';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { authAPI, getErrorMessage } from '@/lib/api';

export interface ProfileData {
  id: string;
  fullName: string;
  email: string;
  role: string;
  phone?: string | null;
  dob?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  avatarKey?: string | null;
  coverKey?: string | null;
  memberCode?: string | null;
  memberStatus?: string | null;
  joinDate?: string | null;
  emailVerified?: boolean;
  idVerificationStatus?: 'pending' | 'approved' | 'rejected' | null;
  idVerificationNote?: string | null;
  idSubmittedAt?: string | null;
  profile?: {
    isOnboarded?: boolean;
    fitnessGoals?: string | null;
    experienceLevel?: string | null;
    emergencyName?: string | null;
    emergencyPhone?: string | null;
    emergencyRelation?: string | null;
  } | null;
}

const GENDER_OPTIONS = [
  { value: '', label: 'Prefer not to say' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

interface ProfileContentProps {
  /** When true, show Emergency Contact, ID Verification, and allow editing emergency fields */
  isMember?: boolean;
}

export function ProfileContent({ isMember = false }: ProfileContentProps) {
  const { user, refreshUser, logout, avatarMediaVersion, coverMediaVersion, bumpAvatarMediaVersion, bumpCoverMediaVersion } = useAuth();
  const toast = useToast();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    dob: '' as string | null,
    gender: '' as string | null,
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [coverFailed, setCoverFailed] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  // ID resubmit (members with pending/rejected can resubmit from profile)
  type DocType = 'nic' | 'driving_license' | 'passport';
  const [idResubmitOpen, setIdResubmitOpen] = useState(false);
  const [idDocType, setIdDocType] = useState<DocType>('nic');
  const [idDocFront, setIdDocFront] = useState<File | null>(null);
  const [idDocBack, setIdDocBack] = useState<File | null>(null);
  const [idDocFrontPreview, setIdDocFrontPreview] = useState('');
  const [idDocBackPreview, setIdDocBackPreview] = useState('');
  const [idUploading, setIdUploading] = useState(false);
  const [idUploadProgress, setIdUploadProgress] = useState(0);
  const [idResubmitError, setIdResubmitError] = useState('');

  useEffect(() => {
    let cancelled = false;
    authAPI.getProfile()
      .then(res => {
        if (cancelled) return;
        const d = res.data.data as ProfileData;
        setProfileData(d);
        setCoverFailed(false);
        setAvatarFailed(false);
        setEditForm({
          fullName: d.fullName ?? '',
          phone: d.phone ?? '',
          dob: d.dob ?? null,
          gender: d.gender ?? null,
          emergencyName: d.profile?.emergencyName ?? '',
          emergencyPhone: d.profile?.emergencyPhone ?? '',
          emergencyRelation: d.profile?.emergencyRelation ?? '',
        });
      })
      .catch(() => {
        if (!cancelled) setProfileData(null);
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleEdit = async () => {
    if (!editForm.fullName.trim()) {
      toast.error('Validation Error', 'Full name is required');
      return;
    }
    setLoading(true);
    try {
      await authAPI.updateProfile({
        fullName: editForm.fullName.trim(),
        phone: editForm.phone || undefined,
        dob: editForm.dob || null,
        gender: (editForm.gender as 'male' | 'female' | 'other') || null,
        ...(isMember && {
          emergencyName: editForm.emergencyName || undefined,
          emergencyPhone: editForm.emergencyPhone || undefined,
          emergencyRelation: editForm.emergencyRelation || undefined,
        }),
      });
      const res = await authAPI.getProfile();
      setProfileData(res.data.data as ProfileData);
      toast.success('Profile Updated', 'Your profile has been updated.');
      setEditOpen(false);
      refreshUser();
    } catch (e) {
      toast.error('Error', getErrorMessage(e));
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
    } catch (e) {
      toast.error('Error', getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Invalid file', 'Only JPEG, PNG or WebP images are allowed (no GIF).');
      return;
    }
    setAvatarUploading(true);
    setAvatarFailed(false);
    try {
      await authAPI.uploadAvatar(file);
      bumpAvatarMediaVersion();
      setProfileData(prev => prev ? { ...prev, avatarKey: 'set' } : null);
      // Refresh the authenticated user so navbar and other consumers immediately
      // see the new avatarKey without requiring a full page reload.
      await refreshUser();
      toast.success('Avatar updated', 'Your profile photo has been updated.');
    } catch (err) {
      toast.error('Upload failed', getErrorMessage(err));
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const onCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Invalid file', 'Only JPEG, PNG or WebP images are allowed (no GIF).');
      return;
    }
    setCoverUploading(true);
    setCoverFailed(false);
    try {
      await authAPI.uploadCover(file);
      bumpCoverMediaVersion();
      setProfileData(prev => prev ? { ...prev, coverKey: 'set' } : null);
      toast.success('Cover updated', 'Your cover image has been updated.');
    } catch (err) {
      toast.error('Upload failed', getErrorMessage(err));
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  if (profileLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  const p = profileData;
  const idStatus = p?.idVerificationStatus ?? 'pending';
  const idStatusBadge = {
    pending: 'bg-amber-500/20 text-amber-400',
    approved: 'bg-emerald-500/20 text-emerald-400',
    rejected: 'bg-red-500/20 text-red-400',
  }[idStatus] ?? 'bg-zinc-500/20 text-zinc-400';
  const hasAvatar = !!p?.avatarKey;
  const hasCover = !!p?.coverKey;
  const showCover = hasCover && !coverFailed;
  const showAvatar = hasAvatar && !avatarFailed;
  const initials = p?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const roleLabel = p?.role === 'admin' ? 'Administrator' : p?.role === 'manager' ? 'Manager' : p?.role === 'trainer' ? 'Trainer' : 'Member';

  return (
    <div className="space-y-8">
      <div className="relative rounded-2xl overflow-hidden border border-zinc-800">
        <div className="h-32 sm:h-40 relative bg-gradient-to-br from-zinc-800 via-zinc-800/90 to-red-900/30">
          {showCover && (
            <img
              src={authAPI.profileCoverUrl(user?.id, coverMediaVersion)}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setCoverFailed(true)}
              key={`cover-${user?.id}-${coverMediaVersion}`}
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_60%,rgba(0,0,0,0.4)_100%)]" />
          <input type="file" ref={coverInputRef} accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onCoverChange} />
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={coverUploading}
            className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {coverUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            {coverUploading ? 'Uploading…' : 'Change cover'}
          </button>
        </div>
        <div className="relative -mt-16 sm:-mt-20 px-6 pb-6 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="relative shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-[#1e1e1e] bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-3xl sm:text-4xl shadow-xl overflow-hidden">
              {showAvatar ? (
                <img src={authAPI.profileAvatarUrl(user?.id, avatarMediaVersion)} alt="Avatar" className="w-full h-full object-cover" onError={() => setAvatarFailed(true)} key={`avatar-${user?.id}-${avatarMediaVersion}`} />
              ) : (
                initials
              )}
            </div>
            <input type="file" ref={avatarInputRef} accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onAvatarChange} />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-zinc-800 border-2 border-[#1e1e1e] flex items-center justify-center text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
              title="Change avatar"
            >
              {avatarUploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white">{p?.fullName ?? roleLabel}</h1>
            <p className="text-zinc-400 text-sm mt-0.5">{p?.email ?? '—'}</p>
            {isMember && (
              <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-medium capitalize ${idStatusBadge}`}>
                ID {idStatus}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <LoadingButton
              icon={Edit}
              variant="secondary"
              onClick={() => {
                setEditForm({
                  fullName: p?.fullName ?? '',
                  phone: p?.phone ?? '',
                  dob: p?.dob ?? null,
                  gender: p?.gender ?? null,
                  emergencyName: p?.profile?.emergencyName ?? '',
                  emergencyPhone: p?.profile?.emergencyPhone ?? '',
                  emergencyRelation: p?.profile?.emergencyRelation ?? '',
                });
                setEditOpen(true);
              }}
              size="sm"
            >
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
        subtitle={isMember ? 'Manage your personal details and emergency contact' : 'Manage your personal details'}
      />

      <Card padding="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <User size={18} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Full Name</p>
              <p className="text-white font-medium">{p?.fullName ?? '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <Mail size={18} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Email</p>
              <p className="text-white font-medium">{p?.email ?? '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <Phone size={18} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Phone</p>
              <p className="text-white font-medium">{p?.phone ?? '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <Calendar size={18} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Date of Birth</p>
              <p className="text-white font-medium">{p?.dob ?? '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <User size={18} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Gender</p>
              <p className="text-white font-medium capitalize">{p?.gender ?? '—'}</p>
            </div>
          </div>
        </div>
      </Card>

      {isMember && (
        <>
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-white mb-6">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-zinc-500">Name</p>
                <p className="text-white font-medium">{p?.profile?.emergencyName ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Phone</p>
                <p className="text-white font-medium">{p?.profile?.emergencyPhone ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Relation</p>
                <p className="text-white font-medium">{p?.profile?.emergencyRelation ?? '—'}</p>
              </div>
            </div>
          </Card>
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-white mb-6">ID Verification</h3>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Shield size={18} className="text-zinc-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Status</p>
                  <p className="text-xs text-zinc-500">NIC verification status</p>
                  {idStatus === 'rejected' && p?.idVerificationNote && (
                    <p className="text-xs text-zinc-400 mt-1">Note: {p.idVerificationNote}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-3 py-1.5 rounded-full font-semibold capitalize ${idStatusBadge}`}>{idStatus}</span>
                {(idStatus === 'rejected' || idStatus === 'pending') && (
                  <LoadingButton
                    variant="secondary"
                    size="sm"
                    icon={Upload}
                    onClick={() => {
                      setIdResubmitOpen(true);
                      setIdDocType('nic');
                      setIdDocFront(null);
                      setIdDocBack(null);
                      setIdDocFrontPreview('');
                      setIdDocBackPreview('');
                      setIdResubmitError('');
                    }}
                  >
                    Resubmit documents
                  </LoadingButton>
                )}
              </div>
            </div>
          </Card>
        </>
      )}

      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-6">Security</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <Lock size={18} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-white font-medium">Password</p>
              <p className="text-xs text-zinc-500">Change your password</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <LoadingButton icon={Lock} variant="secondary" onClick={() => setPasswordOpen(true)} size="sm">
              Change Password
            </LoadingButton>
            <LoadingButton variant="danger" icon={LogOut} onClick={() => logout()} size="sm">
              Log out
            </LoadingButton>
          </div>
        </div>
      </Card>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile" size="md">
        <div className="space-y-4">
          <Input label="Full Name" value={editForm.fullName} onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))} required />
          <Input label="Phone" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
          <Input label="Date of Birth" type="date" value={editForm.dob ?? ''} onChange={e => setEditForm(f => ({ ...f, dob: e.target.value || null }))} />
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Gender</label>
            <select
              value={editForm.gender ?? ''}
              onChange={e => setEditForm(f => ({ ...f, gender: e.target.value || null }))}
              className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-red-600"
            >
              {GENDER_OPTIONS.map(o => (
                <option key={o.value || 'none'} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {isMember && (
            <>
              <Input label="Emergency Contact Name" value={editForm.emergencyName} onChange={e => setEditForm(f => ({ ...f, emergencyName: e.target.value }))} />
              <Input label="Emergency Contact Phone" value={editForm.emergencyPhone} onChange={e => setEditForm(f => ({ ...f, emergencyPhone: e.target.value }))} />
              <Input label="Relation" value={editForm.emergencyRelation} onChange={e => setEditForm(f => ({ ...f, emergencyRelation: e.target.value }))} placeholder="e.g. Spouse, Parent" />
            </>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <LoadingButton variant="secondary" onClick={() => setEditOpen(false)}>Cancel</LoadingButton>
            <LoadingButton loading={loading} onClick={handleEdit}>Save Changes</LoadingButton>
          </div>
        </div>
      </Modal>

      <Modal isOpen={passwordOpen} onClose={() => setPasswordOpen(false)} title="Change Password" size="sm">
        <div className="space-y-4">
          <Input label="Current Password" type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))} required />
          <Input label="New Password" type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))} required />
          <Input label="Confirm New Password" type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))} required />
          <div className="flex justify-end gap-3 pt-2">
            <LoadingButton variant="secondary" onClick={() => setPasswordOpen(false)}>Cancel</LoadingButton>
            <LoadingButton loading={loading} onClick={handleChangePassword}>Change Password</LoadingButton>
          </div>
        </div>
      </Modal>

      <Modal isOpen={idResubmitOpen} onClose={() => setIdResubmitOpen(false)} title="Resubmit ID documents" size="md">
        <IdResubmitForm
          documentType={idDocType}
          setDocumentType={setIdDocType}
          docFront={idDocFront}
          docBack={idDocBack}
          docFrontPreview={idDocFrontPreview}
          docBackPreview={idDocBackPreview}
          onCancel={() => setIdResubmitOpen(false)}
          onFrontChange={(file) => {
            setIdDocFront(file);
            setIdDocFrontPreview(file ? URL.createObjectURL(file) : '');
            setIdDocBack(null);
            setIdDocBackPreview('');
            setIdResubmitError('');
          }}
          onBackChange={(file) => {
            setIdDocBack(file);
            setIdDocBackPreview(file ? URL.createObjectURL(file) : '');
            setIdResubmitError('');
          }}
          uploading={idUploading}
          uploadProgress={idUploadProgress}
          error={idResubmitError}
          onUpload={async () => {
            const isPassport = idDocType === 'passport';
            if (!idDocFront) {
              setIdResubmitError(isPassport ? 'Select passport image.' : 'Select front image.');
              return;
            }
            if (!isPassport && !idDocBack) {
              setIdResubmitError('Select back image.');
              return;
            }
            setIdUploading(true);
            setIdResubmitError('');
            setIdUploadProgress(0);
            try {
              const formData = new FormData();
              formData.append('document_type', idDocType);
              formData.append('nic_front', idDocFront);
              if (!isPassport && idDocBack) formData.append('nic_back', idDocBack);
              await authAPI.uploadIdDocuments(formData, {
                onUploadProgress: (e) => setIdUploadProgress(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
              });
              const res = await authAPI.getProfile();
              const d = res.data.data as ProfileData;
              setProfileData(d);
              toast.success('Documents submitted', 'Your ID documents have been resubmitted for verification.');
              setIdResubmitOpen(false);
              setIdDocFront(null);
              setIdDocBack(null);
              setIdDocFrontPreview('');
              setIdDocBackPreview('');
            } catch (err) {
              setIdResubmitError(getErrorMessage(err) ?? 'Upload failed');
            } finally {
              setIdUploading(false);
              setIdUploadProgress(0);
            }
          }}
        />
      </Modal>
    </div>
  );
}

function IdResubmitForm({
  documentType,
  setDocumentType,
  docFront,
  docBack,
  docFrontPreview,
  docBackPreview,
  onCancel,
  onFrontChange,
  onBackChange,
  uploading,
  uploadProgress,
  error,
  onUpload,
}: {
  documentType: 'nic' | 'driving_license' | 'passport';
  setDocumentType: (v: 'nic' | 'driving_license' | 'passport') => void;
  docFront: File | null;
  docBack: File | null;
  docFrontPreview: string;
  docBackPreview: string;
  onCancel: () => void;
  onFrontChange: (file: File | null) => void;
  onBackChange: (file: File | null) => void;
  uploading: boolean;
  uploadProgress: number;
  error: string;
  onUpload: () => void;
}) {
  const isPassport = documentType === 'passport';
  const needsTwoFiles = !isPassport;
  const canUpload = isPassport ? !!docFront : !!docFront && !!docBack;
  const handleFile = (field: 'front' | 'back', file: File | null) => {
    if (file && (file.size > 5 * 1024 * 1024 || !file.type.startsWith('image/'))) return;
    if (field === 'front') onFrontChange(file);
    else onBackChange(file);
  };
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Document type</label>
        <select
          value={documentType}
          onChange={e => {
            const v = e.target.value as 'nic' | 'driving_license' | 'passport';
            setDocumentType(v);
            onFrontChange(null);
            onBackChange(null);
          }}
          className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-red-600"
        >
          <option value="nic">National Identity Card</option>
          <option value="driving_license">Driving License</option>
          <option value="passport">Passport</option>
        </select>
      </div>
      <div className={needsTwoFiles ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-4'}>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">{isPassport ? 'Passport (photo page)' : 'Front'}</label>
          <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-zinc-700 hover:border-zinc-500 cursor-pointer overflow-hidden">
            {docFrontPreview ? (
              <img src={docFrontPreview} alt="Front" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-zinc-500 py-4">
                <Upload size={22} />
                <span className="text-xs">Image, max 5MB</span>
              </div>
            )}
            <input type="file" accept="image/*" className="sr-only" onChange={e => handleFile('front', e.target.files?.[0] ?? null)} />
          </label>
        </div>
        {needsTwoFiles && (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Back</label>
            <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-zinc-700 hover:border-zinc-500 cursor-pointer overflow-hidden">
              {docBackPreview ? (
                <img src={docBackPreview} alt="Back" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-zinc-500 py-4">
                  <FileImage size={22} />
                  <span className="text-xs">Image, max 5MB</span>
                </div>
              )}
              <input type="file" accept="image/*" className="sr-only" onChange={e => handleFile('back', e.target.files?.[0] ?? null)} />
            </label>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {uploading && (
        <div className="space-y-1">
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-red-600 transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
          <p className="text-xs text-zinc-500">Uploading… {uploadProgress}%</p>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <LoadingButton variant="secondary" onClick={onCancel}>Cancel</LoadingButton>
        <LoadingButton loading={uploading} onClick={onUpload} disabled={!canUpload || uploading}>
          Upload documents
        </LoadingButton>
      </div>
    </div>
  );
}
