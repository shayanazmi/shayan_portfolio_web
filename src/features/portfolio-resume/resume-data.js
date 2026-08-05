import { onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { dataPath, uiDocPath } from "../../shared/firebase/firebase-config.js";

// Default Fallback Data
export const defaultProjects = [
    { id: 'dp1', title: "Olympia Academia", desc: "RAG chatbot using FAISS and Semantic Search with an upcoming XAI UI.", link: "https://github.com/shayanazmi/olympia-academia-ragChatBot", priority: 1 },
    { id: 'dp2', title: "Face Mask Detection", desc: "Real-time Streamlit AI Dashboard using VGG16 and Haar Cascades (93% accuracy).", link: "https://github.com/shayanazmi/Face-mask-Detection-FInal", priority: 2 }
];

export const defaultExperience = [
    { id: 'de1', title: "AI Intern @ C-DAC", desc: "Ranked #1 of 45+ trainees. Led a 4-person team to build a CNN/OpenCV Indian Sign Language model and optimized ML algorithms across 10+ datasets.", meta: "Jun 2025 – Jul 2025 · Patna, Bihar", priority: 1 },
    { id: 'de2', title: "Data Science Intern @ Codveda", desc: "Developed 12 Scikit-learn ML models and executed time-series trend analysis on data acquired via automated Beautiful Soup web scraping.", meta: "May 2025 – Jul 2025 · Remote", priority: 2 },
    { id: 'de3', title: "Leader @ Eulim Science Club", desc: "Orchestrated national science events for 1,500+ students and drove digital campaigns yielding 900K+ online engagements.", meta: "Aug 2025 – Present · Christ University", priority: 3 },
    { id: 'de4', title: "Stage Committee @ ICSCPS 2026", desc: "Directed a 15-member team executing seamless stage logistics and real-time session flows for 15 international speakers.", meta: "Christ University · Delhi NCR", priority: 4 }
];

export const defaultEducation = [
    { id: 'ded1', title: "B.Sc. Data Science & AI",  meta: "Christ University · 3/4 GPA", priority: 1 },
    { id: 'ded2', title: "Intermediate (12th)",       meta: "Al-Hafeez College · 68.6%",  priority: 2 },
    { id: 'ded3', title: "Matriculation (10th)",      meta: "St. Karens Secondary · 83.6%", priority: 3 }
];

export const defaultCertifications = [
    { id: 'dc1', title: "Data Analysis With R",         meta: "Google · Scored 90%",       priority: 1 },
    { id: 'dc2', title: "Python for Data Science & AI", meta: "IBM · Scored 92.5%",        priority: 2 },
    { id: 'dc3', title: "AI & Machine Learning",        meta: "Intel Unnati · Scored 80%", priority: 3 },
    { id: 'dc4', title: "Product & Brand Management",   meta: "IIT Roorkee · Scored 77%",  priority: 4 }
];

export const defaultPoetry    = [{ id: 'dpoe1', title: 'An Ode to the Code', type: 'Nazm', content: 'In loops we trust…', link: '#', priority: 1 }];
export const defaultArticles  = [{ id: 'da1', title: 'The Psychology of Human Misjudgment', meta: 'Charlie Munger · Essay', link: '#', priority: 1 }];
export const defaultVideos    = [{ id: 'dv1', title: 'The Art of Color Grading', meta: 'YouTube · Video Essay', link: '#', priority: 1 }];
export const defaultPlaylists = [];

export const defaultSkills = [
    { id: 'dsk1', name: 'Python',           priority: 1  },
    { id: 'dsk2', name: 'R',                priority: 2  },
    { id: 'dsk3', name: 'SQL',              priority: 3  },
    { id: 'dsk4', name: 'Scikit-learn',     priority: 4  },
    { id: 'dsk5', name: 'Pandas',           priority: 5  },
    { id: 'dsk6', name: 'NumPy',            priority: 6  },
    { id: 'dsk7', name: 'OpenCV',           priority: 7  },
    { id: 'dsk8', name: 'TensorFlow',       priority: 8  },
    { id: 'dsk9', name: 'Keras',            priority: 9  },
    { id: 'dsk10', name: 'XGBoost',         priority: 10 },
    { id: 'dsk11', name: 'Machine Learning',priority: 11 },
    { id: 'dsk12', name: 'Computer Vision', priority: 12 },
    { id: 'dsk13', name: 'NLP (RAG)',       priority: 13 },
    { id: 'dsk14', name: 'Data Modeling',   priority: 14 },
];

export const defaultTechQuotes = [
    { id: 'dtq1', text: "The art of programming is the art of organizing complexity.", author: "Edsger W. Dijkstra", category: "tech" },
    { id: 'dtq2', text: "Innovation distinguishes between a leader and a follower.",   author: "Steve Jobs",         category: "tech" }
];

export const defaultCreativeQuotes = [
    { id: 'dcq1', text: "Good design is invisible. Great design is inevitable.",                                      author: "Anonymous",   category: "creative" },
    { id: 'dcq2', text: "A photograph is a secret about a secret. The more it tells you the less you know.",          author: "Diane Arbus", category: "creative" }
];

export function syncCollection(collName, defaults, onUpdate) {
    onSnapshot(dataPath(collName), snap => {
        const items = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));

        items.sort((a, b) => {
            const pA = a.priority ? Number(a.priority) : 999;
            const pB = b.priority ? Number(b.priority) : 999;
            return pA !== pB ? pA - pB : (b.addedAt || 0) - (a.addedAt || 0);
        });

        if (window.globalManageData) {
            window.globalManageData[collName] = items;
            if (window._cmsRenderCategoryList) {
                window._cmsRenderCategoryList(collName);
            }
        }

        onUpdate(items.length ? items : defaults);
    }, err => {
        console.warn(`[Resume Data] ${collName} read failed:`, err);
        onUpdate(defaults);
    });
}

export function syncQuotes(onUpdate) {
    onSnapshot(dataPath('quotes'), snap => {
        const items = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        
        if (window.globalManageData) {
            window.globalManageData['quotes'] = items;
            if (window._cmsRenderCategoryList) {
                window._cmsRenderCategoryList('quotes');
            }
        }
        
        let tech = items.filter(q => q.category === 'tech');
        let creative = items.filter(q => q.category !== 'tech');
        
        if (!tech.length) tech = defaultTechQuotes;
        if (!creative.length) creative = defaultCreativeQuotes;
        
        onUpdate({ tech, creative });
    }, err => {
        console.warn('[Resume Data] quotes read failed:', err);
        onUpdate({ tech: defaultTechQuotes, creative: defaultCreativeQuotes });
    });
}

export function syncIntroText() {
    onSnapshot(uiDocPath('main_intro'), snap => {
        if (!snap.exists()) return;
        const d = snap.data();
        
        const techHookVal = d.tech_hook || '';
        const techIntroVal = [d.tech_p1, d.tech_p2, d.tech_p3, d.tech_p4].filter(Boolean).join('\n\n');
        const creaHookVal = d.crea_hook || '';
        const creaIntroVal = [d.crea_p1, d.crea_p2, d.crea_p3, d.crea_p4].filter(Boolean).join('\n\n');

        // Set UI elements
        const uiTechHook = document.getElementById('ui-tech-hook');
        if (uiTechHook) uiTechHook.innerHTML = techHookVal.replace(/\n/g, '<br>');
        const uiCreaHook = document.getElementById('ui-crea-hook');
        if (uiCreaHook) uiCreaHook.innerHTML = creaHookVal.replace(/\n/g, '<br>');

        for (let i = 1; i <= 4; i++) {
            const uiTechP = document.getElementById(`ui-tech-p${i}`);
            if (uiTechP) uiTechP.textContent = d[`tech_p${i}`] || '';
            const uiCreaP = document.getElementById(`ui-crea-p${i}`);
            if (uiCreaP) uiCreaP.textContent = d[`crea_p${i}`] || '';
        }

        // Set Admin inputs
        const adminTechHook = document.getElementById('admin-tech-hook');
        if (adminTechHook) adminTechHook.value = techHookVal;
        const adminTechIntro = document.getElementById('admin-tech-intro');
        if (adminTechIntro) adminTechIntro.value = techIntroVal;

        const adminCreaHook = document.getElementById('admin-crea-hook');
        if (adminCreaHook) adminCreaHook.value = creaHookVal;
        const adminCreaIntro = document.getElementById('admin-crea-intro');
        if (adminCreaIntro) adminCreaIntro.value = creaIntroVal;
    }, err => console.warn('[Resume Data] intro fetch failed:', err));
}

export function syncSpotifyPlayer() {
    onSnapshot(uiDocPath('spotify'), snap => {
        if (!snap.exists() || !snap.data().url) return;
        const url = snap.data().url;
        const pl  = document.getElementById('live-spotify-player');
        const adm = document.getElementById('admin-spotify-url');
        if (pl)  pl.src   = url;
        if (adm) adm.value = url;
        localStorage.setItem('spotifyEmbedUrl', url);
    }, err => console.warn('[Resume Data] spotify fetch failed:', err));
}
