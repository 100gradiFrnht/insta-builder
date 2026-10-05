export const LIMITS = { x: 280, bluesky: 300, instagram: 2200 };
export const MAX_IMAGES_PER_POST = 4;
export const MAX_CAROUSEL_SLIDES = 20;
export const X_URL_WEIGHT = 23;

const URL_RE = /https?:\/\/\S+/g;
const EMOJI_RE = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;
const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const graphemes = (text) => [...segmenter.segment(text)].map(s => s.segment);

// Canvas text uses *italic*, **bold** and ***both***; social posts must contain none of the markers. Paired markers
// are unwrapped (even across lines), then any leftover marker touching text is dropped. A lone " * " is kept.
export const stripMarkdown = (text) => text
    .replace(/(\*{1,3})(?=[^\s*])([\s\S]*?[^\s*])\1(?!\*)/g, '$2')
    .replace(/\*{2,}/g, '')
    .replace(/(?<=\S)\*|\*(?=\S)/g, '')
    .replace(/ {2,}/g, ' ');

// Textboxes are stacked from the bottom, so index 0 is the lowest box; reading order is reversed
export const slideParagraphs = (slide) =>
    [...slide.textElements].reverse().map(el => stripMarkdown(el.text || '').trim()).filter(Boolean);

export const withEmoji = (emoji, text) => (emoji ? `${emoji} ${text}` : text);

// The first mention of each phrase (across all texts, in order) becomes a hashtag. "Eurovision Asia" is its own
// phrase, so plain "Eurovision" never matches inside it ("Junior Eurovision" counts as Eurovision: Junior #Eurovision).
// Rules already satisfied by a typed hashtag are skipped.
const HASHTAG_RULES = [
    { pattern: /(?<![#\w])Eurovision\s+Asia(?!\w)/i, tag: '#EurovisionAsia', existing: /#EurovisionAsia(?!\w)/i },
    { pattern: /(?<![#\w])Eurovision(?!\s+Asia(?!\w))(?!\w)/i, tag: '#Eurovision', existing: /#Eurovision(?!\w)/i },
];

// Replaces the first match outside URLs; returns null when there is none
const replaceOutsideUrls = (text, pattern, replacement) => {
    const parts = text.split(/(https?:\/\/\S+)/);
    for (let i = 0; i < parts.length; i += 2) {
        if (pattern.test(parts[i])) {
            parts[i] = parts[i].replace(pattern, replacement);
            return parts.join('');
        }
    }
    return null;
};

export const hashtagFirstMentions = (texts) => {
    const result = [...texts];
    for (const rule of HASHTAG_RULES) {
        if (result.some(t => rule.existing.test(t))) continue;
        for (let i = 0; i < result.length; i++) {
            const replaced = replaceOutsideUrls(result[i], rule.pattern, rule.tag);
            if (replaced !== null) {
                result[i] = replaced;
                break;
            }
        }
    }
    return result;
};

// X's weighted count: URLs are 23, emoji 2, Latin and common punctuation 1, everything else (e.g. CJK) 2
export const countX = (text) => {
    const urls = text.match(URL_RE) || [];
    let count = urls.length * X_URL_WEIGHT;
    for (const g of graphemes(text.normalize('NFC').replace(URL_RE, ''))) {
        if (EMOJI_RE.test(g)) {
            count += 2;
            continue;
        }
        for (const ch of g) {
            const cp = ch.codePointAt(0);
            const light = cp <= 4351 || (cp >= 8192 && cp <= 8205) || (cp >= 8208 && cp <= 8223) || (cp >= 8242 && cp <= 8247);
            count += light ? 1 : 2;
        }
    }
    return count;
};

// Bluesky counts graphemes, so an emoji or flag is 1
export const countBluesky = (text) => graphemes(text).length;

// Instagram counts UTF-16 code units, and each line break as 2
export const countInstagram = (text) => text.length + (text.match(/\n/g) || []).length;

// Thread for X and Bluesky: every slide's textboxes in order, each prefixed with that slide's emoji,
// then a plain "More:" post. The More post is optional: without a link it is marked `omitted` and not sent. The first Eurovision / Eurovision Asia mention becomes a hashtag. Each slide's original image goes on the first post from that slide.
export const buildThreadPosts = (slides, emojis, moreLink) => {
    const posts = [];
    const tagged = hashtagFirstMentions(slides.flatMap(slideParagraphs));
    let next = 0;
    slides.forEach((slide, slideIdx) => {
        const paragraphs = slideParagraphs(slide).map(() => tagged[next++]);
        const image = slide.baseImage ? [slideImageRef(slide, slideIdx)] : [];
        if (paragraphs.length === 0) {
            if (image.length) posts.push({ slideIdx, text: '', images: image });
            return;
        }
        paragraphs.forEach((p, i) => posts.push({
            slideIdx,
            text: withEmoji(emojis[slideIdx], p),
            images: i === 0 ? image : [],
        }));
    });
    const link = moreLink.trim();
    posts.push({ slideIdx: null, isMore: true, omitted: !link, text: link ? `More: ${link}` : '', images: [] });
    return posts;
};

// Instagram caption: all slides' paragraphs separated by blank lines; only the first starts with the emoji
export const buildCaption = (slides, emoji) => {
    const paragraphs = hashtagFirstMentions(slides.flatMap(slideParagraphs));
    if (paragraphs.length === 0) return '';
    return [withEmoji(emoji, paragraphs[0]), ...paragraphs.slice(1)].join('\n\n');
};

export const slideImageRef = (slide, slideIdx) => ({
    key: `slide-${slideIdx}`,
    label: `Slide ${slideIdx + 1} image`,
    src: slide.baseImage.src,
    kind: 'slide',
});

// Every image the user can attach in the preview: slide originals plus unused images from Bluesky imports
export const collectImageLibrary = (slides) => {
    const library = [];
    const seen = new Set();
    slides.forEach((slide, slideIdx) => {
        if (slide.baseImage) library.push(slideImageRef(slide, slideIdx));
        (slide.bskyData?.allImages || []).forEach((img, i) => {
            const usedAsBase = i === slide.bskySelectedImageIdx && !slide.bskyCustomImage && slide.baseImage;
            if (usedAsBase || seen.has(img.fullsize)) return;
            seen.add(img.fullsize);
            library.push({ key: `bsky-${img.fullsize}`, label: 'From Bluesky import', src: img.thumb, url: img.fullsize, kind: 'bsky' });
        });
    });
    return library;
};

// Finds the link that follows "More:" in a Bluesky post. The visible text is shortened, so the full URL
// comes from the post's link facets (whose offsets are UTF-8 bytes).
export const extractMoreLink = (record) => {
    const text = record?.text || '';
    const idx = text.search(/More:/i);
    if (idx === -1) return '';
    const byteIdx = new TextEncoder().encode(text.slice(0, idx)).length;
    for (const facet of record.facets || []) {
        if (facet.index?.byteStart < byteIdx) continue;
        const link = facet.features?.find(f => f.$type === 'app.bsky.richtext.facet#link');
        if (link?.uri) return link.uri;
    }
    return text.slice(idx).match(/More:\s*(\S+)/i)?.[1] ?? '';
};
