import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Simulator',
    description: 'Hardware and payment simulator for PowerWorld access control.',
};

export default function SimulateLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-app text-white">
            <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-[#1e1e1e]/95 backdrop-blur-md">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center">
                    <Link href="/" className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity">
                        <Image src="/logo.svg" alt="PowerWorld" width={140} height={40} className="h-8 w-auto object-contain" />
                        <span className="font-semibold text-sm tracking-tight text-white hidden sm:inline">PowerWorld</span>
                    </Link>
                </div>
            </header>
            <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">{children}</div>
        </div>
    );
}
