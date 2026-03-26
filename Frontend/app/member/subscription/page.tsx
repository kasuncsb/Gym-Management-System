'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, RefreshCw, ArrowUpCircle, Snowflake, ShieldAlert } from 'lucide-react';
import { PageHeader, Card, Modal, Input, Select, Textarea, LoadingButton, Tabs } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { authAPI, getErrorMessage, opsAPI } from '@/lib/api';

type IdVerificationStatus = 'pending' | 'approved' | 'rejected' | null;

interface Plan {
    id: string;
    name: string;
    price: string;
    durationDays: number;
}
interface MySubscription {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    pricePaid: string | null;
    ptSessionsLeft: number;
    planName: string | null;
}
interface MyPayment {
    id: string;
    paymentDate: string;
    amount: string;
    paymentMethod: string;
    receiptNumber: string | null;
    invoiceNumber?: string | null;
}

type CheckoutState = 'idle' | 'awaiting_processor' | 'processing' | 'approved' | 'declined' | 'expired';

export default function MemberSubscriptionPage() {
    const toast = useToast();
    const [tab, setTab] = useState<'overview' | 'history'>('overview');
    const [idStatus, setIdStatus] = useState<IdVerificationStatus>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [renewOpen, setRenewOpen] = useState(false);
    const [freezeOpen, setFreezeOpen] = useState(false);
    const [upgradeOpen, setUpgradeOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [subscriptions, setSubscriptions] = useState<MySubscription[]>([]);
    const [payments, setPayments] = useState<MyPayment[]>([]);

    const [renewForm, setRenewForm] = useState({ plan: '', promo: '', payment: 'card' });
    const [freezeForm, setFreezeForm] = useState({ startDate: '', endDate: '', reason: '' });
    const [upgradeForm, setUpgradeForm] = useState({ plan: '' });
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [checkout, setCheckout] = useState({
        planId: '',
        promotionCode: '',
        paymentMethod: 'card',
        cardPan: '',
        cardHolder: '',
    });
    const [checkoutSessionId, setCheckoutSessionId] = useState('');
    const [checkoutState, setCheckoutState] = useState<CheckoutState>('idle');

    useEffect(() => {
        authAPI.getProfile()
            .then(res => {
                const data = res.data?.data as { idVerificationStatus?: IdVerificationStatus } | undefined;
                setIdStatus(data?.idVerificationStatus ?? null);
            })
            .catch(() => setIdStatus(null))
            .finally(() => setProfileLoading(false));
        Promise.all([
            opsAPI.plans().then((d) => setPlans((d ?? []) as Plan[])),
            opsAPI.mySubscriptions().then((d) => setSubscriptions((d ?? []) as MySubscription[])),
            opsAPI.myPayments().then((d) => setPayments((d ?? []) as MyPayment[])),
        ]).catch(() => {
            toast.error('Error', 'Failed to load subscription details');
        });
    }, []);

    const idRejected = idStatus === 'rejected';
    const idPending = idStatus === 'pending';
    const canPurchase = !idRejected && !idPending;
    const activeSubscription = subscriptions.find((s) => ['active', 'grace_period', 'frozen'].includes(s.status)) ?? subscriptions[0];
    const planOptions = plans.map((p) => ({
        value: p.id,
        label: `${p.name} — ${p.durationDays} days — Rs. ${Number(p.price ?? 0).toLocaleString()}`,
    }));

    const openCheckout = (payload: { planId: string; promotionCode?: string; paymentMethod?: string }) => {
        setCheckout({
            planId: payload.planId,
            promotionCode: payload.promotionCode ?? '',
            paymentMethod: payload.paymentMethod ?? 'card',
            cardPan: '',
            cardHolder: '',
        });
        setCheckoutState('idle');
        setCheckoutSessionId('');
        setCheckoutOpen(true);
    };

    const pollSessionUntilFinal = async (sessionId: string) => {
        const started = Date.now();
        while (Date.now() - started < 90_000) {
            const s = await opsAPI.getPaymentSession(sessionId) as { status: CheckoutState };
            if (s.status === 'approved' || s.status === 'declined' || s.status === 'expired') return s.status;
            setCheckoutState(s.status === 'processing' ? 'processing' : 'awaiting_processor');
            await new Promise((r) => setTimeout(r, 1800));
        }
        return 'expired' as CheckoutState;
    };

    const submitCheckout = async () => {
        if (!checkout.planId) {
            toast.error('Validation Error', 'Plan is required');
            return;
        }
        if (checkout.paymentMethod === 'card' && checkout.cardPan.replace(/\D/g, '').length < 13) {
            toast.error('Validation Error', 'Enter a valid card number');
            return;
        }
        setLoading(true);
        try {
            const session = await opsAPI.createPaymentSession({
                planId: checkout.planId,
                promotionCode: checkout.promotionCode || undefined,
                paymentMethod: checkout.paymentMethod as any,
                cardPan: checkout.cardPan || undefined,
                cardHolder: checkout.cardHolder || undefined,
                ttlSec: 180,
            });
            setCheckoutSessionId(session.id);
            setCheckoutState('awaiting_processor');
            const finalState = await pollSessionUntilFinal(session.id);
            setCheckoutState(finalState);
            if (finalState !== 'approved') {
                toast.error('Payment Not Approved', `Processor state: ${finalState}`);
                return;
            }
            setSubscriptions(await opsAPI.mySubscriptions() as MySubscription[]);
            setPayments(await opsAPI.myPayments() as MyPayment[]);
            toast.success('Payment Successful', 'Subscription activated and invoice issued.');
            setCheckoutOpen(false);
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleRenew = async () => {
        if (!canPurchase) return;
        if (!renewForm.plan) {
            toast.error('Validation Error', 'Please select a plan');
            return;
        }
        setRenewOpen(false);
        openCheckout({
            planId: renewForm.plan,
            promotionCode: renewForm.promo || undefined,
            paymentMethod: renewForm.payment,
        });
        setRenewForm({ plan: '', promo: '', payment: 'card' });
    };

    const handleFreeze = async () => {
        if (!freezeForm.startDate || !freezeForm.endDate || !freezeForm.reason) {
            toast.error('Validation Error', 'Please fill all fields');
            return;
        }
        setLoading(true);
        try {
            await opsAPI.requestFreeze({
                subscriptionId: activeSubscription?.id,
                freezeStart: freezeForm.startDate,
                freezeEnd: freezeForm.endDate,
                reason: freezeForm.reason,
            });
            setSubscriptions(await opsAPI.mySubscriptions() as MySubscription[]);
            toast.success('Freeze Request Sent', 'Your request will be processed soon.');
            setFreezeOpen(false);
            setFreezeForm({ startDate: '', endDate: '', reason: '' });
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
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
        setUpgradeOpen(false);
        openCheckout({ planId: upgradeForm.plan, paymentMethod: 'online' });
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
            {!profileLoading && idPending && (
                <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 flex items-start gap-3" role="alert">
                    <ShieldAlert className="text-yellow-400 shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="font-medium text-yellow-300">ID verification pending</p>
                        <p className="text-sm text-zinc-400 mt-1">
                            Your identity documents are being reviewed. Subscription purchases are blocked until your ID is approved.
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
                    {!activeSubscription ? (
                        <Card padding="lg" className="text-center space-y-5">
                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                                <CreditCard size={32} className="text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">No Active Plan</h3>
                                <p className="text-zinc-400 text-sm mt-1">Purchase your first subscription to access PowerWorld Kiribathgoda.</p>
                            </div>
                            <LoadingButton
                                icon={CreditCard}
                                onClick={() => canPurchase && setRenewOpen(true)}
                                disabled={!canPurchase}
                                size="lg"
                            >
                                Purchase Your First Plan
                            </LoadingButton>
                        </Card>
                    ) : (
                        <Card padding="lg">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                                        <CreditCard size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{activeSubscription.planName ?? 'No active plan'}</h3>
                                        <p className="text-zinc-400 text-sm mt-1">
                                            Rs. {Number(activeSubscription.pricePaid ?? 0).toLocaleString()}
                                        </p>
                                        <p className="text-zinc-500 text-xs mt-2">
                                            Ends: {activeSubscription.endDate ?? '—'} · PT sessions left: {activeSubscription.ptSessionsLeft ?? 0}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                                        activeSubscription.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                                        activeSubscription.status === 'grace_period' ? 'bg-yellow-500/20 text-yellow-400' :
                                        activeSubscription.status === 'frozen' ? 'bg-blue-500/20 text-blue-400' :
                                        'bg-red-500/20 text-red-400'
                                    }`}>
                                        {activeSubscription.status?.replace('_', ' ') ?? 'unknown'}
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
                                    onClick={() => setFreezeOpen(true)}
                                    size="sm"
                                >
                                    Request Freeze
                                </LoadingButton>
                            </div>
                        </Card>
                    )}
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
                                    <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">Invoice</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((p) => (
                                    <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                        <td className="px-6 py-4 text-sm text-white">{String(p.paymentDate).slice(0, 10)}</td>
                                        <td className="px-6 py-4 text-sm text-white">Rs. {Number(p.amount ?? 0).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-sm text-zinc-400">{p.paymentMethod}</td>
                                        <td className="px-6 py-4 text-sm text-zinc-400">{p.receiptNumber ?? '-'}</td>
                                        <td className="px-6 py-4 text-sm text-zinc-400">
                                            <LoadingButton
                                                size="sm"
                                                variant="secondary"
                                                disabled={!p.invoiceNumber}
                                                onClick={async () => {
                                                    try {
                                                        const html = await opsAPI.downloadInvoiceHtml(p.id);
                                                        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `${p.invoiceNumber ?? `invoice-${p.id}`}.html`;
                                                        a.click();
                                                        URL.revokeObjectURL(url);
                                                    } catch (e) {
                                                        toast.error('Invoice', getErrorMessage(e));
                                                    }
                                                }}
                                            >
                                                Download
                                            </LoadingButton>
                                        </td>
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
                        options={planOptions}
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
                            { value: 'cash', label: 'Cash' },
                            { value: 'bank_transfer', label: 'Bank Transfer' },
                            { value: 'online', label: 'Online Payment' },
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

            <Modal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} title="Secure checkout" size="md">
                <div className="space-y-4">
                    <Select
                        label="Payment Method"
                        options={[
                            { value: 'card', label: 'Credit/Debit Card' },
                            { value: 'online', label: 'Online Payment' },
                            { value: 'bank_transfer', label: 'Bank Transfer' },
                            { value: 'cash', label: 'Cash' },
                        ]}
                        value={checkout.paymentMethod}
                        onChange={e => setCheckout((f) => ({ ...f, paymentMethod: e.target.value }))}
                    />
                    <Input
                        label="Card Number"
                        placeholder="4242 4242 4242 4242"
                        value={checkout.cardPan}
                        onChange={e => setCheckout((f) => ({ ...f, cardPan: e.target.value }))}
                    />
                    <Input
                        label="Cardholder Name"
                        placeholder="NAME ON CARD"
                        value={checkout.cardHolder}
                        onChange={e => setCheckout((f) => ({ ...f, cardHolder: e.target.value }))}
                    />
                    <div className="rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-300">
                        Status: <span className="font-semibold text-white">{checkoutState.replace('_', ' ')}</span>
                        {checkoutSessionId ? ` · Session ${checkoutSessionId.slice(0, 8)}` : ''}
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setCheckoutOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={submitCheckout}>Pay</LoadingButton>
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
                        options={planOptions}
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
