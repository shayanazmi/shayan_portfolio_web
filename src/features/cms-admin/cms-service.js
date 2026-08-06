import {
    dataPath, docPath, uiDocPath, addDoc, setDoc, deleteDoc
} from '../../shared/firebase/firebase-config.js';
import { showToast } from './toast.js';

export let editingItemId = null;
export let editingCategory = null;

export const categoryConfigs = {
    projects: { inputs: ['admin-proj-title', 'admin-proj-desc', 'admin-proj-link', 'admin-proj-tags'], btn: 'save-proj-btn', label: 'Save Project' },
    experience: { inputs: ['admin-exp-role', 'admin-exp-company', 'admin-exp-period', 'admin-exp-desc'], btn: 'save-exp-btn', label: 'Save Experience' },
    education: { inputs: ['admin-edu-degree', 'admin-edu-inst', 'admin-edu-year'], btn: 'save-edu-btn', label: 'Save Education' },
    certifications: { inputs: ['admin-cert-title', 'admin-cert-issuer'], btn: 'save-cert-btn', label: 'Save Certification' },
    gallery: { inputs: ['admin-img-title', 'admin-img-url', 'admin-img-link'], btn: 'save-img-btn', label: 'Save Photo' },
    poetry: { inputs: ['admin-poem-title', 'admin-poem-body', 'admin-poem-rekhta', 'admin-poem-lang'], btn: 'save-poem-btn', label: 'Save Poem' },
    articles: { inputs: ['admin-art-title', 'admin-art-link', 'admin-art-note'], btn: 'save-art-btn', label: 'Save Article' },
    videos: { inputs: ['admin-vid-title', 'admin-vid-link'], btn: 'save-vid-btn', label: 'Save Media Item' },
    skills: { inputs: ['admin-skill-name'], btn: 'save-skill-btn', label: 'Save Skill' },
    playlists: { inputs: ['admin-pl-title', 'admin-pl-link'], btn: 'save-pl-btn', label: 'Save Playlist' },
    quotes: { inputs: ['admin-quote-text', 'admin-quote-author', 'admin-quote-cat'], btn: 'save-quote-btn', label: 'Save Quote' }
};

export function enterEditMode(category, item) {
    editingItemId = item.id;
    editingCategory = category;
    const cfg = categoryConfigs[category];
    if (!cfg) return;

    cfg.inputs.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const key = id.replace(`admin-${category.slice(0, 3)}-`, '').replace('admin-quote-', '');
        if (item[key] !== undefined) {
            el.value = Array.isArray(item[key]) ? item[key].join(', ') : item[key];
        }
    });

    const btn = document.getElementById(cfg.btn);
    if (btn) {
        btn.textContent = 'Update Item';
        btn.style.background = '#eab308';
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

export function exitEditMode(category) {
    editingItemId = null;
    editingCategory = null;
    const cfg = categoryConfigs[category];
    if (!cfg) return;

    cfg.inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    const btn = document.getElementById(cfg.btn);
    if (btn) {
        btn.textContent = cfg.label;
        btn.style.background = '';
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
            showToast('Saved successfully!');
        }
    } catch (e) {
        showToast('Failed to save item.', 'error');
    }
}

export async function deleteCategoryItem(category, docId) {
    try {
        await deleteDoc(docPath(category, docId));
        showToast('Deleted item.');
    } catch (e) {
        showToast('Failed to delete item.', 'error');
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
        showToast('Order updated.');
    } catch (e) {
        showToast('Failed to reorder.', 'error');
    }
}

export async function saveUiDoc(docId, data) {
    try {
        await setDoc(uiDocPath(docId), data, { merge: true });
        showToast('Configuration updated!');
    } catch (e) {
        showToast('Failed to update config.', 'error');
    }
}
