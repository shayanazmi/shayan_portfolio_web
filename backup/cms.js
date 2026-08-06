import {
    signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
    addDoc, setDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { auth, db, dataPath, docPath, uiDocPath } from "./firebase-config.js";

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
// TOAST ALERT SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
function showToast(message, type = 'success') {
    const container = document.getElementById('cms-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `cms-toast ${type}`;
    toast.innerHTML = `<span>${escapeHtml(message)}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3200);
}

// Legacy status helper mapping
function showStatus(msg, isError = false) {
    showToast(msg, isError ? 'error' : 'success');
}

// ─────────────────────────────────────────────────────────────────────────────
// EDIT MODE STATE & CONFIG
// ─────────────────────────────────────────────────────────────────────────────
let editingItemId = null;
let editingCategory = null;

const categoryConfigs = {
    playlists: {
        inputs: {
            title: 'admin-playlist-title',
            link: 'admin-playlist-url'
        },
        saveBtn: 'save-playlist-btn',
        titleLabel: '+ Add Playlist',
        updateLabel: '✓ Update Playlist'
    },
    projects: {
        inputs: {
            title: 'admin-proj-title',
            desc: 'admin-proj-desc',
            link: 'admin-proj-link',
            demo: 'admin-proj-demo',
            tags: 'admin-proj-tags'
        },
        saveBtn: 'save-proj-btn',
        titleLabel: '+ Add Project',
        updateLabel: '✓ Update Project'
    },
    experience: {
        inputs: {
            title: 'admin-exp-title',
            company: 'admin-exp-company',
            duration: 'admin-exp-duration',
            location: 'admin-exp-location',
            desc: 'admin-exp-desc'
        },
        saveBtn: 'save-exp-btn',
        titleLabel: '+ Add Experience',
        updateLabel: '✓ Update Experience'
    },
    education: {
        inputs: {
            title: 'admin-edu-title',
            institution: 'admin-edu-institution',
            score: 'admin-edu-score'
        },
        saveBtn: 'save-edu-btn',
        titleLabel: '+ Add Education',
        updateLabel: '✓ Update Education'
    },
    certifications: {
        inputs: {
            title: 'admin-cert-title',
            issuer: 'admin-cert-issuer',
            score: 'admin-cert-score',
            link: 'admin-cert-link'
        },
        saveBtn: 'save-cert-btn',
        titleLabel: '+ Add Certification',
        updateLabel: '✓ Update Certification'
    },
    gallery: {
        inputs: {
            url: 'admin-img-url',
            title: 'admin-img-title',
            alt: 'admin-img-alt',
            link: 'admin-img-link'
        },
        saveBtn: 'save-photo-btn',
        titleLabel: '+ Save to Gallery',
        updateLabel: '✓ Update Photo'
    },
    poetry: {
        inputs: {
            title: 'admin-poem-title',
            type: 'admin-poem-type',
            content: 'admin-poem-content',
            link: 'admin-poem-link',
            lang: 'admin-poem-lang'
        },
        saveBtn: 'save-poem-btn',
        titleLabel: '✓ Save Poetry',
        updateLabel: '✓ Update Poetry'
    },
    articles: {
        inputs: {
            title: 'admin-art-title',
            author: 'admin-art-author',
            type: 'admin-art-type',
            link: 'admin-art-link',
            note: 'admin-art-note'
        },
        saveBtn: 'save-art-btn',
        titleLabel: '+ Add to Reading List',
        updateLabel: '✓ Update Reading Item'
    },
    videos: {
        inputs: {
            title: 'admin-vid-title',
            creator: 'admin-vid-creator',
            link: 'admin-vid-link'
        },
        saveBtn: 'save-vid-btn',
        titleLabel: '+ Add to Watchlist',
        updateLabel: '✓ Update Watchlist Item'
    },
    skills: {
        inputs: {
            name: 'admin-skill-name'
        },
        saveBtn: 'save-skill-btn',
        titleLabel: '+ Add Skill Tag',
        updateLabel: '✓ Update Skill'
    },
    quotes: {
        inputs: {
            category: 'admin-quote-category',
            text: 'admin-quote-text',
            author: 'admin-quote-author'
        },
        saveBtn: 'save-quote-btn',
        titleLabel: '+ Add Quote',
        updateLabel: '✓ Update Quote'
    }
};

function enterEditMode(category, item) {
    editingItemId = item.id;
    editingCategory = category;

    const config = categoryConfigs[category];
    if (!config) return;

    // Parse structured data if required
    let parsedValues = { ...item };
    if (category === 'experience') {
        let company = '';
        let role = item.title || '';
        if (role.includes(' @ ')) {
            const parts = role.split(' @ ');
            role = parts[0];
            company = parts[1];
        }
        let duration = '';
        let location = '';
        if (item.meta) {
            const parts = item.meta.split(' · ');
            duration = parts[0] || '';
            location = parts[1] || '';
        }
        parsedValues = {
            title: role,
            company,
            duration,
            location,
            desc: item.desc || ''
        };
    } else if (category === 'education') {
        let institution = '';
        let score = '';
        if (item.meta) {
            const parts = item.meta.split(' · ');
            institution = parts[0] || '';
            score = parts[1] || '';
        }
        parsedValues = {
            title: item.title || '',
            institution,
            score
        };
    } else if (category === 'certifications') {
        let issuer = '';
        let score = '';
        if (item.meta) {
            const parts = item.meta.split(' · ');
            issuer = parts[0] || '';
            score = parts[1] || '';
        }
        parsedValues = {
            title: item.title || '',
            issuer,
            score,
            link: item.link || ''
        };
    } else if (category === 'articles') {
        let author = '';
        let type = '';
        if (item.meta) {
            const parts = item.meta.split(' · ');
            author = parts[0] || '';
            type = parts[1] || '';
        }
        parsedValues = {
            title: item.title || '',
            author,
            type,
            link: item.link || '',
            note: item.note || ''
        };
    } else if (category === 'videos') {
        parsedValues = {
            title: item.title || '',
            creator: item.meta || '',
            link: item.link || ''
        };
    }

    // Fill values
    Object.entries(config.inputs).forEach(([field, elementId]) => {
        const el = document.getElementById(elementId);
        if (el) el.value = parsedValues[field] || '';
    });

    // Special gallery handling
    if (category === 'gallery') {
        const fileInput = document.getElementById('admin-img-file');
        if (fileInput) fileInput.value = '';
        const previewContainer = document.getElementById('gallery-preview-container');

        if (item.url) {
            if (item.url.startsWith('data:image')) {
                switchGalleryTab('file');
                const previewImg = document.getElementById('gallery-file-preview');
                const previewSize = document.getElementById('gallery-file-size');
                if (previewImg && previewSize && previewContainer) {
                    previewImg.src = item.url;
                    previewSize.textContent = 'Local Compressed Image Loaded';
                    previewContainer.style.display = 'block';
                }
            } else {
                switchGalleryTab('link');
                const urlInput = document.getElementById('admin-img-url');
                if (urlInput) urlInput.value = item.url;
                if (previewContainer) previewContainer.style.display = 'none';
            }
        }
    }

    // Focus input and show edit active
    const btn = document.getElementById(config.saveBtn);
    if (btn) {
        btn.textContent = config.updateLabel;
        btn.classList.add('edit-active');
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    showToast('Editing item...', 'success');
}

function exitEditMode(category) {
    editingItemId = null;
    editingCategory = null;

    const config = categoryConfigs[category];
    if (!config) return;

    // Clear values
    Object.values(config.inputs).forEach(elementId => {
        const el = document.getElementById(elementId);
        if (el) el.value = '';
    });

    // Special reset for gallery
    if (category === 'gallery') {
        const fileInput = document.getElementById('admin-img-file');
        if (fileInput) fileInput.value = '';
        const previewContainer = document.getElementById('gallery-preview-container');
        if (previewContainer) previewContainer.style.display = 'none';
        const urlInput = document.getElementById('admin-img-url');
        if (urlInput) urlInput.value = '';
    }

    // Reset Button Text
    const btn = document.getElementById(config.saveBtn);
    if (btn) {
        btn.textContent = config.titleLabel;
        btn.classList.remove('edit-active');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC SAVE / DELETE
// ─────────────────────────────────────────────────────────────────────────────

async function saveItem(collName, data, inputsToClear = []) {
    try {
        if (editingItemId && editingCategory === collName) {
            // Edit Mode -> UPDATE
            await setDoc(docPath(collName, editingItemId), {
                ...data,
                updatedAt: Date.now()
            }, { merge: true });

            exitEditMode(collName);
            showToast('Updated successfully!');
        } else {
            // Add Mode -> CREATE
            const existingItems = window.globalManageData?.[collName] || [];
            const priority = existingItems.length + 1;

            await addDoc(dataPath(collName), {
                ...data,
                priority,
                addedAt: Date.now()
            });

            inputsToClear.forEach(el => { if (el) el.value = ''; });
            if (collName === 'gallery') {
                const filePreviewContainer = document.getElementById('gallery-preview-container');
                if (filePreviewContainer) filePreviewContainer.style.display = 'none';
            }
            showToast('Saved successfully!');
        }

        renderCategoryList(collName);

    } catch (e) {
        console.error('[CMS] saveItem error:', e);
        const msg = e.code === 'permission-denied'
            ? 'Permission denied. Are you logged in?'
            : `Failed to save: ${e.message}`;
        showToast(msg, 'error');
    }
}

async function saveUiDoc(docId, data) {
    try {
        await setDoc(uiDocPath(docId), data, { merge: true });
        showToast('Saved!');
    } catch (e) {
        console.error('[CMS] saveUiDoc error:', e);
        showToast('Failed to save.', 'error');
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
            // Render list containers right on auth success
            Object.keys(categoryConfigs).forEach(renderCategoryList);
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
            await signInWithEmailAndPassword(auth, emailInput.value.trim(), passInput.value);
            passcodeModal.style.display = 'none';
            document.getElementById('admin-panel').style.display = 'flex';
            showToast('Logged in as Admin!');
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
        await signOut(auth);
        showToast('Logged out.');
    });

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

        // Check active mode
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
                    // Updating item but keeping existing base64
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

    // ── Batch Auto-Extract (Last 6 Instagram Posts) ───────────────────────────
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

async function extractInstagramPostData(postUrl) {
    try {
        const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(postUrl)}`);
        const json = await res.json();
        if (json.status === 'success' && json.data?.image?.url) {
            return {
                imageUrl: json.data.image.url,
                caption: json.data.description || json.data.title || '',
                author: json.data.author || ''
            };
        }
    } catch (e) {
        console.warn('[CMS] Microlink extraction error:', e);
    }
    return null;
}

async function tryConvertToBase64(imageUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxDim = 1200;
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
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/webp', 0.84));
            } catch (e) {
                resolve(imageUrl);
            }
        };
        img.onerror = () => {
            resolve(imageUrl);
        };
        img.src = imageUrl;
    });
}

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
}

function switchGalleryTab(mode) {
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

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXTUAL LIST RENDERING
// ─────────────────────────────────────────────────────────────────────────────
function renderCategoryList(category) {
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

// Expose so onSnapshot updates trigger render
window._cmsRenderCategoryList = renderCategoryList;

async function moveItemOrder(category, index, direction) {
    const items = window.globalManageData?.[category] || [];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const item1 = items[index];
    const item2 = items[targetIndex];

    const tempPriority = item1.priority || (index + 1);
    item1.priority = item2.priority || (targetIndex + 1);
    item2.priority = tempPriority;

    try {
        await setDoc(docPath(category, item1.id), { priority: item1.priority }, { merge: true });
        await setDoc(docPath(category, item2.id), { priority: item2.priority }, { merge: true });
        showToast('Order updated!');
    } catch (e) {
        console.error('[CMS] moveItemOrder error:', e);
        showToast('Failed to update order.', 'error');
    }
}

async function deleteItem(category, docId) {
    try {
        await deleteDoc(docPath(category, docId));
        showToast('Item deleted.');
        if (editingItemId === docId) {
            exitEditMode(category);
        }
    } catch (e) {
        console.error('[CMS] deleteItem error:', e);
        showToast('Failed to delete.', 'error');
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