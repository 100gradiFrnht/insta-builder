import { useState, useEffect, useRef, useCallback } from 'react';
import SendPanel from './SendPanel';
import { PLATFORMS } from './platforms';
import {
    LIMITS, MAX_IMAGES_PER_POST, MAX_CAROUSEL_SLIDES,
    buildThreadPosts, buildCaption, collectImageLibrary,
    countX, countBluesky, countInstagram,
} from '../utils/socialPosts';

const inputClass = 'w-full p-2 border border-gray-600 rounded text-xs md:text-sm';
const smallButton = 'px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed';

function Counter({ label, count, limit }) {
    const over = count > limit;
    return (
        <span className={`text-[11px] tabular-nums ${over ? 'text-red-300 font-semibold' : 'text-gray-400'}`}>
            {label} {count}/{limit}
        </span>
    );
}

function PlatformBadges({ ids, isOn }) {
    return PLATFORMS.filter(p => ids.includes(p.id)).map(({ id, label, Icon }) => (
        <Icon key={id} className={`w-4 h-4 ${isOn(id) ? 'text-gray-100' : 'text-gray-600'}`} aria-label={label} />
    ));
}

function CopyButton({ text, label = 'Copy' }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={async () => {
                try {
                    await navigator.clipboard.writeText(text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                } catch {
                    // Clipboard blocked; nothing useful to do
                }
            }}
            className={smallButton}
        >
            {copied ? 'Copied' : label}
        </button>
    );
}

export default function PostPreview({ slides, presets, aspectRatio, moreLink, onMoreLinkChange, renderSlideImages, onClose: closePreview }) {
    const presetEmoji = (slide) => presets.find(p => p.id === slide.selectedBannerPreset)?.match || '';
    const [emojis, setEmojis] = useState(() => slides.map(presetEmoji));
    // Image assignment per thread post, fixed at open: the post structure only depends on the slides
    const [postImages, setPostImages] = useState(() => buildThreadPosts(slides, [], '').map(p => p.images));
    const [uploads, setUploads] = useState([]);
    const [pickerFor, setPickerFor] = useState(null);
    const [carousel, setCarousel] = useState({ status: 'loading', urls: [] });
    const [mobileTab, setMobileTab] = useState('thread');
    const [sendState, setSendState] = useState({ busy: false, locked: false });
    // Platforms to post to; every preview starts with all of them so a skipped one is never carried over
    const [selected, setSelected] = useState(() => PLATFORMS.map(p => p.id));
    const toggleService = (id) => setSelected(prev => (prev.includes(id) ? prev.filter(s => s !== id) : PLATFORMS.map(p => p.id).filter(s => s === id || prev.includes(s))));
    const isOn = (id) => selected.includes(id);
    const threadOn = isOn('twitter') || isOn('bluesky');
    const fileInputRef = useRef(null);
    const locked = sendState.locked || sendState.busy; // content can't change once anything has been sent

    const onClose = useCallback(() => {
        if (sendState.busy && !window.confirm('Posts are still being sent. Close anyway? You won’t see the results.')) return;
        closePreview();
    }, [sendState.busy, closePreview]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    useEffect(() => {
        let urls = [];
        let cancelled = false;
        // Deferred so rendering (which swaps slides in the editor) never runs twice in parallel or inside React's commit
        const timer = setTimeout(() => {
            renderSlideImages()
                .then(blobs => {
                    urls = blobs.map(b => URL.createObjectURL(b));
                    if (cancelled) urls.forEach(URL.revokeObjectURL);
                    else setCarousel({ status: 'ready', urls, blobs });
                })
                .catch(err => !cancelled && setCarousel({ status: 'error', urls: [], error: err.message }));
        });
        return () => {
            cancelled = true;
            clearTimeout(timer);
            urls.forEach(URL.revokeObjectURL);
        };
        // Render once when the preview opens
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const uploadsRef = useRef(uploads);
    uploadsRef.current = uploads;
    useEffect(() => () => uploadsRef.current.forEach(u => URL.revokeObjectURL(u.src)), []);

    const allPosts = buildThreadPosts(slides, emojis, moreLink).map((p, i) => ({ ...p, images: postImages[i] }));
    const posts = allPosts.filter(p => !p.omitted); // what actually gets sent
    const moreSlot = allPosts.find(p => p.omitted);
    const caption = buildCaption(slides, emojis[0]);
    const library = [...collectImageLibrary(slides), ...uploads];
    const multiEmoji = slides.length > 1;

    // Checks that block sending, each tagged with the platforms it affects; only checks for selected platforms apply
    const allIssues = [];
    const issue = (text, ...services) => allIssues.push({ text, services });
    posts.forEach((p, i) => {
        if (countX(p.text) > LIMITS.x) issue(`Post ${i + 1} is too long for X`, 'twitter');
        if (countBluesky(p.text) > LIMITS.bluesky) issue(`Post ${i + 1} is too long for Bluesky`, 'bluesky');
    });
    if (moreLink.trim() && !/^https?:\/\/\S+\.\S+/.test(moreLink.trim())) issue('The More link should be a full URL starting with https://', 'twitter', 'bluesky');
    if (!caption) issue('The Instagram caption is empty', 'instagram');
    if (countInstagram(caption) > LIMITS.instagram) issue('The Instagram caption is too long', 'instagram');
    if (aspectRatio === '9:16') issue('Instagram feed posts can’t be 9:16 — switch to 4:5 or 1:1', 'instagram');
    if (slides.length > MAX_CAROUSEL_SLIDES) issue(`Instagram carousels allow at most ${MAX_CAROUSEL_SLIDES} slides`, 'instagram');
    const issues = allIssues.filter(i => i.services.some(isOn)).map(i => i.text);
    const missingEmoji = emojis.some(e => !e);

    const updateImages = (postIdx, fn) => setPostImages(prev => prev.map((imgs, i) => (i === postIdx ? fn(imgs) : imgs)));

    const moveImage = (postIdx, imgIdx, delta) => {
        const target = postIdx + delta;
        if (target < 0 || target >= postImages.length || postImages[target].length >= MAX_IMAGES_PER_POST) return;
        setPostImages(prev => {
            const next = prev.map(imgs => [...imgs]);
            const [img] = next[postIdx].splice(imgIdx, 1);
            next[target].push(img);
            return next;
        });
    };

    const addUpload = (e) => {
        const files = [...(e.target.files || [])];
        e.target.value = '';
        if (!files.length || pickerFor === null) return;
        const added = files.map((file, i) => ({
            key: `upload-${Date.now()}-${i}`,
            label: file.name,
            src: URL.createObjectURL(file),
            kind: 'upload',
            file,
        }));
        setUploads(prev => [...prev, ...added]);
        updateImages(pickerFor, imgs => [...imgs, ...added].slice(0, MAX_IMAGES_PER_POST));
        setPickerFor(null);
    };

    const threadText = posts.map(p => p.text).join('\n\n---\n\n');

    return (
        <div className="fixed inset-0 z-50 flex items-stretch md:items-center justify-center bg-black/60 md:p-6" onClick={onClose}>
            <div
                className="bg-gray-800 text-gray-200 w-full md:max-w-6xl md:rounded-lg shadow-2xl flex flex-col max-h-full md:max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Preview posts"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                    <h2 className="text-base md:text-lg font-semibold">Preview posts</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none px-2" aria-label="Close">×</button>
                </div>

                {/* Shared fields */}
                <div className="px-4 py-3 border-b border-gray-700 grid gap-3 md:grid-cols-[1fr_auto]">
                    <div>
                        <label className="text-xs text-gray-300 mb-1 block">More link (optional: adds a last post on X and Bluesky)</label>
                        <input
                            type="url"
                            value={moreLink}
                            onChange={(e) => onMoreLinkChange(e.target.value)}
                            disabled={locked}
                            placeholder="https://…"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-300 mb-1 block">Emoji{multiEmoji ? ' per slide' : ''}</label>
                        <div className="flex gap-2 flex-wrap">
                            {emojis.map((emoji, i) => (
                                <div key={i} className="flex items-center gap-1">
                                    {multiEmoji && <span className="text-[11px] text-gray-400">{i + 1}</span>}
                                    <input
                                        type="text"
                                        value={emoji}
                                        onChange={(e) => setEmojis(prev => prev.map((v, j) => (j === i ? e.target.value.trim() : v)))}
                                        placeholder="Pick"
                                        list="post-preview-emojis"
                                        disabled={locked}
                                        className={`w-16 p-2 border rounded text-sm text-center ${emoji ? 'border-gray-600' : 'border-amber-500'}`}
                                    />
                                </div>
                            ))}
                            <datalist id="post-preview-emojis">
                                {presets.filter(p => p.match).map(p => <option key={p.id} value={p.match}>{p.name}</option>)}
                            </datalist>
                        </div>
                    </div>
                </div>

                {/* Mobile tabs */}
                <div className="flex lg:hidden border-b border-gray-700">
                    {[['thread', 'X / Bluesky'], ['instagram', 'Instagram']].map(([id, label]) => (
                        <button
                            key={id}
                            onClick={() => setMobileTab(id)}
                            className={`flex-1 py-2 text-sm font-medium ${mobileTab === id ? 'border-b-2 border-blue-500 text-blue-300' : 'text-gray-400'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden lg:grid lg:grid-cols-2">
                    {/* X / Bluesky thread */}
                    <section className={`${mobileTab === 'thread' ? 'block' : 'hidden'} lg:block lg:overflow-y-auto p-4 lg:border-r border-gray-700 transition-opacity ${threadOn ? '' : 'opacity-40'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-sm flex items-center gap-1.5">
                                <PlatformBadges ids={['twitter', 'bluesky']} isOn={isOn} />
                                X &amp; Bluesky {posts.length === 1 ? 'post' : `thread · ${posts.length} posts`}
                                {!threadOn && <span className="font-normal text-gray-400">· not posting</span>}
                            </h3>
                            <CopyButton text={threadText} label="Copy all" />
                        </div>
                        <ol className="space-y-3">
                            {posts.map((post, i) => (
                                <li key={i} className="bg-gray-900/60 rounded-lg p-3 relative">
                                    {i < posts.length - 1 && <span className="absolute left-5 top-full h-3 w-px bg-gray-600" aria-hidden />}
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="text-[11px] text-gray-400">
                                            {i + 1}/{posts.length}
                                            {post.slideIdx !== null && multiEmoji && ` · slide ${post.slideIdx + 1}`}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {isOn('twitter') && <Counter label="X" count={countX(post.text)} limit={LIMITS.x} />}
                                            {isOn('bluesky') && <Counter label="Bsky" count={countBluesky(post.text)} limit={LIMITS.bluesky} />}
                                            <CopyButton text={post.text} />
                                        </div>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap break-words">
                                        {post.text || <span className="text-gray-500">(image only)</span>}
                                    </p>

                                    {/* Images */}
                                    {post.images.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            {post.images.map((img, j) => (
                                                <figure key={img.key + j} className="relative bg-black rounded overflow-hidden">
                                                    <img src={img.src} alt={img.label} className="w-full h-32 object-contain" />
                                                    <figcaption className="absolute inset-x-0 bottom-0 flex justify-between items-center gap-1 bg-black/70 px-1 py-0.5">
                                                        <span className="text-[10px] truncate text-gray-300">{img.label}</span>
                                                        <span className="flex gap-0.5 flex-shrink-0">
                                                            <button onClick={() => moveImage(i, j, -1)} disabled={locked || i === 0 || postImages[i - 1]?.length >= MAX_IMAGES_PER_POST} className={smallButton} title="Move to previous post" aria-label="Move to previous post">↑</button>
                                                            <button onClick={() => moveImage(i, j, 1)} disabled={locked || i === posts.length - 1 || postImages[i + 1]?.length >= MAX_IMAGES_PER_POST} className={smallButton} title="Move to next post" aria-label="Move to next post">↓</button>
                                                            <button onClick={() => updateImages(i, imgs => imgs.filter((_, k) => k !== j))} disabled={locked} className={smallButton} title="Remove" aria-label="Remove image">×</button>
                                                        </span>
                                                    </figcaption>
                                                </figure>
                                            ))}
                                        </div>
                                    )}
                                    {post.images.length < MAX_IMAGES_PER_POST && !locked && (
                                        <button onClick={() => setPickerFor(pickerFor === i ? null : i)} className="mt-2 text-xs text-blue-300 hover:text-blue-200">
                                            + Add image
                                        </button>
                                    )}

                                    {/* Image picker */}
                                    {pickerFor === i && !locked && (
                                        <div className="mt-2 p-2 rounded bg-gray-800 border border-gray-700">
                                            <div className="grid grid-cols-4 gap-2">
                                                {library.map(img => (
                                                    <button
                                                        key={img.key}
                                                        onClick={() => {
                                                            updateImages(i, imgs => [...imgs, img]);
                                                            setPickerFor(null);
                                                        }}
                                                        className="bg-black rounded overflow-hidden hover:ring-2 ring-blue-500"
                                                        title={img.label}
                                                    >
                                                        <img src={img.src} alt={img.label} className="w-full h-16 object-contain" />
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="h-16 rounded border border-dashed border-gray-500 text-xs text-gray-300 hover:bg-gray-700"
                                                >
                                                    Upload…
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ol>
                        {moreSlot && (
                            <div className="mt-3 rounded-lg border border-dashed border-gray-600 p-3 text-xs text-gray-400">
                                No More post: add a link above to end the thread with one.
                                {moreSlot.images.length > 0 && <span className="block text-amber-300 mt-1">Its {moreSlot.images.length} image(s) won’t be sent.</span>}
                            </div>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addUpload} className="hidden" />
                    </section>

                    {/* Instagram */}
                    <section className={`${mobileTab === 'instagram' ? 'block' : 'hidden'} lg:block lg:overflow-y-auto p-4 transition-opacity ${isOn('instagram') ? '' : 'opacity-40'}`}>
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                            <PlatformBadges ids={['instagram']} isOn={isOn} />
                            Instagram · {slides.length > 1 ? `carousel of ${slides.length}` : 'single image'}
                            {!isOn('instagram') && <span className="font-normal text-gray-400">· not posting</span>}
                        </h3>
                        {carousel.status === 'loading' && <p className="text-sm text-gray-400">Rendering slides…</p>}
                        {carousel.status === 'error' && <p className="text-sm text-red-300">Couldn’t render slides: {carousel.error}</p>}
                        {carousel.status === 'ready' && (
                            <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2">
                                {carousel.urls.map((url, i) => (
                                    <figure key={url} className="snap-start flex-shrink-0 w-[70%] sm:w-[45%] lg:w-[60%] relative">
                                        <img src={url} alt={`Slide ${i + 1}`} className="w-full rounded" />
                                        {carousel.urls.length > 1 && (
                                            <span className="absolute top-2 right-2 text-[11px] bg-black/70 rounded px-1.5 py-0.5">{i + 1}/{carousel.urls.length}</span>
                                        )}
                                    </figure>
                                ))}
                            </div>
                        )}
                        <div className="mt-3 bg-gray-900/60 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] text-gray-400">Caption</span>
                                <div className="flex items-center gap-2">
                                    <Counter label="" count={countInstagram(caption)} limit={LIMITS.instagram} />
                                    <CopyButton text={caption} />
                                </div>
                            </div>
                            <p className="text-sm whitespace-pre-wrap break-words">{caption || <span className="text-gray-500">(no text)</span>}</p>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-700 text-xs space-y-2">
                    {issues.length > 0 && (
                        <ul className="text-red-300 list-disc pl-4">
                            {issues.map(issue => <li key={issue}>{issue}</li>)}
                        </ul>
                    )}
                    {missingEmoji && <p className="text-amber-300">Some slides have no emoji: their posts will start without one.</p>}
                    <SendPanel
                        posts={posts}
                        caption={caption}
                        carouselBlobs={carousel.blobs ?? null}
                        selected={selected}
                        onToggle={toggleService}
                        blockingIssues={issues.length > 0}
                        onStateChange={setSendState}
                    />
                </div>
            </div>
        </div>
    );
}
