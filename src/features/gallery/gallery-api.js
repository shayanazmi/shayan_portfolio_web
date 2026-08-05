import { onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { dataPath, uiDocPath } from "../../shared/firebase/firebase-config.js";

export const defaultGallery = [
    { id: 'dg1', url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80', title: 'Cinematography', priority: 1 },
    { id: 'dg2', url: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?auto=format&fit=crop&w=800&q=80', title: 'Street', priority: 2 }
];

let manualGalleryItems = [];
let beholdGalleryItems = [];

export function syncGallery(onUpdate) {
    // 1. Sync manual gallery collection
    onSnapshot(dataPath('gallery'), snap => {
        const items = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        items.sort((a, b) => {
            const pA = a.priority ? Number(a.priority) : 999;
            const pB = b.priority ? Number(b.priority) : 999;
            return pA !== pB ? pA - pB : (b.addedAt || 0) - (a.addedAt || 0);
        });
        manualGalleryItems = items.length > 0 ? items : defaultGallery;
        
        // Expose to CMS manager
        if (window.globalManageData) {
            window.globalManageData['gallery'] = manualGalleryItems;
            if (window._cmsRenderCategoryList) {
                window._cmsRenderCategoryList('gallery');
            }
        }

        onUpdate([...beholdGalleryItems, ...manualGalleryItems]);
    }, err => {
        console.warn('[Gallery API] gallery sync failed:', err);
        manualGalleryItems = defaultGallery;
        onUpdate([...beholdGalleryItems, ...manualGalleryItems]);
    });

    // 2. Sync Behold Instagram feed URL
    onSnapshot(uiDocPath('behold'), async snap => {
        const beholdAdminInp = document.getElementById('admin-behold-url');
        if (!snap.exists() || !snap.data().url) {
            if (beholdAdminInp) beholdAdminInp.value = '';
            beholdGalleryItems = [];
            onUpdate([...beholdGalleryItems, ...manualGalleryItems]);
            return;
        }
        const url = snap.data().url;
        if (beholdAdminInp) beholdAdminInp.value = url;

        try {
            const res = await fetch(url);
            const data = await res.json();
            const posts = Array.isArray(data) ? data : (data.posts || []);

            beholdGalleryItems = posts.map(p => ({
                id: p.id,
                url: p.sizes?.large?.mediaUrl || p.sizes?.medium?.mediaUrl || p.mediaUrl,
                link: p.permalink || '',
                title: p.prunedCaption || p.caption || '',
                alt: p.prunedCaption || p.caption || ''
            }));

            onUpdate([...beholdGalleryItems, ...manualGalleryItems]);
        } catch (e) {
            console.warn('[Gallery API] Behold fetch failed:', e);
        }
    }, err => console.warn('[Gallery API] behold fetch failed:', err));
}
