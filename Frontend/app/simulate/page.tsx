'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CreditCard, DoorClosed, DoorOpen, RefreshCw, Router } from 'lucide-react';
import { Card, Input, LoadingButton, Select } from '@/components/ui/SharedComponents';
import { getErrorMessage, opsAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export default function SimulatePage() {
  const toast = useToast();
  const [members, setMembers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [doorOpen, setDoorOpen] = useState(false);
  const [meta, setMeta] = useState<{ code?: string; expiresAt?: string; serverTime?: string }>({});
  const [pay, setPay] = useState({ memberId: '', planId: '', pan: '', holder: '' });
  const [loading, setLoading] = useState(false);

  const memberOptions = useMemo(
    () => members.map((u) => ({ value: u.id, label: `${u.fullName} (${u.memberCode ?? u.id.slice(0, 6)})` })),
    [members],
  );
  const planOptions = useMemo(
    () => plans.map((p) => ({ value: p.id, label: `${p.name} — Rs.${Number(p.price ?? 0).toLocaleString()}` })),
    [plans],
  );

  const refreshQr = useCallback(async () => {
    try {
      const otp = await opsAPI.publicSimulateGenerateDoorOtp(120);
      // Keep QR payload compact for maximum scan reliability (screen → camera).
      // The check-in scanner accepts both JSON and `token|code`.
      const payload = `${otp.token}|${otp.code}`;
      const QR = (await import('qrcode')).default;
      // Screen-to-camera scanning needs standard dark-on-light, big quiet zone,
      // and high error correction for real devices.
      const url = await QR.toDataURL(payload, {
        width: 420,
        margin: 4,
        errorCorrectionLevel: 'H',
        color: { dark: '#000000', light: '#ffffff' },
      });
      setQrUrl(url);
      setMeta({ code: otp.code, expiresAt: otp.expiresAt, serverTime: (otp as { serverTime?: string }).serverTime });
    } catch (e) {
      toast.error('QR refresh failed', getErrorMessage(e));
    }
  }, [toast]);

  const pollDoor = useCallback(async () => {
    try {
      const s = await opsAPI.publicSimulationState();
      const v = s?.visits?.[0];
      const lastAt = v?.checkOutAt ?? v?.checkInAt ?? v?.createdAt;
      if (!lastAt) return;
      const age = Date.now() - new Date(lastAt).getTime();
      if (age < 7000) {
        setDoorOpen(true);
        window.setTimeout(() => setDoorOpen(false), 3200);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    opsAPI
      .publicSimulationBootstrap()
      .then((b) => {
        setMembers(b?.members ?? []);
        setPlans(b?.plans ?? []);
        if (b?.members?.[0]) setPay((p) => ({ ...p, memberId: b.members[0].id }));
        if (b?.plans?.[0]) setPay((p) => ({ ...p, planId: b.plans[0].id }));
      })
      .catch(() => undefined);
    refreshQr().catch(() => undefined);
    const qrTimer = window.setInterval(() => {
      refreshQr().catch(() => undefined);
    }, 45_000);
    const doorTimer = window.setInterval(() => {
      // 2s polling quickly triggers rate limiting in production; keep it light.
      if (document.visibilityState === 'visible') {
        pollDoor().catch(() => undefined);
      }
    }, 6000);
    return () => {
      window.clearInterval(qrTimer);
      window.clearInterval(doorTimer);
    };
  }, [pollDoor, refreshQr]);

  const runCardPay = async () => {
    if (!pay.memberId || !pay.planId || pay.pan.replace(/\D/g, '').length < 13) {
      toast.error('Payment', 'Choose member, plan, and a valid test card number.');
      return;
    }
    setLoading(true);
    try {
      await opsAPI.publicSimulateCardPayment({
        memberId: pay.memberId,
        planId: pay.planId,
        cardPan: pay.pan,
        cardHolder: pay.holder || undefined,
      });
      toast.success('Approved', 'Simulator card network accepted the transaction.');
    } catch (e) {
      toast.error('Declined', getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Simulator environment</h1>
        <p className="text-zinc-400 mt-2 max-w-2xl text-sm md:text-base leading-relaxed">
          This page mimics real hardware: a time-limited door QR, animated entry, and a mock card network that auto-approves
          valid-length PANs. Open{' '}
          <span className="text-red-400 font-medium">Check-in</span> on your phone while logged in, allow the camera, and scan
          the code below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card padding="lg" className="space-y-6 bg-zinc-900/40 border-zinc-800">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <DoorClosed size={20} className="text-red-400 shrink-0" />
              Access door
            </h2>
            <LoadingButton type="button" variant="secondary" icon={RefreshCw} onClick={() => refreshQr().catch(() => undefined)}>
              Refresh QR
            </LoadingButton>
          </div>

          <div
            className={`relative mx-auto w-full max-w-sm aspect-[4/5] rounded-2xl border-2 transition-all duration-500 flex flex-col items-center justify-center gap-4 overflow-hidden ${
              doorOpen ? 'border-emerald-500/70 shadow-[0_0_40px_rgba(16,185,129,0.25)]' : 'border-zinc-700'
            }`}
            style={{ perspective: '900px' }}
          >
            <div
              className={`absolute inset-4 rounded-xl transition-transform duration-700 ease-out origin-left bg-gradient-to-br from-zinc-800 to-zinc-950 border border-zinc-700/80 ${
                doorOpen ? '[transform:rotateY(-78deg)]' : '[transform:rotateY(0deg)]'
              }`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 rounded-full bg-zinc-700/80 mb-6 ring-2 ring-zinc-600" />
                <div className="h-1 w-24 bg-zinc-600 rounded-full" />
              </div>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-2 mt-auto pb-4">
              {doorOpen ? (
                <span className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <DoorOpen size={22} /> Unlocked
                </span>
              ) : (
                <span className="text-zinc-500 text-xs uppercase tracking-wider">Locked</span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrUrl}
                alt="Door QR"
                className="rounded-xl border border-zinc-700 w-[360px] h-[360px] bg-white"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <div className="w-[360px] h-[360px] rounded-xl border border-zinc-700 bg-white/10 animate-pulse" />
            )}
            <div className="text-center sm:text-left space-y-1">
              <p className="text-zinc-500 text-xs">OTP token</p>
              <p className="text-white font-mono text-lg tracking-widest">{meta.code ?? '— — — — — —'}</p>
              <p className="text-zinc-500 text-xs mt-2">Expires</p>
              <p className="text-zinc-300 text-sm font-mono">{meta.expiresAt ? new Date(meta.expiresAt).toLocaleTimeString() : '—'}</p>
              <p className="text-zinc-500 text-xs mt-2">Server time</p>
              <p className="text-zinc-400 text-xs font-mono">{meta.serverTime ? new Date(meta.serverTime).toLocaleTimeString() : '—'}</p>
            </div>
          </div>
        </Card>

        <Card padding="lg" className="space-y-5 bg-zinc-900/40 border-zinc-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Router size={20} className="text-amber-400 shrink-0" />
            Mock card network
          </h2>
          <p className="text-zinc-500 text-sm">
            Acts as a Mastercard/Visa-style router: any 13–19 digit PAN is validated and the subscription is activated; only a
            hash is stored server-side.
          </p>
          <Select label="Member" options={memberOptions} value={pay.memberId} onChange={(e) => setPay((p) => ({ ...p, memberId: e.target.value }))} />
          <Select label="Plan" options={planOptions} value={pay.planId} onChange={(e) => setPay((p) => ({ ...p, planId: e.target.value }))} />
          <Input label="Card number" placeholder="4242 4242 4242 4242" value={pay.pan} onChange={(e) => setPay((p) => ({ ...p, pan: e.target.value }))} />
          <Input label="Cardholder" placeholder="NAME ON CARD" value={pay.holder} onChange={(e) => setPay((p) => ({ ...p, holder: e.target.value }))} />
          <LoadingButton type="button" loading={loading} icon={CreditCard} onClick={() => runCardPay()}>
            Route &amp; capture payment
          </LoadingButton>
        </Card>
      </div>
    </div>
  );
}
