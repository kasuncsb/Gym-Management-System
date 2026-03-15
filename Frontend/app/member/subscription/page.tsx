'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, RefreshCw, ArrowUpCircle, Snowflake, ShieldAlert } from 'lucide-react';
import { PageHeader, Card, Modal, Input, Select, Textarea, LoadingButton, Tabs } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { authAPI } from '@/lib/api';

type IdVerificationStatus = 'pending' | 'approved' | 'rejected' | null;

const MOCK_PLAN = {
    name: 'Premium Plan',
    price: 4500,
    duration: '1 month',
    endDate: '2025-02-15',
    status: 'active' as const,
    ptSessionsLeft: 4,
};

const MOCK_PAYMENTS = [
    { date: '2025-01-15', amount: 4500, method: 'Card', receipt: 'Receipt #001' },
    { date: '2024-12-15', amount: 4500, method: 'Card', receipt: 'Receipt #002' },
    { date: '2024-11-15', amount: 4500, method: 'Card', receipt: 'Receipt #003' },
];

const PLAN_OPTIONS = [
    { value: 'basic', label: 'Basic — 1 month — Rs. 2,500' },
    { value: 'premium', label: 'Premium — 1 month — Rs. 4,500' },
    { value: 'premium_3m', label: 'Premium — 3 months — Rs. 12,000' },
    { value: 'elite', label: 'Elite — 1 month — Rs. 6,500' },
];

export default function MemberSubscriptionPage() {
    const toast = useToast();
    const [tab, setTab] = useState<'overview' | 'history'>('overview');
    const [idStatus, setIdStatus] = useState<IdVerificationStatus>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [renewOpen, setRenewOpen] = useState(false);
    const [freezeOpen, setFreezeOpen] = useState(false);
    const [upgradeOpen, setUpgradeOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [renewForm, setRenewForm] = useState({ plan: '', promo: '', payment: 'card' });
    const [freezeForm, setFreezeForm] = useState({ startDate: '', endDate: '', reason: '' });
    const [upgradeForm, setUpgradeForm] = useState({ plan: '' });

    useEffect(() => {
        authAPI.getProfile()
            .then(res => {
                const data = res.data?.data as { idVerificationStatus?: IdVerificationStatus } | undefined;
                setIdStatus(data?.idVerificationStatus ?? null);
            })
            .catch(() => setIdStatus(null))
            .finally(() => setProfileLoading(false));
    }, []);

    const idRejected = idStatus === 'rejected';
    const canPurchase = !idRejected;

    const handleRenew = async () => {
        if (!canPurchase) return;
        if (!renewForm.plan) {
            toast.error('Validation Error', 'Please select a plan');
            return;
        }
        setLoading(true);
        try {
            await new Promise(r => setTimeout(r, 800));
            toast.success('Subscription Renewed', 'Your plan has been renewed successfully.');
            setRenewOpen(false);
            setRenewForm({ plan: '', promo: '', payment: 'card' });
        } catch {
            toast.error('Error', 'Failed to renew subscription');
        } finally {
            setLoading(false);
        }
    };

    const handleFreeze = async () => {
        if (!freezeForm.startDate || !freezeForm.endDate || !freezeForm.reason) {
            toast.error('Validation Error', 'Please fill all fields');
            return;
        }
        setLoading(true);
        try {
            await new Promise(r => setTimeout(r, 800));
            toast.success('Freeze Request Sent', 'Your request will be processed soon.');
            setFreezeOpen(false);
            setFreezeForm({ startDate: '', endDate: '', reason: '' });
        } catch {
            toast.error('Error', 'Failed to submit freeze request');
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async () => {
        if (!canPurchase) return;
        if (!upgradeForm.plan) {
            toast.error('Validation Error', 'Please select a plan');
            return;
        }
        setLoading(true);
        try {
            await new Promise(r => setTimeout(r, 800));
            toast.success('Plan Upgraded', 'Your plan has been upgraded successfully.');
            setUpgradeOpen(false);
            setUpgradeForm({ plan: '' });
        } catch {
            toast.error('Error', 'Failed to upgrade plan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="My Subscription"
                subtitle="Manage your membership plan and payment history"
            />

            {!profileLoading && idRejected && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3" role="alert">
                    <ShieldAlert className="text-red-400 shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="font-medium text-red-300">ID verification was rejected</p>
                        <p className="text-sm text-zinc-400 mt-1">
                            You cannot purchase, renew, or upgrade a subscription until your identity is verified. Please resubmit your ID documents from your{' '}
                            <Link href="/member/profile" className="text-red-400 hover:text-red-300 underline">Profile</Link> or contact support.
                        </p>
                    </div>
                </div>
            )}

            <Tabs
                tabs={[
                    { key: 'overview', label: 'Overview' },
                    { key: 'history', label: 'Payment History' },
                ]}
                activeTab={tab}
                onChange={(key) => setTab(key as 'overview' | 'history')}
            />

            {tab === 'overview' && (
                <>
                    <Card padding="lg">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                                    <CreditCard size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{MOCK_PLAN.name}</h3>
                                    <p className="text-zinc-400 text-sm mt-1">
                                        Rs. {MOCK_PLAN.price.toLocaleString()} / {MOCK_PLAN.duration}
                                    </p>
                                    <p className="text-zinc-500 text-xs mt-2">
                                        Ends: {MOCK_PLAN.endDate} · PT sessions left: {MOCK_PLAN.ptSessionsLeft}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full font-semibold">
                                    {MOCK_PLAN.status}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-zinc-700">
                            <LoadingButton
                                icon={RefreshCw}
                                variant="secondary"
                                onClick={() => canPurchase && setRenewOpen(true)}
                                size="sm"
                                disabled={!canPurchase}
                            >
                                Renew
                            </LoadingButton>
                            <LoadingButton
                                icon={ArrowUpCircle}
                                variant="secondary"
                                onClick={() => canPurchase && setUpgradeOpen(true)}
                                size="sm"
                                disabled={!canPurchase}
                            >
                                Upgrade
                            </LoadingButton>
                            <LoadingButton
                                icon={Snowflake}
                                variant="secondary"
                                onClick={() => canPurchase && setFreezeOpen(true)}
                                size="sm"
                                disabled={!canPurchase}
                            >
                                Request Freeze
                            </LoadingButton>
                        </div>
                    </Card>
                </>
            )}

            {tab === 'history' && (
                <Card padding="none">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-700">
                                    <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">Date</th>
                                    <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">Amount</th>
                                    <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">Method</th>
                                    <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">Receipt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_PAYMENTS.map((p, i) => (
                                    <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                        <td className="px-6 py-4 text-sm text-white">{p.date}</td>
                                        <td className="px-6 py-4 text-sm text-white">Rs. {p.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-sm text-zinc-400">{p.method}</td>
                                        <td className="px-6 py-4 text-sm text-zinc-400">{p.receipt}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Renew Subscription Dialog */}
            <Modal isOpen={renewOpen} onClose={() => setRenewOpen(false)} title="Renew Subscription" size="md">
                <div className="space-y-4">
                    <Select
                        label="Select Plan"
                        options={PLAN_OPTIONS}
                        value={renewForm.plan}
                        onChange={e => setRenewForm(f => ({ ...f, plan: e.target.value }))}
                        placeholder="Choose a plan"
                    />
                    <Input
                        label="Promo Code (optional)"
                        placeholder="Enter promo code"
                        value={renewForm.promo}
                        onChange={e => setRenewForm(f => ({ ...f, promo: e.target.value }))}
                    />
                    <Select
                        label="Payment Method"
                        options={[
                            { value: 'card', label: 'Credit/Debit Card' },
                            { value: 'bank', label: 'Bank Transfer' },
                        ]}
                        value={renewForm.payment}
                        onChange={e => setRenewForm(f => ({ ...f, payment: e.target.value }))}
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setRenewOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleRenew}>Confirm Renewal</LoadingButton>
                    </div>
                </div>
            </Modal>

            {/* Freeze Request Dialog */}
            <Modal isOpen={freezeOpen} onClose={() => setFreezeOpen(false)} title="Request Freeze" description="Request to freeze your subscription">
                <div className="space-y-4">
                    <Input
                        label="Start Date"
                        type="date"
                        value={freezeForm.startDate}
                        onChange={e => setFreezeForm(f => ({ ...f, startDate: e.target.value }))}
                    />
                    <Input
                        label="End Date"
                        type="date"
                        value={freezeForm.endDate}
                        onChange={e => setFreezeForm(f => ({ ...f, endDate: e.target.value }))}
                    />
                    <Textarea
                        label="Reason"
                        placeholder="Reason for freeze"
                        value={freezeForm.reason}
                        onChange={e => setFreezeForm(f => ({ ...f, reason: e.target.value }))}
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setFreezeOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleFreeze}>Submit Request</LoadingButton>
                    </div>
                </div>
            </Modal>

            {/* Upgrade Plan Dialog */}
            <Modal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} title="Upgrade Plan" description="Select a new plan">
                <div className="space-y-4">
                    <Select
                        label="Select New Plan"
                        options={PLAN_OPTIONS}
                        value={upgradeForm.plan}
                        onChange={e => setUpgradeForm(f => ({ ...f, plan: e.target.value }))}
                        placeholder="Choose a plan"
                    />
                    <p className="text-xs text-zinc-500">Prorated amount will be calculated at checkout.</p>
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setUpgradeOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleUpgrade}>Upgrade</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
