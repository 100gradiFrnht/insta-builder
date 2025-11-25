import twemoji from 'twemoji';

// Cache for loaded emoji images
const emojiImageCache = new Map();

// Regular expression to match emoji including flag sequences
// Matches: flag sequences (regional indicators), emoji with variation selectors, and other emoji
const emojiRegex = /([\u{1F1E6}-\u{1F1FF}]{2}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;

/**
 * Parse text and split it into segments of text and emoji
 * @param {string} text - The text to parse
 * @returns {Array} Array of {type: 'text'|'emoji', content: string, codePoint?: string}
 */
export function parseTextWithEmoji(text) {
    const segments = [];
    let lastIndex = 0;
    let match;

    // Reset regex
    emojiRegex.lastIndex = 0;

    while ((match = emojiRegex.exec(text)) !== null) {
        // Add text before emoji
        if (match.index > lastIndex) {
            const textContent = text.substring(lastIndex, match.index);
            if (textContent) {
                segments.push({ type: 'text', content: textContent });
            }
        }

        // Add emoji
        const emoji = match[0];
        const codePoint = getEmojiCodePoint(emoji);
        segments.push({ type: 'emoji', content: emoji, codePoint });

        lastIndex = match.index + emoji.length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        const textContent = text.substring(lastIndex);
        if (textContent) {
            segments.push({ type: 'text', content: textContent });
        }
    }

    // If no emojis found, return text as single segment
    if (segments.length === 0) {
        segments.push({ type: 'text', content: text });
    }

    return segments;
}

/**
 * Get the code point for an emoji character
 * @param {string} emoji - The emoji character
 * @returns {string} The code point in hex format
 */
function getEmojiCodePoint(emoji) {
    const codePoints = [];
    for (let i = 0; i < emoji.length; i++) {
        const code = emoji.codePointAt(i);
        if (code) {
            codePoints.push(code.toString(16));
            // Skip surrogate pairs
            if (code > 0xFFFF) i++;
        }
    }
    return codePoints.join('-');
}

/**
 * Get Twemoji image URL for an emoji
 * @param {string} codePoint - The emoji code point
 * @returns {string} The Twemoji CDN URL
 */
export function getTwemojiUrl(codePoint) {
    return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${codePoint}.png`;
}

/**
 * Load and cache an emoji image
 * @param {string} codePoint - The emoji code point
 * @returns {Promise<HTMLImageElement>} The loaded image
 */
export async function loadEmojiImage(codePoint) {
    // Check cache first
    if (emojiImageCache.has(codePoint)) {
        return emojiImageCache.get(codePoint);
    }

    // Load image
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            emojiImageCache.set(codePoint, img);
            resolve(img);
        };
        img.onerror = () => {
            console.error('Failed to load emoji:', codePoint);
            reject(new Error(`Failed to load emoji: ${codePoint}`));
        };
        img.src = getTwemojiUrl(codePoint);
    });
}

/**
 * Preload emoji images for a text string
 * @param {string} text - The text containing emojis
 * @returns {Promise<void>}
 */
export async function preloadEmojisInText(text) {
    const segments = parseTextWithEmoji(text);
    const emojiSegments = segments.filter(seg => seg.type === 'emoji');

    // Load all emojis in parallel
    await Promise.all(
        emojiSegments.map(seg => loadEmojiImage(seg.codePoint))
    );
}
