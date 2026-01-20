'use client';

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function IdentityVerification() {
  const [selectedDocument, setSelectedDocument] = useState('');
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsLoading(false);
    // Navigate to subscription page
    router.push('/register/subscription');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'front') {
        setFrontImage(file);
      } else {
        setBackImage(file);
      }
    }
  };

  const removeFile = (type: 'front' | 'back') => {
    if (type === 'front') {
      setFrontImage(null);
    } else {
      setBackImage(null);
    }
  };

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
              href="/register/personal-details" 
              className="text-gray-700 hover:text-red-500 px-4 py-2 font-medium transition-colors"
            >
              Back
            </Link>
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
          {/* Identity Verification Card */}
          <div className="bg-white shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-8 py-10 text-center border-b border-gray-200">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Identity Verification
              </h1>
              <p className="text-gray-600">
                Upload your government-issued ID for verification. This helps us ensure account security.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
              {/* Document Type Selection */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Document Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { 
                      value: 'passport', 
                      label: 'Passport', 
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )
                    },
                    { 
                      value: 'driving-license', 
                      label: 'Driving License', 
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )
                    },
                    { 
                      value: 'national-id', 
                      label: 'National ID', 
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                      )
                    }
                  ].map((doc) => (
                    <button
                      key={doc.value}
                      type="button"
                      onClick={() => setSelectedDocument(doc.value)}
                      className={`p-4 border-2 rounded-lg text-center transition-all duration-200 ${
                        selectedDocument === doc.value
                          ? 'border-red-500 bg-red-500/10 text-red-500'
                          : 'border-gray-300 hover:border-gray-400 text-gray-700'
                      }`}
                    >
                      <div className="flex justify-center mb-2 text-gray-600">{doc.icon}</div>
                      <div className="text-sm font-medium">{doc.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Front Image Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Front of Document
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  {frontImage ? (
                    <div className="space-y-2">
                      <div className="text-green-500 text-sm">✓ File uploaded: {frontImage.name}</div>
                      <button
                        type="button"
                        onClick={() => removeFile('front')}
                        className="text-red-500 hover:text-red-600 text-sm"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'front')}
                        className="hidden"
                        id="front-upload"
                      />
                      <label
                        htmlFor="front-upload"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-gray-300">Click to upload front image</span>
                        <span className="text-xs text-gray-400">PNG, JPG up to 10MB</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Back Image Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Back of Document
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  {backImage ? (
                    <div className="space-y-2">
                      <div className="text-green-500 text-sm">✓ File uploaded: {backImage.name}</div>
                      <button
                        type="button"
                        onClick={() => removeFile('back')}
                        className="text-red-500 hover:text-red-600 text-sm"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'back')}
                        className="hidden"
                        id="back-upload"
                      />
                      <label
                        htmlFor="back-upload"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-gray-300">Click to upload back image</span>
                        <span className="text-xs text-gray-400">PNG, JPG up to 10MB</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>


              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !selectedDocument || !frontImage || !backImage}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:scale-100 disabled:shadow-none flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Upload Documents</span>
                  </>
                )}
              </button>

              {/* Back to Personal Details */}
              <div className="text-center">
                <Link 
                  href="/register/personal-details" 
                  className="text-sm text-gray-600 hover:text-red-500 transition-colors flex items-center justify-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Back to Personal Details</span>
                </Link>
              </div>
            </form>
          </div>

          {/* Progress Indicator */}
          <div className="mt-8 text-center">
            <div className="flex justify-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
              <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
            </div>
            <p className="text-xs text-gray-600">Step 3 of 5</p>
          </div>
        </div>
      </main>
    </div>
  );
}
