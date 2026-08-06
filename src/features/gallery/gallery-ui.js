import { escapeHtml } from '../../shared/utils/escape.js';

let currentGalleryItems = [];
let galleryExpanded = false;
const GALLERY_LIMIT = 6;

export function renderGallery(items) {
    if (items) currentGalleryItems = items;
    const container = document.getElementById('gallery-container');
    const toggleBtn = document.getElementById('show-more-gallery-btn');
    if (!container) return;

    const visibleItems = galleryExpanded ? currentGalleryItems : currentGalleryItems.slice(0, GALLERY_LIMIT);

    container.setAttribute('data-count', visibleItems.length);

    container.innerHTML = visibleItems.map((item) => {
        const escapedTitle = escapeHtml(item.title || 'Photo');
        const escapedUrl = escapeHtml(item.url || '');
        const escapedLink = escapeHtml(item.link || '');
        const targetMediaUrl = escapedUrl || escapedLink;

        const isYoutube = /youtube\.com|youtu\.be/i.test(targetMediaUrl);
        const isSpotify = /spotify\.com/i.test(targetMediaUrl);

        let clickAction;
        if (escapedLink && !isYoutube && !isSpotify) {
            clickAction = `window.open('${escapedLink.replace(/'/g, "\\'")}', '_blank', 'noopener')`;
        } else {
            clickAction = `openLightbox('${targetMediaUrl.replace(/'/g, "\\'")}')`;
        }

        return `
            <div class="gallery-item" onclick="${clickAction}" role="button" tabindex="0" aria-label="View ${escapedTitle}">
                <img src="${escapedUrl}" alt="${escapedTitle}" loading="lazy" onError="this.onerror=null;this.src='favicon.svg';" />
                <div class="ig-overlay">
                    <span>${escapedTitle}</span>
                    ${isYoutube ? '<span class="media-type-badge">▶ Video</span>' : ''}
                </div>
            </div>
        `;
    }).join('');

    if (toggleBtn) {
        if (currentGalleryItems.length > GALLERY_LIMIT) {
            toggleBtn.style.display = 'inline-flex';
            toggleBtn.textContent = galleryExpanded ? 'View Less' : `View All Frames (${currentGalleryItems.length})`;
        } else {
            toggleBtn.style.display = 'none';
        }
    }
}

function extractYouTubeId(url) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
}

export function openLightbox(src) {
    if (!src) return;
    let overlay = document.getElementById('photo-lightbox');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'photo-lightbox';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.95);display:flex;align-items:center;justify-content:center;cursor:zoom-out;opacity:0;transition:opacity 0.3s ease;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);padding:1rem;';
        document.body.appendChild(overlay);

        const closeFn = () => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
                overlay.innerHTML = '';
            }, 300);
        };

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.tagName === 'IMG') closeFn();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.style.display === 'flex') closeFn();
        });
    }

    const ytId = extractYouTubeId(src);
    if (ytId) {
        overlay.innerHTML = `
            <div style="position:relative;width:90vw;max-width:900px;aspect-ratio:16/9;box-shadow:0 20px 60px rgba(0,0,0,0.9);border-radius:12px;overflow:hidden;background:#000;">
                <iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1" style="width:100%;height:100%;border:none;" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
            </div>
        `;
    } else if (/spotify\.com/i.test(src)) {
        const spotifyEmbed = src.replace('open.spotify.com/', 'open.spotify.com/embed/');
        overlay.innerHTML = `
            <div style="position:relative;width:90vw;max-width:600px;height:380px;box-shadow:0 20px 60px rgba(0,0,0,0.9);border-radius:12px;overflow:hidden;background:#000;">
                <iframe src="${spotifyEmbed}" style="width:100%;height:100%;border:none;" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
            </div>
        `;
    } else {
        overlay.innerHTML = `<img src="${escapeHtml(src)}" style="max-width:92vw;max-height:92vh;object-fit:contain;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.8);" alt="Fullscreen photo">`;
    }

    overlay.style.display = 'flex';

    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
    });
}

if (typeof window !== 'undefined') {
    window.openLightbox = openLightbox;
}

export function initGalleryUI() {
    const toggleBtn = document.getElementById('show-more-gallery-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            galleryExpanded = !galleryExpanded;
            renderGallery();
        });
    }
}
