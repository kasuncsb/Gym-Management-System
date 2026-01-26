'use client';

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WelcomeDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to main dashboard after 8 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 8000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation Header */}
      <nav className="bg-white text-gray-900 py-4 px-6 relative z-10 shadow-sm border-b border-gray-200">
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
          <div className="flex space-x-3">
            <Link 
              href="/" 
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          {/* Welcome Card */}
          <div className="bg-white shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-8 py-10 text-center border-b border-gray-200">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg rounded-full">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome to PowerWorld!
              </h1>
              <p className="text-gray-600 text-lg">
                Your account has been successfully created and verified.
              </p>
            </div>

            {/* Content */}
            <div className="px-8 py-8 space-y-6">
              {/* Success Message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-green-600">
                    Your membership is now active! You can start using all gym facilities immediately.
                  </p>
                </div>
              </div>

              {/* What's Next */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-700 mb-2">What&apos;s Next?</h4>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>• Visit your nearest PowerWorld location</li>
                  <li>• Download our mobile app for easy check-ins</li>
                  <li>• Book your first personal training session</li>
                  <li>• Explore our group fitness classes</li>
                </ul>
              </div>

              {/* Membership Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Your Membership Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Plan:</span>
                    <span className="text-gray-900 ml-2">Premium</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="text-green-500 ml-2">Active</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Next Payment:</span>
                    <span className="text-gray-900 ml-2">Next Month</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Member ID:</span>
                    <span className="text-gray-900 ml-2">PW2025001</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Link 
                  href="/dashboard" 
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-4 transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                  </svg>
                  <span>Go to Dashboard</span>
                </Link>

                <Link 
                  href="/" 
                  className="w-full border-2 border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-600 font-semibold py-3 px-4 transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Go to Home</span>
                </Link>
              </div>

              {/* Auto-redirect notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-yellow-600">
                    You will be automatically redirected to your dashboard in 8 seconds.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mt-8 text-center">
            <div className="flex justify-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
            <p className="text-xs text-gray-600">Registration Complete!</p>
          </div>
        </div>
      </main>
    </div>
  );
}
