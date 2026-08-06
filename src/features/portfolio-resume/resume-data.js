import {
    dataPath, uiDocPath, onSnapshot
} from '../../shared/firebase/firebase-config.js';
import { DebugLogger } from '../../shared/utils/logger.js';

// Default Datasets from main.js (used while Firestore syncs or if collection is empty)
export const defaultProjects = [
    { id: 'dp1', title: "Olympia Academia", desc: "RAG chatbot using FAISS and Semantic Search with an upcoming XAI UI.", link: "https://github.com/shayanazmi/olympia-academia-ragChatBot", tags: ["Python", "RAG", "FAISS"], priority: 1 },
    { id: 'dp2', title: "Face Mask Detection", desc: "Real-time Streamlit AI Dashboard using VGG16 and Haar Cascades (93% accuracy).", link: "https://github.com/shayanazmi/Face-mask-Detection-FInal", tags: ["OpenCV", "VGG16", "Streamlit"], priority: 2 }
];

export const defaultExperience = [
    { id: 'de1', role: "AI Intern", company: "C-DAC", period: "Jun 2025 – Jul 2025 · Patna, Bihar", desc: "Ranked #1 of 45+ trainees. Led a 4-person team to build a CNN/OpenCV Indian Sign Language model and optimized ML algorithms across 10+ datasets.", priority: 1 },
    { id: 'de2', role: "Data Science Intern", company: "Codveda", period: "May 2025 – Jul 2025 · Remote", desc: "Developed 12 Scikit-learn ML models and executed time-series trend analysis on data acquired via automated Beautiful Soup web scraping.", priority: 2 },
    { id: 'de3', role: "Leader", company: "Eulim Science Club", period: "Aug 2025 – Present · Christ University", desc: "Orchestrated national science events for 1,500+ students and drove digital campaigns yielding 900K+ online engagements.", priority: 3 },
    { id: 'de4', role: "Stage Committee", company: "ICSCPS 2026", period: "Christ University · Delhi NCR", desc: "Directed a 15-member team executing seamless stage logistics and real-time session flows for 15 international speakers.", priority: 4 }
];

export const defaultEducation = [
    { id: 'ded1', degree: "B.Sc. Data Science & AI", institution: "Christ University", year: "3/4 GPA", priority: 1 },
    { id: 'ded2', degree: "Intermediate (12th)", institution: "Al-Hafeez College", year: "68.6%", priority: 2 },
    { id: 'ded3', degree: "Matriculation (10th)", institution: "St. Karens Secondary", year: "83.6%", priority: 3 }
];

export const defaultCertifications = [
    { id: 'dc1', title: "Data Analysis With R", issuer: "Google · Scored 90%", priority: 1 },
    { id: 'dc2', title: "Python for Data Science & AI", issuer: "IBM · Scored 92.5%", priority: 2 },
    { id: 'dc3', title: "AI & Machine Learning", issuer: "Intel Unnati · Scored 80%", priority: 3 },
    { id: 'dc4', title: "Product & Brand Management", issuer: "IIT Roorkee · Scored 77%", priority: 4 }
];

export const defaultSkills = [
    { id: 'dsk1', name: 'Python', priority: 1 },
    { id: 'dsk2', name: 'R', priority: 2 },
    { id: 'dsk3', name: 'SQL', priority: 3 },
    { id: 'dsk4', name: 'Scikit-learn', priority: 4 },
    { id: 'dsk5', name: 'Pandas', priority: 5 },
    { id: 'dsk6', name: 'NumPy', priority: 6 },
    { id: 'dsk7', name: 'OpenCV', priority: 7 },
    { id: 'dsk8', name: 'TensorFlow', priority: 8 },
    { id: 'dsk9', name: 'Keras', priority: 9 },
    { id: 'dsk10', name: 'XGBoost', priority: 10 },
    { id: 'dsk11', name: 'Machine Learning', priority: 11 },
    { id: 'dsk12', name: 'Computer Vision', priority: 12 },
    { id: 'dsk13', name: 'NLP (RAG)', priority: 13 }
];

export const defaultTechQuotes = [
    { id: 'dtq1', text: "The art of programming is the art of organizing complexity.", author: "Edsger W. Dijkstra", category: "tech" }
];

export const defaultCreativeQuotes = [
    { id: 'dcq1', text: "A photograph is a secret about a secret. The more it tells you the less you know.", author: "Diane Arbus", category: "creative" }
];

export function syncCollection(collName, defaults, onUpdate) {
    onSnapshot(dataPath(collName), (snap) => {
        let items = [];
        snap.forEach(docSnap => items.push({ id: docSnap.id, ...docSnap.data() }));

        items.sort((a, b) => (a.priority || 999) - (b.priority || 999));

        if (!window.globalManageData) window.globalManageData = {};
        window.globalManageData[collName] = items;

        if (window._cmsRenderCategoryList) {
            window._cmsRenderCategoryList(collName);
        }

        onUpdate(items.length ? items : defaults);
    }, (err) => {
        DebugLogger.recordError('Firestore Sync Error', `Collection [${collName}] sync failed: ${err.message}`);
        onUpdate(defaults);
    });
}

export function syncQuotes(onUpdate) {
    onSnapshot(dataPath('quotes'), (snap) => {
        let tech = [];
        let creative = [];
        snap.forEach(docSnap => {
            const data = { id: docSnap.id, ...docSnap.data() };
            if (data.cat === 'creative') creative.push(data);
            else tech.push(data);
        });

        tech.sort((a, b) => (a.priority || 999) - (b.priority || 999));
        creative.sort((a, b) => (a.priority || 999) - (b.priority || 999));

        if (!window.globalManageData) window.globalManageData = {};
        window.globalManageData['quotes'] = [...tech, ...creative];

        if (window._cmsRenderCategoryList) {
            window._cmsRenderCategoryList('quotes');
        }

        const finalTech = tech.length ? tech : defaultTechQuotes;
        const finalCreative = creative.length ? creative : defaultCreativeQuotes;

        onUpdate({ tech: finalTech, creative: finalCreative });
    }, (err) => {
        DebugLogger.recordError('Quotes Sync Error', err.message);
        onUpdate({ tech: defaultTechQuotes, creative: defaultCreativeQuotes });
    });
}

export function syncSpotifyPlayer() {
    const cachedUrl = localStorage.getItem('spotify_embed_url');
    const iframe = document.getElementById('spotify-player-iframe');
    if (cachedUrl && iframe) {
        iframe.src = cachedUrl;
    }

    onSnapshot(uiDocPath('spotify'), (snap) => {
        if (snap.exists() && snap.data().embedUrl) {
            const url = snap.data().embedUrl;
            localStorage.setItem('spotify_embed_url', url);
            if (iframe) iframe.src = url;
        }
    }, () => {});
}
