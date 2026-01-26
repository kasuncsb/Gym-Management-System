'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './qr-code.css';

export default function QRCodePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [qrCode, setQrCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (!user || user.role !== 'member') {
            router.push('/login');
            return;
        }

        generateQR();

        // Auto-refresh QR code every 4 minutes (before 5-minute expiry)
        intervalRef.current = setInterval(generateQR, 4 * 60 * 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [user, router]);

    const generateQR = async () => {
        try {
            const response = await authAPI.getQRCode();
            setQrCode(response.data.data.qrCodeDataUrl);
            setError('');
        } catch (err) {
            setError('Failed to generate QR code');
        } finally {
            setLoading(false);
        }
    };

    const downloadQR = () => {
        const link = document.createElement('a');
        link.href = qrCode;
        link.download = `powerworld-qr-${user?.name}.png`;
        link.click();
    };

    const copyToken = async () => {
        try {
            const response = await authAPI.getQRCode();
            await navigator.clipboard.writeText(response.data.data.qrToken);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy token');
        }
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner-large"></div>
                <p>Generating your QR code...</p>
            </div>
        );
    }

    return (
        <div className="qr-page">
            <nav className="dashboard-nav">
                <div className="nav-brand">
                    <span className="brand-icon">💪</span>
                    <span className="brand-name">PowerWorld</span>
                </div>
                <div className="nav-links">
                    <Link href="/member" className="nav-link">Dashboard</Link>
                    <Link href="/member/qr-code" className="nav-link active">My QR Code</Link>
                    <Link href="/member/profile" className="nav-link">Profile</Link>
                </div>
            </nav>

            <div className="qr-container container">
                <div className="qr-header">
                    <h1>Your Access QR Code</h1>
                    <p>Scan this code at the gym entrance for quick access</p>
                </div>

                <div className="qr-content">
                    <div className="qr-card card-glass">
                        {error ? (
                            <div className="qr-error">
                                <span className="error-icon">❌</span>
                                <p>{error}</p>
                                <button onClick={generateQR} className="btn btn-primary">
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="qr-display">
                                    <img src={qrCode} alt="Member QR Code" className="qr-image" />
                                    <div className="qr-refresh-indicator">
                                        <span className="refresh-dot"></span>
                                        Auto-refreshes every 4 minutes
                                    </div>
                                </div>

                                <div className="qr-actions">
                                    <button onClick={downloadQR} className="btn btn-primary">
                                        <span>📥</span> Download QR Code
                                    </button>
                                    <button onClick={copyToken} className="btn btn-outline">
                                        <span>{copied ? '✓' : '📋'}</span>
                                        {copied ? 'Copied!' : 'Copy Token'}
                                    </button>
                                    <button onClick={generateQR} className="btn btn-secondary">
                                        <span>🔄</span> Refresh
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="qr-info">
                        <h3>How to Use</h3>
                        <div className="info-steps">
                            <div className="info-step">
                                <div className="step-number">1</div>
                                <div className="step-content">
                                    <h4>Show this QR Code</h4>
                                    <p>Present your phone screen at the gym entrance scanner</p>
                                </div>
                            </div>
                            <div className="info-step">
                                <div className="step-number">2</div>
                                <div className="step-content">
                                    <h4>Wait for Scan</h4>
                                    <p>The scanner will validate your subscription automatically</p>
                                </div>
                            </div>
                            <div className="info-step">
                                <div className="step-number">3</div>
                                <div className="step-content">
                                    <h4>Access Granted!</h4>
                                    <p>Door will unlock if your subscription is active</p>
                                </div>
                            </div>
                        </div>

                        <div className="security-note">
                            <span className="note-icon">🔒</span>
                            <div>
                                <h4>Security Notice</h4>
                                <p>This QR code is unique to you and refreshes automatically. Do not share it with others.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
