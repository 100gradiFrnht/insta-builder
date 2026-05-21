import { useState, useRef, useEffect } from 'react';
import { canvasRGBA } from 'stackblur-canvas';
import { ASPECT_RATIOS, OVERLAY_PATHS } from './utils/constants';
import { transformTextCase } from './utils/textTransform';
import { parseMarkdown } from './utils/markdown';
import { parseTextWithEmoji, loadEmojiImage } from './utils/emoji';

// Banner tag presets
const BANNER_PRESETS = {
    breaking: { name: '🔴 Breaking', text: 'BREAKING', letterSpacing: 0.85, align: 'center', bgColor: '#850000' },
    custom: { name: 'Custom', text: 'Custom', letterSpacing: 0, align: 'left', bgColor: '#000f85' },
    // Eurovision countries (alphabetically sorted)
    albania: { name: '🇦🇱 Albania', text: '🇦🇱 Albania', letterSpacing: 0, align: 'left', bgColor: '#c60a00' },
    andorra: { name: '🇦🇩 Andorra', text: '🇦🇩 Andorra', letterSpacing: 0, align: 'left', bgColor: '#102fab' },
    armenia: { name: '🇦🇲 Armenia', text: '🇦🇲 Armenia', letterSpacing: 0, align: 'left', bgColor: '#f0a902' },
    australia: { name: '🇦🇺 Australia', text: '🇦🇺 Australia', letterSpacing: 0, align: 'left', bgColor: '#0000ca' },
    austria: { name: '🇦🇹 Austria', text: '🇦🇹 Austria', letterSpacing: 0, align: 'left', bgColor: '#a70a0a' },
    azerbaijan: { name: '🇦🇿 Azerbaijan', text: '🇦🇿 Azerbaijan', letterSpacing: 0, align: 'left', bgColor: '#13a8b0' },
    belarus: { name: '🇧🇾 Belarus', text: '🇧🇾 Belarus', letterSpacing: 0, align: 'left', bgColor: '#641313' },
    belgium: { name: '🇧🇪 Belgium', text: '🇧🇪 Belgium', letterSpacing: 0, align: 'left', bgColor: '#c4ba00' },
    bosnia: { name: '🇧🇦 Bosnia & Herzegovina', text: '🇧🇦 Bosnia & Herzegovina', letterSpacing: 0, align: 'left', bgColor: '#003aa6' },
    bulgaria: { name: '🇧🇬 Bulgaria', text: '🇧🇬 Bulgaria', letterSpacing: 0, align: 'left', bgColor: '#00b960' },
    canada: { name: '🇨🇦 Canada', text: '🇨🇦 Canada', letterSpacing: 0, align: 'left', bgColor: '#a40000' },
    croatia: { name: '🇭🇷 Croatia', text: '🇭🇷 Croatia', letterSpacing: 0, align: 'left', bgColor: '#d20025' },
    cyprus: { name: '🇨🇾 Cyprus', text: '🇨🇾 Cyprus', letterSpacing: 0, align: 'left', bgColor: '#b78900' },
    czechia: { name: '🇨🇿 Czechia', text: '🇨🇿 Czechia', letterSpacing: 0, align: 'left', bgColor: '#000971' },
    denmark: { name: '🇩🇰 Denmark', text: '🇩🇰 Denmark', letterSpacing: 0, align: 'left', bgColor: '#b90004'},
    estonia: { name: '🇪🇪 Estonia', text: '🇪🇪 Estonia', letterSpacing: 0, align: 'left', bgColor: '#0056e6'},
    finland: { name: '🇫🇮 Finland', text: '🇫🇮 Finland', letterSpacing: 0, align: 'left', bgColor: '#0030f2'},
    france: { name: '🇫🇷 France', text: '🇫🇷 France', letterSpacing: 0, align: 'left', bgColor: '#0013a4'},
    georgia: { name: '🇬🇪 Georgia', text: '🇬🇪 Georgia', letterSpacing: 0, align: 'left', bgColor: '#9d0000'},
    germany: { name: '🇩🇪 Germany', text: '🇩🇪 Germany', letterSpacing: 0, align: 'left', bgColor: '#d56300'},
    greece: { name: '🇬🇷 Greece', text: '🇬🇷 Greece', letterSpacing: 0, align: 'left', bgColor: '#0062ca'},
    hungary: { name: '🇭🇺 Hungary', text: '🇭🇺 Hungary', letterSpacing: 0, align: 'left', bgColor: '#00640f'},
    iceland: { name: '🇮🇸 Iceland', text: '🇮🇸 Iceland', letterSpacing: 0, align: 'left', bgColor: '#001d91'},
    ireland: { name: '🇮🇪 Ireland', text: '🇮🇪 Ireland', letterSpacing: 0, align: 'left', bgColor: '#00970d'},
    israel: { name: '🇮🇱 Israel', text: '🇮🇱 Israel', letterSpacing: 0, align: 'left', bgColor: '#0060bf'},
    italy: { name: '🇮🇹 Italy', text: '🇮🇹 Italy', letterSpacing: 0, align: 'left', bgColor: '#009507'},
    kazakhstan: { name: '🇰🇿 Kazakhstan', text: '🇰🇿 Kazakhstan', letterSpacing: 0, align: 'left', bgColor: '#009f9f'},
    kosovo: { name: '🇽🇰 Kosovo', text: '🇽🇰 Kosovo', letterSpacing: 0, align: 'left', bgColor: '#000fe8'},
    latvia: { name: '🇱🇻 Latvia', text: '🇱🇻 Latvia', letterSpacing: 0, align: 'left', bgColor: '#400000'},
    lithuania: { name: '🇱🇹 Lithuania', text: '🇱🇹 Lithuania', letterSpacing: 0, align: 'left', bgColor: '#bf8f00'},
    luxembourg: { name: '🇱🇺 Luxembourg', text: '🇱🇺 Luxembourg', letterSpacing: 0, align: 'left', bgColor: '#00bde8'},
    malta: { name: '🇲🇹 Malta', text: '🇲🇹 Malta', letterSpacing: 0, align: 'left', bgColor: '#8a0000'},
    moldova: { name: '🇲🇩 Moldova', text: '🇲🇩 Moldova', letterSpacing: 0, align: 'left', bgColor: '#a68500'},
    monaco: { name: '🇲🇨 Monaco', text: '🇲🇨 Monaco', letterSpacing: 0, align: 'left', bgColor: '#950000'},
    montenegro: { name: '🇲🇪 Montenegro', text: '🇲🇪 Montenegro', letterSpacing: 0, align: 'left', bgColor: '#aa5500'},
    morocco: { name: '🇲🇦 Morocco', text: '🇲🇦 Morocco', letterSpacing: 0, align: 'left', bgColor: '#6d1818'},
    netherlands: { name: '🇳🇱 Netherlands', text: '🇳🇱 Netherlands', letterSpacing: 0, align: 'left', bgColor: '#00209d'},
    northmacedonia: { name: '🇲🇰 North Macedonia', text: '🇲🇰 North Macedonia', letterSpacing: 0, align: 'left', bgColor: '#ae4600'},
    norway: { name: '🇳🇴 Norway', text: '🇳🇴 Norway', letterSpacing: 0, align: 'left', bgColor: '#aa0000'},
    poland: { name: '🇵🇱 Poland', text: '🇵🇱 Poland', letterSpacing: 0, align: 'left', bgColor: '#a80022'},
    portugal: { name: '🇵🇹 Portugal', text: '🇵🇹 Portugal', letterSpacing: 0, align: 'left', bgColor: '#007103'},
    romania: { name: '🇷🇴 Romania', text: '🇷🇴 Romania', letterSpacing: 0, align: 'left', bgColor: '#000291'},
    russia: { name: '🇷🇺 Russia', text: '🇷🇺 Russia', letterSpacing: 0, align: 'left', bgColor: '#000f85'},
    sanmarino: { name: '🇸🇲 San Marino', text: '🇸🇲 San Marino', letterSpacing: 0, align: 'left', bgColor: '#0083ae'},
    serbia: { name: '🇷🇸 Serbia', text: '🇷🇸 Serbia', letterSpacing: 0, align: 'left', bgColor: '#001c9d'},
    slovakia: { name: '🇸🇰 Slovakia', text: '🇸🇰 Slovakia', letterSpacing: 0, align: 'left', bgColor: '#0c0091'},
    slovenia: { name: '🇸🇮 Slovenia', text: '🇸🇮 Slovenia', letterSpacing: 0, align: 'left', bgColor: '#0028b9'},
    spain: { name: '🇪🇸 Spain', text: '🇪🇸 Spain', letterSpacing: 0, align: 'left', bgColor: '#ae8300'},
    sweden: { name: '🇸🇪 Sweden', text: '🇸🇪 Sweden', letterSpacing: 0, align: 'left', bgColor: '#005b9f'},
    switzerland: { name: '🇨🇭 Switzerland', text: '🇨🇭 Switzerland', letterSpacing: 0, align: 'left', bgColor: '#c40000'},
    turkiye: { name: '🇹🇷 Türkiye', text: '🇹🇷 Türkiye', letterSpacing: 0, align: 'left', bgColor: '#a71f1f'},
    ukraine: { name: '🇺🇦 Ukraine', text: '🇺🇦 Ukraine', letterSpacing: 0, align: 'left', bgColor: '#d5ce00'},
    uk: { name: '🇬🇧 United Kingdom', text: '🇬🇧 United Kingdom', letterSpacing: 0, align: 'left', bgColor: '#0000ae'},
    // Eurovision Asia countries (alphabetically sorted)
    bangladesh: { name: '🇧🇩 Bangladesh', text: '🇧🇩 Bangladesh', letterSpacing: 0, align: 'left', bgColor: '#006a4e' },
    bhutan: { name: '🇧🇹 Bhutan', text: '🇧🇹 Bhutan', letterSpacing: 0, align: 'left', bgColor: '#e47c1a' },
    cambodia: { name: '🇰🇭 Cambodia', text: '🇰🇭 Cambodia', letterSpacing: 0, align: 'left', bgColor: '#032ea1' },
    laos: { name: '🇱🇦 Laos', text: '🇱🇦 Laos', letterSpacing: 0, align: 'left', bgColor: '#ce1126' },
    malaysia: { name: '🇲🇾 Malaysia', text: '🇲🇾 Malaysia', letterSpacing: 0, align: 'left', bgColor: '#cc0001' },
    nepal: { name: '🇳🇵 Nepal', text: '🇳🇵 Nepal', letterSpacing: 0, align: 'left', bgColor: '#003893' },
    philippines: { name: '🇵🇭 Philippines', text: '🇵🇭 Philippines', letterSpacing: 0, align: 'left', bgColor: '#0038a8' },
    southkorea: { name: '🇰🇷 South Korea', text: '🇰🇷 South Korea', letterSpacing: 0, align: 'left', bgColor: '#003478' },
    thailand: { name: '🇹🇭 Thailand', text: '🇹🇭 Thailand', letterSpacing: 0, align: 'left', bgColor: '#a51931' },
    vietnam: { name: '🇻🇳 Vietnam', text: '🇻🇳 Vietnam', letterSpacing: 0, align: 'left', bgColor: '#da251d' },
};

// ISO 3166-1 alpha-2 → BANNER_PRESETS key
const FLAG_TO_PRESET = {
    AL:'albania', AD:'andorra', AM:'armenia', AU:'australia', AT:'austria',
    AZ:'azerbaijan', BY:'belarus', BE:'belgium', BA:'bosnia', BG:'bulgaria',
    CA:'canada', HR:'croatia', CY:'cyprus', CZ:'czechia', DK:'denmark',
    EE:'estonia', FI:'finland', FR:'france', GE:'georgia', DE:'germany',
    GR:'greece', HU:'hungary', IS:'iceland', IE:'ireland', IL:'israel',
    IT:'italy', KZ:'kazakhstan', XK:'kosovo', LV:'latvia', LT:'lithuania',
    LU:'luxembourg', MT:'malta', MD:'moldova', MC:'monaco', ME:'montenegro',
    MA:'morocco', NL:'netherlands', MK:'northmacedonia', NO:'norway',
    PL:'poland', PT:'portugal', RO:'romania', RU:'russia', SM:'sanmarino',
    RS:'serbia', SK:'slovakia', SI:'slovenia', ES:'spain', SE:'sweden',
    CH:'switzerland', TR:'turkiye', UA:'ukraine', GB:'uk',
    BD:'bangladesh', BT:'bhutan', KH:'cambodia', LA:'laos', MY:'malaysia',
    NP:'nepal', PH:'philippines', KR:'southkorea', TH:'thailand', VN:'vietnam',
};

const CORS_PROXY = 'https://escdiscord-cors-proxy.100gradifrnht.workers.dev';

export default function App() {
            const [aspectRatio, setAspectRatio] = useState('4:5');
            const [baseImage, setBaseImage] = useState(null);
            const [permanentOverlays, setPermanentOverlays] = useState({
                '4:5': null,
                '1:1': null,
                '9:16': null
            });
            const [additionalOverlays, setAdditionalOverlays] = useState({
                'regular-4:5': null,
                'regular-1:1': null,
                'regular-9:16': null,
                'custom-4:5': null,
                'custom-1:1': null,
                'custom-9:16': null
            });
            const [selectedOverlay] = useState('custom');
            const [overlayColor, setOverlayColor] = useState('white');
            const [textElements, setTextElements] = useState([{
                id: Date.now(),
                text: 'Your text here',
                x: 540,
                y: 1194,
                useCustomSettings: false,
                fontSize: 40,
                color: '#ffffff',
                fontFamily: 'Helvetica Neue',
                fontWeight: 'normal',
                fontStyle: 'normal',
                textAlign: 'left',
                textCase: 'default',
                justify: false,
                maxWidth: 980
            }]);
            const [selectedText, setSelectedText] = useState(null);
            const [textBoxMargin, setTextBoxMargin] = useState(20);

            // Global text formatting settings
            const [globalFontSize, setGlobalFontSize] = useState(40);
            const [globalColor, setGlobalColor] = useState('#ffffff');
            const [globalFontFamily, setGlobalFontFamily] = useState('Helvetica Neue');
            const [globalFontWeight, setGlobalFontWeight] = useState('normal');
            const [globalFontStyle, setGlobalFontStyle] = useState('normal');
            const [globalTextAlign, setGlobalTextAlign] = useState('left');
            const [globalJustify, setGlobalJustify] = useState(false);
            const [globalTextCase, setGlobalTextCase] = useState('default');

            // Tag banner settings (for Custom overlay)
            const [bannerText, setBannerText] = useState('Custom');
            const [bannerLetterSpacing, setBannerLetterSpacing] = useState(0);
            const [bannerColor, setBannerColor] = useState('#000f85');
            const [bannerFontSize, setBannerFontSize] = useState(40);
            const [bannerFontFamily, setBannerFontFamily] = useState('Helvetica Neue');
            const [bannerFontWeight, setBannerFontWeight] = useState('bold');
            const [bannerFontStyle, setBannerFontStyle] = useState('normal');
            const [bannerTextAlign, setBannerTextAlign] = useState('left');
            const [bannerTextCase, setBannerTextCase] = useState('uppercase');
            const [bannerOpacity, setBannerOpacity] = useState(0.6);
            const [selectedBannerPreset, setSelectedBannerPreset] = useState('custom');
            const [showBanner, setShowBanner] = useState(true);
            const [photoCredit, setPhotoCredit] = useState('');

            // Bluesky import
            const [bskyUrl, setBskyUrl] = useState('');
            const [baseImageUrl, setBaseImageUrl] = useState('');
            const [bskyLoading, setBskyLoading] = useState(false);
            const [bskyError, setBskyError] = useState('');
            const [bskyData, setBskyData] = useState(null); // { posts: [{text, images}], allImages: [{fullsize, thumb}] }
            const [bskySelectedImageIdx, setBskySelectedImageIdx] = useState(null);
            const [bskyCustomImage, setBskyCustomImage] = useState(null);
            const [showOverlay, setShowOverlay] = useState(true);

            const [imageScale, setImageScale] = useState(1);
            const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
            const [imageRotation, setImageRotation] = useState(0);
            const [isDragging, setIsDragging] = useState(false);
            const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
            const [showMobileControls, setShowMobileControls] = useState(true);
            const [activeTab, setActiveTab] = useState('image');
            const [showSafeMargins, setShowSafeMargins] = useState(false);
            const [showGlobalFormatting, setShowGlobalFormatting] = useState(false);
            const [lastTouchDistance, setLastTouchDistance] = useState(null);

            // Refs for touch event handlers to avoid stale closures
            const isDraggingRef = useRef(false);
            const dragStartRef = useRef({ x: 0, y: 0 });
            const lastTouchDistanceRef = useRef(null);
            const imagePositionRef = useRef({ x: 0, y: 0 });
            const imageScaleRef = useRef(1);
            const [useBlurBackground, setUseBlurBackground] = useState(false);
            const [blurIntensity, setBlurIntensity] = useState(50);
            const [blurImage, setBlurImage] = useState(null);
            const [useBaseImageForBlur, setUseBaseImageForBlur] = useState(true);
            const [blurImageScale, setBlurImageScale] = useState(1);
            const [blurImagePosition, setBlurImagePosition] = useState({ x: 0, y: 0 });
            const [blurImageRotation, setBlurImageRotation] = useState(0);
            const [fontsLoaded, setFontsLoaded] = useState(false);

            const canvasRef = useRef(null);
            const containerRef = useRef(null);

            // Keep refs in sync with state
            useEffect(() => {
                isDraggingRef.current = isDragging;
            }, [isDragging]);

            useEffect(() => {
                dragStartRef.current = dragStart;
            }, [dragStart]);

            useEffect(() => {
                lastTouchDistanceRef.current = lastTouchDistance;
            }, [lastTouchDistance]);

            useEffect(() => {
                imagePositionRef.current = imagePosition;
            }, [imagePosition]);

            useEffect(() => {
                imageScaleRef.current = imageScale;
            }, [imageScale]);

            // Predefined file paths for permanent overlays (by color and aspect ratio)
            const PERMANENT_OVERLAY_PATHS = {
                'white-4:5': `${import.meta.env.BASE_URL}overlays/overlay-white-4-5.png`,
                'white-1:1': `${import.meta.env.BASE_URL}overlays/overlay-white-1-1.png`,
                'white-9:16': `${import.meta.env.BASE_URL}overlays/overlay-white-9-16.png`,
                'black-4:5': `${import.meta.env.BASE_URL}overlays/overlay-black-4-5.png`,
                'black-1:1': `${import.meta.env.BASE_URL}overlays/overlay-black-1-1.png`,
                'black-9:16': `${import.meta.env.BASE_URL}overlays/overlay-black-9-16.png`
            };

            const dimensions = ASPECT_RATIOS[aspectRatio];
            const maxCanvasWidthByColumn = typeof window !== 'undefined' ? Math.min(window.innerWidth >= 1024 ? 780 : 600, window.innerWidth - 40) : 600;
            // ~190px reserved for aspect buttons, safe-area toggle, copy/export buttons, card padding
            const maxCanvasHeightByViewport = typeof window !== 'undefined' ? window.innerHeight - 190 : 700;
            const maxCanvasWidthByHeight = maxCanvasHeightByViewport * (dimensions.width / dimensions.height);
            const maxCanvasWidth = Math.min(maxCanvasWidthByColumn, maxCanvasWidthByHeight);
            const scale = maxCanvasWidth / dimensions.width;
            const canvasHeight = dimensions.height * scale;

            // Load permanent overlays from predefined paths on mount
            useEffect(() => {
                // Load permanent overlays
                Object.entries(PERMANENT_OVERLAY_PATHS).forEach(([ratio, path]) => {
                    fetch(path)
                        .then(response => response.blob())
                        .then(blob => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                const img = new Image();
                                img.onload = () => {
                                    console.log(`Loaded permanent overlay for ${ratio}`);
                                    setPermanentOverlays(prev => ({
                                        ...prev,
                                        [ratio]: img
                                    }));
                                };
                                img.src = e.target.result;
                            };
                            reader.readAsDataURL(blob);
                        })
                        .catch(e => {
                            console.error(`Failed to load permanent overlay for ${ratio} from ${path}`, e);
                        });
                });

                // Load additional overlays
                Object.entries(OVERLAY_PATHS).forEach(([type, path]) => {
                    fetch(path)
                        .then(response => response.blob())
                        .then(blob => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                const img = new Image();
                                img.onload = () => {
                                    console.log(`Loaded additional overlay for ${type}`);
                                    setAdditionalOverlays(prev => ({
                                        ...prev,
                                        [type]: img
                                    }));
                                };
                                img.src = e.target.result;
                            };
                            reader.readAsDataURL(blob);
                        })
                        .catch(e => {
                            console.error(`Failed to load additional overlay for ${type} from ${path}`, e);
                        });
                });
            }, []);

            // Load fonts before rendering
            useEffect(() => {
                const loadFonts = async () => {
                    try {
                        await Promise.all([
                            document.fonts.load('400 40px "Helvetica Neue"'),
                            document.fonts.load('500 40px "Helvetica Neue"'),
                            document.fonts.load('700 40px "Helvetica Neue"'),
                            document.fonts.load('italic 400 40px "Helvetica Neue"'),
                            document.fonts.load('italic 700 40px "Helvetica Neue"'),
                            document.fonts.load('40px "Singing Sans"'),
                            document.fonts.load('400 20px "Inter"')
                        ]);
                        setFontsLoaded(true);
                    } catch (error) {
                        console.error('Error loading fonts:', error);
                        setFontsLoaded(true); // Proceed anyway
                    }
                };
                loadFonts();
            }, []);

            const handleBaseImageUpload = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                            setBaseImage(img);
                            setImageScale(1);
                            setImagePosition({ x: 0, y: 0 });
                        };
                        img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            };

            // Fetches an external image via CORS proxy so the canvas is never tainted.
            // Proxy adds Access-Control-Allow-Origin: * that cdn.bsky.app omits.
            const loadExternalImage = (url) => {
                const proxied = `${CORS_PROXY}?url=${encodeURIComponent(url)}`;
                return fetch(proxied)
                    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.blob(); })
                    .then(blob => new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const img = new Image();
                            img.onload = () => resolve(img);
                            img.onerror = reject;
                            img.src = reader.result;
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    }));
            };

            const handleBaseImageUrlLoad = () => {
                const url = baseImageUrl.trim();
                if (!url) return;
                loadExternalImage(url).then(img => {
                    setBaseImage(img);
                    setImageScale(1);
                    setImagePosition({ x: 0, y: 0 });
                }).catch(() => {});
            };

            const importFromBluesky = async () => {
                setBskyLoading(true);
                setBskyError('');
                setBskyData(null);
                setBskySelectedImageIdx(null);
                setBskyCustomImage(null);
                try {
                    const raw = bskyUrl.trim();
                    const url = new URL(raw.startsWith('http') ? raw : 'https://' + raw);
                    const parts = url.pathname.split('/').filter(Boolean);
                    if (parts[0] !== 'profile' || parts[2] !== 'post') throw new Error('Not a valid Bluesky post URL');
                    const handle = parts[1];
                    const rkey = parts[3];

                    const resolveRes = await fetch(`https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`);
                    if (!resolveRes.ok) throw new Error('Could not resolve handle');
                    const { did } = await resolveRes.json();

                    const atUri = `at://${did}/app.bsky.feed.post/${rkey}`;
                    const threadRes = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(atUri)}&depth=20`);
                    if (!threadRes.ok) throw new Error('Could not fetch thread');
                    const { thread } = await threadRes.json();

                    // If the pasted post is a reply, re-fetch from the root
                    let rootThread = thread;
                    const rootUri = thread.post?.record?.reply?.root?.uri;
                    if (rootUri) {
                        const rootRes = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(rootUri)}&depth=20`);
                        if (rootRes.ok) {
                            const rootData = await rootRes.json();
                            rootThread = rootData.thread;
                        }
                    }

                    // Walk down following only the original author's replies
                    const flatPosts = [];
                    let current = rootThread;
                    while (current?.$type === 'app.bsky.feed.defs#threadViewPost') {
                        if (current.post?.author?.did === did) flatPosts.push(current.post);
                        current = current.replies?.find(r =>
                            r.$type === 'app.bsky.feed.defs#threadViewPost' &&
                            r.post?.author?.did === did
                        ) ?? null;
                    }

                    if (flatPosts.length === 0) throw new Error('No posts found from this author');

                    const posts = flatPosts.map(post => {
                        const images = [];
                        const embed = post.embed;
                        if (embed?.$type === 'app.bsky.embed.images#view') {
                            embed.images.forEach(img => images.push({ fullsize: img.fullsize, thumb: img.thumb }));
                        } else if (embed?.$type === 'app.bsky.embed.recordWithMedia#view') {
                            const media = embed.media;
                            if (media?.$type === 'app.bsky.embed.images#view') {
                                media.images.forEach(img => images.push({ fullsize: img.fullsize, thumb: img.thumb }));
                            }
                        }
                        const text = post.record.text.replace(/\s*More:[\s\S]*$/i, '').trim();
                        return { text, images };
                    }).filter(post => post.text || post.images.length > 0);

                    const allImages = posts.flatMap(p => p.images);
                    setBskyData({ posts, allImages });
                    if (allImages.length > 0) setBskySelectedImageIdx(0);
                    await applyBskyImport({ posts, allImages }, allImages.length > 0 ? 0 : null, null);
                } catch (err) {
                    setBskyError(err.message || 'Import failed');
                } finally {
                    setBskyLoading(false);
                }
            };

            const handleBskyOwnImageUpload = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => { setBskyCustomImage(img); setBskySelectedImageIdx(null); };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            };

            const applyBskyImport = async (data = bskyData, selectedIdx = bskySelectedImageIdx, customImage = bskyCustomImage) => {
                if (!data) return;
                // Load image first so all state updates fire in one batch
                let imgToSet = customImage ?? null;
                if (!imgToSet && selectedIdx !== null && data.allImages[selectedIdx]) {
                    imgToSet = await loadExternalImage(data.allImages[selectedIdx].fullsize).catch(() => null);
                }
                if (imgToSet) {
                    setBaseImage(imgToSet);
                    setImageScale(1);
                    setImagePosition({ x: 0, y: 0 });
                    setImageRotation(0);
                }
                // Auto-set banner preset from first emoji of first post
                if (data.posts.length > 0) {
                    const chars = [...data.posts[0].text];
                    const cp0 = chars[0]?.codePointAt(0);
                    const cp1 = chars[1]?.codePointAt(0);
                    const isRI = cp => cp >= 0x1F1E6 && cp <= 0x1F1FF;
                    if (cp0 === 0x1F534) { // 🔴
                        handleBannerPresetChange('breaking');
                    } else if (isRI(cp0) && isRI(cp1)) {
                        const isoCode = String.fromCharCode(cp0 - 0x1F1E6 + 65) + String.fromCharCode(cp1 - 0x1F1E6 + 65);
                        handleBannerPresetChange(FLAG_TO_PRESET[isoCode] || 'custom');
                    } else {
                        handleBannerPresetChange('custom');
                    }
                }

                // Create one textbox per post
                const stripLeadingEmojis = (text) =>
                    text.replace(/^([\p{Emoji_Presentation}\p{Regional_Indicator}]\s*)+/u, '');

                const bottomMargin = aspectRatio === '9:16' ? 112 : 37;
                setTextElements([...data.posts].reverse().map((post, i) => ({
                    id: Date.now() + i,
                    text: stripLeadingEmojis(post.text),
                    x: dimensions.width / 2,
                    y: dimensions.height - bottomMargin,
                    useCustomSettings: false,
                    fontSize: 40,
                    color: '#ffffff',
                    fontFamily: 'Helvetica Neue',
                    fontWeight: 'normal',
                    fontStyle: 'normal',
                    textAlign: 'left',
                    textCase: 'default',
                    justify: false,
                    maxWidth: dimensions.width - 100,
                })));
            };

            const handleBlurImageUpload = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                            setBlurImage(img);
                            setBlurImageScale(1);
                            setBlurImagePosition({ x: 0, y: 0 });
                            setBlurImageRotation(0);
                            setUseBaseImageForBlur(false);
                        };
                        img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            };

            const [focusedTextboxId, setFocusedTextboxId] = useState(null);

            const appendEmojiToTextbox = (emoji) => {
                setTextElements(prev => {
                    if (prev.length === 0) return prev;
                    const targetId = focusedTextboxId && prev.some(el => el.id === focusedTextboxId)
                        ? focusedTextboxId
                        : prev[prev.length - 1].id;
                    return prev.map(el =>
                        el.id === targetId ? { ...el, text: el.text + emoji } : el
                    );
                });
            };

            const addText = () => {
                const bottomMargin = aspectRatio === '9:16' ? 112 : 37;
                const yPosition = dimensions.height - bottomMargin;

                setTextElements(prev => [...prev, {
                    id: Date.now(),
                    text: 'Your text here',
                    x: dimensions.width / 2,
                    y: yPosition,
                    useCustomSettings: false,
                    fontSize: 40,
                    color: '#ffffff',
                    fontFamily: 'Helvetica Neue',
                    fontWeight: 'normal',
                    fontStyle: 'normal',
                    textAlign: 'left',
                    textCase: 'default',
                    justify: false,
                    maxWidth: dimensions.width - 100
                }]);
            };

            const updateTextElement = (id, updates) => {
                setTextElements(prev => prev.map(el => 
                    el.id === id ? { ...el, ...updates } : el
                ));
            };

            const deleteTextElement = (id) => {
                setTextElements(prev => prev.filter(el => el.id !== id));
                if (selectedText === id) setSelectedText(null);
            };

            const moveTextElementUp = (index) => {
                if (index === 0) return; // Already at the top
                setTextElements(prev => {
                    const newArray = [...prev];
                    [newArray[index - 1], newArray[index]] = [newArray[index], newArray[index - 1]];
                    return newArray;
                });
            };

            const moveTextElementDown = (index) => {
                if (index === textElements.length - 1) return; // Already at the bottom
                setTextElements(prev => {
                    const newArray = [...prev];
                    [newArray[index], newArray[index + 1]] = [newArray[index + 1], newArray[index]];
                    return newArray;
                });
            };

            const handleBannerPresetChange = (presetKey) => {
                setSelectedBannerPreset(presetKey);
                const preset = BANNER_PRESETS[presetKey];
                if (preset) {
                    setBannerText(preset.text);
                    setBannerLetterSpacing(preset.letterSpacing);
                    setBannerTextAlign(preset.align);
                    setBannerColor(preset.bgColor);
                }
            };

            const getTouchDistance = (touches) => {
                const dx = touches[0].clientX - touches[1].clientX;
                const dy = touches[0].clientY - touches[1].clientY;
                return Math.sqrt(dx * dx + dy * dy);
            };

            // Touch/mouse event handlers using refs to avoid stale closures
            const touchMoveHandlerRef = useRef(null);
            const touchEndHandlerRef = useRef(null);

            const handleImageDragStart = (e) => {
                console.log('🎯 DRAG START', { touches: e.touches?.length, type: e.type });

                // Handle pinch zoom - detect two fingers
                if (e.touches && e.touches.length === 2) {
                    const distance = getTouchDistance(e.touches);
                    setLastTouchDistance(distance);
                    setIsDragging(false);
                    console.log('👆 PINCH MODE');
                    return;
                }

                // Handle single touch/mouse drag only if not already pinching
                if (e.touches && e.touches.length > 2) return;

                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                setIsDragging(true);
                setDragStart({ x: clientX - imagePosition.x, y: clientY - imagePosition.y });
                setLastTouchDistance(null);
                console.log('✅ DRAGGING = TRUE');
            };

            // Window-level move handler that uses refs
            useEffect(() => {
                const handleMove = (e) => {
                    // Handle pinch zoom - two fingers
                    if (e.touches && e.touches.length === 2) {
                        const distance = getTouchDistance(e.touches);

                        if (lastTouchDistanceRef.current && lastTouchDistanceRef.current > 0) {
                            const ratio = distance / lastTouchDistanceRef.current;
                            const smoothRatio = 1 + (ratio - 1) * 0.8;
                            const newScale = imageScaleRef.current * smoothRatio;
                            const clampedScale = Math.max(0.5, Math.min(3, newScale));
                            setImageScale(clampedScale);
                        }

                        setLastTouchDistance(distance);
                        setIsDragging(false);
                        return;
                    }

                    // Handle single touch/mouse drag
                    if (!isDraggingRef.current || (e.touches && e.touches.length !== 1)) return;

                    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                    setImagePosition({
                        x: Math.round(clientX - dragStartRef.current.x),
                        y: Math.round(clientY - dragStartRef.current.y)
                    });
                };

                const handleEnd = (e) => {
                    console.log('🛑 DRAG END', { touches: e.touches?.length, type: e.type });

                    // If there are still touches, check if we should continue pinching
                    if (e.touches && e.touches.length >= 2) {
                        const distance = getTouchDistance(e.touches);
                        setLastTouchDistance(distance);
                        console.log('👆 CONTINUE PINCH');
                        return;
                    }

                    setIsDragging(false);
                    setLastTouchDistance(null);
                    console.log('❌ DRAGGING = FALSE');
                };

                touchMoveHandlerRef.current = handleMove;
                touchEndHandlerRef.current = handleEnd;

                if (isDragging || lastTouchDistance !== null) {
                    console.log('🔊 ATTACHING window event listeners');
                    window.addEventListener('mousemove', handleMove);
                    window.addEventListener('mouseup', handleEnd);
                    window.addEventListener('touchmove', handleMove, { passive: true });
                    window.addEventListener('touchend', handleEnd, { passive: true });

                    return () => {
                        console.log('🔇 REMOVING window event listeners');
                        window.removeEventListener('mousemove', handleMove);
                        window.removeEventListener('mouseup', handleEnd);
                        window.removeEventListener('touchmove', handleMove);
                        window.removeEventListener('touchend', handleEnd);
                    };
                }
            }, [isDragging, lastTouchDistance]);

            // Global click/touch tracker for debugging
            useEffect(() => {
                const logClick = (e) => {
                    console.log('👆 CLICK detected', {
                        type: e.type,
                        target: e.target.tagName,
                        isButton: e.target.tagName === 'BUTTON',
                        text: e.target.textContent?.substring(0, 30)
                    });
                };

                document.addEventListener('click', logClick, true);
                document.addEventListener('touchend', logClick, true);

                return () => {
                    document.removeEventListener('click', logClick, true);
                    document.removeEventListener('touchend', logClick, true);
                };
            }, []);

            const renderCanvas = async (includeSafeMargins = true) => {
                const canvas = canvasRef.current;
                if (!canvas) return;

                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, dimensions.width, dimensions.height);

                // Detect platform for emoji rendering offsets
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                const isMacSafari = /Safari/.test(navigator.userAgent) &&
                                   !/Chrome/.test(navigator.userAgent) &&
                                   /Mac/.test(navigator.userAgent) &&
                                   !isIOS;

                // Helper function to render text with emoji support
                const renderTextWithEmoji = async (text, x, y, fontSize, fontFamily = 'Helvetica Neue') => {
                    const segments = parseTextWithEmoji(text);
                    let currentX = x;

                    for (const segment of segments) {
                        if (segment.type === 'text') {
                            // Draw regular text
                            ctx.fillText(segment.content, currentX, y);
                            currentX += ctx.measureText(segment.content).width;
                        } else if (segment.type === 'emoji') {
                            // Draw emoji as Twemoji image
                            try {
                                const emojiImg = await loadEmojiImage(segment.codePoint);
                                // Match emoji size to font size
                                const emojiSize = fontSize;
                                // Platform-specific and font-specific offsets
                                let emojiOffset = 0;
                                if (isIOS) emojiOffset = 0.15;
                                else if (isMacSafari) emojiOffset = 0.10;
                                // Singing Sans specific offset
                                if (fontFamily === 'Singing Sans') emojiOffset = -0.10;
                                const emojiY = y + fontSize * emojiOffset;
                                ctx.drawImage(emojiImg, currentX, emojiY, emojiSize, emojiSize);
                                currentX += emojiSize + 6; // 6px gap between emojis
                            } catch (error) {
                                // Fallback to native emoji if Twemoji fails
                                ctx.fillText(segment.content, currentX, y);
                                currentX += ctx.measureText(segment.content).width;
                            }
                        }
                    }

                    return currentX - x; // Return total width
                };

                // Helper to measure text width including emojis
                const measureTextWithEmoji = (text, fontSize) => {
                    const segments = parseTextWithEmoji(text);
                    let totalWidth = 0;

                    for (const segment of segments) {
                        if (segment.type === 'text') {
                            totalWidth += ctx.measureText(segment.content).width;
                        } else if (segment.type === 'emoji') {
                            totalWidth += fontSize + 6; // Match rendering: emojiSize + 6px gap
                        }
                    }

                    return totalWidth;
                };

                // Draw blurred background if enabled
                if (useBlurBackground) {
                    const blurSourceImage = useBaseImageForBlur ? baseImage : blurImage;

                    if (blurSourceImage) {
                        const centerX = dimensions.width / 2;
                        const centerY = dimensions.height / 2;
                        const blurImgX = blurImagePosition.x / scale;
                        const blurImgY = blurImagePosition.y / scale;

                        const blurImgAspect = blurSourceImage.width / blurSourceImage.height;
                        const canvasAspect = dimensions.width / dimensions.height;
                        let blurDrawWidth = dimensions.width;
                        let blurDrawHeight = dimensions.height;
                        if (blurImgAspect > canvasAspect) {
                            blurDrawWidth = dimensions.height * blurImgAspect;
                            blurDrawHeight = dimensions.height;
                        } else {
                            blurDrawWidth = dimensions.width;
                            blurDrawHeight = dimensions.width / blurImgAspect;
                        }

                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = dimensions.width;
                        tempCanvas.height = dimensions.height;
                        const tempCtx = tempCanvas.getContext('2d');
                        tempCtx.save();
                        tempCtx.translate(centerX + blurImgX, centerY + blurImgY);
                        tempCtx.rotate((blurImageRotation * Math.PI) / 180);
                        tempCtx.scale(blurImageScale, blurImageScale);
                        tempCtx.drawImage(blurSourceImage, -blurDrawWidth / 2, -blurDrawHeight / 2, blurDrawWidth, blurDrawHeight);
                        tempCtx.restore();
                        canvasRGBA(tempCanvas, 0, 0, dimensions.width, dimensions.height, blurIntensity);
                        ctx.drawImage(tempCanvas, 0, 0);
                    }
                }

                // Draw base image
                if (baseImage) {
                    // Calculate image dimensions to fill canvas
                    const imgAspect = baseImage.width / baseImage.height;
                    const canvasAspect = dimensions.width / dimensions.height;

                    let drawWidth = dimensions.width;
                    let drawHeight = dimensions.height;

                    if (imgAspect > canvasAspect) {
                        drawWidth = dimensions.height * imgAspect;
                        drawHeight = dimensions.height;
                    } else {
                        drawWidth = dimensions.width;
                        drawHeight = dimensions.width / imgAspect;
                    }

                    // Draw main image with transformations
                    ctx.save();

                    // Center point of canvas
                    const centerX = dimensions.width / 2;
                    const centerY = dimensions.height / 2;

                    // Apply position offset (scaled to canvas coordinates)
                    const imgX = imagePosition.x / scale;
                    const imgY = imagePosition.y / scale;

                    // Move to center + offset
                    ctx.translate(centerX + imgX, centerY + imgY);

                    // Apply rotation around the center
                    ctx.rotate((imageRotation * Math.PI) / 180);

                    // Apply zoom
                    ctx.scale(imageScale, imageScale);

                    // Draw image centered at origin (which is now at centerX + offset)
                    ctx.drawImage(baseImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

                    ctx.restore();
                }

                // Draw overlays only if enabled
                if (showOverlay) {
                    // Draw selected additional overlay for current aspect ratio
                    const overlayKey = `${selectedOverlay}-${overlayColor}-${aspectRatio}`;
                    const currentAdditionalOverlay = additionalOverlays[overlayKey];
                    if (currentAdditionalOverlay) {
                        ctx.drawImage(currentAdditionalOverlay, 0, 0, dimensions.width, dimensions.height);
                    }

                    // Draw permanent overlay for current aspect ratio
                    const permanentOverlayKey = `${overlayColor}-${aspectRatio}`;
                    const currentPermanentOverlay = permanentOverlays[permanentOverlayKey];
                    if (currentPermanentOverlay) {
                        ctx.drawImage(currentPermanentOverlay, 0, 0, dimensions.width, dimensions.height);
                    }
                }

                // Draw text elements (calculate positions from bottom to top with margins)
                const bottomMargin = aspectRatio === '9:16' ? 106 : 31;
                const isCustomOverlay = selectedOverlay === 'custom';
                let currentBottomY = dimensions.height - bottomMargin;
                const textBoxHeights = [];

                // First pass: calculate all text box heights
                textElements.forEach((el, index) => {
                    // Use global settings if not using custom settings
                    const rawFontSize = el.useCustomSettings ? el.fontSize : globalFontSize;
                    const fontSize = (typeof rawFontSize === 'number' && !isNaN(rawFontSize) && rawFontSize > 0) ? rawFontSize : 40;
                    const fontFamily = el.useCustomSettings ? (el.fontFamily || 'Helvetica Neue') : globalFontFamily;
                    const fontStyle = el.useCustomSettings ? (el.fontStyle || 'normal') : globalFontStyle;
                    const fontWeight = el.useCustomSettings ? (el.fontWeight || 'normal') : globalFontWeight;
                    const textCase = el.useCustomSettings ? (el.textCase || 'default') : globalTextCase;

                    // Skip calculation if fontSize is invalid
                    if (typeof rawFontSize !== 'number' || isNaN(rawFontSize) || rawFontSize <= 0) {
                        textBoxHeights.push({ height: 0, marginBottom: 0 });
                        return;
                    }

                    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
                    const lineHeight = fontSize * 1.2;
                    const paddingVertical = 40;

                    const transformTextCase = (text, textCase) => {
                        if (!textCase || textCase === 'default') return text;
                        switch (textCase) {
                            case 'uppercase': return text.toUpperCase();
                            case 'lowercase': return text.toLowerCase();
                            case 'capitalize': return text.replace(/\b\w/g, l => l.toUpperCase());
                            default: return text;
                        }
                    };

                    const transformedText = transformTextCase(el.text, textCase);
                    const textMargin = 30;
                    const availableTextWidth = 965 - (textMargin * 2);

                    const wrapText = (text, maxWidth) => {
                        const paragraphs = text.split('\n');
                        const allLines = [];
                        paragraphs.forEach(paragraph => {
                            if (paragraph.trim() === '') {
                                allLines.push('');
                                return;
                            }
                            const mdSegs = parseMarkdown(paragraph);
                            let lineWidth = 0;
                            let lineHasWords = false;
                            const flushLine = () => { allLines.push('x'); lineWidth = 0; lineHasWords = false; };
                            for (const seg of mdSegs) {
                                const segWeight = seg.bold ? 'bold' : fontWeight;
                                const segStyle = seg.italic ? 'italic' : fontStyle;
                                ctx.font = `${segStyle} ${segWeight} ${fontSize}px ${fontFamily}`;
                                for (const word of seg.text.split(' ')) {
                                    if (word === '') continue;
                                    const prefix = lineHasWords ? ' ' : '';
                                    const w = ctx.measureText(prefix + word).width;
                                    if (lineHasWords && lineWidth + w > maxWidth) {
                                        flushLine();
                                        lineWidth = ctx.measureText(word).width;
                                        lineHasWords = true;
                                    } else {
                                        lineWidth += w;
                                        lineHasWords = true;
                                    }
                                }
                            }
                            if (lineHasWords) flushLine();
                        });
                        return allLines;
                    };

                    const lines = wrapText(transformedText, availableTextWidth);
                    const totalTextHeight = lines.length * lineHeight;
                    const rectHeight = totalTextHeight + paddingVertical * 2;

                    textBoxHeights.push({
                        height: rectHeight,
                        marginBottom: textBoxMargin
                    });
                });

                // Second pass: render text elements from bottom to top
                for (let index = 0; index < textElements.length; index++) {
                    const el = textElements[index];
                    // Use global settings if not using custom settings
                    const rawFontSize = el.useCustomSettings ? el.fontSize : globalFontSize;
                    const fontSize = (typeof rawFontSize === 'number' && !isNaN(rawFontSize) && rawFontSize > 0) ? rawFontSize : 40;
                    const fontFamily = el.useCustomSettings ? (el.fontFamily || 'Helvetica Neue') : globalFontFamily;
                    const fontStyle = el.useCustomSettings ? (el.fontStyle || 'normal') : globalFontStyle;
                    const fontWeight = el.useCustomSettings ? (el.fontWeight || 'normal') : globalFontWeight;
                    const textCase = el.useCustomSettings ? (el.textCase || 'default') : globalTextCase;
                    const textAlign = el.useCustomSettings ? (el.textAlign || 'left') : globalTextAlign;
                    const justify = el.useCustomSettings ? (el.justify || false) : globalJustify;
                    const color = el.useCustomSettings ? (el.color || '#ffffff') : globalColor;

                    // Skip rendering if fontSize is invalid
                    if (typeof rawFontSize !== 'number' || isNaN(rawFontSize) || rawFontSize <= 0) {
                        continue;
                    }

                    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
                    const maxWidth = el.maxWidth || dimensions.width - 100;
                    const lineHeight = fontSize * 1.2;
                    const paddingVertical = 40; // Top and bottom padding
                    const paddingHorizontal = 20; // Left and right padding (for the box itself)
                    const textMargin = 30; // Margin inside the textbox for text

                    // Text case transformation function
                    const transformTextCase = (text, textCase) => {
                        if (!textCase || textCase === 'default') return text;

                        switch (textCase) {
                            case 'uppercase':
                                return text.toUpperCase();
                            case 'lowercase':
                                return text.toLowerCase();
                            case 'titlecase':
                                return text.replace(/\w\S*/g, (word) =>
                                    word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
                                );
                            case 'sentencecase':
                                return text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase());
                            default:
                                return text;
                        }
                    };

                    // Apply text case transformation
                    const transformedText = transformTextCase(el.text, textCase);

                    const wrapMarkdownSegments = (text, maxWidth) => {
                        const paragraphs = text.split('\n');
                        const allLines = [];
                        paragraphs.forEach(paragraph => {
                            if (paragraph.trim() === '') {
                                allLines.push([{ text: '', bold: false, italic: false }]);
                                return;
                            }
                            const mdSegs = parseMarkdown(paragraph);
                            let lineSegs = [];
                            let lineWidth = 0;
                            const flushLine = () => { allLines.push(lineSegs); lineSegs = []; lineWidth = 0; };
                            for (const seg of mdSegs) {
                                const segWeight = seg.bold ? 'bold' : fontWeight;
                                const segStyle = seg.italic ? 'italic' : fontStyle;
                                ctx.font = `${segStyle} ${segWeight} ${fontSize}px ${fontFamily}`;
                                for (const word of seg.text.split(' ')) {
                                    if (word === '') continue;
                                    const hasContent = lineWidth > 0 || lineSegs.length > 0;
                                    const prefix = hasContent ? ' ' : '';
                                    const w = ctx.measureText(prefix + word).width;
                                    if (hasContent && lineWidth + w > maxWidth) {
                                        flushLine();
                                        lineSegs = [{ text: word, bold: seg.bold, italic: seg.italic }];
                                        lineWidth = ctx.measureText(word).width;
                                    } else {
                                        const last = lineSegs[lineSegs.length - 1];
                                        if (last && last.bold === seg.bold && last.italic === seg.italic) {
                                            last.text += prefix + word;
                                        } else {
                                            lineSegs.push({ text: prefix + word, bold: seg.bold, italic: seg.italic });
                                        }
                                        lineWidth += ctx.measureText(prefix + word).width;
                                    }
                                }
                            }
                            if (lineSegs.length > 0) flushLine();
                        });
                        return allLines;
                    };

                    // Calculate available width for text (textbox width minus margins)
                    const availableTextWidth = 965 - (textMargin * 2);
                    const mdLines = wrapMarkdownSegments(transformedText, availableTextWidth);

                    // Calculate text block dimensions
                    const totalTextHeight = mdLines.length * lineHeight;

                    // Set fixed width to 965px
                    let textBoxWidth = 965;

                    // Rectangle dimensions
                    const rectHeight = totalTextHeight + paddingVertical * 2;

                    // Calculate stacked position from bottom to top
                    const rectX = dimensions.width / 2 - textBoxWidth / 2;
                    const rectY = currentBottomY - rectHeight;

                    // Update currentBottomY for next textbox (add margin)
                    currentBottomY = rectY - textBoxMargin;

                    // Draw rectangle with gradient background and rounded corners
                    ctx.save();

                    const borderRadius = 50;

                    // Create gradient (top to bottom: 55% transparent to black)
                    const gradient = ctx.createLinearGradient(rectX, rectY, rectX, rectY + rectHeight);
                    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
                    gradient.addColorStop(1, 'rgba(0, 0, 0, 1.0)');

                    // Draw filled rounded rectangle with gradient
                    ctx.fillStyle = gradient;
                    ctx.beginPath();

                    // Only the top textbox (last index) should have square top corners with Custom overlay
                    const isTopTextbox = index === textElements.length - 1;
                    if (showBanner && isCustomOverlay && isTopTextbox) {
                        // Square top corners, rounded bottom corners
                        ctx.moveTo(rectX, rectY);
                        ctx.lineTo(rectX + textBoxWidth, rectY);
                        ctx.lineTo(rectX + textBoxWidth, rectY + rectHeight - borderRadius);
                        ctx.arcTo(rectX + textBoxWidth, rectY + rectHeight, rectX + textBoxWidth - borderRadius, rectY + rectHeight, borderRadius);
                        ctx.lineTo(rectX + borderRadius, rectY + rectHeight);
                        ctx.arcTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - borderRadius, borderRadius);
                        ctx.lineTo(rectX, rectY);
                    } else {
                        // All corners rounded
                        ctx.moveTo(rectX + borderRadius, rectY);
                        ctx.lineTo(rectX + textBoxWidth - borderRadius, rectY);
                        ctx.arcTo(rectX + textBoxWidth, rectY, rectX + textBoxWidth, rectY + borderRadius, borderRadius);
                        ctx.lineTo(rectX + textBoxWidth, rectY + rectHeight - borderRadius);
                        ctx.arcTo(rectX + textBoxWidth, rectY + rectHeight, rectX + textBoxWidth - borderRadius, rectY + rectHeight, borderRadius);
                        ctx.lineTo(rectX + borderRadius, rectY + rectHeight);
                        ctx.arcTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - borderRadius, borderRadius);
                        ctx.lineTo(rectX, rectY + borderRadius);
                        ctx.arcTo(rectX, rectY, rectX + borderRadius, rectY, borderRadius);
                    }

                    ctx.closePath();
                    ctx.fill();

                    // Draw white inside stroke (2px) with rounded corners
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    const strokeInset = 1;
                    const innerRadius = borderRadius - strokeInset;
                    ctx.beginPath();

                    if (showBanner && isCustomOverlay && isTopTextbox) {
                        // Square top corners, rounded bottom corners
                        ctx.moveTo(rectX + strokeInset, rectY + strokeInset);
                        ctx.lineTo(rectX + textBoxWidth - strokeInset, rectY + strokeInset);
                        ctx.lineTo(rectX + textBoxWidth - strokeInset, rectY + rectHeight - strokeInset - innerRadius);
                        ctx.arcTo(rectX + textBoxWidth - strokeInset, rectY + rectHeight - strokeInset, rectX + textBoxWidth - strokeInset - innerRadius, rectY + rectHeight - strokeInset, innerRadius);
                        ctx.lineTo(rectX + strokeInset + innerRadius, rectY + rectHeight - strokeInset);
                        ctx.arcTo(rectX + strokeInset, rectY + rectHeight - strokeInset, rectX + strokeInset, rectY + rectHeight - strokeInset - innerRadius, innerRadius);
                        ctx.lineTo(rectX + strokeInset, rectY + strokeInset);
                    } else {
                        // All corners rounded
                        ctx.moveTo(rectX + strokeInset + innerRadius, rectY + strokeInset);
                        ctx.lineTo(rectX + textBoxWidth - strokeInset - innerRadius, rectY + strokeInset);
                        ctx.arcTo(rectX + textBoxWidth - strokeInset, rectY + strokeInset, rectX + textBoxWidth - strokeInset, rectY + strokeInset + innerRadius, innerRadius);
                        ctx.lineTo(rectX + textBoxWidth - strokeInset, rectY + rectHeight - strokeInset - innerRadius);
                        ctx.arcTo(rectX + textBoxWidth - strokeInset, rectY + rectHeight - strokeInset, rectX + textBoxWidth - strokeInset - innerRadius, rectY + rectHeight - strokeInset, innerRadius);
                        ctx.lineTo(rectX + strokeInset + innerRadius, rectY + rectHeight - strokeInset);
                        ctx.arcTo(rectX + strokeInset, rectY + rectHeight - strokeInset, rectX + strokeInset, rectY + rectHeight - strokeInset - innerRadius, innerRadius);
                        ctx.lineTo(rectX + strokeInset, rectY + strokeInset + innerRadius);
                        ctx.arcTo(rectX + strokeInset, rectY + strokeInset, rectX + strokeInset + innerRadius, rectY + strokeInset, innerRadius);
                    }

                    ctx.closePath();
                    ctx.stroke();

                    ctx.restore();

                    // Draw text on top
                    ctx.fillStyle = color;
                    ctx.textBaseline = 'top';

                    // Calculate starting Y position for text (with padding)
                    const textStartY = rectY + paddingVertical;

                    // Draw lines from top to bottom with markdown support
                    const renderLines = async () => {
                        for (let i = 0; i < mdLines.length; i++) {
                            const lineSegments = mdLines[i];
                            const lineY = textStartY + (i * lineHeight);

                            // Calculate total line width for alignment (including emojis)
                            let totalLineWidth = 0;
                            for (const seg of lineSegments) {
                                const segWeight = seg.bold ? 'bold' : fontWeight;
                                const segStyle = seg.italic ? 'italic' : fontStyle;
                                ctx.font = `${segStyle} ${segWeight} ${fontSize}px ${fontFamily}`;
                                totalLineWidth += measureTextWithEmoji(seg.text, fontSize);
                            }

                            // Calculate starting X based on alignment
                            let startX;
                            if (textAlign === 'center') {
                                startX = rectX + textBoxWidth / 2 - totalLineWidth / 2;
                            } else if (textAlign === 'right') {
                                startX = rectX + textBoxWidth - textMargin - totalLineWidth;
                            } else {
                                startX = rectX + textMargin;
                            }

                            // Draw each segment with its styling
                            let currentX = startX;
                            for (const seg of lineSegments) {
                                const segWeight = seg.bold ? 'bold' : fontWeight;
                                const segStyle = seg.italic ? 'italic' : fontStyle;
                                ctx.font = `${segStyle} ${segWeight} ${fontSize}px ${fontFamily}`;
                                ctx.textAlign = 'left';

                                const width = await renderTextWithEmoji(seg.text, currentX, lineY, fontSize, fontFamily);
                                currentX += width;
                            }
                        }
                    };

                    await renderLines();
                }

                // Draw tag banner on top of the topmost textbox (when Custom overlay is selected)
                if (showBanner && isCustomOverlay && textElements.length > 0) {
                    // Validate banner values before rendering
                    const validBannerFontSize = typeof bannerFontSize === 'number' && !isNaN(bannerFontSize) && bannerFontSize > 0;
                    const validBannerLetterSpacing = typeof bannerLetterSpacing === 'number' && !isNaN(bannerLetterSpacing);
                    const validBannerOpacity = typeof bannerOpacity === 'number' && !isNaN(bannerOpacity);

                    if (validBannerFontSize && validBannerLetterSpacing && validBannerOpacity) {
                        // Get the topmost textbox position (last one rendered)
                        const topmostIndex = textElements.length - 1;

                        // Calculate the position from the textBoxHeights
                        let bannerY = dimensions.height - bottomMargin;
                        for (let i = 0; i < textElements.length; i++) {
                            bannerY -= textBoxHeights[i].height;
                            if (i < textElements.length - 1) {
                                bannerY -= textBoxMargin;
                            }
                        }

                        const bannerWidth = 965;
                        const bannerHeight = 89;
                        const bannerX = dimensions.width / 2 - bannerWidth / 2;
                        const bannerTopY = bannerY - bannerHeight + 1;

                        // Draw banner rectangle with color fill and rounded top corners
                        ctx.save();
                    const bannerTopRadius = 35.5;

                    // Convert hex color to rgba with opacity
                    const hexToRgba = (hex, alpha) => {
                        const r = parseInt(hex.slice(1, 3), 16);
                        const g = parseInt(hex.slice(3, 5), 16);
                        const b = parseInt(hex.slice(5, 7), 16);
                        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                    };

                    // Draw filled rounded rectangle (rounded top corners, sharp bottom corners)
                    ctx.fillStyle = hexToRgba(bannerColor, bannerOpacity);
                    ctx.beginPath();
                    ctx.moveTo(bannerX + bannerTopRadius, bannerTopY);
                    ctx.lineTo(bannerX + bannerWidth - bannerTopRadius, bannerTopY);
                    ctx.arcTo(bannerX + bannerWidth, bannerTopY, bannerX + bannerWidth, bannerTopY + bannerTopRadius, bannerTopRadius);
                    ctx.lineTo(bannerX + bannerWidth, bannerTopY + bannerHeight);
                    ctx.lineTo(bannerX, bannerTopY + bannerHeight);
                    ctx.lineTo(bannerX, bannerTopY + bannerTopRadius);
                    ctx.arcTo(bannerX, bannerTopY, bannerX + bannerTopRadius, bannerTopY, bannerTopRadius);
                    ctx.closePath();
                    ctx.fill();

                    // Draw 2px white inside stroke (same as text boxes)
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    const bannerStrokeInset = 1;
                    const bannerInnerRadius = bannerTopRadius - bannerStrokeInset;
                    ctx.beginPath();
                    ctx.moveTo(bannerX + bannerStrokeInset + bannerInnerRadius, bannerTopY + bannerStrokeInset);
                    ctx.lineTo(bannerX + bannerWidth - bannerStrokeInset - bannerInnerRadius, bannerTopY + bannerStrokeInset);
                    ctx.arcTo(bannerX + bannerWidth - bannerStrokeInset, bannerTopY + bannerStrokeInset, bannerX + bannerWidth - bannerStrokeInset, bannerTopY + bannerStrokeInset + bannerInnerRadius, bannerInnerRadius);
                    ctx.lineTo(bannerX + bannerWidth - bannerStrokeInset, bannerTopY + bannerHeight);
                    ctx.lineTo(bannerX + bannerStrokeInset, bannerTopY + bannerHeight);
                    ctx.lineTo(bannerX + bannerStrokeInset, bannerTopY + bannerStrokeInset + bannerInnerRadius);
                    ctx.arcTo(bannerX + bannerStrokeInset, bannerTopY + bannerStrokeInset, bannerX + bannerStrokeInset + bannerInnerRadius, bannerTopY + bannerStrokeInset, bannerInnerRadius);
                    ctx.closePath();
                    ctx.stroke();

                    // Apply text case transformation
                    const transformBannerText = (text) => {
                        switch (bannerTextCase) {
                            case 'uppercase': return text.toUpperCase();
                            case 'lowercase': return text.toLowerCase();
                            case 'titlecase': return text.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase());
                            case 'sentencecase': return text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase());
                            default: return text;
                        }
                    };

                    const displayText = transformBannerText(bannerText);

                    // Draw banner text with letter spacing and emoji support
                    ctx.fillStyle = '#ffffff';
                    ctx.font = `${bannerFontStyle} ${bannerFontWeight} ${bannerFontSize}px ${bannerFontFamily}`;
                    ctx.textBaseline = 'middle';

                    // Parse text for emojis
                    const bannerSegments = parseTextWithEmoji(displayText);
                    const letterSpacingPx = bannerFontSize * bannerLetterSpacing;

                    // Calculate widths for each segment
                    const segmentWidths = [];
                    let totalTextWidth = 0;
                    for (const seg of bannerSegments) {
                        if (seg.type === 'text') {
                            // Split text into characters for letter spacing
                            const chars = seg.content.split('');
                            const charWidths = chars.map(char => ctx.measureText(char).width);
                            const segWidth = charWidths.reduce((sum, w) => sum + w, 0) + (letterSpacingPx * (chars.length - 1));
                            segmentWidths.push({ type: 'text', chars, charWidths, width: segWidth });
                            totalTextWidth += segWidth;
                        } else {
                            // Emoji
                            const emojiWidth = bannerFontSize;
                            segmentWidths.push({ type: 'emoji', codePoint: seg.codePoint, width: emojiWidth });
                            totalTextWidth += emojiWidth + letterSpacingPx;
                        }
                    }

                    // Calculate starting X based on alignment (using same 30px padding as textboxes)
                    const bannerTextMargin = 30;
                    let textX;
                    if (bannerTextAlign === 'center') {
                        textX = bannerX + (bannerWidth / 2) - (totalTextWidth / 2);
                    } else if (bannerTextAlign === 'right') {
                        textX = bannerX + bannerWidth - bannerTextMargin - totalTextWidth;
                    } else {
                        textX = bannerX + bannerTextMargin;
                    }

                    const textY = bannerTopY + (bannerHeight / 2);

                    // Draw each segment with custom letter spacing
                    const renderBannerText = async () => {
                        let currentX = textX;
                        for (const seg of segmentWidths) {
                            if (seg.type === 'text') {
                                // Draw characters with letter spacing
                                for (let i = 0; i < seg.chars.length; i++) {
                                    ctx.fillText(seg.chars[i], currentX, textY);
                                    currentX += seg.charWidths[i] + letterSpacingPx;
                                }
                            } else {
                                // Draw emoji
                                try {
                                    const emojiImg = await loadEmojiImage(seg.codePoint);
                                    const emojiSize = bannerFontSize;
                                    // Banner uses textBaseline 'middle', so center the emoji vertically
                                    // Singing Sans specific offset
                                    let bannerEmojiOffset = 0;
                                    if (bannerFontFamily === 'Singing Sans') bannerEmojiOffset = -0.10;
                                    const bannerEmojiY = textY - emojiSize / 2 + bannerFontSize * bannerEmojiOffset;
                                    ctx.drawImage(emojiImg, currentX, bannerEmojiY, emojiSize, emojiSize);
                                    currentX += emojiSize + letterSpacingPx;
                                } catch (error) {
                                    // Skip on error
                                    currentX += seg.width + letterSpacingPx;
                                }
                            }
                        }
                    };

                    await renderBannerText();

                    ctx.restore();
                    }
                }

                // Draw photo credit rotated vertically along the left edge
                if (photoCredit.trim()) {
                    ctx.save();
                    ctx.globalAlpha = 0.5;
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '400 20px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.translate(15, dimensions.height / 2);
                    ctx.rotate(-Math.PI / 2);
                    ctx.fillText(photoCredit, 0, 0);
                    ctx.restore();
                }

                // Draw 3:4 safe area centered on all aspect ratios if enabled (only for display, not export)
                // This is drawn LAST so it overlays everything
                if (showSafeMargins && includeSafeMargins) {
                    ctx.save();

                    // 3:4 safe area (1080x1440) - centered on the canvas
                    // Scale to fit within canvas if necessary
                    const targetRatio = 3 / 4; // width/height for 3:4
                    const canvasRatio = dimensions.width / dimensions.height;

                    let safeWidth, safeHeight, marginLeft, marginTop;

                    if (canvasRatio > targetRatio) {
                        // Canvas is wider than 3:4, fit by height
                        safeHeight = dimensions.height;
                        safeWidth = safeHeight * targetRatio;
                        marginLeft = (dimensions.width - safeWidth) / 2;
                        marginTop = 0;
                    } else {
                        // Canvas is taller than 3:4, fit by width
                        safeWidth = dimensions.width;
                        safeHeight = safeWidth / targetRatio;
                        marginLeft = 0;
                        marginTop = (dimensions.height - safeHeight) / 2;
                    }

                    // Draw semi-transparent black overlay on areas outside safe area
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';

                    // Top area (if any)
                    if (marginTop > 0) {
                        ctx.fillRect(0, 0, dimensions.width, marginTop);
                    }

                    // Bottom area (if any)
                    if (marginTop + safeHeight < dimensions.height) {
                        ctx.fillRect(0, marginTop + safeHeight, dimensions.width, dimensions.height - (marginTop + safeHeight));
                    }

                    // Left area (if any)
                    if (marginLeft > 0) {
                        ctx.fillRect(0, 0, marginLeft, dimensions.height);
                    }

                    // Right area (if any)
                    if (marginLeft + safeWidth < dimensions.width) {
                        ctx.fillRect(marginLeft + safeWidth, 0, dimensions.width - (marginLeft + safeWidth), dimensions.height);
                    }

                    // Draw red dashed border around safe area
                    ctx.strokeStyle = '#ff0000';
                    ctx.lineWidth = 3;
                    ctx.setLineDash([10, 5]);
                    ctx.strokeRect(marginLeft, marginTop, safeWidth, safeHeight);

                    // Add label with background for better visibility
                    ctx.setLineDash([]);
                    ctx.font = 'bold 24px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    const labelText = '3:4 Safe Area';
                    const textMetrics = ctx.measureText(labelText);
                    const textWidth = textMetrics.width;
                    const textHeight = 24; // font size
                    const padding = 8;

                    // Calculate label position (center of background box)
                    const labelY = marginTop > 30 ? marginTop - 20 : marginTop + 20;

                    // Draw background rectangle
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.fillRect(
                        dimensions.width / 2 - textWidth / 2 - padding,
                        labelY - textHeight / 2 - padding,
                        textWidth + padding * 2,
                        textHeight + padding * 2
                    );

                    // Draw white text on top (centered in the box)
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(labelText, dimensions.width / 2, labelY);

                    ctx.restore();
                }
            };

            useEffect(() => {
                if (fontsLoaded) {
                    renderCanvas().catch(err => console.error('Render error:', err));
                }
            }, [baseImage, permanentOverlays, selectedOverlay, textElements, imageScale, imagePosition, imageRotation, aspectRatio, additionalOverlays, showSafeMargins, useBlurBackground, blurIntensity, blurImage, useBaseImageForBlur, blurImageScale, blurImagePosition, blurImageRotation, textBoxMargin, globalFontSize, globalColor, globalFontFamily, globalFontWeight, globalFontStyle, globalTextAlign, globalJustify, globalTextCase, bannerText, bannerLetterSpacing, bannerColor, bannerFontSize, bannerFontFamily, bannerFontWeight, bannerFontStyle, bannerTextAlign, bannerTextCase, bannerOpacity, showBanner, showOverlay, photoCredit, fontsLoaded]);

            // Reposition text elements when aspect ratio changes
            useEffect(() => {
                setTextElements(prev => prev.map(el => {
                    const bottomMargin = aspectRatio === '9:16' ? 106 : 31;
                    const yPosition = dimensions.height - bottomMargin;
                    const xPosition = dimensions.width / 2;

                    return {
                        ...el,
                        x: xPosition,
                        y: yPosition,
                        maxWidth: dimensions.width - 100
                    };
                }));
            }, [aspectRatio, selectedOverlay, overlayColor]);

            const exportImage = async () => {
                console.log('📸 EXPORT BUTTON CLICKED - React handler fired!');
                const canvas = canvasRef.current;
                if (!canvas) {
                    console.log('❌ Canvas not ready');
                    alert('Canvas not ready. Please try again.');
                    return;
                }
                console.log('✅ Starting export...');

                try {
                    // Re-render canvas without safe margins for export
                    await renderCanvas(false);

                    // Get blob from canvas
                    const blob = await new Promise((resolve, reject) => {
                        canvas.toBlob((blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error('Failed to create blob from canvas'));
                            }
                        }, 'image/png');
                    });

                    // Create download using anchor tag
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = `instagram-${aspectRatio}-${Date.now()}.png`;
                    link.href = url;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();

                    // Clean up
                    setTimeout(() => {
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                    }, 100);

                    // Re-render with safe margins for display
                    await renderCanvas(true);
                } catch (error) {
                    console.error('Export error:', error);
                    alert('Failed to export image. Error: ' + error.message);
                    // Re-render with safe margins even on error
                    await renderCanvas(true);
                }
            };

            const copyImage = async () => {
                const canvas = canvasRef.current;
                if (!canvas) {
                    alert('Canvas not ready. Please try again.');
                    return;
                }

                try {
                    // Re-render canvas without safe margins for copy/share
                    await renderCanvas(false);

                    // Get blob from canvas
                    const blob = await new Promise((resolve, reject) => {
                        canvas.toBlob((blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error('Failed to create blob from canvas'));
                            }
                        }, 'image/png', 1.0);
                    });

                    // Check if we're on mobile and Share API is available
                    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

                    if (isMobile && navigator.share) {
                        // Use Share API on mobile
                        const file = new File([blob], `instagram-${aspectRatio}-${Date.now()}.png`, { type: 'image/png' });
                        await navigator.share({
                            files: [file],
                            title: 'Instagram Post',
                            text: 'Created with Instagram Template Editor'
                        });
                    } else if (navigator.clipboard && window.ClipboardItem) {
                        // Use Clipboard API on desktop
                        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                        alert('Image copied to clipboard!');
                    } else {
                        // Fallback: download the image
                        const dataUrl = canvas.toDataURL('image/png');
                        const link = document.createElement('a');
                        link.download = `instagram-${aspectRatio}-${Date.now()}.png`;
                        link.href = dataUrl;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        alert('Image downloaded.');
                    }

                    // Re-render with safe margins for display
                    await renderCanvas(true);
                } catch (error) {
                    console.error('Copy/Share error:', error);

                    // If share fails, fallback to download
                    if (error.name === 'AbortError') {
                        // User cancelled share - do nothing
                    } else {
                        alert('Failed to share/copy image. Error: ' + error.message);
                    }

                    // Re-render with safe margins even on error
                    await renderCanvas(true);
                }
            };

            return (
                <div className="bg-gray-900">
                    <div className="max-w-7xl mx-auto py-4">
                        <div className="lg:grid lg:grid-cols-3 lg:gap-6 lg:px-4">
                            {/* Canvas - Always visible */}
                            <div className="lg:col-span-2 canvas-wrapper">
                                <div className="bg-gray-800 rounded-lg shadow-lg p-2 md:p-4 mx-2 md:mx-0 lg:sticky lg:top-4">
                                    <div className="mb-3 flex flex-wrap gap-1 md:gap-2">
                                        {Object.entries(ASPECT_RATIOS).map(([key, value]) => (
                                            <button
                                                key={key}
                                                onClick={() => setAspectRatio(key)}
                                                className={`px-2 md:px-4 py-1.5 md:py-2 rounded-lg text-sm md:text-base font-medium transition ${
                                                    aspectRatio === key
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                                }`}
                                            >
                                                {value.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Safe margins toggle for all aspect ratios */}
                                    <div className="mt-2 mb-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={showSafeMargins}
                                                onChange={(e) => setShowSafeMargins(e.target.checked)}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            <span className="text-xs md:text-sm text-gray-200 font-medium">
                                                Show 3:4 Safe Area (Instagram Grid Crop)
                                            </span>
                                        </label>
                                    </div>

                                    <div
                                        ref={containerRef}
                                        className="canvas-container relative mx-auto bg-gray-600 rounded-lg overflow-hidden"
                                        style={{
                                            width: maxCanvasWidth,
                                            height: canvasHeight,
                                            cursor: isDragging ? 'grabbing' : 'grab'
                                        }}
                                        onMouseDown={handleImageDragStart}
                                        onTouchStart={handleImageDragStart}
                                    >
                                        <canvas
                                            ref={canvasRef}
                                            width={dimensions.width}
                                            height={dimensions.height}
                                            style={{
                                                width: '100%',
                                                height: '100%'
                                            }}
                                        />
                                    </div>

                                    {baseImage && (
                                        <div className="mt-3 md:mt-4 space-y-3">
                                            {/* Quick fit buttons */}
                                            <div className="flex gap-2 pb-2 border-b border-gray-600">
                                                <button
                                                    onClick={() => {
                                                        // Crop to fit: reset to default (fills canvas)
                                                        setImageScale(1);
                                                        setImagePosition({ x: 0, y: 0 });
                                                    }}
                                                    className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-200 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                                                >
                                                    Crop to fit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        // Fit to page: calculate scale to fit entire image within canvas
                                                        const imgAspect = baseImage.width / baseImage.height;
                                                        const canvasAspect = dimensions.width / dimensions.height;

                                                        let scale;
                                                        if (imgAspect > canvasAspect) {
                                                            // Image is wider - it's being stretched horizontally to fill
                                                            // To fit, scale down by the width ratio
                                                            const drawWidth = dimensions.height * imgAspect;
                                                            scale = dimensions.width / drawWidth;
                                                        } else {
                                                            // Image is taller - it's being stretched vertically to fill
                                                            // To fit, scale down by the height ratio
                                                            const drawHeight = dimensions.width / imgAspect;
                                                            scale = dimensions.height / drawHeight;
                                                        }

                                                        setImageScale(scale);
                                                        setImagePosition({ x: 0, y: 0 });
                                                    }}
                                                    className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-200 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                                                >
                                                    Fit to page
                                                </button>
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <label className="text-xs md:text-sm font-medium text-gray-200 whitespace-nowrap">
                                                        Zoom
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0.1"
                                                        max="3"
                                                        step="0.01"
                                                        value={imageScale.toFixed(2)}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            if (!isNaN(val)) setImageScale(val);
                                                        }}
                                                        className="w-20 px-2 py-1 text-xs border border-gray-600 rounded"
                                                    />
                                                    <button
                                                        onClick={() => setImageScale(1)}
                                                        className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                    >
                                                        Reset
                                                    </button>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0.1"
                                                    max="3"
                                                    step="0.01"
                                                    value={imageScale}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val)) setImageScale(val);
                                                    }}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <label className="text-xs md:text-sm font-medium text-gray-200 whitespace-nowrap">
                                                        X Position
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="-500"
                                                        max="500"
                                                        value={imagePosition.x.toFixed(0)}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            if (!isNaN(val)) setImagePosition(prev => ({ ...prev, x: val }));
                                                        }}
                                                        className="w-20 px-2 py-1 text-xs border border-gray-600 rounded"
                                                    />
                                                    <button
                                                        onClick={() => setImagePosition(prev => ({ ...prev, x: 0 }))}
                                                        className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                    >
                                                        Reset
                                                    </button>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="-500"
                                                    max="500"
                                                    step="1"
                                                    value={imagePosition.x}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val)) setImagePosition(prev => ({ ...prev, x: val }));
                                                    }}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <label className="text-xs md:text-sm font-medium text-gray-200 whitespace-nowrap">
                                                        Y Position
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="-500"
                                                        max="500"
                                                        value={imagePosition.y.toFixed(0)}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            if (!isNaN(val)) setImagePosition(prev => ({ ...prev, y: val }));
                                                        }}
                                                        className="w-20 px-2 py-1 text-xs border border-gray-600 rounded"
                                                    />
                                                    <button
                                                        onClick={() => setImagePosition(prev => ({ ...prev, y: 0 }))}
                                                        className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                    >
                                                        Reset
                                                    </button>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="-500"
                                                    max="500"
                                                    step="1"
                                                    value={imagePosition.y}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val)) setImagePosition(prev => ({ ...prev, y: val }));
                                                    }}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs md:text-sm font-medium text-gray-200 mb-2">
                                                    Rotation
                                                </label>
                                                <div className="grid grid-cols-4 gap-2">
                                                    <button
                                                        onClick={() => setImageRotation((imageRotation + 90) % 360)}
                                                        className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium transition"
                                                        title="Rotate 90° clockwise"
                                                    >
                                                        90°
                                                    </button>
                                                    <button
                                                        onClick={() => setImageRotation((imageRotation + 180) % 360)}
                                                        className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium transition"
                                                        title="Rotate 180°"
                                                    >
                                                        180°
                                                    </button>
                                                    <button
                                                        onClick={() => setImageRotation((imageRotation + 270) % 360)}
                                                        className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium transition"
                                                        title="Rotate 270° clockwise (90° counter-clockwise)"
                                                    >
                                                        270°
                                                    </button>
                                                    <button
                                                        onClick={() => setImageRotation(0)}
                                                        className="px-2 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium transition"
                                                        title="Reset rotation"
                                                    >
                                                        Reset
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 mt-3 md:mt-4">
                                        <button
                                            onClick={copyImage}
                                            className="bg-blue-600 text-white px-3 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-semibold hover:bg-blue-700 transition"
                                        >
                                            <span className="hidden md:inline">Copy</span>
                                            <span className="md:hidden">Share</span>
                                        </button>
                                        <button
                                            onClick={exportImage}
                                            className="bg-green-600 text-white px-3 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-semibold hover:bg-green-700 transition"
                                        >
                                            Export as PNG
                                        </button>
                                    </div>

                                    {/* Mobile Controls Toggle */}
                                    <button
                                        onClick={() => {
                                            console.log('🎛️ CONTROLS TOGGLE CLICKED - React handler fired!');
                                            setShowMobileControls(!showMobileControls);
                                        }}
                                        className="lg:hidden w-full mt-3 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                                    >
                                        {showMobileControls ? 'Hide' : 'Show'} Controls
                                    </button>
                                </div>
                            </div>

                            {/* Controls - Desktop sidebar / Mobile bottom panel */}
                            <div className={`${showMobileControls ? 'block' : 'hidden'} lg:block controls-section`}>
                                {/* Mobile Tabs */}
                                <div className="lg:hidden flex border-b border-gray-600 bg-gray-800 sticky top-0 z-10">
                                    <button
                                        onClick={() => setActiveTab('image')}
                                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'image' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400'}`}
                                    >
                                        Image
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('overlays')}
                                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'overlays' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400'}`}
                                    >
                                        Overlays
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('text')}
                                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'text' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400'}`}
                                    >
                                        Text
                                    </button>
                                </div>

                                <div className="space-y-4 p-2 md:p-0 mobile-panel">
                                    {/* Import from Bluesky */}
                                    <div className="bg-gray-800 rounded-lg shadow-lg p-2">
                                        <h2 className="text-base md:text-lg font-semibold mb-2 flex items-center gap-2">Import from Bluesky <span className="text-xs font-medium bg-yellow-900 text-yellow-300 px-1.5 py-0.5 rounded">Beta</span></h2>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={bskyUrl}
                                                onChange={(e) => setBskyUrl(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && importFromBluesky()}
                                                placeholder="https://bsky.app/profile/…/post/…"
                                                className="flex-1 p-2 border border-gray-600 rounded text-xs"
                                            />
                                            <button
                                                onClick={importFromBluesky}
                                                disabled={bskyLoading || !bskyUrl.trim()}
                                                className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition whitespace-nowrap"
                                            >
                                                {bskyLoading ? 'Loading…' : 'Import'}
                                            </button>
                                        </div>
                                        {bskyError && <p className="text-red-500 text-xs mb-2">{bskyError}</p>}
                                        {bskyData && (
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-1">
                                                        {bskyData.allImages.length > 0 ? 'Choose image:' : 'No images — upload your own:'}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 items-center">
                                                        {bskyData.allImages.map((img, i) => (
                                                            <img
                                                                key={i}
                                                                src={img.thumb}
                                                                onClick={() => { setBskySelectedImageIdx(i); setBskyCustomImage(null); }}
                                                                className={`w-14 h-14 object-cover rounded cursor-pointer border-2 transition ${bskySelectedImageIdx === i && !bskyCustomImage ? 'border-blue-500' : 'border-transparent hover:border-gray-600'}`}
                                                                alt=""
                                                            />
                                                        ))}
                                                        {bskyData.allImages.length === 0 && (
                                                            <label className={`w-14 h-14 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:border-blue-400 hover:text-blue-400 transition text-center ${bskyCustomImage ? 'border-blue-500 text-blue-500' : 'border-gray-600'}`}>
                                                                <span className="text-lg leading-none">+</span>
                                                                <span className="text-xs leading-tight mt-0.5">Own</span>
                                                                <input type="file" accept="image/*" className="hidden" onChange={handleBskyOwnImageUpload} />
                                                            </label>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-1">{bskyData.posts.length} post{bskyData.posts.length !== 1 ? 's' : ''}{bskyData.posts.length > 1 ? ' (last skipped — news link)' : ''}:</p>
                                                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                                        {bskyData.posts.map((post, i) => (
                                                            <div key={i} className="bg-gray-900 border border-gray-600 rounded p-1.5">
                                                                <p className="text-xs text-gray-400 mb-0.5">#{i + 1}</p>
                                                                <p className="text-xs text-gray-200 whitespace-pre-wrap">{post.text}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={applyBskyImport}
                                                    className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition"
                                                >
                                                    Apply to Canvas
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Base Image - Desktop: always show, Mobile: show in 'image' tab */}
                                    <div className={`${activeTab === 'image' || window.innerWidth >= 1024 ? 'block' : 'hidden'} lg:block bg-gray-800 rounded-lg shadow-lg p-2`}>
                                        <h2 className="text-base md:text-lg font-semibold mb-2">Base Image</h2>
                                        <label className="block mb-2">
                                            <span className="sr-only">Choose base image</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleBaseImageUpload}
                                                className="block w-full text-xs md:text-sm text-gray-400 file:mr-2 md:file:mr-4 file:py-1.5 md:file:py-2 file:px-3 md:file:px-4 file:rounded-full file:border-0 file:text-xs md:file:text-sm file:font-semibold file:bg-gray-700 file:text-gray-200 hover:file:bg-gray-600"
                                            />
                                        </label>
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                value={baseImageUrl}
                                                onChange={(e) => setBaseImageUrl(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleBaseImageUrlLoad()}
                                                placeholder="Or paste image URL…"
                                                className="flex-1 text-xs border border-gray-600 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400"
                                            />
                                            <button
                                                onClick={handleBaseImageUrlLoad}
                                                disabled={!baseImageUrl.trim()}
                                                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-40 transition"
                                            >Load</button>
                                        </div>

                                        {/* Blur Background Options */}
                                        <div className="mt-3 pt-3 border-t border-gray-600">
                                            <label className="flex items-center gap-2 cursor-pointer mb-3">
                                                <input
                                                    type="checkbox"
                                                    checked={useBlurBackground}
                                                    onChange={(e) => setUseBlurBackground(e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 rounded"
                                                />
                                                <span className="text-xs md:text-sm text-gray-200 font-medium">
                                                    Enable Blur Background
                                                </span>
                                            </label>

                                            {useBlurBackground && (
                                                <div className="space-y-3 pl-6 border-l-2 border-blue-200">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={useBaseImageForBlur}
                                                            onChange={(e) => setUseBaseImageForBlur(e.target.checked)}
                                                            className="w-4 h-4 text-blue-600 rounded"
                                                        />
                                                        <span className="text-xs text-gray-200">
                                                            Use base image for blur
                                                        </span>
                                                    </label>

                                                    {!useBaseImageForBlur && (
                                                        <label className="block">
                                                            <span className="text-xs text-gray-300 mb-1 block">Blur Image</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleBlurImageUpload}
                                                                className="block w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-700 file:text-gray-200 hover:file:bg-gray-200"
                                                            />
                                                        </label>
                                                    )}

                                                    <div>
                                                        <label className="text-xs text-gray-300 mb-1 block">Blur Intensity</label>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="250"
                                                                step="1"
                                                                value={blurIntensity}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value);
                                                                    if (!isNaN(val)) setBlurIntensity(val);
                                                                }}
                                                                className="w-16 px-2 py-1 text-xs border border-gray-600 rounded"
                                                            />
                                                            <button
                                                                onClick={() => setBlurIntensity(50)}
                                                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                            >
                                                                Reset
                                                            </button>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="250"
                                                            step="1"
                                                            value={blurIntensity}
                                                            onChange={(e) => setBlurIntensity(parseInt(e.target.value))}
                                                            className="w-full"
                                                        />
                                                    </div>

                                                    {/* Blur Image Controls */}
                                                    <div className="space-y-2 pt-2 border-t border-gray-700">
                                                        <p className="text-xs font-medium text-gray-300">Blur Image Controls</p>

                                                        <div>
                                                            <label className="text-xs text-gray-300 mb-1 block">Zoom</label>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <input
                                                                    type="number"
                                                                    min="0.1"
                                                                    max="3"
                                                                    step="0.01"
                                                                    value={blurImageScale.toFixed(2)}
                                                                    onChange={(e) => {
                                                                        const val = parseFloat(e.target.value);
                                                                        if (!isNaN(val)) setBlurImageScale(val);
                                                                    }}
                                                                    className="w-16 px-2 py-1 text-xs border border-gray-600 rounded"
                                                                />
                                                                <button
                                                                    onClick={() => setBlurImageScale(1)}
                                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                                >
                                                                    Reset
                                                                </button>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="0.1"
                                                                max="3"
                                                                step="0.01"
                                                                value={blurImageScale}
                                                                onChange={(e) => {
                                                                    const val = parseFloat(e.target.value);
                                                                    if (!isNaN(val)) setBlurImageScale(val);
                                                                }}
                                                                className="w-full"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="text-xs text-gray-300 mb-1 block">X Position</label>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <input
                                                                    type="number"
                                                                    min="-500"
                                                                    max="500"
                                                                    value={blurImagePosition.x.toFixed(0)}
                                                                    onChange={(e) => {
                                                                        const val = parseFloat(e.target.value);
                                                                        if (!isNaN(val)) setBlurImagePosition(prev => ({ ...prev, x: val }));
                                                                    }}
                                                                    className="w-16 px-2 py-1 text-xs border border-gray-600 rounded"
                                                                />
                                                                <button
                                                                    onClick={() => setBlurImagePosition(prev => ({ ...prev, x: 0 }))}
                                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                                >
                                                                    Reset
                                                                </button>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="-500"
                                                                max="500"
                                                                step="1"
                                                                value={blurImagePosition.x}
                                                                onChange={(e) => {
                                                                    const val = parseFloat(e.target.value);
                                                                    if (!isNaN(val)) setBlurImagePosition(prev => ({ ...prev, x: val }));
                                                                }}
                                                                className="w-full"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="text-xs text-gray-300 mb-1 block">Y Position</label>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <input
                                                                    type="number"
                                                                    min="-500"
                                                                    max="500"
                                                                    value={blurImagePosition.y.toFixed(0)}
                                                                    onChange={(e) => {
                                                                        const val = parseFloat(e.target.value);
                                                                        if (!isNaN(val)) setBlurImagePosition(prev => ({ ...prev, y: val }));
                                                                    }}
                                                                    className="w-16 px-2 py-1 text-xs border border-gray-600 rounded"
                                                                />
                                                                <button
                                                                    onClick={() => setBlurImagePosition(prev => ({ ...prev, y: 0 }))}
                                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                                >
                                                                    Reset
                                                                </button>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="-500"
                                                                max="500"
                                                                step="1"
                                                                value={blurImagePosition.y}
                                                                onChange={(e) => {
                                                                    const val = parseFloat(e.target.value);
                                                                    if (!isNaN(val)) setBlurImagePosition(prev => ({ ...prev, y: val }));
                                                                }}
                                                                className="w-full"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="text-xs text-gray-300 mb-1 block">Rotation</label>
                                                            <div className="grid grid-cols-4 gap-1">
                                                                <button
                                                                    onClick={() => setBlurImageRotation((blurImageRotation + 90) % 360)}
                                                                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition"
                                                                >
                                                                    90°
                                                                </button>
                                                                <button
                                                                    onClick={() => setBlurImageRotation((blurImageRotation + 180) % 360)}
                                                                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition"
                                                                >
                                                                    180°
                                                                </button>
                                                                <button
                                                                    onClick={() => setBlurImageRotation((blurImageRotation + 270) % 360)}
                                                                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition"
                                                                >
                                                                    270°
                                                                </button>
                                                                <button
                                                                    onClick={() => setBlurImageRotation(0)}
                                                                    className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs transition"
                                                                >
                                                                    Reset
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Overlay Color - Desktop: always show, Mobile: show in 'overlays' tab */}
                                    <div className={`${activeTab === 'overlays' || window.innerWidth >= 1024 ? 'block' : 'hidden'} lg:block bg-gray-800 rounded-lg shadow-lg p-2`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <h2 className="text-base md:text-lg font-semibold">Overlay</h2>
                                            <button
                                                onClick={() => setShowOverlay(!showOverlay)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    showOverlay ? 'bg-blue-600' : 'bg-gray-300'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        showOverlay ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="flex items-center space-x-3 cursor-pointer p-3 border-2 border-gray-600 rounded-lg hover:bg-gray-700 transition">
                                                <input
                                                    type="radio"
                                                    name="overlayColor"
                                                    value="white"
                                                    checked={overlayColor === 'white'}
                                                    onChange={(e) => setOverlayColor(e.target.value)}
                                                    className="w-5 h-5 text-blue-600"
                                                />
                                                <span className="text-sm md:text-base font-medium text-gray-200">White</span>
                                            </label>
                                            <label className="flex items-center space-x-3 cursor-pointer p-3 border-2 border-gray-600 rounded-lg hover:bg-gray-700 transition">
                                                <input
                                                    type="radio"
                                                    name="overlayColor"
                                                    value="black"
                                                    checked={overlayColor === 'black'}
                                                    onChange={(e) => setOverlayColor(e.target.value)}
                                                    className="w-5 h-5 text-blue-600"
                                                />
                                                <span className="text-sm md:text-base font-medium text-gray-200">Black</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Tag Banner Controls */}
                                    <div className={`${activeTab === 'overlays' || window.innerWidth >= 1024 ? 'block' : 'hidden'} lg:block bg-gray-800 rounded-lg shadow-lg p-2`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <h2 className="text-base md:text-lg font-semibold">Tag Banner</h2>
                                            <button
                                                onClick={() => setShowBanner(!showBanner)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    showBanner ? 'bg-blue-600' : 'bg-gray-300'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        showBanner ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                                {/* Banner Preset */}
                                                <div>
                                                    <label className="text-xs text-gray-300 mb-1 block">Preset</label>
                                                    <select
                                                        value={selectedBannerPreset}
                                                        onChange={(e) => handleBannerPresetChange(e.target.value)}
                                                        className="w-full p-2 border border-gray-600 rounded text-xs md:text-sm"
                                                    >
                                                        <option value="breaking">🔴 Breaking</option>
                                                        <option value="custom">Custom</option>
                                                        <optgroup label="Eurovision">
                                                            <option value="albania">🇦🇱 Albania</option>
                                                            <option value="andorra">🇦🇩 Andorra</option>
                                                            <option value="armenia">🇦🇲 Armenia</option>
                                                            <option value="australia">🇦🇺 Australia</option>
                                                            <option value="austria">🇦🇹 Austria</option>
                                                            <option value="azerbaijan">🇦🇿 Azerbaijan</option>
                                                            <option value="belarus">🇧🇾 Belarus</option>
                                                            <option value="belgium">🇧🇪 Belgium</option>
                                                            <option value="bosnia">🇧🇦 Bosnia & Herzegovina</option>
                                                            <option value="bulgaria">🇧🇬 Bulgaria</option>
                                                            <option value="canada">🇨🇦 Canada</option>
                                                            <option value="croatia">🇭🇷 Croatia</option>
                                                            <option value="cyprus">🇨🇾 Cyprus</option>
                                                            <option value="czechia">🇨🇿 Czechia</option>
                                                            <option value="denmark">🇩🇰 Denmark</option>
                                                            <option value="estonia">🇪🇪 Estonia</option>
                                                            <option value="finland">🇫🇮 Finland</option>
                                                            <option value="france">🇫🇷 France</option>
                                                            <option value="georgia">🇬🇪 Georgia</option>
                                                            <option value="germany">🇩🇪 Germany</option>
                                                            <option value="greece">🇬🇷 Greece</option>
                                                            <option value="hungary">🇭🇺 Hungary</option>
                                                            <option value="iceland">🇮🇸 Iceland</option>
                                                            <option value="ireland">🇮🇪 Ireland</option>
                                                            <option value="israel">🇮🇱 Israel</option>
                                                            <option value="italy">🇮🇹 Italy</option>
                                                            <option value="kazakhstan">🇰🇿 Kazakhstan</option>
                                                            <option value="kosovo">🇽🇰 Kosovo</option>
                                                            <option value="latvia">🇱🇻 Latvia</option>
                                                            <option value="lithuania">🇱🇹 Lithuania</option>
                                                            <option value="luxembourg">🇱🇺 Luxembourg</option>
                                                            <option value="malta">🇲🇹 Malta</option>
                                                            <option value="moldova">🇲🇩 Moldova</option>
                                                            <option value="monaco">🇲🇨 Monaco</option>
                                                            <option value="montenegro">🇲🇪 Montenegro</option>
                                                            <option value="morocco">🇲🇦 Morocco</option>
                                                            <option value="netherlands">🇳🇱 Netherlands</option>
                                                            <option value="northmacedonia">🇲🇰 North Macedonia</option>
                                                            <option value="norway">🇳🇴 Norway</option>
                                                            <option value="poland">🇵🇱 Poland</option>
                                                            <option value="portugal">🇵🇹 Portugal</option>
                                                            <option value="romania">🇷🇴 Romania</option>
                                                            <option value="russia">🇷🇺 Russia</option>
                                                            <option value="sanmarino">🇸🇲 San Marino</option>
                                                            <option value="serbia">🇷🇸 Serbia</option>
                                                            <option value="slovakia">🇸🇰 Slovakia</option>
                                                            <option value="slovenia">🇸🇮 Slovenia</option>
                                                            <option value="spain">🇪🇸 Spain</option>
                                                            <option value="sweden">🇸🇪 Sweden</option>
                                                            <option value="switzerland">🇨🇭 Switzerland</option>
                                                            <option value="turkiye">🇹🇷 Türkiye</option>
                                                            <option value="ukraine">🇺🇦 Ukraine</option>
                                                            <option value="uk">🇬🇧 United Kingdom</option>
                                                        </optgroup>
                                                        <optgroup label="Eurovision Asia">
                                                            <option value="bangladesh">🇧🇩 Bangladesh</option>
                                                            <option value="bhutan">🇧🇹 Bhutan</option>
                                                            <option value="cambodia">🇰🇭 Cambodia</option>
                                                            <option value="laos">🇱🇦 Laos</option>
                                                            <option value="malaysia">🇲🇾 Malaysia</option>
                                                            <option value="nepal">🇳🇵 Nepal</option>
                                                            <option value="philippines">🇵🇭 Philippines</option>
                                                            <option value="southkorea">🇰🇷 South Korea</option>
                                                            <option value="thailand">🇹🇭 Thailand</option>
                                                            <option value="vietnam">🇻🇳 Vietnam</option>
                                                        </optgroup>
                                                    </select>
                                                </div>

                                                {/* Banner Text - Only show for Custom preset */}
                                                {selectedBannerPreset === 'custom' && (
                                                    <div>
                                                        <label className="text-xs text-gray-300 mb-1 block">Banner Text</label>
                                                        <input
                                                            type="text"
                                                            value={bannerText}
                                                            onChange={(e) => {
                                                                setBannerText(e.target.value);
                                                                setSelectedBannerPreset('custom');
                                                            }}
                                                            className="w-full p-2 border border-gray-600 rounded text-xs md:text-sm"
                                                        />
                                                    </div>
                                                )}

                                                {/* Letter Spacing and Color */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-xs text-gray-300 mb-1 block">Letter Spacing (%)</label>
                                                        <input
                                                            type="text"
                                                            value={bannerLetterSpacing === '' ? '' : (typeof bannerLetterSpacing === 'number' ? bannerLetterSpacing * 100 : '')}
                                                            onChange={(e) => {
                                                                const input = e.target.value;
                                                                if (input === '') {
                                                                    setBannerLetterSpacing('');
                                                                } else {
                                                                    const val = parseFloat(input);
                                                                    setBannerLetterSpacing(isNaN(val) ? '' : val / 100);
                                                                }
                                                                setSelectedBannerPreset('custom');
                                                            }}
                                                            className={`w-full p-2 border-2 rounded text-xs md:text-sm ${
                                                                bannerLetterSpacing === '' || typeof bannerLetterSpacing !== 'number'
                                                                    ? 'border-red-600 bg-red-100'
                                                                    : 'border-gray-600'
                                                            }`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-300 mb-1 block">Color</label>
                                                        <input
                                                            type="color"
                                                            value={bannerColor}
                                                            onChange={(e) => {
                                                                setBannerColor(e.target.value);
                                                                setSelectedBannerPreset('custom');
                                                            }}
                                                            className="w-full h-10 border border-gray-600 rounded cursor-pointer"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Transparency */}
                                                <div>
                                                    <label className="text-xs text-gray-300 mb-1 block">Transparency</label>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <input
                                                            type="text"
                                                            value={bannerOpacity === '' ? '' : (typeof bannerOpacity === 'number' ? Math.round(bannerOpacity * 100) : '')}
                                                            onChange={(e) => {
                                                                const input = e.target.value;
                                                                if (input === '') {
                                                                    setBannerOpacity('');
                                                                } else {
                                                                    const val = parseFloat(input);
                                                                    setBannerOpacity(isNaN(val) ? '' : val / 100);
                                                                }
                                                            }}
                                                            className={`w-16 px-2 py-1 text-xs border-2 rounded ${
                                                                bannerOpacity === '' || typeof bannerOpacity !== 'number'
                                                                    ? 'border-red-600 bg-red-100'
                                                                    : 'border-gray-600'
                                                            }`}
                                                        />
                                                        <span className="text-xs text-gray-400">%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        step="1"
                                                        value={typeof bannerOpacity === 'number' ? bannerOpacity * 100 : 0}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            if (!isNaN(val)) setBannerOpacity(val / 100);
                                                        }}
                                                        className="w-full"
                                                    />
                                                </div>

                                                {/* Font Size and Font Family */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-xs text-gray-300 mb-1 block">Font Size</label>
                                                        <input
                                                            type="text"
                                                            value={bannerFontSize === '' ? '' : (typeof bannerFontSize === 'number' ? bannerFontSize : '')}
                                                            onChange={(e) => {
                                                                const input = e.target.value;
                                                                if (input === '') {
                                                                    setBannerFontSize('');
                                                                } else {
                                                                    const val = parseInt(input);
                                                                    setBannerFontSize(isNaN(val) ? '' : val);
                                                                }
                                                            }}
                                                            className={`w-full p-2 border-2 rounded text-xs md:text-sm ${
                                                                bannerFontSize === '' || typeof bannerFontSize !== 'number'
                                                                    ? 'border-red-600 bg-red-100'
                                                                    : 'border-gray-600'
                                                            }`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-300 mb-1 block">Font</label>
                                                        <select
                                                            value={bannerFontFamily}
                                                            onChange={(e) => {
                                                                setBannerFontFamily(e.target.value);
                                                                if (e.target.value === 'Singing Sans') {
                                                                    setBannerTextCase('default');
                                                                }
                                                            }}
                                                            className="w-full p-2 border border-gray-600 rounded text-xs md:text-sm"
                                                        >
                                                            <option value="Helvetica Neue">Helvetica Neue</option>
                                                            <option value="Singing Sans">Singing Sans</option>
                                                            <option value="Arial">Arial</option>
                                                            <option value="Arial Black">Arial Black</option>
                                                            <option value="Impact">Impact</option>
                                                            <option value="Georgia">Georgia</option>
                                                            <option value="Times New Roman">Times New Roman</option>
                                                            <option value="Courier New">Courier New</option>
                                                            <option value="Verdana">Verdana</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Font Weight and Font Style */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-xs text-gray-300 mb-1 block">Weight</label>
                                                        <select
                                                            value={bannerFontWeight}
                                                            onChange={(e) => setBannerFontWeight(e.target.value)}
                                                            className="w-full p-2 border border-gray-600 rounded text-xs md:text-sm"
                                                        >
                                                            <option value="normal">Normal</option>
                                                            <option value="bold">Bold</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-300 mb-1 block">Style</label>
                                                        <select
                                                            value={bannerFontStyle}
                                                            onChange={(e) => setBannerFontStyle(e.target.value)}
                                                            className="w-full p-2 border border-gray-600 rounded text-xs md:text-sm"
                                                        >
                                                            <option value="normal">Normal</option>
                                                            <option value="italic">Italic</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Text Align and Text Case */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-xs text-gray-300 mb-1 block">Align</label>
                                                        <select
                                                            value={bannerTextAlign}
                                                            onChange={(e) => {
                                                                setBannerTextAlign(e.target.value);
                                                                setSelectedBannerPreset('custom');
                                                            }}
                                                            className="w-full p-2 border border-gray-600 rounded text-xs md:text-sm"
                                                        >
                                                            <option value="left">Left</option>
                                                            <option value="center">Center</option>
                                                            <option value="right">Right</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-300 mb-1 block">Text Case</label>
                                                        <select
                                                            value={bannerTextCase}
                                                            onChange={(e) => setBannerTextCase(e.target.value)}
                                                            className="w-full p-2 border border-gray-600 rounded text-xs md:text-sm"
                                                        >
                                                            <option value="default">Default</option>
                                                            <option value="uppercase">UPPERCASE</option>
                                                            <option value="lowercase">lowercase</option>
                                                            <option value="titlecase">Title Case</option>
                                                            <option value="sentencecase">Sentence case</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                    </div>

                                    {/* Photo Credit */}
                                    <div className={`${activeTab === 'text' || activeTab === 'overlays' || window.innerWidth >= 1024 ? 'block' : 'hidden'} lg:block bg-gray-800 rounded-lg shadow-lg p-2`}>
                                        <h2 className="text-base md:text-lg font-semibold mb-2">Photo Credit</h2>
                                        <input
                                            type="text"
                                            value={photoCredit}
                                            onChange={(e) => setPhotoCredit(e.target.value)}
                                            placeholder="e.g. © Corinne Cumming / EBU"
                                            className="w-full p-2 border border-gray-600 rounded text-xs md:text-sm"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Rendered vertically along the left edge at 50% opacity</p>
                                    </div>

                                    {/* Text Controls - Desktop: always show, Mobile: show in 'text' tab */}
                                    <div className={`${activeTab === 'text' || window.innerWidth >= 1024 ? 'block' : 'hidden'} lg:block bg-gray-800 rounded-lg shadow-lg p-2`}>
                                        <h2 className="text-base md:text-lg font-semibold mb-2">Text</h2>

                                        <button
                                            onClick={addText}
                                            className="w-full bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-medium hover:bg-blue-700 transition mb-2"
                                        >
                                            Add Text
                                        </button>
                                        <div className="flex gap-2 mb-3">
                                            <button
                                                onClick={() => appendEmojiToTextbox('🔸')}
                                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-sm py-1.5 rounded-lg transition"
                                                title="Add 🔸 Small Orange Diamond"
                                            >
                                                🔸
                                            </button>
                                            <button
                                                onClick={() => appendEmojiToTextbox('🔹')}
                                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-sm py-1.5 rounded-lg transition"
                                                title="Add 🔹 Small Blue Diamond"
                                            >
                                                🔹
                                            </button>
                                        </div>

                                        <div className="space-y-3 mb-4">
                                            {[...textElements].reverse().map((el, reverseIndex) => {
                                                const index = textElements.length - 1 - reverseIndex;
                                                return (
                                                <div key={el.id} className="border border-gray-600 rounded-lg p-2 md:p-3">
                                                    {/* Header with number and reorder buttons */}
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-semibold text-gray-200">Textbox #{textElements.length - index}</span>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => moveTextElementDown(index)}
                                                                disabled={index === textElements.length - 1}
                                                                className={`px-2 py-1 rounded text-xs transition ${
                                                                    index === textElements.length - 1
                                                                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                                }`}
                                                                title="Move Up (towards top of canvas)"
                                                            >
                                                                ↑
                                                            </button>
                                                            <button
                                                                onClick={() => moveTextElementUp(index)}
                                                                disabled={index === 0}
                                                                className={`px-2 py-1 rounded text-xs transition ${
                                                                    index === 0
                                                                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                                }`}
                                                                title="Move Down (towards bottom of canvas)"
                                                            >
                                                                ↓
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <textarea
                                                        value={el.text}
                                                        onChange={(e) => updateTextElement(el.id, { text: e.target.value })}
                                                        onFocus={() => setFocusedTextboxId(el.id)}
                                                        className={`w-full p-2 border rounded mb-2 text-xs md:text-sm resize-none overflow-hidden ${focusedTextboxId === el.id ? 'border-blue-400' : 'border-gray-600'}`}
                                                        rows={Math.max(3, el.text.split('\n').length + Math.ceil(el.text.length / 60))}
                                                    />

                                                    {/* Custom settings checkbox */}
                                                    <label className="flex items-center space-x-2 mb-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={el.useCustomSettings || false}
                                                            onChange={(e) => updateTextElement(el.id, { useCustomSettings: e.target.checked })}
                                                            className="w-4 h-4 text-blue-600"
                                                        />
                                                        <span className="text-xs text-gray-200 font-medium">Use Custom Formatting</span>
                                                    </label>

                                                    {el.useCustomSettings && (
                                                        <>
                                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                                        <div>
                                                            <label className="text-xs text-gray-300">Size</label>
                                                            <input
                                                                type="text"
                                                                value={el.fontSize === '' ? '' : (typeof el.fontSize === 'number' ? el.fontSize : '')}
                                                                onChange={(e) => {
                                                                    const input = e.target.value;
                                                                    if (input === '') {
                                                                        updateTextElement(el.id, { fontSize: '' });
                                                                    } else {
                                                                        const val = parseInt(input);
                                                                        updateTextElement(el.id, { fontSize: isNaN(val) ? '' : val });
                                                                    }
                                                                }}
                                                                className={`w-full p-1 border-2 rounded text-xs md:text-sm ${
                                                                    el.fontSize === '' || typeof el.fontSize !== 'number'
                                                                        ? 'border-red-600 bg-red-100'
                                                                        : 'border-gray-600'
                                                                }`}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-gray-300">Color</label>
                                                            <input
                                                                type="color"
                                                                value={el.color}
                                                                onChange={(e) => updateTextElement(el.id, { color: e.target.value })}
                                                                className="w-full h-8 border border-gray-600 rounded"
                                                            />
                                                        </div>
                                                    </div>
                                                    <select
                                                        value={el.fontFamily}
                                                        onChange={(e) => {
                                                            const updates = { fontFamily: e.target.value };
                                                            if (e.target.value === 'Singing Sans') {
                                                                updates.textCase = 'default';
                                                            }
                                                            updateTextElement(el.id, updates);
                                                        }}
                                                        className="w-full p-1 border border-gray-600 rounded text-xs md:text-sm mb-2"
                                                    >
                                                        <option value="Helvetica Neue">Helvetica Neue</option>
                                                        <option value="Singing Sans">Singing Sans</option>
                                                        <option value="Arial">Arial</option>
                                                        <option value="Helvetica">Helvetica</option>
                                                        <option value="Georgia">Georgia</option>
                                                        <option value="Times New Roman">Times New Roman</option>
                                                        <option value="Courier New">Courier New</option>
                                                        <option value="Verdana">Verdana</option>
                                                        <option value="Impact">Impact</option>
                                                    </select>
                                                    <div className="mb-2">
                                                        <label className="text-xs text-gray-300 mb-1 block">Font Style</label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <button
                                                                onClick={() => updateTextElement(el.id, {
                                                                    fontWeight: 'normal',
                                                                    fontStyle: 'normal'
                                                                })}
                                                                className={`px-2 py-2 rounded text-xs font-medium transition ${
                                                                    (el.fontWeight === 'normal' || !el.fontWeight) && (el.fontStyle === 'normal' || !el.fontStyle) ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                                                }`}
                                                            >
                                                                Normal
                                                            </button>
                                                            <button
                                                                onClick={() => updateTextElement(el.id, {
                                                                    fontWeight: 'bold',
                                                                    fontStyle: 'normal'
                                                                })}
                                                                className={`px-2 py-2 rounded text-xs font-bold transition ${
                                                                    el.fontWeight === 'bold' && (el.fontStyle === 'normal' || !el.fontStyle) ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                                                }`}
                                                            >
                                                                Bold
                                                            </button>
                                                            <button
                                                                onClick={() => updateTextElement(el.id, {
                                                                    fontWeight: 'normal',
                                                                    fontStyle: 'italic'
                                                                })}
                                                                className={`px-2 py-2 rounded text-xs italic transition ${
                                                                    (el.fontWeight === 'normal' || !el.fontWeight) && el.fontStyle === 'italic' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                                                }`}
                                                            >
                                                                Italic
                                                            </button>
                                                            <button
                                                                onClick={() => updateTextElement(el.id, {
                                                                    fontWeight: 'bold',
                                                                    fontStyle: 'italic'
                                                                })}
                                                                className={`px-2 py-2 rounded text-xs font-bold italic transition ${
                                                                    el.fontWeight === 'bold' && el.fontStyle === 'italic' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                                                }`}
                                                            >
                                                                Bold Italic
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="mb-2">
                                                        <label className="text-xs text-gray-300 mb-1 block">Alignment</label>
                                                        <div className="grid grid-cols-4 gap-1">
                                                            <button
                                                                onClick={() => updateTextElement(el.id, {
                                                                    textAlign: 'left',
                                                                    justify: false
                                                                })}
                                                                className={`px-2 py-2 rounded text-sm font-medium transition flex items-center justify-center ${
                                                                    el.textAlign === 'left' && !el.justify ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                                                }`}
                                                                title="Align Left"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                                    <path d="M2 3h12v1H2V3zm0 3h8v1H2V6zm0 3h12v1H2V9zm0 3h8v1H2v-1z"/>
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => updateTextElement(el.id, {
                                                                    textAlign: 'center',
                                                                    justify: false
                                                                })}
                                                                className={`px-2 py-2 rounded text-sm font-medium transition flex items-center justify-center ${
                                                                    el.textAlign === 'center' && !el.justify ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                                                }`}
                                                                title="Align Center"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                                    <path d="M2 3h12v1H2V3zm2 3h8v1H4V6zm-2 3h12v1H2V9zm2 3h8v1H4v-1z"/>
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => updateTextElement(el.id, {
                                                                    textAlign: 'right',
                                                                    justify: false
                                                                })}
                                                                className={`px-2 py-2 rounded text-sm font-medium transition flex items-center justify-center ${
                                                                    el.textAlign === 'right' && !el.justify ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                                                }`}
                                                                title="Align Right"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                                    <path d="M2 3h12v1H2V3zm4 3h8v1H6V6zm-4 3h12v1H2V9zm4 3h8v1H6v-1z"/>
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => updateTextElement(el.id, {
                                                                    textAlign: 'justify',
                                                                    justify: true
                                                                })}
                                                                className={`px-2 py-2 rounded text-sm font-medium transition flex items-center justify-center ${
                                                                    el.justify ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                                                }`}
                                                                title="Justify"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                                    <path d="M2 3h12v1H2V3zm0 3h12v1H2V6zm0 3h12v1H2V9zm0 3h12v1H2v-1z"/>
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="mb-2">
                                                        <label className="text-xs text-gray-300 mb-1 block">Text Case</label>
                                                        <select
                                                            value={el.textCase || 'default'}
                                                            onChange={(e) => updateTextElement(el.id, { textCase: e.target.value })}
                                                            className="w-full p-1 border border-gray-600 rounded text-xs md:text-sm"
                                                        >
                                                            <option value="default">Default</option>
                                                            <option value="uppercase">UPPERCASE</option>
                                                            <option value="lowercase">lowercase</option>
                                                            <option value="titlecase">Title Case</option>
                                                            <option value="sentencecase">Sentence case</option>
                                                        </select>
                                                    </div>
                                                        </>
                                                    )}

                                                    <button
                                                        onClick={() => deleteTextElement(el.id)}
                                                        className="w-full bg-red-500 text-white px-2 md:px-3 py-1.5 md:py-2 rounded text-xs md:text-sm hover:bg-red-600 transition mt-2"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                                );
                                            })}
                                        </div>

                                        {/* Global Text Formatting */}
                                        <div className="mb-4 p-3 bg-gray-900 rounded-lg border border-gray-600">
                                            <button
                                                onClick={() => setShowGlobalFormatting(!showGlobalFormatting)}
                                                className="w-full flex items-center justify-between text-sm font-semibold mb-2 text-gray-200 hover:text-white transition py-1"
                                            >
                                                <span>Global Formatting</span>
                                                <svg
                                                    className={`w-4 h-4 transform transition-transform ${showGlobalFormatting ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>

                                            {showGlobalFormatting && (
                                                <>
                                            <div className="grid grid-cols-2 gap-2 mb-2">
                                                <div>
                                                    <label className="text-xs text-gray-300">Size</label>
                                                    <input
                                                        type="text"
                                                        value={globalFontSize === '' ? '' : (typeof globalFontSize === 'number' ? globalFontSize : '')}
                                                        onChange={(e) => {
                                                            const input = e.target.value;
                                                            if (input === '') {
                                                                setGlobalFontSize('');
                                                            } else {
                                                                const val = parseInt(input);
                                                                setGlobalFontSize(isNaN(val) ? '' : val);
                                                            }
                                                        }}
                                                        className={`w-full p-1 border-2 rounded text-xs md:text-sm ${
                                                            globalFontSize === '' || typeof globalFontSize !== 'number'
                                                                ? 'border-red-600 bg-red-100'
                                                                : 'border-gray-600'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-300">Color</label>
                                                    <input
                                                        type="color"
                                                        value={globalColor}
                                                        onChange={(e) => setGlobalColor(e.target.value)}
                                                        className="w-full p-1 border border-gray-600 rounded h-8"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mb-2">
                                                <label className="text-xs text-gray-300">Font Family</label>
                                                <select
                                                    value={globalFontFamily}
                                                    onChange={(e) => {
                                                        setGlobalFontFamily(e.target.value);
                                                        if (e.target.value === 'Singing Sans') {
                                                            setGlobalTextCase('default');
                                                        }
                                                    }}
                                                    className="w-full p-1 border border-gray-600 rounded text-xs md:text-sm"
                                                >
                                                    <option value="Helvetica Neue">Helvetica Neue</option>
                                                    <option value="Singing Sans">Singing Sans</option>
                                                    <option value="Arial">Arial</option>
                                                    <option value="Helvetica">Helvetica</option>
                                                    <option value="Georgia">Georgia</option>
                                                    <option value="Times New Roman">Times New Roman</option>
                                                    <option value="Courier New">Courier New</option>
                                                    <option value="Verdana">Verdana</option>
                                                    <option value="Impact">Impact</option>
                                                </select>
                                            </div>

                                            <div className="mb-2">
                                                <label className="text-xs text-gray-300 mb-1 block">Font Style</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setGlobalFontWeight('normal');
                                                            setGlobalFontStyle('normal');
                                                        }}
                                                        className={`px-2 py-2 rounded text-xs font-medium transition ${
                                                            globalFontWeight === 'normal' && globalFontStyle === 'normal' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                                        }`}
                                                    >
                                                        Normal
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setGlobalFontWeight('bold');
                                                            setGlobalFontStyle('normal');
                                                        }}
                                                        className={`px-2 py-2 rounded text-xs font-bold transition ${
                                                            globalFontWeight === 'bold' && globalFontStyle === 'normal' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                                        }`}
                                                    >
                                                        Bold
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setGlobalFontWeight('normal');
                                                            setGlobalFontStyle('italic');
                                                        }}
                                                        className={`px-2 py-2 rounded text-xs italic transition ${
                                                            globalFontWeight === 'normal' && globalFontStyle === 'italic' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                                        }`}
                                                    >
                                                        Italic
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setGlobalFontWeight('bold');
                                                            setGlobalFontStyle('italic');
                                                        }}
                                                        className={`px-2 py-2 rounded text-xs font-bold italic transition ${
                                                            globalFontWeight === 'bold' && globalFontStyle === 'italic' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                                        }`}
                                                    >
                                                        Bold Italic
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mb-2">
                                                <label className="text-xs text-gray-300 mb-1 block">Alignment</label>
                                                <div className="grid grid-cols-4 gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setGlobalTextAlign('left');
                                                            setGlobalJustify(false);
                                                        }}
                                                        className={`px-2 py-2 rounded text-sm font-medium transition flex items-center justify-center ${
                                                            globalTextAlign === 'left' && !globalJustify ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                                        }`}
                                                        title="Align Left"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                            <path d="M2 3h12v1H2V3zm0 3h8v1H2V6zm0 3h12v1H2V9zm0 3h8v1H2v-1z"/>
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setGlobalTextAlign('center');
                                                            setGlobalJustify(false);
                                                        }}
                                                        className={`px-2 py-2 rounded text-sm font-medium transition flex items-center justify-center ${
                                                            globalTextAlign === 'center' && !globalJustify ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                                        }`}
                                                        title="Align Center"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                            <path d="M2 3h12v1H2V3zm2 3h8v1H4V6zm-2 3h12v1H2V9zm2 3h8v1H4v-1z"/>
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setGlobalTextAlign('right');
                                                            setGlobalJustify(false);
                                                        }}
                                                        className={`px-2 py-2 rounded text-sm font-medium transition flex items-center justify-center ${
                                                            globalTextAlign === 'right' && !globalJustify ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                                        }`}
                                                        title="Align Right"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                            <path d="M2 3h12v1H2V3zm4 3h8v1H6V6zm-4 3h12v1H2V9zm4 3h8v1H6v-1z"/>
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setGlobalTextAlign('justify');
                                                            setGlobalJustify(true);
                                                        }}
                                                        className={`px-2 py-2 rounded text-sm font-medium transition flex items-center justify-center ${
                                                            globalJustify ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                                        }`}
                                                        title="Justify"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                            <path d="M2 3h12v1H2V3zm0 3h12v1H2V6zm0 3h12v1H2V9zm0 3h12v1H2v-1z"/>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mb-2">
                                                <label className="text-xs text-gray-300">Text Case</label>
                                                <select
                                                    value={globalTextCase}
                                                    onChange={(e) => setGlobalTextCase(e.target.value)}
                                                    className="w-full p-1 border border-gray-600 rounded text-xs md:text-sm"
                                                >
                                                    <option value="default">Default</option>
                                                    <option value="uppercase">UPPERCASE</option>
                                                    <option value="lowercase">lowercase</option>
                                                    <option value="capitalize">Capitalize Each Word</option>
                                                </select>
                                            </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="mb-3">
                                            <label className="text-xs text-gray-300 mb-1 block">Textbox Margin</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="500"
                                                step="10"
                                                value={textBoxMargin}
                                                onChange={(e) => {
                                                    if (e.target.value === '') {
                                                        setTextBoxMargin(0);
                                                    } else {
                                                        const val = parseInt(e.target.value);
                                                        if (!isNaN(val)) setTextBoxMargin(val);
                                                    }
                                                }}
                                                className="w-full p-2 border border-gray-600 rounded text-xs md:text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
