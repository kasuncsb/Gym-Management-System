'use client';

import { useEffect, useState } from 'react';

/**
 * Reveals `source` progressively for a lightweight “streaming” effect after the full string is known.
 * Resets when `source` changes or becomes null.
 */
export function useStreamedText(source: string | null): string {
    const [out, setOut] = useState('');

    useEffect(() => {
        if (!source) {
            setOut('');
            return;
        }
        setOut('');
        let i = 0;
        const step = 6;
        const id = window.setInterval(() => {
            i = Math.min(i + step, source.length);
            setOut(source.slice(0, i));
            if (i >= source.length) window.clearInterval(id);
        }, 14);
        return () => window.clearInterval(id);
    }, [source]);

    return out;
}
