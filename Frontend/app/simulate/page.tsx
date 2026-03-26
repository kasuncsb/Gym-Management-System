'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, CreditCard, DoorClosed, DoorOpen, RefreshCw, Router, XCircle } from 'lucide-react';
import { Card, LoadingButton } from '@/components/ui/SharedComponents';
import { getErrorMessage, opsAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export default function SimulatePage() {
  const toast = useToast();
  const [qrUrl, setQrUrl] = useState<string>('');
  const [doorOpen, setDoorOpen] = useState(false);
  const [meta, setMeta] = useState<{ code?: string; expiresAt?: string }>({});
  const [countdownSec, setCountdownSec] = useState<number>(0);
  const [processorQueue, setProcessorQueue] = useState<any[]>([]);
  const [processorStatus, setProcessorStatus] = useState('Awaiting payment request...');
  const [processorStep, setProcessorStep] = useState<'idle' | 'incoming' | 'validating' | 'risk' | 'approved' | 'declined'>('idle');
  const [activeRequestId, setActiveRequestId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const refreshingRef = useRef(false);
  const lastQrRetryAtRef = useRef(0);
  const countdownRef = useRef(0);
  const lastDoorEventRef = useRef<string>('');
  const doorCloseTimerRef = useRef<number | null>(null);

  const refreshQr = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      // Requested: QR challenge timeout is 30 seconds.
      const otp = await opsAPI.publicSimulateGenerateDoorOtp(30);
      // Keep QR payload compact for maximum scan reliability (screen → camera).
      // The check-in scanner accepts both JSON and `token|code`.
      const payload = `${otp.token}|${otp.code}`;
      const QR = (await import('qrcode')).default;
      // Screen-to-camera scanning needs standard dark-on-light, big quiet zone,
      // and high error correction for real devices.
      const url = await QR.toDataURL(payload, {
        width: 380,
        margin: 4,
        errorCorrectionLevel: 'H',
        color: { dark: '#000000', light: '#ffffff' },
      });
      setQrUrl(url);
      setMeta({ code: otp.code, expiresAt: otp.expiresAt });
      const initialLeft = Math.max(0, Math.ceil((new Date(otp.expiresAt).getTime() - Date.now()) / 1000));
      setCountdownSec(initialLeft);
    } catch (e) {
      toast.error('QR refresh failed', getErrorMessage(e));
    } finally {
      refreshingRef.current = false;
    }
  }, [toast]);

  const pollDoor = useCallback(async () => {
    try {
      const s = await opsAPI.publicSimulationState();
      const v = s?.visits?.[0];
      const lastAt = v?.checkOutAt ?? v?.checkInAt ?? v?.createdAt;
      if (!lastAt) return;
      const age = Date.now() - new Date(lastAt).getTime();
      if (age < 10000) {
        const eventKey = `${v?.id ?? 'unknown'}:${v?.status ?? 'unknown'}:${lastAt}`;
        if (lastDoorEventRef.current === eventKey) return;
        lastDoorEventRef.current = eventKey;
        setDoorOpen(true);
        if (doorCloseTimerRef.current) window.clearTimeout(doorCloseTimerRef.current);
        doorCloseTimerRef.current = window.setTimeout(() => setDoorOpen(false), 3200);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    countdownRef.current = countdownSec;
  }, [countdownSec]);

  useEffect(() => {
    opsAPI
      .publicSimulationBootstrap()
      .then((b) => {
        void b;
      })
      .catch(() => undefined);
    refreshQr().catch(() => undefined);
    const doorTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        pollDoor().catch(() => undefined);
      }
    }, 6000);
    const paymentReqTimer = window.setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const rows = await opsAPI.publicPendingPaymentRequests();
        setProcessorQueue(rows);
      } catch {
        setProcessorQueue([]);
      }
    }, 1800);
    const countdownTimer = window.setInterval(() => {
      setCountdownSec((prev) => {
        if (prev === 1) {
          if (document.visibilityState === 'visible') {
            refreshQr().catch(() => undefined);
          }
          return 0;
        }
        if (prev <= 0) {
          // Self-heal: if we are stuck at 00:00 due to a failed refresh/network hiccup,
          // retry refresh every few seconds while visible.
          if (document.visibilityState === 'visible') {
            const now = Date.now();
            if (now - lastQrRetryAtRef.current >= 5000) {
              lastQrRetryAtRef.current = now;
              refreshQr().catch(() => undefined);
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const onVisible = () => {
      if (document.visibilityState === 'visible' && countdownRef.current <= 0) {
        refreshQr().catch(() => undefined);
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(doorTimer);
      window.clearInterval(paymentReqTimer);
      window.clearInterval(countdownTimer);
      if (doorCloseTimerRef.current) window.clearTimeout(doorCloseTimerRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [pollDoor, refreshQr]);

  useEffect(() => {
    if (processorStep !== 'idle') return;
    if (!processorQueue.length) {
      setProcessorStatus('Awaiting payment request...');
      return;
    }
    const req = processorQueue[0];
    let cancelled = false;
    const run = async () => {
      try {
        setActiveRequestId(req.id);
        setProcessorStep('incoming');
        setProcessorStatus(`Incoming payment request detected • ${req.memberName ?? req.memberId}`);
        await new Promise((r) => setTimeout(r, 900));
        if (cancelled) return;
        setProcessorStep('validating');
        setProcessorStatus('Validating payment credentials...');
        await new Promise((r) => setTimeout(r, 1100));
        if (cancelled) return;
        setProcessorStep('risk');
        setProcessorStatus('3DS check • AVS match • risk scoring...');
        await new Promise((r) => setTimeout(r, 1400));
        if (cancelled) return;
        await opsAPI.publicApprovePaymentRequest(req.id);
        setProcessorStep('approved');
        setProcessorStatus('Payment approved and settlement committed');
        setTimeout(() => {
          setProcessorStep('idle');
          setActiveRequestId('');
        }, 1200);
      } catch {
        setProcessorStep('declined');
        setProcessorStatus('Payment declined by processor');
        setTimeout(() => {
          setProcessorStep('idle');
          setActiveRequestId('');
        }, 1200);
      }
    };
    run().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [processorQueue, processorStep]);

  const countdownText = useMemo(() => {
    const s = Math.max(0, countdownSec);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }, [countdownSec]);

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

      <div className="space-y-8">
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

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
            <div
              className={`relative mx-auto w-full max-w-md aspect-[4/5] rounded-2xl border-2 transition-all duration-500 overflow-hidden ${
                doorOpen ? 'border-emerald-500/70 shadow-[0_0_46px_rgba(16,185,129,0.32)]' : 'border-zinc-700'
              }`}
              style={{ perspective: '1000px' }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 to-zinc-900" />
              <div className="absolute left-2 top-2 bottom-2 w-3 bg-zinc-700/90 rounded-sm" />
              <div className="absolute right-2 top-2 bottom-2 w-3 bg-zinc-700/90 rounded-sm" />
              <div className="absolute left-2 right-2 top-2 h-3 bg-zinc-700/90 rounded-sm" />
              <div className="absolute left-2 right-2 bottom-2 h-3 bg-zinc-700/90 rounded-sm" />

              <div
                className={`absolute inset-5 rounded-xl transition-transform duration-700 ease-out origin-left border border-zinc-700/80 bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-950 ${
                  doorOpen ? '[transform:rotateY(-76deg)]' : '[transform:rotateY(0deg)]'
                }`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="absolute inset-0 p-5">
                  <div className="h-full w-full rounded-lg border border-zinc-600/60" />
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-zinc-300 shadow-[0_0_8px_rgba(255,255,255,0.35)]" />
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center">
                {doorOpen ? (
                  <span className="flex items-center gap-2 text-emerald-300 font-semibold text-sm bg-emerald-950/40 border border-emerald-500/30 rounded-full px-3 py-1">
                    <DoorOpen size={18} /> Unlocked
                  </span>
                ) : (
                  <span className="text-zinc-300 text-xs uppercase tracking-wider bg-zinc-900/50 border border-zinc-700 rounded-full px-3 py-1">Locked</span>
                )}
              </div>
            </div>

            <div className="w-full flex flex-col items-center xl:items-start gap-3">
              {qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrUrl}
                  alt="Door QR"
                  className="rounded-xl border border-zinc-700 w-[320px] h-[320px] bg-white"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <div className="w-[320px] h-[320px] rounded-xl border border-zinc-700 bg-white/10 animate-pulse" />
              )}
              <p className="text-zinc-500 text-xs">Door code</p>
              <p className="text-white font-mono text-lg tracking-widest">{meta.code ?? '— — — — — —'}</p>
              <p className="text-zinc-500 text-xs">QR refresh in</p>
              <p className={`font-mono text-xl ${countdownSec <= 8 ? 'text-amber-300' : 'text-zinc-200'}`}>{countdownText}</p>
            </div>
          </div>
        </Card>

        <Card padding="lg" className="space-y-5 bg-zinc-900/40 border-zinc-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Router size={20} className="text-amber-400 shrink-0" />
            Payment processor
          </h2>
          <p className="text-zinc-500 text-sm">
            Incoming sessions from member checkout are processed here using a realistic pipeline.
          </p>
          <div className="rounded-xl border border-zinc-700 bg-zinc-950/60 p-4 space-y-3">
            <p className="text-sm text-zinc-200">{processorStatus}</p>
            {activeRequestId ? <p className="text-xs text-zinc-500">Request: {activeRequestId.slice(0, 8)}</p> : null}
            {processorStep === 'approved' ? (
              <div className="flex items-center gap-2 text-emerald-300"><CheckCircle2 size={18} /> CAPTURED</div>
            ) : null}
            {processorStep === 'declined' ? (
              <div className="flex items-center gap-2 text-red-300"><XCircle size={18} /> DECLINED</div>
            ) : null}
            {processorStep !== 'approved' && processorStep !== 'declined' ? (
              <div className="flex items-center gap-2 text-amber-300"><CreditCard size={18} /> Processor online</div>
            ) : null}
          </div>
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">Pending queue: {processorQueue.length}</p>
            {processorQueue.slice(0, 3).map((req) => (
              <div key={req.id} className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-300">
                {req.memberName ?? req.memberId} • {req.planName ?? req.planId} • Rs. {Number(req.amount ?? 0).toLocaleString()}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <LoadingButton
              type="button"
              variant="secondary"
              loading={loading}
              disabled={!processorQueue[0]}
              onClick={async () => {
                if (!processorQueue[0]) return;
                setLoading(true);
                try {
                  await opsAPI.publicDeclinePaymentRequest(processorQueue[0].id, 'Manual simulator decline');
                  toast.success('Declined', 'Top request declined.');
                } catch (e) {
                  toast.error('Decline failed', getErrorMessage(e));
                } finally {
                  setLoading(false);
                }
              }}
            >
              Decline next request
            </LoadingButton>
          </div>
        </Card>
      </div>
    </div>
  );
}
