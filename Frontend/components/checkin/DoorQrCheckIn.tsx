'use client';

import axios from 'axios';
import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { Camera, CheckCircle2, LogOut, Users } from 'lucide-react';
import { PageHeader, Card, LoadingButton } from '@/components/ui/SharedComponents';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage, opsAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface LogEntry {
    label: string;
    type: 'in' | 'out';
    time: string;
    status?: string;
}

function parseDoorPayload(text: string): { token: string; code: string } | null {
    const raw = String(text ?? '').trim();
    if (!raw) return null;

    // Most reliable path: extract a JSON object even if the decoder adds noise
    // (e.g. leading/trailing characters around the payload).
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    const jsonCandidate =
        firstBrace >= 0 && lastBrace > firstBrace ? raw.slice(firstBrace, lastBrace + 1) : raw;

    try {
        const j = JSON.parse(jsonCandidate) as any;
        const token = j?.token ?? j?.data?.token ?? null;
        const code = j?.code ?? j?.data?.code ?? null;
        if (token != null && code != null) {
            return { token: String(token), code: String(code) };
        }
    } catch {
        /* ignore */
    }

    // Fallback: token and code separated by common delimiters.
    const parts = raw.split(/[|\n:,]/g).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) return { token: parts[0]!, code: parts[1]! };

    return null;
}

export function DoorQrCheckIn({
    title = 'Check-in',
    subtitle = 'Scan the door QR code shown on the simulator display to check in or out.',
    showCapacity = true,
}: {
    title?: string;
    subtitle?: string;
    showCapacity?: boolean;
}) {
    const toast = useToast();
    const { user } = useAuth();
    const scanKey = useId().replace(/:/g, '');
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const controlsRef = useRef<any>(null);
    const busyRef = useRef(false);
    const mountedRef = useRef(false);
    // Backend rate limit backoff to prevent request storms (429 floods).
    const rateLimitedUntilRef = useRef(0);
    const lastReloadAtRef = useRef(0);
    const [cameraOn, setCameraOn] = useState(false);
    const [starting, setStarting] = useState(false);
    const [log, setLog] = useState<LogEntry[]>([]);
    const [capacity, setCapacity] = useState({ current: 0, limit: 120 });
    const [scannedIn, setScannedIn] = useState(false);
    const scanSubmittedRef = useRef(false);
    const [scanHint, setScanHint] = useState<string | null>(null);
    const scanStartedAtRef = useRef<number | null>(null);
    const scanHintShownRef = useRef(false);
    const guideStyle = useMemo(() => {
        return { width: '72%', maxWidth: 360, aspectRatio: '1 / 1' as any };
    }, []);

    const reload = useCallback(async () => {
        if (!mountedRef.current) return;
        if (Date.now() < rateLimitedUntilRef.current) return;
        // Additional client-side throttle: even if multiple triggers happen, keep it sane.
        if (Date.now() - lastReloadAtRef.current < 5000) return;
        lastReloadAtRef.current = Date.now();

        try {
            const [myVisits, stats] = await Promise.all([opsAPI.myVisits(20), opsAPI.visitStats()]);
            const mapped: LogEntry[] = (myVisits ?? []).map((v: any) => ({
                label: user?.fullName ?? 'You',
                type: v.status === 'active' ? 'in' : 'out',
                time: new Date(v.checkInAt ?? v.checkOutAt ?? v.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                }),
                status: v.status,
            }));
            if (!mountedRef.current) return;
            setLog(mapped);
            setScannedIn(mapped[0]?.type === 'in' && mapped[0]?.status === 'active');
            setCapacity((prev) => ({ ...prev, current: Number(stats?.activeNow ?? 0) }));
        } catch (err) {
            // If the backend is rate limiting, back off and do not spam toasts.
            if (axios.isAxiosError(err) && err.response?.status === 429) {
                rateLimitedUntilRef.current = Date.now() + 60_000; // backoff window
                return;
            }
            throw err;
        }
    }, [user?.fullName]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (!showCapacity) return;
        opsAPI
            .branchCapacity()
            .then((d: { capacity: number }) => {
                setCapacity((prev) => ({ ...prev, limit: d.capacity || 120 }));
            })
            .catch(() => undefined);
    }, [showCapacity]);

    useEffect(() => {
        reload().catch(() => undefined);
    }, [reload]);

    const stopCamera = useCallback(async () => {
        try {
            if (controlsRef.current?.stop) {
                await controlsRef.current.stop();
            }
        } catch {
            /* ignore */
        } finally {
            controlsRef.current = null;
        }

        if (mountedRef.current) setCameraOn(false);
        if (mountedRef.current) setScanHint(null);
        scanStartedAtRef.current = null;
        scanHintShownRef.current = false;
    }, []);

    useEffect(() => () => {
        stopCamera().catch(() => undefined);
    }, [stopCamera]);

    const onDecoded = useCallback(
        async (text: string) => {
            if (busyRef.current) return;
            if (Date.now() < rateLimitedUntilRef.current) return;
            if (scanSubmittedRef.current) return;

            const payload = parseDoorPayload(text);
            if (!payload) {
                // Don't spam the user for frame-by-frame decoder noise.
                return;
            }
            busyRef.current = true;
            scanSubmittedRef.current = true;
            try {
                await stopCamera();
                const result = await opsAPI.doorScan(payload);
                const action = (result as { action?: string })?.action;
                toast.success(
                    action === 'check_out' ? 'Checked out' : 'Checked in',
                    action === 'check_out' ? 'Door unlocked — have a great day.' : 'Door unlocked — welcome in.',
                );
                await reload();
            } catch (err) {
                // Don't toast-spam on rate limits.
                if (axios.isAxiosError(err) && err.response?.status === 429) {
                    rateLimitedUntilRef.current = Date.now() + 60_000;
                } else {
                    toast.error('Scan failed', getErrorMessage(err));
                }
            } finally {
                busyRef.current = false;
            }
        },
        [reload, stopCamera, toast],
    );

    const startCamera = async () => {
        setStarting(true);
        try {
            await stopCamera();

            const videoEl = videoRef.current;
            if (!videoEl) throw new Error('Camera preview is not ready.');

            // Mobile browsers often refuse camera APIs on insecure origins.
            if (typeof window !== 'undefined' && !window.isSecureContext) {
                throw new Error('Camera requires HTTPS (or localhost). Open the site over HTTPS and try again.');
            }

            // Reset scan submission flag for this camera session.
            scanSubmittedRef.current = false;
            scanStartedAtRef.current = Date.now();
            scanHintShownRef.current = false;
            if (mountedRef.current) setScanHint(null);

            // Lazy import: keeps camera libs out of the server bundle.
            const zx = await import('@zxing/browser');
            const codeReader = new zx.BrowserQRCodeReader();

            const onZxingFrame = (result: any, err: any, controlsInCb: any) => {
                controlsRef.current = controlsInCb;

                if (result?.getText) {
                    const text = result.getText();
                    void onDecoded(text);
                    return;
                }

                const name = String(err?.name ?? '');
                const msg = String(err?.message ?? err ?? '');

                // Expected: "no QR found in this frame".
                if (name === 'NotFoundException' || /no qr|not found|notfound/i.test(msg)) return;

                // Surface a single helpful hint after a few seconds with no decode.
                if (mountedRef.current && !scanHintShownRef.current && scanStartedAtRef.current) {
                    const age = Date.now() - scanStartedAtRef.current;
                    if (age > 6000) {
                        scanHintShownRef.current = true;
                        setScanHint('No QR detected yet. Increase screen brightness, move closer, and keep the QR centered.');
                    }
                }

                // Only toast/stop for fatal streaming/camera errors.
                const fatal = /NotAllowed|Permission|denied|overconstrained|not supported|stream|Method not allowed/i.test(msg);
                if (fatal && mountedRef.current) {
                    toast.error('Camera error', getErrorMessage(err) ?? 'Failed to start camera stream.');
                    void stopCamera();
                }
            };

            // Prefer constraints-based start (more reliable on mobile, avoids enumerateDevices edge cases).
            let controls: any | null = null;
            try {
                controls = await codeReader.decodeFromConstraints(
                    {
                        video: {
                            facingMode: { ideal: 'environment' },
                            width: { ideal: 1280 },
                            height: { ideal: 720 },
                        },
                        audio: false,
                    },
                    videoEl,
                    onZxingFrame,
                );
            } catch (e) {
                // Fallback to explicit device selection.
                const devices = await zx.BrowserCodeReader.listVideoInputDevices();
                const pickBack = (d: any) =>
                    /back|rear|environment/i.test(String(d.label ?? '')) || /rear camera/i.test(String(d.label ?? ''));

                const device =
                    devices.find((d: any) => pickBack(d)) ??
                    devices.find((d: any) => d.label && d.label.length > 0) ??
                    devices[0];

                if (!device?.deviceId) throw e;

                controls = await codeReader.decodeFromVideoDevice(device.deviceId, videoEl, onZxingFrame);
            }

            controlsRef.current = controls;
            if (mountedRef.current) setCameraOn(true);
        } catch (err) {
            console.error('[DoorQrCheckIn] startCamera failed', err);
            toast.error('Camera error', getErrorMessage(err) ?? 'Failed to access camera.');
            await stopCamera();
        } finally {
            if (mountedRef.current) setStarting(false);
        }
    };

    return (
        <div className="space-y-8 max-w-2xl">
            <PageHeader title={title} subtitle={subtitle} />

            <Card padding="lg" className={`flex flex-col gap-4 ${scannedIn ? 'border-emerald-500/30' : ''}`}>
                <div className="flex items-center justify-between gap-3">
                    <p className="text-zinc-400 text-sm">
                        {cameraOn
                            ? 'Point the camera at the rotating door QR on the simulator screen.'
                            : 'Enable the camera, then scan the door QR from the simulator.'}
                    </p>
                    {cameraOn ? (
                        <LoadingButton
                            type="button"
                            variant="secondary"
                            onClick={() => stopCamera().catch(() => undefined)}
                        >
                            Stop camera
                        </LoadingButton>
                    ) : (
                        <LoadingButton
                            type="button"
                            loading={starting}
                            icon={Camera}
                            onClick={() => startCamera()}
                        >
                            Use camera
                        </LoadingButton>
                    )}
                </div>

                <div
                    className={`relative rounded-2xl border overflow-hidden bg-zinc-950/60 ${
                        cameraOn ? 'border-red-500/40' : 'border-zinc-800'
                    } aspect-square`}
                >
                    <video
                        key={scanKey}
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover"
                        playsInline
                        muted
                        autoPlay
                    />
                    {!cameraOn && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <p className="text-zinc-500 text-sm px-6 text-center">
                                Camera preview appears here after you allow access.
                            </p>
                        </div>
                    )}
                    {cameraOn && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div
                                className="relative rounded-2xl border border-zinc-200/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]"
                                style={guideStyle}
                            >
                                <div className="absolute -top-0.5 -left-0.5 w-7 h-7 border-l-2 border-t-2 border-red-300/90 rounded-tl-md" />
                                <div className="absolute -top-0.5 -right-0.5 w-7 h-7 border-r-2 border-t-2 border-red-300/90 rounded-tr-md" />
                                <div className="absolute -bottom-0.5 -left-0.5 w-7 h-7 border-l-2 border-b-2 border-red-300/90 rounded-bl-md" />
                                <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 border-r-2 border-b-2 border-red-300/90 rounded-br-md" />
                                <div className="absolute inset-x-0 -bottom-8 flex justify-center">
                                    <span className="text-[11px] text-zinc-300 bg-zinc-900/70 border border-zinc-700 rounded-full px-2 py-1">
                                        Keep QR inside the frame
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {scanHint && (
                    <p className="text-amber-300 text-sm">
                        {scanHint}
                    </p>
                )}

                {scannedIn && (
                    <p className="text-emerald-400 text-sm flex items-center gap-2">
                        <CheckCircle2 size={18} /> You have an active visit (checked in).
                    </p>
                )}
            </Card>

            {showCapacity && (
                <Card padding="md" className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Users size={20} className="text-blue-400" />
                        <div>
                            <p className="text-white font-semibold text-sm">Current occupancy</p>
                            <p className="text-zinc-500 text-xs">Live from visit log</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-white font-bold text-xl">
                            {capacity.current} / {capacity.limit}
                        </p>
                        <p className="text-zinc-500 text-xs">in facility</p>
                    </div>
                </Card>
            )}

            <Card padding="lg">
                <h2 className="text-lg font-semibold text-white mb-4">Your recent visits</h2>
                <div className="space-y-2">
                    {log.map((l, i) => (
                        <div key={i} className="flex items-center justify-between bg-zinc-800/30 rounded-xl p-3">
                            <div className="flex items-center gap-3">
                                {l.type === 'in' ? (
                                    <CheckCircle2 size={16} className="text-green-400" />
                                ) : (
                                    <LogOut size={16} className="text-red-400" />
                                )}
                                <span className="text-white text-sm">{l.label}</span>
                            </div>
                            <span className="text-zinc-500 text-xs">{l.time}</span>
                        </div>
                    ))}
                    {log.length === 0 && <p className="text-zinc-600 text-sm text-center py-4">No visits yet.</p>}
                </div>
            </Card>
        </div>
    );
}
