/**
 * Custom React Hook for managing data with auto-refresh
 * Handles fetching, caching, and real-time updates from the database
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to fetch and manage data with auto-refresh
 * @param {Function} fetchFunction - Async function that fetches data
 * @param {number} refreshInterval - Interval in ms to auto-refresh (0 = no auto-refresh)
 * @returns {Object} { data, loading, error, refetch, refresh }
 */
export const useDataFetch = (fetchFunction, refreshInterval = 10000) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch data from API
    const refetch = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await fetchFunction();
            setData(result);
        } catch (err) {
            setError(err.message || "Failed to fetch data");
            console.error("Data fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [fetchFunction]);

    // Initial fetch on mount
    useEffect(() => {
        refetch();
    }, [refetch]);

    // Auto-refresh interval
    useEffect(() => {
        if (refreshInterval <= 0) return;

        const interval = setInterval(() => {
            refetch();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [refetch, refreshInterval]);

    // Refresh on window focus (user switches back to tab)
    useEffect(() => {
        const handleFocus = () => {
            refetch();
        };

        window.addEventListener("focus", handleFocus);
        return () => window.removeEventListener("focus", handleFocus);
    }, [refetch]);

    return {
        data,
        loading,
        error,
        refetch,
        refresh: refetch // Alias for clarity
    };
};

export default useDataFetch;
