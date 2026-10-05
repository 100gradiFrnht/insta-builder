// Banner tag presets. `match` is the leading emoji in an imported post that auto-selects the preset.
// The 'custom' preset is the fallback and cannot be deleted.
export const DEFAULT_BANNER_PRESETS = [
    { id: 'breaking', group: '', name: '🔴 Breaking', text: 'BREAKING', letterSpacing: 0.85, align: 'center', bgColor: '#850000', match: '🔴' },
    { id: 'custom', group: '', name: 'Custom', text: 'Custom', letterSpacing: 0, align: 'left', bgColor: '#000f85', match: '' },
    { id: 'albania', group: 'Eurovision', name: '🇦🇱 Albania', text: '🇦🇱 Albania', letterSpacing: 0, align: 'left', bgColor: '#c60a00', match: '🇦🇱' },
    { id: 'andorra', group: 'Eurovision', name: '🇦🇩 Andorra', text: '🇦🇩 Andorra', letterSpacing: 0, align: 'left', bgColor: '#102fab', match: '🇦🇩' },
    { id: 'armenia', group: 'Eurovision', name: '🇦🇲 Armenia', text: '🇦🇲 Armenia', letterSpacing: 0, align: 'left', bgColor: '#f0a902', match: '🇦🇲' },
    { id: 'australia', group: 'Eurovision', name: '🇦🇺 Australia', text: '🇦🇺 Australia', letterSpacing: 0, align: 'left', bgColor: '#0000ca', match: '🇦🇺' },
    { id: 'austria', group: 'Eurovision', name: '🇦🇹 Austria', text: '🇦🇹 Austria', letterSpacing: 0, align: 'left', bgColor: '#a70a0a', match: '🇦🇹' },
    { id: 'azerbaijan', group: 'Eurovision', name: '🇦🇿 Azerbaijan', text: '🇦🇿 Azerbaijan', letterSpacing: 0, align: 'left', bgColor: '#13a8b0', match: '🇦🇿' },
    { id: 'belarus', group: 'Eurovision', name: '🇧🇾 Belarus', text: '🇧🇾 Belarus', letterSpacing: 0, align: 'left', bgColor: '#641313', match: '🇧🇾' },
    { id: 'belgium', group: 'Eurovision', name: '🇧🇪 Belgium', text: '🇧🇪 Belgium', letterSpacing: 0, align: 'left', bgColor: '#c4ba00', match: '🇧🇪' },
    { id: 'bosnia', group: 'Eurovision', name: '🇧🇦 Bosnia & Herzegovina', text: '🇧🇦 Bosnia & Herzegovina', letterSpacing: 0, align: 'left', bgColor: '#003aa6', match: '🇧🇦' },
    { id: 'bulgaria', group: 'Eurovision', name: '🇧🇬 Bulgaria', text: '🇧🇬 Bulgaria', letterSpacing: 0, align: 'left', bgColor: '#00b960', match: '🇧🇬' },
    { id: 'canada', group: 'Eurovision', name: '🇨🇦 Canada', text: '🇨🇦 Canada', letterSpacing: 0, align: 'left', bgColor: '#a40000', match: '🇨🇦' },
    { id: 'croatia', group: 'Eurovision', name: '🇭🇷 Croatia', text: '🇭🇷 Croatia', letterSpacing: 0, align: 'left', bgColor: '#d20025', match: '🇭🇷' },
    { id: 'cyprus', group: 'Eurovision', name: '🇨🇾 Cyprus', text: '🇨🇾 Cyprus', letterSpacing: 0, align: 'left', bgColor: '#b78900', match: '🇨🇾' },
    { id: 'czechia', group: 'Eurovision', name: '🇨🇿 Czechia', text: '🇨🇿 Czechia', letterSpacing: 0, align: 'left', bgColor: '#000971', match: '🇨🇿' },
    { id: 'denmark', group: 'Eurovision', name: '🇩🇰 Denmark', text: '🇩🇰 Denmark', letterSpacing: 0, align: 'left', bgColor: '#b90004', match: '🇩🇰' },
    { id: 'estonia', group: 'Eurovision', name: '🇪🇪 Estonia', text: '🇪🇪 Estonia', letterSpacing: 0, align: 'left', bgColor: '#0056e6', match: '🇪🇪' },
    { id: 'finland', group: 'Eurovision', name: '🇫🇮 Finland', text: '🇫🇮 Finland', letterSpacing: 0, align: 'left', bgColor: '#0030f2', match: '🇫🇮' },
    { id: 'france', group: 'Eurovision', name: '🇫🇷 France', text: '🇫🇷 France', letterSpacing: 0, align: 'left', bgColor: '#0013a4', match: '🇫🇷' },
    { id: 'georgia', group: 'Eurovision', name: '🇬🇪 Georgia', text: '🇬🇪 Georgia', letterSpacing: 0, align: 'left', bgColor: '#9d0000', match: '🇬🇪' },
    { id: 'germany', group: 'Eurovision', name: '🇩🇪 Germany', text: '🇩🇪 Germany', letterSpacing: 0, align: 'left', bgColor: '#d56300', match: '🇩🇪' },
    { id: 'greece', group: 'Eurovision', name: '🇬🇷 Greece', text: '🇬🇷 Greece', letterSpacing: 0, align: 'left', bgColor: '#0062ca', match: '🇬🇷' },
    { id: 'hungary', group: 'Eurovision', name: '🇭🇺 Hungary', text: '🇭🇺 Hungary', letterSpacing: 0, align: 'left', bgColor: '#00640f', match: '🇭🇺' },
    { id: 'iceland', group: 'Eurovision', name: '🇮🇸 Iceland', text: '🇮🇸 Iceland', letterSpacing: 0, align: 'left', bgColor: '#001d91', match: '🇮🇸' },
    { id: 'ireland', group: 'Eurovision', name: '🇮🇪 Ireland', text: '🇮🇪 Ireland', letterSpacing: 0, align: 'left', bgColor: '#00970d', match: '🇮🇪' },
    { id: 'israel', group: 'Eurovision', name: '🇮🇱 Israel', text: '🇮🇱 Israel', letterSpacing: 0, align: 'left', bgColor: '#0060bf', match: '🇮🇱' },
    { id: 'italy', group: 'Eurovision', name: '🇮🇹 Italy', text: '🇮🇹 Italy', letterSpacing: 0, align: 'left', bgColor: '#009507', match: '🇮🇹' },
    { id: 'kazakhstan', group: 'Eurovision', name: '🇰🇿 Kazakhstan', text: '🇰🇿 Kazakhstan', letterSpacing: 0, align: 'left', bgColor: '#009f9f', match: '🇰🇿' },
    { id: 'kosovo', group: 'Eurovision', name: '🇽🇰 Kosovo', text: '🇽🇰 Kosovo', letterSpacing: 0, align: 'left', bgColor: '#000fe8', match: '🇽🇰' },
    { id: 'latvia', group: 'Eurovision', name: '🇱🇻 Latvia', text: '🇱🇻 Latvia', letterSpacing: 0, align: 'left', bgColor: '#400000', match: '🇱🇻' },
    { id: 'lithuania', group: 'Eurovision', name: '🇱🇹 Lithuania', text: '🇱🇹 Lithuania', letterSpacing: 0, align: 'left', bgColor: '#bf8f00', match: '🇱🇹' },
    { id: 'luxembourg', group: 'Eurovision', name: '🇱🇺 Luxembourg', text: '🇱🇺 Luxembourg', letterSpacing: 0, align: 'left', bgColor: '#00bde8', match: '🇱🇺' },
    { id: 'malta', group: 'Eurovision', name: '🇲🇹 Malta', text: '🇲🇹 Malta', letterSpacing: 0, align: 'left', bgColor: '#8a0000', match: '🇲🇹' },
    { id: 'moldova', group: 'Eurovision', name: '🇲🇩 Moldova', text: '🇲🇩 Moldova', letterSpacing: 0, align: 'left', bgColor: '#a68500', match: '🇲🇩' },
    { id: 'monaco', group: 'Eurovision', name: '🇲🇨 Monaco', text: '🇲🇨 Monaco', letterSpacing: 0, align: 'left', bgColor: '#950000', match: '🇲🇨' },
    { id: 'montenegro', group: 'Eurovision', name: '🇲🇪 Montenegro', text: '🇲🇪 Montenegro', letterSpacing: 0, align: 'left', bgColor: '#aa5500', match: '🇲🇪' },
    { id: 'morocco', group: 'Eurovision', name: '🇲🇦 Morocco', text: '🇲🇦 Morocco', letterSpacing: 0, align: 'left', bgColor: '#6d1818', match: '🇲🇦' },
    { id: 'netherlands', group: 'Eurovision', name: '🇳🇱 Netherlands', text: '🇳🇱 Netherlands', letterSpacing: 0, align: 'left', bgColor: '#00209d', match: '🇳🇱' },
    { id: 'northmacedonia', group: 'Eurovision', name: '🇲🇰 North Macedonia', text: '🇲🇰 North Macedonia', letterSpacing: 0, align: 'left', bgColor: '#ae4600', match: '🇲🇰' },
    { id: 'norway', group: 'Eurovision', name: '🇳🇴 Norway', text: '🇳🇴 Norway', letterSpacing: 0, align: 'left', bgColor: '#aa0000', match: '🇳🇴' },
    { id: 'poland', group: 'Eurovision', name: '🇵🇱 Poland', text: '🇵🇱 Poland', letterSpacing: 0, align: 'left', bgColor: '#a80022', match: '🇵🇱' },
    { id: 'portugal', group: 'Eurovision', name: '🇵🇹 Portugal', text: '🇵🇹 Portugal', letterSpacing: 0, align: 'left', bgColor: '#007103', match: '🇵🇹' },
    { id: 'romania', group: 'Eurovision', name: '🇷🇴 Romania', text: '🇷🇴 Romania', letterSpacing: 0, align: 'left', bgColor: '#000291', match: '🇷🇴' },
    { id: 'russia', group: 'Eurovision', name: '🇷🇺 Russia', text: '🇷🇺 Russia', letterSpacing: 0, align: 'left', bgColor: '#000f85', match: '🇷🇺' },
    { id: 'sanmarino', group: 'Eurovision', name: '🇸🇲 San Marino', text: '🇸🇲 San Marino', letterSpacing: 0, align: 'left', bgColor: '#0083ae', match: '🇸🇲' },
    { id: 'serbia', group: 'Eurovision', name: '🇷🇸 Serbia', text: '🇷🇸 Serbia', letterSpacing: 0, align: 'left', bgColor: '#001c9d', match: '🇷🇸' },
    { id: 'slovakia', group: 'Eurovision', name: '🇸🇰 Slovakia', text: '🇸🇰 Slovakia', letterSpacing: 0, align: 'left', bgColor: '#0c0091', match: '🇸🇰' },
    { id: 'slovenia', group: 'Eurovision', name: '🇸🇮 Slovenia', text: '🇸🇮 Slovenia', letterSpacing: 0, align: 'left', bgColor: '#0028b9', match: '🇸🇮' },
    { id: 'spain', group: 'Eurovision', name: '🇪🇸 Spain', text: '🇪🇸 Spain', letterSpacing: 0, align: 'left', bgColor: '#ae8300', match: '🇪🇸' },
    { id: 'sweden', group: 'Eurovision', name: '🇸🇪 Sweden', text: '🇸🇪 Sweden', letterSpacing: 0, align: 'left', bgColor: '#005b9f', match: '🇸🇪' },
    { id: 'switzerland', group: 'Eurovision', name: '🇨🇭 Switzerland', text: '🇨🇭 Switzerland', letterSpacing: 0, align: 'left', bgColor: '#c40000', match: '🇨🇭' },
    { id: 'turkiye', group: 'Eurovision', name: '🇹🇷 Türkiye', text: '🇹🇷 Türkiye', letterSpacing: 0, align: 'left', bgColor: '#a71f1f', match: '🇹🇷' },
    { id: 'ukraine', group: 'Eurovision', name: '🇺🇦 Ukraine', text: '🇺🇦 Ukraine', letterSpacing: 0, align: 'left', bgColor: '#d5ce00', match: '🇺🇦' },
    { id: 'uk', group: 'Eurovision', name: '🇬🇧 United Kingdom', text: '🇬🇧 United Kingdom', letterSpacing: 0, align: 'left', bgColor: '#0000ae', match: '🇬🇧' },
    { id: 'bangladesh', group: 'Eurovision Asia', name: '🇧🇩 Bangladesh', text: '🇧🇩 Bangladesh', letterSpacing: 0, align: 'left', bgColor: '#006a4e', match: '🇧🇩' },
    { id: 'bhutan', group: 'Eurovision Asia', name: '🇧🇹 Bhutan', text: '🇧🇹 Bhutan', letterSpacing: 0, align: 'left', bgColor: '#e47c1a', match: '🇧🇹' },
    { id: 'cambodia', group: 'Eurovision Asia', name: '🇰🇭 Cambodia', text: '🇰🇭 Cambodia', letterSpacing: 0, align: 'left', bgColor: '#032ea1', match: '🇰🇭' },
    { id: 'laos', group: 'Eurovision Asia', name: '🇱🇦 Laos', text: '🇱🇦 Laos', letterSpacing: 0, align: 'left', bgColor: '#ce1126', match: '🇱🇦' },
    { id: 'malaysia', group: 'Eurovision Asia', name: '🇲🇾 Malaysia', text: '🇲🇾 Malaysia', letterSpacing: 0, align: 'left', bgColor: '#cc0001', match: '🇲🇾' },
    { id: 'nepal', group: 'Eurovision Asia', name: '🇳🇵 Nepal', text: '🇳🇵 Nepal', letterSpacing: 0, align: 'left', bgColor: '#003893', match: '🇳🇵' },
    { id: 'philippines', group: 'Eurovision Asia', name: '🇵🇭 Philippines', text: '🇵🇭 Philippines', letterSpacing: 0, align: 'left', bgColor: '#0038a8', match: '🇵🇭' },
    { id: 'southkorea', group: 'Eurovision Asia', name: '🇰🇷 South Korea', text: '🇰🇷 South Korea', letterSpacing: 0, align: 'left', bgColor: '#003478', match: '🇰🇷' },
    { id: 'thailand', group: 'Eurovision Asia', name: '🇹🇭 Thailand', text: '🇹🇭 Thailand', letterSpacing: 0, align: 'left', bgColor: '#a51931', match: '🇹🇭' },
    { id: 'vietnam', group: 'Eurovision Asia', name: '🇻🇳 Vietnam', text: '🇻🇳 Vietnam', letterSpacing: 0, align: 'left', bgColor: '#da251d', match: '🇻🇳' },
];

const STORAGE_KEY = 'escdiscord.bannerPresets.v1';

export const sanitizePreset = (p) => ({
    id: String(p.id),
    group: typeof p.group === 'string' ? p.group : '',
    name: typeof p.name === 'string' && p.name ? p.name : String(p.id),
    text: typeof p.text === 'string' ? p.text : '',
    letterSpacing: typeof p.letterSpacing === 'number' && !isNaN(p.letterSpacing) ? p.letterSpacing : 0,
    align: ['left', 'center', 'right'].includes(p.align) ? p.align : 'left',
    bgColor: /^#[0-9a-f]{6}$/i.test(p.bgColor) ? p.bgColor : '#000f85',
    match: typeof p.match === 'string' ? p.match : '',
});

// Validates a parsed preset list; throws on malformed input. Ensures 'custom' exists and ids are unique.
export const normalizePresets = (list) => {
    if (!Array.isArray(list)) throw new Error('Expected a list of presets');
    const seen = new Set();
    const presets = [];
    for (const p of list) {
        if (!p || typeof p !== 'object' || !p.id || seen.has(String(p.id))) continue;
        seen.add(String(p.id));
        presets.push(sanitizePreset(p));
    }
    if (!seen.has('custom')) presets.unshift(DEFAULT_BANNER_PRESETS.find(p => p.id === 'custom'));
    return presets;
};

export const loadBannerPresets = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return normalizePresets(JSON.parse(raw));
    } catch {
        // Fall through to defaults
    }
    return DEFAULT_BANNER_PRESETS;
};

export const saveBannerPresets = (presets) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch {
        // Storage unavailable (private mode, quota); presets stay in memory for this session
    }
};

// Finds the preset whose `match` emoji starts the text (longest match wins, so flags beat single emoji).
export const findPresetForText = (presets, text) => {
    const trimmed = text.trimStart();
    let best = null;
    for (const p of presets) {
        if (p.match && trimmed.startsWith(p.match) && (!best || p.match.length > best.match.length)) best = p;
    }
    return best;
};

// Groups presets in order of first appearance; ungrouped presets come first.
export const groupPresets = (presets) => {
    const groups = new Map([['', []]]);
    for (const p of presets) {
        if (!groups.has(p.group)) groups.set(p.group, []);
        groups.get(p.group).push(p);
    }
    return [...groups].filter(([, items]) => items.length > 0);
};

export const makePresetId = (name, existing) => {
    const base = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '') || 'preset';
    let id = base;
    for (let i = 2; existing.some(p => p.id === id); i++) id = `${base}${i}`;
    return id;
};

export const PRESETS_API = 'https://escdiscord-cors-proxy.100gradifrnht.workers.dev/presets';
