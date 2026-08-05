import { escapeHtml } from '../../shared/utils/escape.js';
import { showToast } from './toast.js';
import { compressImage, toSpotifyEmbed, extractYouTubeThumbnail } from './image-upload.js';
import {
    categoryConfigs,
    editingItemId,
    editingCategory,
    enterEditMode,
    exitEditMode,
    saveItem,
    saveUiDoc,
    moveItemOrder,
    deleteItem,
    extractInstagramPostData,
    tryConvertToBase64
} from './cms-service.js';

export function switchGalleryTab(mode) {
    const tabFile = document.getElementById('gallery-source-file');
    const tabLink = document.getElementById('gallery-source-link');
    const groupFile = document.getElementById('gallery-group-file');
    const groupLink = document.getElementById('gallery-group-link');

    if (mode === 'file') {
        tabFile?.classList.add('active');
        tabLink?.classList.remove('active');
        if (groupFile) groupFile.style.display = 'block';
        if (groupLink) groupLink.style.display = 'none';
        const urlInput = document.getElementById('admin-img-url');
        if (urlInput) urlInput.value = '';
    } else {
        tabLink?.classList.add('active');
        tabFile?.classList.remove('active');
        if (groupFile) groupFile.style.display = 'none';
        if (groupLink) groupLink.style.display = 'block';
        const fileInput = document.getElementById('admin-img-file');
        if (fileInput) fileInput.value = '';
        const previewContainer = document.getElementById('gallery-preview-container');
        if (previewContainer) previewContainer.style.display = 'none';
    }
}

// Bind to window so that service logic can toggle it in edit mode
window.switchGalleryTab = switchGalleryTab;

export function renderCategoryList(category) {
    const container = document.getElementById(`list-${category}`);
    if (!container) return;

    container.innerHTML = '';
    const items = window.globalManageData?.[category] || [];

    if (items.length === 0) {
        container.innerHTML = '<p style="color:rgba(255,255,255,0.25);font-size:0.8rem;padding:0.5rem 0;font-style:italic;">No items here yet.</p>';
        return;
    }

    items.forEach((item, index) => {
        let title = item.title || item.name || item.text || 'Untitled';
        if (title.length > 45) title = title.substring(0, 45) + '…';

        let sub = '';
        if (category === 'projects') {
            sub = item.tags ? `Tags: ${item.tags}` : 'No tags';
        } else if (category === 'experience') {
            sub = item.meta || '';
        } else if (category === 'education') {
            sub = item.meta || '';
        } else if (category === 'certifications') {
            sub = item.meta || '';
        } else if (category === 'gallery') {
            sub = item.title ? `Caption: ${item.title}` : 'No caption';
        } else if (category === 'playlists') {
            sub = 'Spotify Playlists Embed';
        } else if (category === 'poetry') {
            sub = `${item.type || ''} · [${(item.lang || 'en').toUpperCase()}]`;
        } else if (category === 'articles') {
            sub = item.meta || '';
        } else if (category === 'videos') {
            sub = item.meta || '';
        } else if (category === 'quotes') {
            sub = `${item.author || ''} · [${(item.category || 'tech').toUpperCase()}]`;
        } else if (category === 'skills') {
            sub = `Order: ${item.priority || (index + 1)}`;
        }

        const card = document.createElement('div');
        card.className = 'cms-item-card';
        card.innerHTML = `
            <div class="cms-item-info">
                <div class="cms-item-title">${escapeHtml(title)}</div>
                ${sub ? `<div class="cms-item-meta">${escapeHtml(sub)}</div>` : ''}
            </div>
            <div class="cms-item-actions">
                <button class="cms-btn-icon reorder-up-btn" title="Move Up">▲</button>
                <button class="cms-btn-icon reorder-down-btn" title="Move Down">▼</button>
                <button class="cms-btn-icon edit-btn" title="Edit">✏️</button>
                <button class="cms-btn-icon delete-btn" title="Delete">🗑️</button>
            </div>
        `;

        card.querySelector('.reorder-up-btn').addEventListener('click', () => moveItemOrder(category, index, -1));
        card.querySelector('.reorder-down-btn').addEventListener('click', () => moveItemOrder(category, index, 1));
        card.querySelector('.edit-btn').addEventListener('click', () => enterEditMode(category, item));

        const delBtn = card.querySelector('.delete-btn');
        delBtn.addEventListener('click', function() {
            if (this.classList.contains('confirming')) {
                deleteItem(category, item.id);
            } else {
                this.classList.add('confirming');
                this.textContent = '⚠';
                this.style.background = '#ff4646';
                this.style.color = '#fff';
                setTimeout(() => {
                    this.classList.remove('confirming');
                    this.textContent = '🗑️';
                    this.style.background = '';
                    this.style.color = '';
                }, 3000);
            }
        });

        container.appendChild(card);
    });
}

// Expose so snapshot updates elsewhere trigger list re-render
window._cmsRenderCategoryList = renderCategoryList;

export function initCMSListeners() {
    // ── Sidebar navigation ────────────────────────────────────────────────────
    document.querySelectorAll('.cms-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.cms-nav-item').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.cms-form-panel').forEach(p => p.classList.remove('active'));
            item.classList.add('active');
            const panel = document.getElementById(item.dataset.panel);
            if (panel) {
                panel.classList.add('active');
                exitEditMode(item.dataset.panel.replace('panel-', ''));
            }
        });
    });

    // ── Save: Intro text ─────────────────────────────────────────────────────
    document.getElementById('save-ui-btn')?.addEventListener('click', async () => {
        const techHook = document.getElementById('admin-tech-hook').value.trim();
        const techIntro = document.getElementById('admin-tech-intro').value.trim();
        const creaHook = document.getElementById('admin-crea-hook').value.trim();
        const creaIntro = document.getElementById('admin-crea-intro').value.trim();

        const techParas = techIntro.split(/\n\n+/).filter(Boolean);
        const creaParas = creaIntro.split(/\n\n+/).filter(Boolean);

        const data = {
            tech_hook: techHook,
            tech_p1: techParas[0] || '',
            tech_p2: techParas[1] || '',
            tech_p3: techParas[2] || '',
            tech_p4: techParas[3] || '',
            crea_hook: creaHook,
            crea_p1: creaParas[0] || '',
            crea_p2: creaParas[1] || '',
            crea_p3: creaParas[2] || '',
            crea_p4: creaParas[3] || ''
        };

        await saveUiDoc('main_intro', data);
    });

    // ── Save: Spotify player ──────────────────────────────────────────────────
    document.getElementById('save-spotify-btn')?.addEventListener('click', () => {
        const raw = document.getElementById('admin-spotify-url').value.trim();
        const url = toSpotifyEmbed(raw);
        if (!url.includes('spotify.com')) return showToast('Enter a valid Spotify URL.', 'error');
        saveUiDoc('spotify', { url });
    });

    // ── Save: Playlists ───────────────────────────────────────────────────────
    document.getElementById('save-playlist-btn')?.addEventListener('click', () => {
        const title = document.getElementById('admin-playlist-title');
        const urlEl = document.getElementById('admin-playlist-url');
        if (!title.value.trim() || !urlEl.value.trim()) {
            return showToast('Name and URL are both required.', 'error');
        }

        const link = toSpotifyEmbed(urlEl.value.trim());
        if (!link.includes('spotify.com')) return showToast('Enter a valid Spotify URL.', 'error');

        const existing = window.globalManageData?.playlists || [];
        if (!editingItemId && existing.some(p => p.link === link)) {
            return showToast('This playlist is already in your curations.', 'error');
        }

        saveItem('playlists', {
            title: title.value.trim(),
            link
        }, [title, urlEl]);
    });

    // ── Save: Quotes ──────────────────────────────────────────────────────────
    document.getElementById('save-quote-btn')?.addEventListener('click', () => {
        const cat    = document.getElementById('admin-quote-category');
        const text   = document.getElementById('admin-quote-text');
        const author = document.getElementById('admin-quote-author');
        if (!text.value.trim()) return showToast('Quote text is required.', 'error');
        saveItem('quotes', {
            category: cat.value,
            text:     text.value.trim(),
            author:   author.value.trim()
        }, [text, author]);
    });

    // ── Save: Projects ────────────────────────────────────────────────────────
    document.getElementById('save-proj-btn')?.addEventListener('click', () => {
        const title = document.getElementById('admin-proj-title');
        const desc  = document.getElementById('admin-proj-desc');
        const link  = document.getElementById('admin-proj-link');
        const demo  = document.getElementById('admin-proj-demo');
        const tags  = document.getElementById('admin-proj-tags');
        if (!title.value.trim()) return showToast('Title is required.', 'error');
        saveItem('projects', {
            title:    title.value.trim(),
            desc:     desc.value.trim(),
            link:     link.value.trim(),
            demo:     demo ? demo.value.trim() : '',
            tags:     tags ? tags.value.trim() : ''
        }, [title, desc, link, demo, tags]);
    });

    // ── Save: Experience ──────────────────────────────────────────────────────
    document.getElementById('save-exp-btn')?.addEventListener('click', () => {
        const title    = document.getElementById('admin-exp-title');
        const company  = document.getElementById('admin-exp-company');
        const duration = document.getElementById('admin-exp-duration');
        const location = document.getElementById('admin-exp-location');
        const desc     = document.getElementById('admin-exp-desc');

        if (!title.value.trim()) return showToast('Title is required.', 'error');
        const formattedTitle = company.value.trim() ? `${title.value.trim()} @ ${company.value.trim()}` : title.value.trim();
        const formattedMeta  = [duration.value.trim(), location.value.trim()].filter(Boolean).join(' · ');

        saveItem('experience', {
            title: formattedTitle,
            desc:  desc.value.trim(),
            meta:  formattedMeta
        }, [title, company, duration, location, desc]);
    });

    // ── Save: Education ───────────────────────────────────────────────────────
    document.getElementById('save-edu-btn')?.addEventListener('click', () => {
        const title = document.getElementById('admin-edu-title');
        const inst  = document.getElementById('admin-edu-institution');
        const score = document.getElementById('admin-edu-score');
        if (!title.value.trim()) return showToast('Degree/Grade is required.', 'error');

        const formattedMeta = [inst.value.trim(), score.value.trim()].filter(Boolean).join(' · ');

        saveItem('education', {
            title: title.value.trim(),
            meta:  formattedMeta
        }, [title, inst, score]);
    });

    // ── Save: Certifications ──────────────────────────────────────────────────
    document.getElementById('save-cert-btn')?.addEventListener('click', () => {
        const title  = document.getElementById('admin-cert-title');
        const issuer = document.getElementById('admin-cert-issuer');
        const score  = document.getElementById('admin-cert-score');
        const link   = document.getElementById('admin-cert-link');
        if (!title.value.trim()) return showToast('Title is required.', 'error');

        const formattedMeta = [issuer.value.trim(), score.value.trim()].filter(Boolean).join(' · ');

        saveItem('certifications', {
            title: title.value.trim(),
            meta:  formattedMeta,
            link:  link ? link.value.trim() : ''
        }, [title, issuer, score, link]);
    });

    // ── Save: Gallery (Photos) ────────────────────────────────────────────────
    document.getElementById('save-photo-btn')?.addEventListener('click', async () => {
        const fileInput = document.getElementById('admin-img-file');
        const urlInput  = document.getElementById('admin-img-url');
        const titleInp  = document.getElementById('admin-img-title');
        const altInp    = document.getElementById('admin-img-alt');
        const linkInp   = document.getElementById('admin-img-link');

        const isFileMode = document.getElementById('gallery-source-file').classList.contains('active');
        let finalUrl = '';

        try {
            if (isFileMode) {
                if (fileInput?.files?.[0]) {
                    const file = fileInput.files[0];
                    if (file.size > 20 * 1024 * 1024) return showToast('File too large (max 20 MB).', 'error');

                    showToast('Compressing image…');
                    finalUrl = await compressImage(file, { quality: 0.84, maxBytes: 250 * 1024 });
                } else if (editingItemId && editingCategory === 'gallery') {
                    const existingItem = window.globalManageData.gallery.find(g => g.id === editingItemId);
                    finalUrl = existingItem ? existingItem.url : '';
                } else {
                    return showToast('Please choose an image file.', 'error');
                }
            } else {
                const urlVal = urlInput.value.trim();
                if (!urlVal) return showToast('Please enter an Instagram or Image URL.', 'error');

                if (urlVal.includes('instagram.com/p/') || urlVal.includes('instagram.com/reel/') || urlVal.includes('instagram.com/tv/')) {
                    showToast('Fetching photo & caption from Instagram link…');
                    const extracted = await extractInstagramPostData(urlVal);
                    if (extracted && extracted.imageUrl) {
                        finalUrl = await tryConvertToBase64(extracted.imageUrl);
                        if (linkInp && !linkInp.value.trim()) {
                            linkInp.value = urlVal;
                        }
                        if (titleInp && !titleInp.value.trim() && extracted.caption) {
                            titleInp.value = extracted.caption;
                        }
                        showToast('Extracted photo & caption!');
                    } else {
                        return showToast('Could not fetch photo from link. Check URL or use Local File upload.', 'error');
                    }
                } else {
                    finalUrl = urlVal;
                }
            }

            await saveItem('gallery', {
                url:   finalUrl,
                title: titleInp ? titleInp.value.trim() : '',
                alt:   altInp   ? altInp.value.trim()   : '',
                link:  linkInp  ? linkInp.value.trim()  : ''
            }, [fileInput, urlInput, titleInp, altInp, linkInp]);

        } catch (e) {
            console.error('[CMS] Image save error:', e);
            showToast('Error saving image.', 'error');
        }
    });

    // ── Batch Auto-Extract (Last Instagram Posts) ─────────────────────────────
    document.getElementById('batch-extract-ig-btn')?.addEventListener('click', async () => {
        const textEl = document.getElementById('admin-batch-ig-urls');
        const raw = textEl ? textEl.value.trim() : '';
        if (!raw) return showToast('Please paste at least one Instagram post link.', 'error');

        const urls = raw.split(/[\n,]+/).map(u => u.trim()).filter(Boolean);
        if (urls.length === 0) return showToast('No valid URLs found.', 'error');

        const btn = document.getElementById('batch-extract-ig-btn');
        btn.disabled = true;
        btn.textContent = '⚡ Extracting Posts...';

        let successCount = 0;
        try {
            for (let i = 0; i < Math.min(urls.length, 10); i++) {
                const url = urls[i];
                showToast(`Extracting post ${i + 1} of ${urls.length}…`);
                const extracted = await extractInstagramPostData(url);
                if (extracted && extracted.imageUrl) {
                    const finalUrl = await tryConvertToBase64(extracted.imageUrl);
                    await saveItem('gallery', {
                        url: finalUrl,
                        title: extracted.caption || '',
                        alt: extracted.caption ? extracted.caption.substring(0, 50) : '',
                        link: url
                    }, []);
                    successCount++;
                }
            }
            if (successCount > 0) {
                showToast(`Successfully auto-imported ${successCount} Instagram posts!`);
                if (textEl) textEl.value = '';
            } else {
                showToast('Failed to extract photos. Please check post URLs.', 'error');
            }
        } catch (err) {
            console.error('[CMS] Batch extract error:', err);
            showToast('Batch extraction encountered an error.', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = '⚡ Auto-Extract & Import All Posts';
        }
    });

    // ── 1-Click Auto-Import From Instagram Profile ────────────────────────────
    document.getElementById('auto-fetch-ig-profile-btn')?.addEventListener('click', async () => {
        const handleInp = document.getElementById('admin-ig-handle');
        const username = handleInp ? handleInp.value.trim() : 'letsclicksomephotos';
        if (!username) return showToast('Please enter an Instagram handle.', 'error');

        const btn = document.getElementById('auto-fetch-ig-profile-btn');
        btn.disabled = true;
        btn.textContent = '🚀 Fetching Profile & Extracting Posts...';

        try {
            showToast(`Connecting to Instagram (@${username})…`);
            const res = await fetch(`/api/ig?username=${encodeURIComponent(username)}`);
            const data = await res.json();

            if (!data.success || !data.posts || data.posts.length === 0) {
                showToast('Could not fetch posts. Make sure profile is public.', 'error');
                return;
            }

            let importedCount = 0;
            for (let i = 0; i < data.posts.length; i++) {
                const post = data.posts[i];
                showToast(`Compressing & saving post ${i + 1} of ${data.posts.length}…`);
                const finalUrl = await tryConvertToBase64(post.url);

                await saveItem('gallery', {
                    url: finalUrl,
                    title: post.title || '',
                    alt: post.alt || '',
                    link: post.link
                }, []);
                importedCount++;
            }

            showToast(`🎉 Successfully imported ${importedCount} Instagram posts!`);
        } catch (err) {
            console.error('[CMS] Auto profile import error:', err);
            showToast('Failed to auto-import posts from profile.', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = '🚀 Fetch & Import My 6 Latest Posts Now';
        }
    });

    // ── Save: Behold Instagram Sync ───────────────────────────────────────────
    document.getElementById('save-behold-btn')?.addEventListener('click', () => {
        const urlInput = document.getElementById('admin-behold-url');
        const raw = urlInput ? urlInput.value.trim() : '';
        if (raw && !raw.includes('behold.so')) {
            return showToast('Please enter a valid Behold.so JSON URL.', 'error');
        }
        saveUiDoc('behold', { url: raw });
    });

    // ── Save: Poetry ──────────────────────────────────────────────────────────
    document.getElementById('save-poem-btn')?.addEventListener('click', () => {
        const title   = document.getElementById('admin-poem-title');
        const type    = document.getElementById('admin-poem-type');
        const content = document.getElementById('admin-poem-content');
        const link    = document.getElementById('admin-poem-link');
        const lang    = document.getElementById('admin-poem-lang');
        if (!title.value.trim() || !content.value.trim()) return showToast('Title and Content are required.', 'error');
        saveItem('poetry', {
            title:   title.value.trim(),
            type:    type.value.trim(),
            content: content.value.trim(),
            link:    link.value.trim(),
            lang:    lang ? lang.value.trim() : 'en'
        }, [title, type, content, link, lang]);
    });

    // ── Save: Articles ────────────────────────────────────────────────────────
    document.getElementById('save-art-btn')?.addEventListener('click', () => {
        const title  = document.getElementById('admin-art-title');
        const author = document.getElementById('admin-art-author');
        const type   = document.getElementById('admin-art-type');
        const link   = document.getElementById('admin-art-link');
        const note   = document.getElementById('admin-art-note');
        if (!title.value.trim()) return showToast('Title is required.', 'error');

        const formattedMeta = [author.value.trim(), type.value.trim()].filter(Boolean).join(' · ');

        saveItem('articles', {
            title: title.value.trim(),
            meta:  formattedMeta,
            link:  link.value.trim(),
            note:  note ? note.value.trim() : ''
        }, [title, author, type, link, note]);
    });

    // ── Save: Videos ──────────────────────────────────────────────────────────
    document.getElementById('save-vid-btn')?.addEventListener('click', () => {
        const title   = document.getElementById('admin-vid-title');
        const creator = document.getElementById('admin-vid-creator');
        const link    = document.getElementById('admin-vid-link');
        if (!title.value.trim() || !link.value.trim()) return showToast('Title and Link are required.', 'error');

        let finalLink = link.value.trim();
        if (finalLink.includes('spotify.com') && !finalLink.includes('/embed/')) {
            finalLink = toSpotifyEmbed(finalLink);
        }
        const thumb = finalLink ? extractYouTubeThumbnail(finalLink) : '';

        saveItem('videos', {
            title:     title.value.trim(),
            meta:      creator.value.trim(),
            link:      finalLink,
            thumbnail: thumb
        }, [title, creator, link]);
    });

    // ── Save: Skills ──────────────────────────────────────────────────────────
    document.getElementById('save-skill-btn')?.addEventListener('click', () => {
        const name = document.getElementById('admin-skill-name');
        if (!name.value.trim()) return showToast('Skill name is required.', 'error');
        saveItem('skills', {
            name: name.value.trim()
        }, [name]);
    });

    // ── Gallery source switcher events ────────────────────────────────────────
    document.getElementById('gallery-source-file')?.addEventListener('click', () => switchGalleryTab('file'));
    document.getElementById('gallery-source-link')?.addEventListener('click', () => switchGalleryTab('link'));

    // ── Gallery file preview event ────────────────────────────────────────────
    document.getElementById('admin-img-file')?.addEventListener('change', async (event) => {
        const fileInput = event.target;
        const previewContainer = document.getElementById('gallery-preview-container');
        const previewImg = document.getElementById('gallery-file-preview');
        const previewSize = document.getElementById('gallery-file-size');

        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            if (file.size > 20 * 1024 * 1024) {
                showToast('File too large (max 20 MB).', 'error');
                fileInput.value = '';
                return;
            }

            showToast('Generating compressed preview...');
            try {
                const previewUrl = await compressImage(file, { quality: 0.84, maxBytes: 250 * 1024 });
                const kb = Math.round(((previewUrl.length - previewUrl.indexOf(',') - 1) * 0.75) / 1024);
                if (previewImg && previewSize && previewContainer) {
                    previewImg.src = previewUrl;
                    previewSize.textContent = `Target Footprint: ~${kb} KB`;
                    previewContainer.style.display = 'block';
                }
            } catch (err) {
                console.error('[CMS] Preview error:', err);
                showToast('Failed to load image preview.', 'error');
            }
        }
    });

    // Close admin panel handler
    document.getElementById('close-admin')?.addEventListener('click', () => {
        document.getElementById('admin-panel').style.display = 'none';
    });
}
