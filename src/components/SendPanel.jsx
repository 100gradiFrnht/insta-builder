import { useState, useRef, useEffect } from 'react';
import { MAX_SCHEDULE_DAYS, imageRefToBlob, uploadImage, sendPosts, fetchPostStatuses } from '../utils/bufferClient';
import { PLATFORMS as SERVICES, PlatformToggles, platformLabel } from './platforms';

const PASSWORD_KEY = 'escdiscord.postPassword';
const POLL_INTERVAL_MS = 4000;
const POLL_MAX_TRIES = 45;

const readPassword = () => {
    try {
        return localStorage.getItem(PASSWORD_KEY) || '';
    } catch {
        return '';
    }
};

const rememberPassword = (password) => {
    try {
        localStorage.setItem(PASSWORD_KEY, password);
    } catch {
        // Not critical: the password just has to be typed again next time
    }
};

// crypto.randomUUID only exists on HTTPS/localhost; getRandomValues also works over plain http (e.g. a phone on the LAN)
const newSendId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');

// datetime-local value for a Date, in the browser's timezone
const toLocalInput = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

function ServiceStatus({ result, status, scheduled }) {
    if (!result) return <span className="text-gray-500">Not sent</span>;
    if (!result.ok) return <span className="text-red-300">Failed: {result.error}</span>;
    const live = status?.status ?? result.status;
    if (live === 'error') {
        // The post exists in Buffer, so it's retried there rather than created again
        return <span className="text-red-300">Buffer couldn’t publish: {status?.error || result.error || 'checking details…'} Use “Retry Now” in Buffer once fixed.</span>;
    }
    if (live === 'sent') {
        return (
            <span className="text-green-300">
                Posted{status?.link && <> · <a href={status.link} target="_blank" rel="noreferrer" className="underline">view</a></>}
            </span>
        );
    }
    if (scheduled) return <span className="text-green-300">Scheduled for {new Date(result.dueAt).toLocaleString()}</span>;
    return <span className="text-blue-300">Publishing…</span>;
}

// Uploads images, sends the posts to Buffer and tracks each network's result. Retrying only resends failed
// networks; the Worker also refuses to post a network twice for the same sendId.
export default function SendPanel({ posts, caption, carouselBlobs, selected, onToggle, blockingIssues, onStateChange }) {
    const [password, setPassword] = useState(readPassword);
    const [when, setWhen] = useState('now');
    const [scheduleAt, setScheduleAt] = useState(() => toLocalInput(new Date(Date.now() + 60 * 60 * 1000)));
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState('');
    const [error, setError] = useState('');
    const [results, setResults] = useState({});
    const [statuses, setStatuses] = useState({});
    const [sentMode, setSentMode] = useState(null);
    const sendIdRef = useRef(null);
    if (!sendIdRef.current) sendIdRef.current = newSendId();
    const uploadedRef = useRef(new Map()); // image key → hosted URL, reused on retry
    const pollRef = useRef(null);

    const anySucceeded = Object.values(results).some(r => r.ok);
    const failed = SERVICES.filter(s => results[s.id] && !results[s.id].ok).map(s => s.id);
    const attempted = SERVICES.filter(s => results[s.id]);
    const allSucceeded = attempted.length > 0 && attempted.every(s => results[s.id].ok);
    const publishFailed = SERVICES.some(s => (statuses[s.id]?.status ?? results[s.id]?.status) === 'error');

    useEffect(() => {
        onStateChange({ busy, locked: anySucceeded });
    }, [busy, anySucceeded, onStateChange]);

    useEffect(() => () => clearTimeout(pollRef.current), []);

    const scheduleDate = new Date(scheduleAt);
    const scheduleError = when !== 'schedule'
        ? ''
        : isNaN(scheduleDate) ? 'Pick a date and time'
            : scheduleDate.getTime() < Date.now() + 60 * 1000 ? 'The time must be at least a minute from now'
                : scheduleDate.getTime() > Date.now() + MAX_SCHEDULE_DAYS * 86400e3 ? `At most ${MAX_SCHEDULE_DAYS} days ahead`
                    : '';

    const pollStatuses = (current, tries = 0) => {
        const pending = Object.entries(current).filter(([, r]) => r.ok && r.status !== 'sent');
        if (!pending.length || tries >= POLL_MAX_TRIES) return;
        pollRef.current = setTimeout(async () => {
            try {
                const list = await fetchPostStatuses(pending.map(([, r]) => r.postId), password);
                const byId = Object.fromEntries(list.map(p => [p.id, p]));
                const next = {};
                pending.forEach(([service, r]) => { if (byId[r.postId]) next[service] = byId[r.postId]; });
                setStatuses(prev => ({ ...prev, ...next }));
                const stillPending = Object.fromEntries(pending.filter(([service]) => !['sent', 'error'].includes(next[service]?.status)));
                pollStatuses(stillPending, tries + 1);
            } catch {
                pollStatuses(Object.fromEntries(pending), tries + 1);
            }
        }, POLL_INTERVAL_MS);
    };

    const upload = async (key, getBlob) => {
        if (!uploadedRef.current.has(key)) uploadedRef.current.set(key, await uploadImage(await getBlob(), password));
        return uploadedRef.current.get(key);
    };

    const send = async (services) => {
        const mode = sentMode ?? when; // a retry keeps the original timing
        const dueAt = mode === 'schedule' ? scheduleDate.toISOString() : null;
        const names = services.map(platformLabel).join(', ');
        const question = mode === 'schedule'
            ? `Schedule on ${names} for ${scheduleDate.toLocaleString()}?`
            : `Post to ${names} now? This publishes immediately.`;
        if (!window.confirm(question)) return;

        setBusy(true);
        setError('');
        try {
            let thread = [];
            if (services.some(s => s !== 'instagram')) {
                const refs = posts.flatMap(p => p.images);
                let done = 0;
                for (const ref of refs) {
                    setProgress(`Uploading thread images (${++done}/${refs.length})…`);
                    await upload(ref.key, () => imageRefToBlob(ref));
                }
                thread = posts.map(p => ({ text: p.text, images: p.images.map(ref => uploadedRef.current.get(ref.key)) }));
            }
            let instagram;
            if (services.includes('instagram')) {
                const images = [];
                for (let i = 0; i < carouselBlobs.length; i++) {
                    setProgress(`Uploading Instagram images (${i + 1}/${carouselBlobs.length})…`);
                    images.push(await upload(`ig-${i}`, async () => carouselBlobs[i]));
                }
                instagram = { caption, images };
            }
            rememberPassword(password);

            setProgress('Sending to Buffer…');
            const { results: fresh } = await sendPosts({ sendId: sendIdRef.current, services, dueAt, thread, instagram }, password);
            const merged = { ...results, ...fresh };
            setResults(merged);
            setSentMode(mode);
            if (mode === 'now') pollStatuses(fresh);
        } catch (err) {
            setError(err.status === 401 ? 'Wrong posting password.' : err.message);
        } finally {
            setBusy(false);
            setProgress('');
        }
    };

    const needsCarousel = selected.includes('instagram');
    const canSend = !busy && !anySucceeded && selected.length > 0 && password && !blockingIssues && !scheduleError
        && (!needsCarousel || carouselBlobs);
    const targetNames = selected.length === SERVICES.length ? 'all 3' : selected.map(platformLabel).join(' & ');

    return (
        <div className="space-y-2">
            {!anySucceeded && (
                <div className="flex flex-wrap items-end gap-2">
                    <div>
                        <span className="text-xs text-gray-300 mb-1 block">Post to</span>
                        <PlatformToggles selected={selected} onToggle={onToggle} disabled={busy} />
                    </div>
                    <div className="flex-1 min-w-[10rem]">
                        <label className="text-xs text-gray-300 mb-1 block">Posting password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            className="w-full p-2 border border-gray-600 rounded text-xs md:text-sm bg-gray-700"
                        />
                    </div>
                    <div className="flex rounded overflow-hidden border border-gray-600 text-xs md:text-sm">
                        {[['now', 'Post now'], ['schedule', 'Schedule']].map(([id, label]) => (
                            <button
                                key={id}
                                onClick={() => setWhen(id)}
                                className={`px-3 py-2 ${when === id ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {when === 'schedule' && (
                        <div>
                            <label className="text-xs text-gray-300 mb-1 block">
                                Time ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                            </label>
                            <input
                                type="datetime-local"
                                value={scheduleAt}
                                min={toLocalInput(new Date())}
                                max={toLocalInput(new Date(Date.now() + MAX_SCHEDULE_DAYS * 86400e3))}
                                onChange={(e) => setScheduleAt(e.target.value)}
                                className="p-2 border border-gray-600 rounded text-xs md:text-sm bg-gray-700 text-gray-200 [color-scheme:dark]"
                            />
                        </div>
                    )}
                    <button
                        onClick={() => send(selected)}
                        disabled={!canSend}
                        className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {busy ? 'Working…' : !selected.length ? 'Pick a platform' : `${when === 'schedule' ? 'Schedule' : 'Post now'} on ${targetNames}`}
                    </button>
                </div>
            )}
            {scheduleError && !anySucceeded && <p className="text-xs text-amber-300">{scheduleError}</p>}
            {progress && <p className="text-xs text-blue-300">{progress}</p>}
            {error && <p className="text-xs text-red-300">{error}</p>}

            {Object.keys(results).length > 0 && (
                <ul className="text-xs space-y-1">
                    {attempted.map(s => (
                        <li key={s.id} className="flex gap-2">
                            <span className="w-16 text-gray-400 flex-shrink-0">{s.label}</span>
                            <ServiceStatus result={results[s.id]} status={statuses[s.id]} scheduled={sentMode === 'schedule'} />
                        </li>
                    ))}
                </ul>
            )}
            {failed.length > 0 && (
                <button
                    onClick={() => send(failed)}
                    disabled={busy}
                    className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-xs text-gray-200 disabled:opacity-40"
                >
                    Retry {failed.map(platformLabel).join(', ')}
                </button>
            )}
            {allSucceeded && !publishFailed && <p className="text-xs text-gray-400">Done. Close the preview to start a new post.</p>}
        </div>
    );
}
