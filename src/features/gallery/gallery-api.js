import {
    dataPath, uiDocPath, onSnapshot
} from '../../shared/firebase/firebase-config.js';
import { DebugLogger } from '../../shared/utils/logger.js';

let defaultGallery = [
    { id: 'dg1', url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80', title: 'Cinematography', link: '' },
    { id: 'dg2', url: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?auto=format&fit=crop&w=800&q=80', title: 'Street', link: '' }
];

export function syncGallery(onUpdate) {
    onSnapshot(dataPath('gallery'), (snap) => {
        let items = [];
        snap.forEach(docSnap => items.push({ id: docSnap.id, ...docSnap.data() }));

        items.sort((a, b) => (a.priority || 999) - (b.priority || 999));

        if (!window.globalManageData) window.globalManageData = {};
        window.globalManageData['gallery'] = items;

        if (window._cmsRenderCategoryList) {
            window._cmsRenderCategoryList('gallery');
        }

        onUpdate(items.length ? items : defaultGallery);
    }, (err) => {
        DebugLogger.recordError('Firestore Sync Error', `Gallery sync failed: ${err.message}`);
        onUpdate(defaultGallery);
    });

    onSnapshot(uiDocPath('behold'), (snap) => {
        if (snap.exists() && snap.data().url) {
            const feedUrl = snap.data().url;
            fetch(feedUrl)
                .then(res => res.json())
                .then(posts => {
                    if (Array.isArray(posts) && posts.length) {
                        const beholdItems = posts.map(p => ({
                            title: p.caption || 'Instagram Post',
                            url: p.sizes?.medium?.mediaUrl || p.mediaUrl,
                            link: p.permalink || ''
                        }));
                        onUpdate(beholdItems);
                    }
                })
                .catch(err => DebugLogger.recordError('Behold Feed Error', err.message));
        }
    }, () => {});
}
