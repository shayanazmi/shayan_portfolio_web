import {
    dataPath, uiDocPath, onSnapshot
} from '../../shared/firebase/firebase-config.js';
import { DebugLogger } from '../../shared/utils/logger.js';

export const DEFAULT_BEHOLD_URL = 'https://feeds.behold.so/LjnCeNbAX8rX7T8X7acZ';

// Embedded authentic Instagram posts from Behold.so dataset (100% reliable, zero network latency)
export const embeddedInstagramPosts = [
    {
        id: "18171881197420176",
        title: "Har aadmi mei hote hai das bees aadmi...",
        url: "https://hop.behold.pictures/eyJ1IjoiUTdPeTdRVXdiSFI3YWRKaVlSWWFISHFnOVE2MyIsImYiOiJMam5DZU5iQVg4clg3VDhYN2FjWiIsInAiOiIxODE3MTg4MTE5NzQyMDE3NiIsImgiOiIxNnp1MnpzIn0.jpg?class=squareLarge",
        link: "https://www.instagram.com/p/DZqPpfczqVH/"
    },
    {
        id: "18020738081656103",
        title: "Hai shauq-e-safar aisa ki ek muddat se humne manzil bhi nahi paayi, raasta bhi nahi badla...",
        url: "https://hop.behold.pictures/eyJ1IjoiUTdPeTdRVXdiSFI3YWRKaVlSWWFISHFnOVE2MyIsImYiOiJMam5DZU5iQVg4clg3VDhYN2FjWiIsInAiOiIxODAyMDczODA4MTY1NjEwMyIsImgiOiI1YXF3Nm4ifQ.jpg?class=squareLarge",
        link: "https://www.instagram.com/p/DXjyn-kExgv/"
    },
    {
        id: "18052978613704883",
        title: "Untitled. #dhaludharranges",
        url: "https://hop.behold.pictures/eyJ1IjoiUTdPeTdRVXdiSFI3YWRKaVlSWWFISHFnOVE2MyIsImYiOiJMam5DZU5iQVg4clg3VDhYN2FjWiIsInAiOiIxODA1Mjk3ODYxMzcwNDg4MyIsImgiOiJ0OTU0MmYifQ.jpg?class=squareLarge",
        link: "https://www.instagram.com/p/DVmByFCEifr/"
    },
    {
        id: "18119526433614127",
        title: "High in the halls of the kings who are gone, Jenny would dance with her ghosts...",
        url: "https://hop.behold.pictures/eyJ1IjoiUTdPeTdRVXdiSFI3YWRKaVlSWWFISHFnOVE2MyIsImYiOiJMam5DZU5iQVg4clg3VDhYN2FjWiIsInAiOiIxODExOTUyNjQzMzYxNDEyNyIsImgiOiIxZ2x3ZnlhIn0.jpg?class=squareLarge",
        link: "https://www.instagram.com/p/DVCfl9fEkcg/"
    },
    {
        id: "18065030570657425",
        title: "I'm not asking you to come down here and clean out the muddy corners of my life...",
        url: "https://hop.behold.pictures/eyJ1IjoiUTdPeTdRVXdiSFI3YWRKaVlSWWFISHFnOVE2MyIsImYiOiJMam5DZU5iQVg4clg3VDhYN2FjWiIsInAiOiIxODA2NTAzMDU3MDY1NzQyNSIsImgiOiI3OTJ5eGYifQ.jpg?class=squareLarge",
        link: "https://www.instagram.com/p/DUv1JU7EvB5/"
    },
    {
        id: "18109593943651121",
        title: "Door se apna ghar dekhna chahiye... ~ Vinod Kumar Shukla",
        url: "https://hop.behold.pictures/eyJ1IjoiUTdPeTdRVXdiSFI3YWRKaVlSWWFISHFnOVE2MyIsImYiOiJMam5DZU5iQVg4clg3VDhYN2FjWiIsInAiOiIxODEwOTU5Mzk0MzY1MTEyMSIsImgiOiIxNTFnZWQ0In0.jpg?class=squareLarge",
        link: "https://www.instagram.com/p/DTafQfCkujA/"
    }
];

export function parseBeholdPosts(data) {
    const postsArray = Array.isArray(data) ? data : (data.posts || []);
    if (!postsArray.length) return embeddedInstagramPosts;
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
                .then(data => parseBeholdPosts(data))
                .catch(() => embeddedInstagramPosts);
        });
}

export function syncGallery(onUpdate) {
    let firestoreItems = [];
    let beholdItems = embeddedInstagramPosts;

    const emitMergedGallery = () => {
        if (beholdItems.length) {
            onUpdate(beholdItems);
        } else if (firestoreItems.length) {
            onUpdate(firestoreItems);
        } else {
            onUpdate(embeddedInstagramPosts);
        }
    };

    // 1. Instantly render embedded authentic Instagram posts
    emitMergedGallery();

    // 2. Fetch remote Behold feed in background if available
    fetchBeholdFeed(DEFAULT_BEHOLD_URL)
        .then(items => {
            if (items && items.length) {
                beholdItems = items;
                emitMergedGallery();
            }
        })
        .catch(err => DebugLogger.recordError('Behold Feed Initial Error', err.message));

    // 3. Listen to Firestore custom uploads
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

    // 4. Listen to custom Behold URL changes in CMS
    onSnapshot(uiDocPath('behold'), (snap) => {
        if (snap.exists() && snap.data().url) {
            const feedUrl = snap.data().url;
            fetchBeholdFeed(feedUrl)
                .then(items => {
                    if (items && items.length) {
                        beholdItems = items;
                        emitMergedGallery();
                    }
                })
                .catch(err => DebugLogger.recordError('Behold Feed Sync Error', err.message));
        }
    }, () => {});
}
