"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getErrorMessage } from "@/lib/api";

/* ── useApi: Simple data-fetching hook with loading / error / retry ── */

interface UseApiOptions<T> {
    /** Function returning the axios promise */
    fetcher: () => Promise<{ data: { data: T } }>;
    /** Whether to fetch immediately on mount */
    immediate?: boolean;
    /** Default data before first fetch */
    defaultData?: T;
    /** Transform the raw API response data */
    transform?: (data: any) => T;
    /** Dependency array to trigger refetch */
    deps?: any[];
}

interface UseApiReturn<T> {
    data: T;
    loading: boolean;
    error: string;
    refetch: () => Promise<void>;
    setData: React.Dispatch<React.SetStateAction<T>>;
}

export function useApi<T>({
    fetcher,
    immediate = true,
    defaultData,
    transform,
    deps = [],
}: UseApiOptions<T>): UseApiReturn<T> {
    const [data, setData] = useState<T>(defaultData as T);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState("");
    const mountedRef = useRef(true);

    const refetch = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetcher();
            if (!mountedRef.current) return;
            const result = transform ? transform(res.data.data) : res.data.data;
            setData(result);
        } catch (err: any) {
            if (!mountedRef.current) return;
            setError(getErrorMessage(err));
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        if (immediate) refetch();
        return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return { data, loading, error, refetch, setData };
}

/* ── useMutation: For POST/PUT/DELETE operations with toast integration ── */

interface UseMutationOptions<TInput, TResult> {
    mutationFn: (input: TInput) => Promise<{ data: { data: TResult } }>;
    onSuccess?: (data: TResult) => void;
    onError?: (error: string) => void;
}

interface UseMutationReturn<TInput, TResult> {
    mutate: (input: TInput) => Promise<TResult | undefined>;
    loading: boolean;
    error: string;
    reset: () => void;
}

export function useMutation<TInput = void, TResult = any>({
    mutationFn,
    onSuccess,
    onError,
}: UseMutationOptions<TInput, TResult>): UseMutationReturn<TInput, TResult> {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const mutate = useCallback(
        async (input: TInput): Promise<TResult | undefined> => {
            setLoading(true);
            setError("");
            try {
                const res = await mutationFn(input);
                const result = res.data.data;
                onSuccess?.(result);
                return result;
            } catch (err: any) {
                const msg = getErrorMessage(err);
                setError(msg);
                onError?.(msg);
                return undefined;
            } finally {
                setLoading(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const reset = useCallback(() => setError(""), []);

    return { mutate, loading, error, reset };
}

/* ── useDebounce ────────────────────────────────────── */

export function useDebounce<T>(value: T, delay = 300): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}
