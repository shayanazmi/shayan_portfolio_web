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

    container.innerHTML = visibleItems.map((item) => {
        const escapedTitle = escapeHtml(item.title || 'Photo');
        const escapedUrl = escapeHtml(item.url || '');
        const escapedLink = escapeHtml(item.link || '');

        const clickAction = escapedLink
            ? `window.open('${escapedLink.replace(/'/g, "\\'")}', '_blank', 'noopener')`
            : `openLightbox('${escapedUrl.replace(/'/g, "\\'")}')`;

        return `
            <div class="gallery-item" onclick="${clickAction}" role="button" tabindex="0" aria-label="View ${escapedTitle} full screen">
                <img src="${escapedUrl}" alt="${escapedTitle}" loading="lazy" />
                <div class="ig-overlay">${escapedTitle}</div>
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

export function openLightbox(src) {
    if (!src) return;
    let overlay = document.getElementById('photo-lightbox');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'photo-lightbox';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.95);display:flex;align-items:center;justify-content:center;cursor:zoom-out;opacity:0;transition:opacity 0.3s ease;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);';
        overlay.innerHTML = `<img style="max-width:92vw;max-height:92vh;object-fit:contain;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.8);" alt="Fullscreen photo">`;
        document.body.appendChild(overlay);

        const closeFn = () => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.style.display = 'none', 300);
        };

        overlay.addEventListener('click', closeFn);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.style.display === 'flex') closeFn();
        });
    }

    const img = overlay.querySelector('img');
    if (img) img.src = src;
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
