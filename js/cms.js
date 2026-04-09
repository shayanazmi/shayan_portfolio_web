import {
    auth, db, onAuthStateChanged,
    adminLogin, adminLogout,
    addDoc, setDoc, deleteDoc,
    dataPath, docPath, uiDocPath
} from "./firebase-config.js";

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE COMPRESSION — industry-standard adaptive pipeline
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compress an image file to a target max dimension and quality.
 * Outputs WebP where supported, JPEG as fallback.
 * Returns a base64 data URL.
 *
 * @param {File}   file       - Raw File from <input type="file">
 * @param {Object} opts
 * @param {number} opts.maxDim    - Max width or height in px   (default: 1200)
 * @param {number} opts.quality   - Encoder quality 0–1         (default: 0.82)
 * @param {number} opts.maxBytes  - Target output size in bytes (default: 300 KB)
 * @returns {Promise<string>} base64 data URL
 */
async function compressImage(file, {
    maxDim   = null,    // null = auto-detect from orientation
    quality  = 0.82,
    maxBytes = 300 * 1024   // 300 KB
} = {}) {
    // 1. Decode the image
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;

    // 2. Orientation-aware max dimension (landscape gets more pixels)
    const adaptedMaxDim = maxDim ?? (width >= height ? 1600 : 1200);

    // 3. Resize proportionally to fit within adaptedMaxDim
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

    // 3. Prefer WebP, fall back to JPEG
    const supportsWebP = canvas.toDataURL('image/webp').startsWith('data:image/webp');
    const mimeType     = supportsWebP ? 'image/webp' : 'image/jpeg';

    // 4. Adaptive quality loop: reduce if still over maxBytes
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
function extractYouTubeThumbnail(url) {
    const match = url.match(
        /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
    );
    return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : url;
}

/**
 * Normalise a raw Spotify URL (or embed snippet) to an embeddable URL.
 */
function toSpotifyEmbed(raw) {
    const srcMatch = raw.match(/src="([^"]+)"/);
    if (srcMatch) raw = srcMatch[1];
    const parts = raw.match(/open\.spotify\.com\/(track|playlist|album|show|episode|artist)\/([a-zA-Z0-9]+)/);
    if (parts && !raw.includes('/embed/')) {
        return `https://open.spotify.com/embed/${parts[1]}/${parts[2]}?utm_source=generator&theme=0`;
    }
    return raw;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS HELPER
// ─────────────────────────────────────────────────────────────────────────────
function showStatus(msg, isError = false) {
    const el = document.getElementById('admin-status');
    if (!el) return;
    el.textContent = msg;
    el.className   = 'status-msg ' + (isError ? 'error' : 'success');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => { el.textContent = ''; el.className = 'status-msg'; }, 3500);
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC SAVE / DELETE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add a new document to a CMS collection.
 * Automatically stamps addedAt and clears the form inputs on success.
 */
async function saveItem(collName, data, inputsToClear = []) {
    try {
        await addDoc(dataPath(collName), { ...data, addedAt: Date.now() });
        inputsToClear.forEach(el => { if (el) el.value = ''; });
        showStatus('Saved successfully!');
    } catch (e) {
        console.error('[CMS] saveItem error:', e);
        showStatus('Failed to save. Check Firestore rules.', true);
    }
}

/**
 * Overwrite a singleton UI document (merge: true so unset fields are preserved).
 */
async function saveUiDoc(docId, data) {
    try {
        await setDoc(uiDocPath(docId), data, { merge: true });
        showStatus('Saved!');
    } catch (e) {
        console.error('[CMS] saveUiDoc error:', e);
        showStatus('Failed to save.', true);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CMS INIT — runs once the DOM is ready
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initCMS);

function initCMS() {

    // ── Auth state indicator ──────────────────────────────────────────────────
    onAuthStateChanged(auth, (user) => {
        const dot = document.getElementById('cms-auth-dot');
        const lbl = document.getElementById('cms-auth-label');
        const logoutBtn = document.getElementById('admin-logout-btn');

        if (user) {
            if (dot) dot.className = 'online';
            if (lbl) lbl.textContent = 'Connected';
            if (logoutBtn) logoutBtn.style.display = 'inline-flex';
        } else {
            if (dot) dot.className = 'offline';
            if (lbl) lbl.textContent = 'Offline';
            if (logoutBtn) logoutBtn.style.display = 'none';
            const panel = document.getElementById('admin-panel');
            if (panel) panel.style.display = 'none';
        }
    });

    // ── Login modal ───────────────────────────────────────────────────────────
    const passcodeModal  = document.getElementById('passcode-modal');
    const emailInput     = document.getElementById('admin-email');
    const passInput      = document.getElementById('admin-password');
    const passError      = document.getElementById('passcode-error');
    const togglePassBtn  = document.getElementById('toggle-pass-vis');

    togglePassBtn?.addEventListener('click', () => {
        const isHidden = passInput.type === 'password';
        passInput.type = isHidden ? 'text' : 'password';
        togglePassBtn.textContent = isHidden ? 'Hide' : 'Show';
    });

    document.getElementById('admin-trigger')?.addEventListener('click', () => {
        passcodeModal.style.display = 'flex';
        passInput.value = '';
        emailInput.value = '';
        passInput.type = 'password';
        if (togglePassBtn) togglePassBtn.textContent = 'Show';
        if (passError) passError.style.display = 'none';
    });

    document.getElementById('close-passcode')?.addEventListener('click', () => {
        passcodeModal.style.display = 'none';
    });

    document.getElementById('passcode-submit')?.addEventListener('click', async () => {
        if (passError) passError.style.display = 'none';
        const submitBtn = document.getElementById('passcode-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in…';
        try {
            await adminLogin(emailInput.value.trim(), passInput.value);
            passcodeModal.style.display = 'none';
            document.getElementById('admin-panel').style.display = 'flex';
            showStatus('Logged in as Admin!');
        } catch (e) {
            console.error('[CMS] Login failed:', e);
            if (passError) {
                passError.textContent = e.code === 'auth/invalid-credential'
                    ? 'Wrong email or password.'
                    : `Login error: ${e.message}`;
                passError.style.display = 'block';
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    });

    document.getElementById('close-admin')?.addEventListener('click', () => {
        document.getElementById('admin-panel').style.display = 'none';
    });

    document.getElementById('admin-logout-btn')?.addEventListener('click', async () => {
        await adminLogout();
        showStatus('Logged out.');
    });

    // ── Sidebar navigation ────────────────────────────────────────────────────
    document.querySelectorAll('.cms-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.cms-nav-item').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.cms-form-panel').forEach(p => p.classList.remove('active'));
            item.classList.add('active');
            const panel = document.getElementById(item.dataset.panel);
            if (panel) panel.classList.add('active');
            if (item.dataset.panel === 'panel-manage') renderManageList();
        });
    });

    // ── Save: Intro text ─────────────────────────────────────────────────────
    document.getElementById('save-ui-btn')?.addEventListener('click', () => {
        const fields = ['tech_hook','tech_p1','tech_p2','tech_p3','tech_p4',
                        'crea_hook','crea_p1','crea_p2','crea_p3','crea_p4'];
        const data = {};
        fields.forEach(f => {
            const el = document.getElementById('admin-' + f.replace(/_/g, '-'));
            data[f] = el ? el.value : '';
        });
        saveUiDoc('main_intro', data);
    });

    // ── Save: Spotify player ──────────────────────────────────────────────────
    document.getElementById('save-spotify-btn')?.addEventListener('click', () => {
        const raw = document.getElementById('admin-spotify-url').value.trim();
        const url = toSpotifyEmbed(raw);
        if (!url.includes('spotify.com')) return showStatus('Enter a valid Spotify URL.', true);
        saveUiDoc('spotify', { url });
    });

    // ── Save: Projects ────────────────────────────────────────────────────────
    document.getElementById('save-proj-btn')?.addEventListener('click', () => {
        const prio  = document.getElementById('admin-proj-priority');
        const title = document.getElementById('admin-proj-title');
        const desc  = document.getElementById('admin-proj-desc');
        const link  = document.getElementById('admin-proj-link');
        const tags  = document.getElementById('admin-proj-tags');
        if (!title.value.trim()) return showStatus('Title is required.', true);
        saveItem('projects', {
            priority: Number(prio.value) || 999,
            title:    title.value.trim(),
            desc:     desc.value.trim(),
            link:     link.value.trim(),
            tags:     tags ? tags.value.trim() : ''
        }, [prio, title, desc, link, tags]);
    });

    // ── Save: Experience ──────────────────────────────────────────────────────
    document.getElementById('save-exp-btn')?.addEventListener('click', () => {
        const prio  = document.getElementById('admin-exp-priority');
        const title = document.getElementById('admin-exp-title');
        const desc  = document.getElementById('admin-exp-desc');
        const meta  = document.getElementById('admin-exp-meta');
        if (!title.value.trim()) return showStatus('Title is required.', true);
        saveItem('experience', {
            priority: Number(prio.value) || 999,
            title:    title.value.trim(),
            desc:     desc.value.trim(),
            meta:     meta.value.trim()
        }, [prio, title, desc, meta]);
    });

    // ── Save: Education ───────────────────────────────────────────────────────
    document.getElementById('save-edu-btn')?.addEventListener('click', () => {
        const prio  = document.getElementById('admin-edu-priority');
        const title = document.getElementById('admin-edu-title');
        const meta  = document.getElementById('admin-edu-meta');
        if (!title.value.trim()) return showStatus('Title is required.', true);
        saveItem('education', {
            priority: Number(prio.value) || 999,
            title:    title.value.trim(),
            meta:     meta.value.trim()
        }, [prio, title, meta]);
    });

    // ── Save: Certifications ──────────────────────────────────────────────────
    document.getElementById('save-cert-btn')?.addEventListener('click', () => {
        const prio  = document.getElementById('admin-cert-priority');
        const title = document.getElementById('admin-cert-title');
        const meta  = document.getElementById('admin-cert-meta');
        const link  = document.getElementById('admin-cert-link');
        if (!title.value.trim()) return showStatus('Title is required.', true);
        saveItem('certifications', {
            priority: Number(prio.value) || 999,
            title:    title.value.trim(),
            meta:     meta.value.trim(),
            link:     link ? link.value.trim() : ''
        }, [prio, title, meta, link]);
    });

    // ── Save: Gallery (with image compression) ────────────────────────────────
    document.getElementById('save-photo-btn')?.addEventListener('click', async () => {
        const prio      = document.getElementById('admin-img-priority');
        const fileInput = document.getElementById('admin-img-file');
        const urlInput  = document.getElementById('admin-img-url');
        const titleInp  = document.getElementById('admin-img-title');
        const altInp    = document.getElementById('admin-img-alt');

        showStatus('Processing image…');
        let finalUrl = '';

        try {
            if (fileInput?.files?.[0]) {
                const file = fileInput.files[0];

                // Reject files over 20 MB before even trying
                if (file.size > 20 * 1024 * 1024) {
                    return showStatus('File too large (max 20 MB).', true);
                }

                // maxDim is auto-computed from orientation inside compressImage
                finalUrl = await compressImage(file, {
                    quality:  0.84,
                    maxBytes: 400 * 1024
                });

                const kb = Math.round(
                    ((finalUrl.length - finalUrl.indexOf(',') - 1) * 0.75) / 1024
                );
                showStatus(`Image compressed to ~${kb} KB`);
            } else if (urlInput?.value.trim()) {
                finalUrl = extractYouTubeThumbnail(urlInput.value.trim());
            } else {
                return showStatus('Select a file or enter a URL.', true);
            }

            await saveItem('gallery', {
                priority: prio.value,
                url:      finalUrl,
                title:    titleInp ? titleInp.value.trim() : '',
                alt:      altInp   ? altInp.value.trim()   : ''
            }, [prio, fileInput, urlInput, titleInp, altInp]);

        } catch (e) {
            console.error('[CMS] Image save error:', e);
            showStatus('Error processing image.', true);
        }
    });

    // ── Save: Poetry ──────────────────────────────────────────────────────────
    document.getElementById('save-poem-btn')?.addEventListener('click', () => {
        const prio    = document.getElementById('admin-poem-priority');
        const title   = document.getElementById('admin-poem-title');
        const type    = document.getElementById('admin-poem-type');
        const content = document.getElementById('admin-poem-content');
        const link    = document.getElementById('admin-poem-link');
        const lang    = document.getElementById('admin-poem-lang');
        if (!title.value.trim()) return showStatus('Title is required.', true);
        saveItem('poetry', {
            priority: prio.value,
            title:    title.value.trim(),
            type:     type.value.trim(),
            content:  content.value.trim(),
            link:     link.value.trim(),
            lang:     lang ? lang.value.trim() : 'en'
        }, [prio, title, type, content, link, lang]);
    });

    // ── Save: Articles ────────────────────────────────────────────────────────
    document.getElementById('save-art-btn')?.addEventListener('click', () => {
        const prio  = document.getElementById('admin-art-priority');
        const title = document.getElementById('admin-art-title');
        const meta  = document.getElementById('admin-art-meta');
        const link  = document.getElementById('admin-art-link');
        const note  = document.getElementById('admin-art-note');
        if (!title.value.trim()) return showStatus('Title is required.', true);
        saveItem('articles', {
            priority: prio.value,
            title:    title.value.trim(),
            meta:     meta.value.trim(),
            link:     link.value.trim(),
            note:     note ? note.value.trim() : ''
        }, [prio, title, meta, link, note]);
    });

    // ── Save: Videos ──────────────────────────────────────────────────────────
    document.getElementById('save-vid-btn')?.addEventListener('click', () => {
        const prio  = document.getElementById('admin-vid-priority');
        const title = document.getElementById('admin-vid-title');
        const meta  = document.getElementById('admin-vid-meta');
        const link  = document.getElementById('admin-vid-link');
        if (!title.value.trim()) return showStatus('Title is required.', true);

        let finalLink = link.value.trim();
        // Auto-convert Spotify URLs
        if (finalLink.includes('spotify.com') && !finalLink.includes('/embed/')) {
            finalLink = toSpotifyEmbed(finalLink);
        }
        const thumb = finalLink ? extractYouTubeThumbnail(finalLink) : '';

        saveItem('videos', {
            priority:  Number(prio.value) || 999,
            title:     title.value.trim(),
            meta:      meta.value.trim(),
            link:      finalLink,
            thumbnail: thumb
        }, [prio, title, meta, link]);
    });

    // ── Save: Skills ──────────────────────────────────────────────────────────
    document.getElementById('save-skill-btn')?.addEventListener('click', () => {
        const prio = document.getElementById('admin-skill-priority');
        const name = document.getElementById('admin-skill-name');
        if (!name.value.trim()) return showStatus('Skill name is required.', true);
        saveItem('skills', {
            priority: Number(prio.value) || 999,
            name:     name.value.trim()
        }, [prio, name]);
    });

    // ── Save: Quotes ──────────────────────────────────────────────────────────
    document.getElementById('save-quote-btn')?.addEventListener('click', () => {
        const cat    = document.getElementById('admin-quote-category');
        const text   = document.getElementById('admin-quote-text');
        const author = document.getElementById('admin-quote-author');
        if (!text.value.trim()) return showStatus('Quote text is required.', true);
        saveItem('quotes', {
            category: cat.value,
            text:     text.value.trim(),
            author:   author.value.trim()
        }, [text, author]);
    });

    // ── Save: Playlists ───────────────────────────────────────────────────────
    document.getElementById('save-playlist-btn')?.addEventListener('click', () => {
        const prio  = document.getElementById('admin-playlist-priority');
        const title = document.getElementById('admin-playlist-title');
        const urlEl = document.getElementById('admin-playlist-url');
        if (!title.value.trim() || !urlEl.value.trim()) {
            return showStatus('Name and URL are both required.', true);
        }

        const link = toSpotifyEmbed(urlEl.value.trim());
        if (!link.includes('spotify.com')) return showStatus('Enter a valid Spotify URL.', true);

        const existing = window.globalManageData?.playlists || [];
        if (existing.some(p => p.link === link)) {
            return showStatus('This playlist is already in your curations.', true);
        }

        saveItem('playlists', {
            priority: prio.value,
            title:    title.value.trim(),
            link
        }, [prio, title, urlEl]);
    });

    // ── Manage / Delete ───────────────────────────────────────────────────────
    document.getElementById('manage-category')?.addEventListener('change', renderManageList);

    function renderManageList() {
        const category  = document.getElementById('manage-category').value;
        const items     = window.globalManageData?.[category] || [];
        const container = document.getElementById('manage-items-container');
        if (!container) return;
        container.innerHTML = '';

        if (items.length === 0) {
            container.innerHTML = '<p style="color:rgba(255,255,255,0.3);font-size:0.9rem;padding:1rem 0;">No items in this section yet.</p>';
            return;
        }

        items.forEach(item => {
            let title = item.title || item.name || item.text || 'Untitled';
            if (title.length > 55) title = title.substring(0, 55) + '…';
            let sub = '';
            if (item.priority)  sub += `Priority ${item.priority}`;
            if (item.meta)      sub += (sub ? ' · ' : '') + item.meta;
            if (item.category)  sub += (sub ? ' · ' : '') + `[${item.category.toUpperCase()}]`;
            if (item.type)      sub += (sub ? ' · ' : '') + item.type;

            const div = document.createElement('div');
            div.className = 'cms-manage-item';
            div.innerHTML = `
                <div>
                    <div class="cms-manage-item-text">${escapeHtml(title)}</div>
                    ${sub ? `<div class="cms-manage-item-sub">${escapeHtml(sub)}</div>` : ''}
                </div>
                <button class="admin-btn-delete">Delete</button>`;
            div.querySelector('.admin-btn-delete').addEventListener('click', function() {
                if (this.classList.contains('confirming')) {
                    // Second click → actually delete
                    deleteItem(category, item.id);
                } else {
                    // First click → show confirm state
                    this.classList.add('confirming');
                    this.textContent = '⚠ Confirm?';
                    // Auto-reset after 3 seconds if not clicked
                    setTimeout(() => {
                        this.classList.remove('confirming');
                        this.textContent = 'Delete';
                    }, 3000);
                }
            });
            container.appendChild(div);
        });
    }

    // Expose renderManageList so main.js can call it after a sync
    window._cmsRenderManageList = renderManageList;

    async function deleteItem(category, docId) {
        try {
            await deleteDoc(docPath(category, docId));
            showStatus('Item deleted.');
        } catch (e) {
            console.error('[CMS] deleteItem error:', e);
            showStatus('Failed to delete.', true);
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}