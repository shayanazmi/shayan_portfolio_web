/**
 * Client-side Image Compression & URL Helper Utilities
 */

export async function compressImage(file, opts = {}) {
    const quality = opts.quality || 0.84;
    const maxBytes = opts.maxBytes || 300 * 1024; // 300 KB limit
    const maxDim = opts.maxDim || 1400;

    const imageBitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    let { width, height } = imageBitmap;

    if (width > maxDim || height > maxDim) {
        if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
        } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
        }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageBitmap, 0, 0, width, height);

    let curQuality = quality;
    let dataUrl = canvas.toDataURL('image/webp', curQuality);

    while (dataUrl.length * 0.75 > maxBytes && curQuality > 0.35) {
        curQuality -= 0.08;
        dataUrl = canvas.toDataURL('image/webp', curQuality);
    }

    return dataUrl;
}

export function extractYouTubeThumbnail(url) {
    if (!url) return '';
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
    return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : '';
}

export function toSpotifyEmbed(raw) {
    if (!raw) return '';
    if (raw.includes('open.spotify.com/embed/')) return raw;
    const match = raw.match(/open\.spotify\.com\/(track|album|playlist|show|episode)\/([a-zA-Z0-9]+)/);
    if (match) {
        return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
    }
    return raw;
}
