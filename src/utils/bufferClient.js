const WORKER_URL = 'https://escdiscord-cors-proxy.100gradifrnht.workers.dev';

export const MAX_SCHEDULE_DAYS = 28;
// Bluesky rejects images over ~1 MB, so thread images are compressed below this
const THREAD_IMAGE_MAX_BYTES = 950_000;
const THREAD_IMAGE_MAX_DIMENSION = 2048;

export class PostingError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

async function request(path, password, options = {}) {
    const res = await fetch(`${WORKER_URL}${path}`, {
        ...options,
        headers: { ...options.headers, 'X-Post-Password': password },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new PostingError(body.error || `HTTP ${res.status}`, res.status);
    return body;
}

const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = src;
});

const canvasToBlob = (canvas, quality) =>
    new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not encode image'))), 'image/jpeg', quality));

// Re-encodes an image as JPEG, lowering quality and then size until it fits within maxBytes
async function compressImage(src, maxBytes = THREAD_IMAGE_MAX_BYTES) {
    const img = await loadImage(src);
    let scale = Math.min(1, THREAD_IMAGE_MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
    for (let attempt = 0; attempt < 8; attempt++) {
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; // transparent PNGs get a white background instead of black
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        for (const quality of [0.9, 0.8, 0.7]) {
            const blob = await canvasToBlob(canvas, quality);
            if (blob.size <= maxBytes) return blob;
        }
        scale *= 0.8;
    }
    throw new Error('Image is too large to compress for Bluesky');
}

// Gets a JPEG blob for a preview image reference (slide original, Bluesky import or local upload)
export async function imageRefToBlob(ref) {
    if (ref.kind === 'bsky') {
        // Remote images go through the CORS proxy so the canvas isn't tainted
        const res = await fetch(`${WORKER_URL}?url=${encodeURIComponent(ref.url)}`);
        if (!res.ok) throw new Error(`Could not download image (HTTP ${res.status})`);
        const objectUrl = URL.createObjectURL(await res.blob());
        try {
            return await compressImage(objectUrl);
        } finally {
            URL.revokeObjectURL(objectUrl);
        }
    }
    return compressImage(ref.src);
}

export const checkPassword = (password) => request('/buffer/check', password);

export async function uploadImage(blob, password) {
    const { url } = await request('/media', password, { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob });
    return url;
}

export const sendPosts = (payload, password) =>
    request('/buffer/send', password, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

export const fetchPostStatuses = (ids, password) =>
    request(`/buffer/status?ids=${ids.map(encodeURIComponent).join(',')}`, password).then(r => r.posts);
