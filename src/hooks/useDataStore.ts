import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { JasaPosting, JasaCari } from '../types';

// Storage keys - Market (approved only)
const MARKET_DATA_KEY = 'thisizstore_market_data';
const MARKET_DATA_EXPIRY_KEY = 'thisizstore_market_data_expiry';

// Storage keys - Admin (all data)
const ADMIN_DATA_KEY = 'thisizstore_admin_data';
const ADMIN_DATA_EXPIRY_KEY = 'thisizstore_admin_data_expiry';

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface MarketData {
    postings: JasaPosting[];
    caris: JasaCari[];
    lastFetch: number;
}

interface DataStoreState {
    postings: JasaPosting[];
    caris: JasaCari[];
    loading: boolean;
    lastFetch: number | null;
}

// Load from localStorage cache (Market - approved only)
const loadFromCache = (): MarketData | null => {
    try {
        const expiry = localStorage.getItem(MARKET_DATA_EXPIRY_KEY);
        if (expiry && Date.now() > parseInt(expiry, 10)) {
            localStorage.removeItem(MARKET_DATA_KEY);
            localStorage.removeItem(MARKET_DATA_EXPIRY_KEY);
            return null;
        }
        const cached = localStorage.getItem(MARKET_DATA_KEY);
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
};

// Load from localStorage cache (Admin - all data)
const loadAdminFromCache = (): MarketData | null => {
    try {
        const expiry = localStorage.getItem(ADMIN_DATA_EXPIRY_KEY);
        if (expiry && Date.now() > parseInt(expiry, 10)) {
            localStorage.removeItem(ADMIN_DATA_KEY);
            localStorage.removeItem(ADMIN_DATA_EXPIRY_KEY);
            return null;
        }
        const cached = localStorage.getItem(ADMIN_DATA_KEY);
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
};

// Save to localStorage cache (Admin - all data)
const saveAdminToCache = (postings: JasaPosting[], caris: JasaCari[]) => {
    try {
        const data: MarketData = {
            postings,
            caris,
            lastFetch: Date.now(),
        };
        localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(data));
        localStorage.setItem(ADMIN_DATA_EXPIRY_KEY, String(Date.now() + CACHE_DURATION_MS));
    } catch (e) {
        console.warn('[useDataStore] Failed to cache admin data:', e);
    }
};

// Initialize global state from cache IMMEDIATELY so data is available on page load
const initializeFromCache = (): DataStoreState => {
    const cached = loadFromCache();
    if (cached) {
        console.log('[useDataStore] Initializing from cache:', cached.postings.length, 'postings,', cached.caris.length, 'caris');
        return {
            postings: cached.postings,
            caris: cached.caris,
            loading: false,
            lastFetch: cached.lastFetch,
        };
    }
    return {
        postings: [],
        caris: [],
        loading: false,
        lastFetch: null,
    };
};

// Initialize admin state from cache
const initializeAdminFromCache = (): DataStoreState => {
    const cached = loadAdminFromCache();
    if (cached) {
        console.log('[useDataStore] Initializing admin from cache:', cached.postings.length, 'postings,', cached.caris.length, 'caris');
        return {
            postings: cached.postings,
            caris: cached.caris,
            loading: false,
            lastFetch: cached.lastFetch,
        };
    }
    return {
        postings: [],
        caris: [],
        loading: false,
        lastFetch: null,
    };
};

// Global state (shared across all hook instances) - INITIALIZED FROM CACHE
let globalState: DataStoreState = initializeFromCache();
let adminState: DataStoreState = initializeAdminFromCache();
let subscribers: Set<() => void> = new Set();
let adminSubscribers: Set<() => void> = new Set();
let prefetchPromise: Promise<void> | null = null;
let adminPrefetchPromise: Promise<void> | null = null;

const notifySubscribers = () => {
    subscribers.forEach(cb => cb());
};

const notifyAdminSubscribers = () => {
    adminSubscribers.forEach(cb => cb());
};

// Invalidate Market cache - call this after admin actions
export const invalidateMarketCache = () => {
    try {
        localStorage.removeItem(MARKET_DATA_KEY);
        localStorage.removeItem(MARKET_DATA_EXPIRY_KEY);
        // Reset global state's lastFetch so Market knows to refetch
        globalState.lastFetch = null;
        console.log('[useDataStore] Market cache invalidated');
    } catch (e) {
        console.warn('[useDataStore] Failed to invalidate market cache:', e);
    }
};

// Refresh Market data - call this from Admin after approve/reject
export const refreshMarketData = async (): Promise<void> => {
    invalidateMarketCache();
    globalState.loading = true;
    notifySubscribers();

    try {
        const { postings, caris } = await fetchDataFromServer(true);
        globalState = {
            postings,
            caris,
            loading: false,
            lastFetch: Date.now(),
        };
        saveToCache(postings, caris);
        console.log('[useDataStore] Market data refreshed after admin action');
    } catch (error) {
        console.error('[useDataStore] Market refresh error:', error);
        globalState.loading = false;
    }
    notifySubscribers();
};



// Save to localStorage cache
const saveToCache = (postings: JasaPosting[], caris: JasaCari[]) => {
    try {
        const data: MarketData = {
            postings,
            caris,
            lastFetch: Date.now(),
        };
        localStorage.setItem(MARKET_DATA_KEY, JSON.stringify(data));
        localStorage.setItem(MARKET_DATA_EXPIRY_KEY, String(Date.now() + CACHE_DURATION_MS));
    } catch (e) {
        console.warn('[useDataStore] Failed to cache data:', e);
    }
};

// Fetch data from Supabase
const fetchDataFromServer = async (approvedOnly: boolean = true): Promise<{ postings: JasaPosting[]; caris: JasaCari[] }> => {
    const basePostingQuery = supabase
        .from('jasa_posting')
        .select('*, game:games(*)')
        .order('created_at', { ascending: false });

    const baseCariQuery = supabase
        .from('jasa_cari')
        .select('*, game:games(*)')
        .order('created_at', { ascending: false });

    const postingQuery = approvedOnly ? basePostingQuery.eq('is_approved', true) : basePostingQuery;
    const cariQuery = approvedOnly ? baseCariQuery.eq('is_approved', true) : baseCariQuery;

    const [postingRes, cariRes] = await Promise.all([postingQuery, cariQuery]);

    if (postingRes.error) throw postingRes.error;
    if (cariRes.error) throw cariRes.error;

    return {
        postings: postingRes.data || [],
        caris: cariRes.data || [],
    };
};

// Prefetch market data (approved only)
export const prefetchMarketData = async (): Promise<void> => {
    // Avoid duplicate fetches
    if (prefetchPromise) return prefetchPromise;
    if (globalState.loading) return;

    // Check if we have fresh cached data
    const cached = loadFromCache();
    if (cached && Date.now() - cached.lastFetch < CACHE_DURATION_MS) {
        globalState = {
            ...globalState,
            postings: cached.postings,
            caris: cached.caris,
            lastFetch: cached.lastFetch,
        };
        notifySubscribers();
        return;
    }

    // Start fetching
    globalState.loading = true;
    notifySubscribers();

    prefetchPromise = (async () => {
        try {
            console.log('[useDataStore] Prefetching market data...');
            const { postings, caris } = await fetchDataFromServer(true);

            globalState = {
                postings,
                caris,
                loading: false,
                lastFetch: Date.now(),
            };
            saveToCache(postings, caris);
            console.log('[useDataStore] Prefetch complete:', postings.length, 'postings,', caris.length, 'caris');
        } catch (error) {
            console.error('[useDataStore] Prefetch error:', error);
            globalState.loading = false;
        } finally {
            prefetchPromise = null;
            notifySubscribers();
        }
    })();

    return prefetchPromise;
};

// Hook for consuming prefetched data
export function useDataStore() {
    const [, forceUpdate] = useState({});

    useEffect(() => {
        const update = () => forceUpdate({});
        subscribers.add(update);
        return () => {
            subscribers.delete(update);
        };
    }, []);

    const refresh = useCallback(async (approvedOnly: boolean = true) => {
        globalState.loading = true;
        notifySubscribers();

        try {
            const { postings, caris } = await fetchDataFromServer(approvedOnly);
            globalState = {
                postings,
                caris,
                loading: false,
                lastFetch: Date.now(),
            };
            if (approvedOnly) {
                saveToCache(postings, caris);
            }
        } catch (error) {
            console.error('[useDataStore] Refresh error:', error);
            globalState.loading = false;
        }
        notifySubscribers();
    }, []);

    return {
        postings: globalState.postings,
        caris: globalState.caris,
        loading: globalState.loading,
        lastFetch: globalState.lastFetch,
        refresh,
        hasPrefetchedData: globalState.lastFetch !== null,
    };
}

// Prefetch admin data (ALL data, not just approved)
export const prefetchAdminData = async (): Promise<void> => {
    // Avoid duplicate fetches
    if (adminPrefetchPromise) return adminPrefetchPromise;
    if (adminState.loading) return;

    // Check if we have fresh cached data
    const cached = loadAdminFromCache();
    if (cached && Date.now() - cached.lastFetch < CACHE_DURATION_MS) {
        adminState = {
            ...adminState,
            postings: cached.postings,
            caris: cached.caris,
            lastFetch: cached.lastFetch,
        };
        notifyAdminSubscribers();
        return;
    }

    // Start fetching
    adminState.loading = true;
    notifyAdminSubscribers();

    adminPrefetchPromise = (async () => {
        try {
            console.log('[useDataStore] Prefetching admin data...');
            const { postings, caris } = await fetchDataFromServer(false); // false = all data

            adminState = {
                postings,
                caris,
                loading: false,
                lastFetch: Date.now(),
            };
            saveAdminToCache(postings, caris);
            console.log('[useDataStore] Admin prefetch complete:', postings.length, 'postings,', caris.length, 'caris');
        } catch (error) {
            console.error('[useDataStore] Admin prefetch error:', error);
            adminState.loading = false;
        } finally {
            adminPrefetchPromise = null;
            notifyAdminSubscribers();
        }
    })();

    return adminPrefetchPromise;
};

// Hook for consuming admin data
export function useAdminDataStore() {
    const [, forceUpdate] = useState({});

    useEffect(() => {
        const update = () => forceUpdate({});
        adminSubscribers.add(update);
        return () => {
            adminSubscribers.delete(update);
        };
    }, []);

    const refresh = useCallback(async () => {
        adminState.loading = true;
        notifyAdminSubscribers();

        try {
            const { postings, caris } = await fetchDataFromServer(false);
            adminState = {
                postings,
                caris,
                loading: false,
                lastFetch: Date.now(),
            };
            saveAdminToCache(postings, caris);
        } catch (error) {
            console.error('[useDataStore] Admin refresh error:', error);
            adminState.loading = false;
        }
        notifyAdminSubscribers();
    }, []);

    return {
        postings: adminState.postings,
        caris: adminState.caris,
        loading: adminState.loading,
        lastFetch: adminState.lastFetch,
        refresh,
        hasPrefetchedData: adminState.lastFetch !== null,
    };
}

export default useDataStore;

