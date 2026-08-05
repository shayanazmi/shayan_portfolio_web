/**
 * Compress an image file to a target max dimension and quality.
 * Outputs WebP where supported, JPEG as fallback.
 * Returns a base64 data URL.
 */
export async function compressImage(file, {
    maxDim   = null,    // null = auto-detect from orientation
    quality  = 0.82,
    maxBytes = 300 * 1024   // 300 KB
} = {}) {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;

    const adaptedMaxDim = maxDim ?? (width >= height ? 1600 : 1200);

    if (width > adaptedMaxDim || height > adaptedMaxDim) {
        const scale = adaptedMaxDim / Math.max(width, height);
        width  = Math.round(width  * scale);
        height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width  = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const supportsWebP = canvas.toDataURL('image/webp').startsWith('data:image/webp');
    const mimeType     = supportsWebP ? 'image/webp' : 'image/jpeg';

    let q    = quality;
    let data = canvas.toDataURL(mimeType, q);

    while (q > 0.40) {
        const byteCount = Math.round((data.length - data.indexOf(',') - 1) * 0.75);
        if (byteCount <= maxBytes) break;
        q   -= 0.08;
        data = canvas.toDataURL(mimeType, q);
    }

    return data;
}

/**
 * Extract a YouTube thumbnail from any YT URL format.
 * Falls back to the original URL if not a YT link.
 */
export function extractYouTubeThumbnail(url) {
    const match = url.match(
        /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
    );
    return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : url;
}

/**
 * Normalise a raw Spotify URL (or embed snippet) to an embeddable URL.
 */
export function toSpotifyEmbed(raw) {
    const srcMatch = raw.match(/src="([^"]+)"/);
    if (srcMatch) raw = srcMatch[1];
    const parts = raw.match(/open\.spotify\.com\/(track|playlist|album|show|episode|artist)\/([a-zA-Z0-9]+)/);
    if (parts && !raw.includes('/embed/')) {
        return `https://open.spotify.com/embed/${parts[1]}/${parts[2]}?utm_source=generator&theme=0`;
    }
    return raw;
}
