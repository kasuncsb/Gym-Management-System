'use client';

import Link from "next/link";
import Image from "next/image";

export default function Home() {
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
          <div className="hidden md:flex space-x-8">
            <Link href="/" className="flex items-center space-x-2 text-gray-700 hover:text-red-500 transition-colors group">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Home</span>
            </Link>
            <Link href="/about" className="flex items-center space-x-2 text-gray-700 hover:text-red-500 transition-colors group">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>About</span>
            </Link>
            <Link href="/contact" className="flex items-center space-x-2 text-gray-700 hover:text-red-500 transition-colors group">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Contact</span>
            </Link>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/login"
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Login</span>
            </Link>
            <Link
              href="/register"
              className="border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-6 py-2.5 font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>Register</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <main className="flex-1 relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-section.jpg"
            alt="PowerWorld Fitness Centre"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/20"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex items-center justify-center min-h-full py-20">
          <div className="text-center max-w-5xl mx-auto px-6">
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 drop-shadow-lg">
              Welcome to <span className="text-red-500">PowerWorld!</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-100 mb-12 max-w-3xl mx-auto font-medium drop-shadow-md">
              Join Sri Lanka&apos;s #1 gym network – Your Fitness Journey Starts Here.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/register"
                className="group bg-red-600 hover:bg-red-700 text-white px-10 py-5 text-lg font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center justify-center space-x-3 shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>JOIN WITH US</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 text-gray-700 py-8 px-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600 mb-4">© 2025 Gym Management System. All rights reserved.</p>
          <div className="flex justify-center space-x-6">
            <Link href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-600 hover:text-gray-900 transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
