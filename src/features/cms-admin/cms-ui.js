import {
    saveItem, deleteCategoryItem, moveItemOrder, enterEditMode, saveUiDoc
} from './cms-service.js';
import { compressImage, toSpotifyEmbed } from './image-upload.js';
import { showToast } from './toast.js';
import { escapeHtml } from '../../shared/utils/escape.js';
import { fetchBeholdFeed, DEFAULT_BEHOLD_URL } from '../gallery/gallery-api.js';

export function switchGalleryTab(mode) {
    const fileTab = document.getElementById('gallery-tab-file');
    const linkTab = document.getElementById('gallery-tab-link');
    const fileInputGroup = document.getElementById('gallery-input-file-group');
    const linkInputGroup = document.getElementById('gallery-input-link-group');

    if (mode === 'file') {
        fileTab?.classList.add('active');
        linkTab?.classList.remove('active');
        if (fileInputGroup) fileInputGroup.style.display = 'block';
        if (linkInputGroup) linkInputGroup.style.display = 'none';
    } else {
        linkTab?.classList.add('active');
        fileTab?.classList.remove('active');
        if (linkInputGroup) linkInputGroup.style.display = 'block';
        if (fileInputGroup) fileInputGroup.style.display = 'none';
    }
}

export function renderCategoryList(category) {
    const container = document.getElementById(`list-${category}`);
    if (!container) return;

    const items = window.globalManageData?.[category] || [];
    if (!items.length) {
        container.innerHTML = '<div style="color:#6b7280;font-size:0.85rem;padding:8px;">No items added yet.</div>';
        return;
    }

    container.innerHTML = items.map((item, idx) => {
        const title = escapeHtml(item.title || item.role || item.degree || item.name || item.text || `Item #${idx + 1}`);
        return `
            <div class="admin-item-card">
                <span style="font-weight:500;">${title}</span>
                <div class="admin-item-actions">
                    <button class="admin-btn-icon" onclick="moveCMSOrder('${category}', ${idx}, -1)" title="Move Up">▲</button>
                    <button class="admin-btn-icon" onclick="moveCMSOrder('${category}', ${idx}, 1)" title="Move Down">▼</button>
                    <button class="admin-btn-icon" onclick="editCMSItem('${category}', '${item.id}')" title="Edit">✏️</button>
                    <button class="admin-btn-icon admin-btn-delete" onclick="confirmCMSDelete(this, '${category}', '${item.id}')" title="Delete">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

if (typeof window !== 'undefined') {
    window._cmsRenderCategoryList = renderCategoryList;
    window.moveCMSOrder = (category, idx, dir) => moveItemOrder(category, idx, dir);
    window.editCMSItem = (category, docId) => {
        const item = (window.globalManageData?.[category] || []).find(i => i.id === docId);
        if (item) enterEditMode(category, item);
    };
    window.confirmCMSDelete = (btn, category, docId) => {
        if (btn.classList.contains('confirming')) {
            deleteCategoryItem(category, docId);
        } else {
            btn.classList.add('confirming');
            btn.textContent = 'Sure?';
            setTimeout(() => {
                btn.classList.remove('confirming');
                btn.textContent = '🗑️';
            }, 3000);
        }
    };
}

export function initCMSListeners() {
    // ── Sidebar panel switching ─────────────────────────────────────────────
    document.querySelectorAll('.cms-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.cms-nav-item').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.cms-form-panel').forEach(p => p.classList.remove('active'));
            item.classList.add('active');
            const targetPanelId = item.dataset.panel;
            if (targetPanelId) {
                const panel = document.getElementById(targetPanelId);
                if (panel) panel.classList.add('active');
            }
        });
    });

    // Gallery source tab switcher
    document.getElementById('gallery-tab-file')?.addEventListener('click', () => switchGalleryTab('file'));
    document.getElementById('gallery-tab-link')?.addEventListener('click', () => switchGalleryTab('link'));

    // Image compression preview
    const fileInput = document.getElementById('admin-img-file');
    const previewContainer = document.getElementById('admin-img-preview-container');
    const previewImg = document.getElementById('admin-img-preview');
    const previewSize = document.getElementById('admin-img-preview-size');

    if (fileInput) {
        fileInput.addEventListener('change', async () => {
            const file = fileInput.files[0];
            if (!file) return;
            if (file.size > 20 * 1024 * 1024) {
                showToast('File size exceeds 20 MB limit.', 'error');
                return;
            }
            showToast('Generating compressed preview...');
            try {
                const compressedUrl = await compressImage(file, { quality: 0.84, maxBytes: 300 * 1024 });
                const kb = Math.round((compressedUrl.length * 0.75) / 1024);
                if (previewImg) previewImg.src = compressedUrl;
                if (previewSize) previewSize.textContent = `Footprint: ~${kb} KB (WebP)`;
                if (previewContainer) previewContainer.style.display = 'block';
                window._lastCompressedPhoto = compressedUrl;
            } catch (err) {
                showToast('Failed to compress image.', 'error');
            }
        });
    }

    // ⚡ 1-Click Sync Instagram Feed button
    document.getElementById('sync-instagram-btn')?.addEventListener('click', async () => {
        const customUrl = document.getElementById('admin-behold-url')?.value.trim();
        const targetUrl = customUrl || DEFAULT_BEHOLD_URL;
        showToast('Syncing latest 6 Instagram posts from Behold.so...');

        try {
            const posts = await fetchBeholdFeed(targetUrl);
            if (!posts.length) {
                throw new Error('No posts returned from Behold.so feed.');
            }

            for (let i = 0; i < posts.length; i++) {
                const p = posts[i];
                await saveItem('gallery', {
                    priority: i + 1,
                    title: p.title,
                    url: p.url,
                    link: p.link
                });
            }

            if (customUrl) {
                saveUiDoc('behold', { url: customUrl });
            }

            showToast(`Synced ${posts.length} latest Instagram posts!`);
        } catch (err) {
            showToast(`Instagram Sync Failed: ${err.message}`, 'error');
        }
    });

    // Projects Save
    document.getElementById('save-proj-btn')?.addEventListener('click', () => {
        const title = document.getElementById('admin-proj-title')?.value.trim();
        const desc = document.getElementById('admin-proj-desc')?.value.trim();
        const link = document.getElementById('admin-proj-link')?.value.trim();
        const tagsRaw = document.getElementById('admin-proj-tags')?.value.trim();
        const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

        if (!title) { showToast('Project title is required.', 'error'); return; }
        saveItem('projects', { title, desc, link, tags }, [
            document.getElementById('admin-proj-title'),
            document.getElementById('admin-proj-desc'),
            document.getElementById('admin-proj-link'),
            document.getElementById('admin-proj-tags')
        ]);
    });

    // Experience Save
    document.getElementById('save-exp-btn')?.addEventListener('click', () => {
        const role = document.getElementById('admin-exp-role')?.value.trim();
        const company = document.getElementById('admin-exp-company')?.value.trim();
        const period = document.getElementById('admin-exp-period')?.value.trim();
        const desc = document.getElementById('admin-exp-desc')?.value.trim();

        if (!role) { showToast('Role is required.', 'error'); return; }
        saveItem('experience', { role, company, period, desc }, [
            document.getElementById('admin-exp-role'),
            document.getElementById('admin-exp-company'),
            document.getElementById('admin-exp-period'),
            document.getElementById('admin-exp-desc')
        ]);
    });

    // Education Save
    document.getElementById('save-edu-btn')?.addEventListener('click', () => {
        const degree = document.getElementById('admin-edu-degree')?.value.trim();
        const institution = document.getElementById('admin-edu-inst')?.value.trim();
        const year = document.getElementById('admin-edu-year')?.value.trim();

        if (!degree) { showToast('Degree is required.', 'error'); return; }
        saveItem('education', { degree, institution, year }, [
            document.getElementById('admin-edu-degree'),
            document.getElementById('admin-edu-inst'),
            document.getElementById('admin-edu-year')
        ]);
    });

    // Certifications Save
    document.getElementById('save-cert-btn')?.addEventListener('click', () => {
        const title = document.getElementById('admin-cert-title')?.value.trim();
        const issuer = document.getElementById('admin-cert-issuer')?.value.trim();

        if (!title) { showToast('Certification title is required.', 'error'); return; }
        saveItem('certifications', { title, issuer }, [
            document.getElementById('admin-cert-title'),
            document.getElementById('admin-cert-issuer')
        ]);
    });

    // Skills Save
    document.getElementById('save-skill-btn')?.addEventListener('click', () => {
        const name = document.getElementById('admin-skill-name')?.value.trim();
        if (!name) { showToast('Skill name is required.', 'error'); return; }
        saveItem('skills', { name }, [
            document.getElementById('admin-skill-name')
        ]);
    });

    // Gallery Save
    document.getElementById('save-photo-btn')?.addEventListener('click', () => {
        const title = document.getElementById('admin-img-title')?.value.trim();
        const link = document.getElementById('admin-img-link')?.value.trim();
        const urlInput = document.getElementById('admin-img-url')?.value.trim();
        const finalUrl = window._lastCompressedPhoto || urlInput;

        if (!finalUrl) { showToast('Please upload a file or specify a photo URL.', 'error'); return; }
        saveItem('gallery', { title, url: finalUrl, link }, [
            document.getElementById('admin-img-title'),
            document.getElementById('admin-img-url'),
            document.getElementById('admin-img-link')
        ]);
        window._lastCompressedPhoto = null;
        if (previewContainer) previewContainer.style.display = 'none';
    });

    // Poetry Save
    document.getElementById('save-poem-btn')?.addEventListener('click', () => {
        const title = document.getElementById('admin-poem-title')?.value.trim();
        const body = document.getElementById('admin-poem-body')?.value.trim();
        const rekhta = document.getElementById('admin-poem-rekhta')?.value.trim();
        const lang = document.getElementById('admin-poem-lang')?.value.trim();

        if (!title) { showToast('Poem title is required.', 'error'); return; }
        saveItem('poetry', { title, body, rekhta, lang }, [
            document.getElementById('admin-poem-title'),
            document.getElementById('admin-poem-body'),
            document.getElementById('admin-poem-rekhta'),
            document.getElementById('admin-poem-lang')
        ]);
    });

    // Articles Save
    document.getElementById('save-art-btn')?.addEventListener('click', () => {
        const title = document.getElementById('admin-art-title')?.value.trim();
        const link = document.getElementById('admin-art-link')?.value.trim();
        const note = document.getElementById('admin-art-note')?.value.trim();

        if (!title) { showToast('Article title is required.', 'error'); return; }
        saveItem('articles', { title, link, note }, [
            document.getElementById('admin-art-title'),
            document.getElementById('admin-art-link'),
            document.getElementById('admin-art-note')
        ]);
    });

    // Videos Save
    document.getElementById('save-vid-btn')?.addEventListener('click', () => {
        const title = document.getElementById('admin-vid-title')?.value.trim();
        const link = document.getElementById('admin-vid-link')?.value.trim();

        if (!title) { showToast('Media title is required.', 'error'); return; }
        saveItem('videos', { title, link }, [
            document.getElementById('admin-vid-title'),
            document.getElementById('admin-vid-link')
        ]);
    });

    // Playlists Save
    document.getElementById('save-pl-btn')?.addEventListener('click', () => {
        const title = document.getElementById('admin-pl-title')?.value.trim();
        const link = document.getElementById('admin-pl-link')?.value.trim();

        if (!title) { showToast('Playlist title is required.', 'error'); return; }
        saveItem('playlists', { title, link }, [
            document.getElementById('admin-pl-title'),
            document.getElementById('admin-pl-link')
        ]);
    });

    // Quotes Save
    document.getElementById('save-quote-btn')?.addEventListener('click', () => {
        const text = document.getElementById('admin-quote-text')?.value.trim();
        const author = document.getElementById('admin-quote-author')?.value.trim();
        const cat = document.getElementById('admin-quote-cat')?.value || 'tech';

        if (!text) { showToast('Quote text is required.', 'error'); return; }
        saveItem('quotes', { text, author, cat }, [
            document.getElementById('admin-quote-text'),
            document.getElementById('admin-quote-author')
        ]);
    });

    // Spotify Save
    document.getElementById('save-spotify-btn')?.addEventListener('click', () => {
        const raw = document.getElementById('admin-spotify-url')?.value.trim();
        if (!raw) return;
        const embedUrl = toSpotifyEmbed(raw);
        saveUiDoc('spotify', { embedUrl });
    });

    // Behold.so Feed Save
    document.getElementById('save-behold-btn')?.addEventListener('click', () => {
        const url = document.getElementById('admin-behold-url')?.value.trim();
        if (!url) return;
        saveUiDoc('behold', { url });
    });
}
