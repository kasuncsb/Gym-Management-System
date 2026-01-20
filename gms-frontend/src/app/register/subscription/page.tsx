'use client';

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsLoading(false);
    // Navigate to dashboard
    router.push('/register/dashboard');
  };

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 'LKR 2,500',
      period: 'per month',
      features: [
        'Access to all gym equipment',
        'Locker facilities',
        'Basic fitness assessment',
        'Group classes (limited)',
        '24/7 gym access'
      ],
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 'LKR 4,500',
      period: 'per month',
      features: [
        'Everything in Basic',
        'Personal trainer sessions (2/month)',
        'Nutrition consultation',
        'All group classes unlimited',
        'Sauna & steam room access',
        'Guest passes (2/month)',
        'Priority booking'
      ],
      popular: true
    },
    {
      id: 'elite',
      name: 'Elite',
      price: 'LKR 7,500',
      period: 'per month',
      features: [
        'Everything in Premium',
        'Unlimited personal training',
        'Custom meal plans',
        'Body composition analysis',
        'Unlimited guest passes',
        'VIP lounge access',
        'Priority equipment booking',
        'Free supplements (monthly)'
      ],
      popular: false
    }
  ];

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
              href="/register/identity-verification" 
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
        <div className="w-full max-w-6xl">
          {/* Subscription Card */}
          <div className="bg-white shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-8 py-10 text-center border-b border-gray-200">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Choose Your Plan
              </h1>
              <p className="text-gray-600">
                Select the membership plan that best fits your fitness goals.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-8">
              {/* Subscription Plans */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedPlan === plan.id
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-gray-300 hover:border-gray-400'
                    } ${plan.popular ? 'ring-2 ring-red-500/50' : ''}`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <div className="mb-2">
                        <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                        <span className="text-gray-600 ml-1">{plan.period}</span>
                      </div>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
                        selectedPlan === plan.id
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Payment Method */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { 
                      name: 'Credit Card', 
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      )
                    },
                    { 
                      name: 'Bank Transfer', 
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      )
                    },
                    { 
                      name: 'Mobile Payment', 
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      )
                    }
                  ].map((method) => (
                    <button
                      key={method.name}
                      type="button"
                      className="p-4 border border-gray-300 rounded-lg text-center hover:border-red-500 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex justify-center mb-2 text-gray-600">{method.icon}</div>
                      <div className="text-sm text-gray-700">{method.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="mb-8">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="terms"
                    className="h-4 w-4 text-red-500 focus:ring-red-500 border-gray-300 bg-white mt-1"
                  />
                  <label htmlFor="terms" className="ml-3 text-sm text-gray-700">
                    I agree to the{' '}
                    <Link href="/terms" className="text-red-400 hover:text-red-300">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-red-400 hover:text-red-300">
                      Privacy Policy
                    </Link>
                    . I understand that this is a recurring subscription and will be charged monthly.
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !selectedPlan}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:scale-100 disabled:shadow-none flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>Complete Registration</span>
                  </>
                )}
              </button>

              {/* Back to Identity Verification */}
              <div className="text-center mt-6">
                <Link 
                  href="/register/identity-verification" 
                  className="text-sm text-gray-600 hover:text-red-500 transition-colors flex items-center justify-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Back to Identity Verification</span>
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
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
            </div>
            <p className="text-xs text-gray-600">Step 4 of 5</p>
          </div>
        </div>
      </main>
    </div>
  );
}
