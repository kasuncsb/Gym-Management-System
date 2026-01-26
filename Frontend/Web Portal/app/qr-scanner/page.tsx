'use client';

import { useState, useEffect, useRef } from 'react';
import Link from "next/link";
import Image from "next/image";
import { qrAPI } from "@/lib/api";
// Note: In a real app, you'd use a library like 'jsqr' or 'react-qr-reader' to decode video stream.
// For this demo, we simulate the 'decoding' part or assume 'scanResult' comes from a library.
// We will simply start the camera stream to show we can, and keep the 'Simulate Scan' button 
// which effectively tests the API integration.

export default function QRScannerPage() {
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [apiMessage, setApiMessage] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startScanning = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsScanning(true);
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Unable to access camera. Please check permissions.');
        }
    };

    const stopScanning = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsScanning(false);
    };

    const handleScan = async (qrData: string) => {
        setScanResult(qrData);
        setLoading(true);
        setApiMessage('');

        try {
            // Call Backend
            const res = await qrAPI.scan(qrData, 'GATE01', 'SCANNER_WEB', 'Front Desk');
            if (res.data.success) {
                setApiMessage(`✅ Access Granted: ${res.data.data.message || 'Welcome!'}`);
            } else {
                setApiMessage(`❌ Access Denied: ${res.data.message}`);
            }
        } catch (err: any) {
            setApiMessage(`❌ Error: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const simulateQRScan = () => {
        // Simulate detecting a code
        // In a real app this comes from the video decoder
        const mockQRData = 'MEMBER-UUID-FROM-DB'; // You normally scan a UUID
        handleScan(mockQRData);
    };

    useEffect(() => {
        return () => stopScanning();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Navigation Header */}
            <nav className="bg-white text-gray-900 py-4 px-6 relative z-10 border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Link href="/" className="flex items-center space-x-3 group">
                            <Image
                                src="/logo.png"
                                alt="PowerWorld Fitness Logo"
                                width={50}
                                height={50}
                                className="transition-transform group-hover:scale-105"
                                priority
                            />
                            <span className="text-xl font-bold text-gray-900 group-hover:text-red-500 transition-colors">
                                PowerWorld
                            </span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/dashboard"
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 px-6 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Check In/Out</h1>
                        <p className="text-gray-600">Scan member QR code</p>
                    </div>

                    {/* QR Scanner Section */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">QR Code Scanner</h2>

                        {!isScanning ? (
                            <div className="text-center">
                                <div className="w-64 h-64 mx-auto mb-6 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                                    <div className="text-center">
                                        <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                        </svg>
                                        <p className="text-gray-600">Camera preview</p>
                                    </div>
                                </div>
                                <button
                                    onClick={startScanning}
                                    className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors mr-4"
                                >
                                    Start Scanning
                                </button>
                                <button
                                    onClick={simulateQRScan}
                                    disabled={loading}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-colors"
                                >
                                    {loading ? 'Processing...' : 'Simulate Scan'}
                                </button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="relative w-full max-w-lg mx-auto mb-6 bg-gray-900 rounded-lg overflow-hidden h-64 sm:h-96">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 border-2 border-red-500 rounded-lg opacity-50"></div>
                                </div>
                                <button
                                    onClick={stopScanning}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-colors"
                                >
                                    Stop Scanning
                                </button>
                                <div className="mt-4">
                                    <button
                                        onClick={simulateQRScan}
                                        disabled={loading}
                                        className="bg-blue-100 text-blue-700 px-4 py-2 rounded text-sm hover:bg-blue-200"
                                    >
                                        Force Simulate Detect
                                    </button>
                                </div>
                            </div>
                        )}

                        {apiMessage && (
                            <div className={`mt-4 p-4 rounded-lg border text-center ${apiMessage.includes('Granted') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                <p className="font-medium text-lg">
                                    {apiMessage}
                                </p>
                                {scanResult && <p className="text-xs mt-1 opacity-75">Code: {scanResult}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
