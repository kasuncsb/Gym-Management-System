"use client";

import Link from "next/link";
import Image from "next/image";
import { Home, ArrowLeft, Dumbbell } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden selection:bg-red-600/30">
            {/* Background Effects */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-20 left-[10%] w-[400px] h-[400px] bg-red-700/20 rounded-full blur-[128px]" />
                <div className="absolute bottom-20 right-[10%] w-[300px] h-[300px] bg-red-600/20 rounded-full blur-[100px]" />
            </div>



            {/* 404 Content */}
            <div className="text-center px-6">
                <div className="relative mb-8">
                    <h1 className="text-[150px] md:text-[200px] font-black text-transparent bg-clip-text bg-gradient-to-b from-zinc-700 to-zinc-900 leading-none select-none">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-700 to-red-600 flex items-center justify-center shadow-2xl shadow-red-600/30">
                            <Dumbbell className="text-white" size={40} />
                        </div>
                    </div>
                </div>

                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Page Not Found
                </h2>
                <p className="text-zinc-400 text-lg max-w-md mx-auto mb-8">
                    Looks like this page took a rest day. Let's get you back on track!
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/"
                        className="px-8 py-3.5 bg-gradient-to-r from-red-700 to-red-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-red-500 transition-all shadow-lg shadow-red-600/25 flex items-center justify-center gap-2"
                    >
                        <Home size={18} />
                        Back to Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="px-8 py-3.5 bg-zinc-900 border border-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </button>
                </div>
            </div>

            {/* Footer */}
            <p className="absolute bottom-8 text-zinc-600 text-sm">
                © {new Date().getFullYear()} PowerWorld Gyms. All rights reserved.
            </p>
        </div>
    );
}
