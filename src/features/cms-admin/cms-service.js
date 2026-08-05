import { addDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { dataPath, docPath, uiDocPath } from "../../shared/firebase/firebase-config.js";
import { showToast } from './toast.js';
import { compressImage } from './image-upload.js';

export let editingItemId = null;
export let editingCategory = null;

export function setEditingItemId(val) { editingItemId = val; }
export function setEditingCategory(val) { editingCategory = val; }

export const categoryConfigs = {
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

export function enterEditMode(category, item) {
    editingItemId = item.id;
    editingCategory = category;

    const config = categoryConfigs[category];
    if (!config) return;

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

    Object.entries(config.inputs).forEach(([field, elementId]) => {
        const el = document.getElementById(elementId);
        if (el) el.value = parsedValues[field] || '';
    });

    if (category === 'gallery') {
        const fileInput = document.getElementById('admin-img-file');
        if (fileInput) fileInput.value = '';
        const previewContainer = document.getElementById('gallery-preview-container');

        if (item.url) {
            if (item.url.startsWith('data:image')) {
                if (window.switchGalleryTab) window.switchGalleryTab('file');
                const previewImg = document.getElementById('gallery-file-preview');
                const previewSize = document.getElementById('gallery-file-size');
                if (previewImg && previewSize && previewContainer) {
                    previewImg.src = item.url;
                    previewSize.textContent = 'Local Compressed Image Loaded';
                    previewContainer.style.display = 'block';
                }
            } else {
                if (window.switchGalleryTab) window.switchGalleryTab('link');
                const urlInput = document.getElementById('admin-img-url');
                if (urlInput) urlInput.value = item.url;
                if (previewContainer) previewContainer.style.display = 'none';
            }
        }
    }

    const btn = document.getElementById(config.saveBtn);
    if (btn) {
        btn.textContent = config.updateLabel;
        btn.classList.add('edit-active');
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    showToast('Editing item...', 'success');
}

export function exitEditMode(category) {
    editingItemId = null;
    editingCategory = null;

    const config = categoryConfigs[category];
    if (!config) return;

    Object.values(config.inputs).forEach(elementId => {
        const el = document.getElementById(elementId);
        if (el) el.value = '';
    });

    if (category === 'gallery') {
        const fileInput = document.getElementById('admin-img-file');
        if (fileInput) fileInput.value = '';
        const previewContainer = document.getElementById('gallery-preview-container');
        if (previewContainer) previewContainer.style.display = 'none';
        const urlInput = document.getElementById('admin-img-url');
        if (urlInput) urlInput.value = '';
    }

    const btn = document.getElementById(config.saveBtn);
    if (btn) {
        btn.textContent = config.titleLabel;
        btn.classList.remove('edit-active');
    }
}

export async function saveItem(collName, data, inputsToClear = []) {
    try {
        if (editingItemId && editingCategory === collName) {
            await setDoc(docPath(collName, editingItemId), {
                ...data,
                updatedAt: Date.now()
            }, { merge: true });

            exitEditMode(collName);
            showToast('Updated successfully!');
        } else {
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

        if (window._cmsRenderCategoryList) {
            window._cmsRenderCategoryList(collName);
        }

    } catch (e) {
        console.error('[CMS] saveItem error:', e);
        const msg = e.code === 'permission-denied'
            ? 'Permission denied. Are you logged in?'
            : `Failed to save: ${e.message}`;
        showToast(msg, 'error');
    }
}

export async function saveUiDoc(docId, data) {
    try {
        await setDoc(uiDocPath(docId), data, { merge: true });
        showToast('Saved!');
    } catch (e) {
        console.error('[CMS] saveUiDoc error:', e);
        showToast('Failed to save.', 'error');
    }
}

export async function moveItemOrder(category, index, direction) {
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

export async function deleteItem(category, docId) {
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

export async function extractInstagramPostData(postUrl) {
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

export async function tryConvertToBase64(imageUrl) {
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
