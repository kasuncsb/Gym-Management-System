import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Simulator',
    description: 'Hardware and payment simulator for PowerWorld access control.',
};

export default function SimulateLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-app text-white pt-24 md:pt-28">
            <div className="max-w-5xl mx-auto px-4 pb-10 md:pb-12">{children}</div>
        </div>
    );
}
