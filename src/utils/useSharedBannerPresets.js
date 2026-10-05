import { useState, useRef, useEffect, useCallback } from 'react';
import { loadBannerPresets, saveBannerPresets, normalizePresets, PRESETS_API } from './bannerPresets';

const SAVE_DELAY_MS = 700;

const fetchRemote = async () => {
    const res = await fetch(PRESETS_API, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
};

// Banner presets shared by all users via the Worker. The localStorage copy is only a cache for fast startup.
// status: 'loading' | 'synced' | 'saving' | 'conflict' | 'error'
export default function useSharedBannerPresets() {
    const [presets, setPresets] = useState(loadBannerPresets);
    const [status, setStatus] = useState('loading');
    const versionRef = useRef(null); // server version our copy is based on; null until a fetch succeeds
    const pendingRef = useRef(null); // latest list not yet saved
    const inFlightRef = useRef(false);
    const timerRef = useRef(null);

    useEffect(() => {
        saveBannerPresets(presets);
    }, [presets]);

    const applyRemote = useCallback((data) => {
        versionRef.current = data.version;
        if (data.presets) setPresets(normalizePresets(data.presets));
    }, []);

    const refresh = useCallback(async () => {
        if (pendingRef.current || inFlightRef.current) return;
        try {
            const data = await fetchRemote();
            if (pendingRef.current || inFlightRef.current) return; // user started editing meanwhile
            applyRemote(data);
            setStatus('synced');
        } catch {
            setStatus('error');
        }
    }, [applyRemote]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const flush = useCallback(async () => {
        const list = pendingRef.current;
        if (!list || inFlightRef.current) return; // an in-flight save re-flushes when it finishes
        inFlightRef.current = true;
        setStatus('saving');
        try {
            if (versionRef.current === null) versionRef.current = (await fetchRemote()).version;
            const res = await fetch(PRESETS_API, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ baseVersion: versionRef.current, presets: list }),
            });
            const data = await res.json();
            if (res.status === 409) {
                // Someone else saved first: drop our unsaved edits and show theirs
                pendingRef.current = null;
                applyRemote(data);
                setStatus('conflict');
            } else if (!res.ok) {
                throw new Error(data.error || `HTTP ${res.status}`);
            } else {
                versionRef.current = data.version;
                if (pendingRef.current === list) {
                    pendingRef.current = null;
                    setStatus('synced');
                }
            }
        } catch {
            setStatus('error');
            return;
        } finally {
            inFlightRef.current = false;
        }
        if (pendingRef.current && pendingRef.current !== list) flush(); // more edits arrived during the request
    }, [applyRemote]);

    const updatePresets = useCallback((next) => {
        setPresets(next);
        pendingRef.current = next;
        setStatus('saving');
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(flush, SAVE_DELAY_MS);
    }, [flush]);

    const retry = useCallback(() => {
        if (pendingRef.current) flush();
        else refresh();
    }, [flush, refresh]);

    return { presets, updatePresets, status, refresh, retry };
}
