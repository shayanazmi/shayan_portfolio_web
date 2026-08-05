import { escapeHtml } from '../../shared/utils/escape.js';

const GALLERY_LIMIT = 6;
let galleryShowingAll = false;
let allGalleryItems = [];

export function setGalleryItems(items) {
    allGalleryItems = items;
}

export function renderGallery() {
    const c   = document.getElementById('gallery-container');
    const btn = document.getElementById('show-more-gallery-btn');
    if (!c) return;

    c.innerHTML = allGalleryItems.map((item, i) => {
        const hasLink    = item.link && item.link.trim();
        const hiddenCls  = i >= GALLERY_LIMIT && !galleryShowingAll ? ' hidden-item' : '';
        const clickAction = hasLink
            ? `window.open('${item.link.replace(/'/g, "\\'")}', '_blank', 'noopener')`
            : `openLightbox('${item.url.replace(/'/g, "\\'")}')`;
        const linkBadge  = hasLink
            ? `<div class="ig-link-badge" title="Opens external link"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></div>`
            : '';
        return `
        <div class="gallery-item${hiddenCls}" onclick="${clickAction}"
             role="button" tabindex="0" aria-label="${hasLink ? 'Open' : 'View'} ${escapeHtml(item.title || 'photo')}${hasLink ? ' on Instagram' : ' full screen'}">
            <img src="${item.url}" alt="${escapeHtml(item.alt || item.title || '')}" loading="lazy">
            <div class="ig-overlay">${escapeHtml(item.title || '')}${linkBadge}</div>
        </div>`;
    }).join('');

    if (btn) {
        btn.style.display = allGalleryItems.length > GALLERY_LIMIT ? 'inline-flex' : 'none';
        if (btn.style.display !== 'none') {
            btn.textContent = galleryShowingAll ? 'View Less' : `View All Frames (${allGalleryItems.length})`;
        }
    }
}

export function openLightbox(src) {
    let lb = document.getElementById('photo-lightbox');
    if (!lb) {
        lb = document.createElement('div');
        lb.id = 'photo-lightbox';
        lb.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.95);display:flex;align-items:center;justify-content:center;cursor:zoom-out;opacity:0;transition:opacity 0.3s ease;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);';
        lb.innerHTML = '<img style="max-width:92vw;max-height:92vh;object-fit:contain;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.8);" alt="Fullscreen photo">';
        lb.addEventListener('click', () => {
            lb.style.opacity = '0';
            setTimeout(() => lb.style.display = 'none', 300);
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && lb.style.display === 'flex') {
                lb.style.opacity = '0';
                setTimeout(() => lb.style.display = 'none', 300);
            }
        });
        document.body.appendChild(lb);
    }
    lb.querySelector('img').src = src;
    lb.style.display = 'flex';
    requestAnimationFrame(() => lb.style.opacity = '1');
}

window.openLightbox = openLightbox;

export function initGalleryUI() {
    document.getElementById('show-more-gallery-btn')?.addEventListener('click', () => {
        galleryShowingAll = !galleryShowingAll;
        renderGallery();
    });
}
