'use client';

import { useState, useEffect, useRef } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function QRScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<'checked-in' | 'checked-out' | null>(null);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const checkInHistory = [
    { date: '2025-01-15', checkIn: '08:30 AM', checkOut: '10:15 AM', duration: '1h 45m' },
    { date: '2025-01-14', checkIn: '07:00 AM', checkOut: '08:30 AM', duration: '1h 30m' },
    { date: '2025-01-13', checkIn: '06:45 AM', checkOut: '08:00 AM', duration: '1h 15m' },
    { date: '2025-01-12', checkIn: '09:00 AM', checkOut: '10:30 AM', duration: '1h 30m' },
    { date: '2025-01-11', checkIn: '08:15 AM', checkOut: '09:45 AM', duration: '1h 30m' }
  ];

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

  const simulateQRScan = () => {
    // Simulate QR code scan
    const mockQRData = 'POWERWORLD_MEMBER_12345';
    setScanResult(mockQRData);
    setIsScanning(false);
    
    // Simulate check-in process
    setTimeout(() => {
      if (checkInStatus === 'checked-in') {
        setCheckInStatus('checked-out');
        setLastCheckIn(new Date().toLocaleString());
        setIsWorkoutActive(false);
      } else {
        setCheckInStatus('checked-in');
        setLastCheckIn(new Date().toLocaleString());
        setIsWorkoutActive(true);
      }
    }, 1000);
  };

  const handleManualCheckIn = () => {
    if (checkInStatus === 'checked-in') {
      setCheckInStatus('checked-out');
      setLastCheckIn(new Date().toLocaleString());
      setIsWorkoutActive(false);
    } else {
      setCheckInStatus('checked-in');
      setLastCheckIn(new Date().toLocaleString());
      setIsWorkoutActive(true);
    }
  };

  useEffect(() => {
    // Start workout timer when checked in
    let interval: NodeJS.Timeout;
    if (isWorkoutActive) {
      interval = setInterval(() => {
        setWorkoutDuration(prev => prev + 1);
      }, 1000);
    } else {
      setWorkoutDuration(0);
    }
    
    return () => clearInterval(interval);
  }, [isWorkoutActive]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (checkInStatus === 'checked-in') return 'text-green-400 bg-green-500/20';
    if (checkInStatus === 'checked-out') return 'text-gray-400 bg-gray-500/20';
    return 'text-gray-400 bg-gray-500/20';
  };

  const getStatusText = () => {
    if (checkInStatus === 'checked-in') return 'Checked In';
    if (checkInStatus === 'checked-out') return 'Checked Out';
    return 'Not Checked In';
  };

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
            <p className="text-gray-600">Scan your QR code or use manual check-in</p>
          </div>

          {/* Status Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
            <div className="text-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-4 ${getStatusColor()}`}>
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  checkInStatus === 'checked-in' ? 'bg-green-400' : 'bg-gray-400'
                }`}></div>
                {getStatusText()}
              </div>
              
              {lastCheckIn && (
                <p className="text-gray-600 text-sm mb-4">
                  Last {checkInStatus === 'checked-in' ? 'check-in' : 'check-out'}: {lastCheckIn}
                </p>
              )}

              {isWorkoutActive && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="text-2xl font-mono text-red-500 mb-2">
                    {formatTime(workoutDuration)}
                  </div>
                  <p className="text-red-600 text-sm">Workout in progress</p>
                </div>
              )}
            </div>
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
                    <p className="text-gray-600">Camera preview will appear here</p>
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
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  Simulate Scan
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="relative w-64 h-64 mx-auto mb-6 bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-2 border-red-500 rounded-lg">
                    <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-red-500 rounded-tl-lg"></div>
                    <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-red-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-red-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-red-500 rounded-br-lg"></div>
                  </div>
                </div>
                <button
                  onClick={stopScanning}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  Stop Scanning
                </button>
              </div>
            )}

            {scanResult && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 text-sm text-center">
                  QR Code detected: {scanResult}
                </p>
              </div>
            )}
          </div>

          {/* Manual Check-in Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Manual Check-in</h2>
            <div className="text-center">
              <button
                onClick={handleManualCheckIn}
                className={`px-8 py-4 rounded-lg font-semibold transition-colors ${
                  checkInStatus === 'checked-in'
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {checkInStatus === 'checked-in' ? 'Check Out' : 'Check In'}
              </button>
              <p className="text-gray-600 text-sm mt-2">
                Use this if QR scanning is not available
              </p>
            </div>
          </div>

          {/* Check-in History */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Check-ins</h2>
            <div className="space-y-4">
              {checkInHistory.map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-semibold">{entry.date}</h3>
                      <p className="text-gray-600 text-sm">
                        {entry.checkIn} - {entry.checkOut}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900 font-semibold">{entry.duration}</p>
                    <p className="text-gray-600 text-sm">Duration</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
