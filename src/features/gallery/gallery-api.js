import {
    dataPath, uiDocPath, onSnapshot
} from '../../shared/firebase/firebase-config.js';
import { DebugLogger } from '../../shared/utils/logger.js';

export const DEFAULT_BEHOLD_URL = 'https://feed.behold.so/Q7Oy7QUwbHR7adJiYRYaHHqg9Q63';

let defaultGallery = [
    { id: 'dg1', url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80', title: 'Cinematography', link: '' },
    { id: 'dg2', url: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?auto=format&fit=crop&w=800&q=80', title: 'Street', link: '' }
];

export function parseBeholdPosts(data) {
    const postsArray = Array.isArray(data) ? data : (data.posts || []);
    return postsArray.slice(0, 6).map((p, idx) => ({
        id: p.id || `behold_${idx}`,
        title: p.prunedCaption || p.caption || 'Instagram Post',
        url: p.sizes?.large?.mediaUrl || p.sizes?.medium?.mediaUrl || p.mediaUrl,
        link: p.permalink || ''
    }));
}

export function fetchBeholdFeed(feedUrl = DEFAULT_BEHOLD_URL) {
    const proxyUrl = `/api/behold?url=${encodeURIComponent(feedUrl)}`;
    return fetch(proxyUrl)
        .then(res => res.json())
        .then(data => parseBeholdPosts(data))
        .catch(() => {
            return fetch(feedUrl)
                .then(res => res.json())
                .then(data => parseBeholdPosts(data));
        });
}

export function syncGallery(onUpdate) {
    let firestoreItems = [];
    let beholdItems = [];

    const emitMergedGallery = () => {
        if (beholdItems.length) {
            onUpdate(beholdItems);
        } else if (firestoreItems.length) {
            onUpdate(firestoreItems);
        } else {
            onUpdate(defaultGallery);
        }
    };

    fetchBeholdFeed(DEFAULT_BEHOLD_URL)
        .then(items => {
            if (items.length) {
                beholdItems = items;
                emitMergedGallery();
            }
        })
        .catch(err => DebugLogger.recordError('Behold Feed Initial Error', err.message));

    onSnapshot(dataPath('gallery'), (snap) => {
        firestoreItems = [];
        snap.forEach(docSnap => firestoreItems.push({ id: docSnap.id, ...docSnap.data() }));
        firestoreItems.sort((a, b) => (a.priority || 999) - (b.priority || 999));

        if (!window.globalManageData) window.globalManageData = {};
        window.globalManageData['gallery'] = firestoreItems;

        if (window._cmsRenderCategoryList) {
            window._cmsRenderCategoryList('gallery');
        }

        emitMergedGallery();
    }, (err) => {
        DebugLogger.recordError('Firestore Sync Error', `Gallery sync failed: ${err.message}`);
        emitMergedGallery();
    });

    onSnapshot(uiDocPath('behold'), (snap) => {
        if (snap.exists() && snap.data().url) {
            const feedUrl = snap.data().url;
            fetchBeholdFeed(feedUrl)
                .then(items => {
                    if (items.length) {
                        beholdItems = items;
                        emitMergedGallery();
                    }
                })
                .catch(err => DebugLogger.recordError('Behold Feed Sync Error', err.message));
        }
    }, () => {});
}
