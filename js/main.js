import { db, onSnapshot, dataPath, uiDocPath } from "./firebase-config.js";

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STATE
// ─────────────────────────────────────────────────────────────────────────────
const GALLERY_LIMIT  = 6;
const POETRY_LIMIT   = 1;
const ARTICLES_LIMIT = 3;
const VIDEOS_LIMIT   = 5;

let galleryShowingAll  = false;
let poetryShowingAll   = false;
let articlesShowingAll = false;
let videosShowingAll   = false;

let techQuotes     = [];
let creativeQuotes = [];

let currentGalleryItems  = [];
let currentPoetryItems   = [];
let currentArticlesItems = [];
let currentVideosItems   = [];

// Shared state used by CMS manage panel
window.globalManageData = {
    projects: [], experience: [], education: [], certifications: [],
    gallery: [], poetry: [], articles: [], videos: [], quotes: [], playlists: [],
    skills: []
};

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT DATA (shown while Firestore loads or if collection is empty)
// ─────────────────────────────────────────────────────────────────────────────
const defaultProjects = [
    { id: 'dp1', title: "Olympia Academia", desc: "RAG chatbot using FAISS and Semantic Search with an upcoming XAI UI.", link: "https://github.com/shayanazmi/olympia-academia-ragChatBot", priority: 1 },
    { id: 'dp2', title: "Face Mask Detection", desc: "Real-time Streamlit AI Dashboard using VGG16 and Haar Cascades (93% accuracy).", link: "https://github.com/shayanazmi/Face-mask-Detection-FInal", priority: 2 }
];
const defaultExperience = [
    { id: 'de1', title: "AI Intern @ C-DAC", desc: "Ranked #1 of 45+ trainees. Led a 4-person team to build a CNN/OpenCV Indian Sign Language model and optimized ML algorithms across 10+ datasets.", meta: "Jun 2025 – Jul 2025 · Patna, Bihar", priority: 1 },
    { id: 'de2', title: "Data Science Intern @ Codveda", desc: "Developed 12 Scikit-learn ML models and executed time-series trend analysis on data acquired via automated Beautiful Soup web scraping.", meta: "May 2025 – Jul 2025 · Remote", priority: 2 },
    { id: 'de3', title: "Leader @ Eulim Science Club", desc: "Orchestrated national science events for 1,500+ students and drove digital campaigns yielding 900K+ online engagements.", meta: "Aug 2025 – Present · Christ University", priority: 3 },
    { id: 'de4', title: "Stage Committee @ ICSCPS 2026", desc: "Directed a 15-member team executing seamless stage logistics and real-time session flows for 15 international speakers.", meta: "Christ University · Delhi NCR", priority: 4 }
];
const defaultEducation = [
    { id: 'ded1', title: "B.Sc. Data Science & AI",  meta: "Christ University · 3/4 GPA", priority: 1 },
    { id: 'ded2', title: "Intermediate (12th)",       meta: "Al-Hafeez College · 68.6%",  priority: 2 },
    { id: 'ded3', title: "Matriculation (10th)",      meta: "St. Karens Secondary · 83.6%", priority: 3 }
];
const defaultCertifications = [
    { id: 'dc1', title: "Data Analysis With R",         meta: "Google · Scored 90%",       priority: 1 },
    { id: 'dc2', title: "Python for Data Science & AI", meta: "IBM · Scored 92.5%",        priority: 2 },
    { id: 'dc3', title: "AI & Machine Learning",        meta: "Intel Unnati · Scored 80%", priority: 3 },
    { id: 'dc4', title: "Product & Brand Management",   meta: "IIT Roorkee · Scored 77%",  priority: 4 }
];
const defaultGallery = [
    { id: 'dg1', url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80', title: 'Cinematography', priority: 1 },
    { id: 'dg2', url: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?auto=format&fit=crop&w=800&q=80', title: 'Street', priority: 2 }
];
const defaultPoetry    = [{ id: 'dpoe1', title: 'An Ode to the Code', type: 'Nazm', content: 'In loops we trust…', link: '#', priority: 1 }];
const defaultArticles  = [{ id: 'da1', title: 'The Psychology of Human Misjudgment', meta: 'Charlie Munger · Essay', link: '#', priority: 1 }];
const defaultVideos    = [{ id: 'dv1', title: 'The Art of Color Grading', meta: 'YouTube · Video Essay', link: '#', priority: 1 }];
const defaultPlaylists = [];
const defaultSkills = [
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
const defaultTechQuotes = [
    { id: 'dtq1', text: "The art of programming is the art of organizing complexity.", author: "Edsger W. Dijkstra", category: "tech" },
    { id: 'dtq2', text: "Innovation distinguishes between a leader and a follower.",   author: "Steve Jobs",         category: "tech" }
];
const defaultCreativeQuotes = [
    { id: 'dcq1', text: "Good design is invisible. Great design is inevitable.",                                      author: "Anonymous",   category: "creative" },
    { id: 'dcq2', text: "A photograph is a secret about a secret. The more it tells you the less you know.",          author: "Diane Arbus", category: "creative" }
];

// ─────────────────────────────────────────────────────────────────────────────
// DOM READY
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    // Scroll-reveal observer
    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.reveal-up').forEach(el => observer.observe(el));

    document.getElementById('alter-ego-toggle')?.addEventListener('click', () => {
        setTimeout(() => {
            document.querySelectorAll('.reveal-up').forEach(el => observer.observe(el));
        }, 400);
    });

    initEntropyCanvas();
    initTechCanvas();

    // Spotify: fast local-cache paint before Firestore responds
    const cachedSpotify = localStorage.getItem('spotifyEmbedUrl');
    if (cachedSpotify) {
        const pl = document.getElementById('live-spotify-player');
        if (pl) pl.src = cachedSpotify;
    }

    startDataFetch();
    initAlterEgoToggle();
    initShowMoreButtons();
    initDinoGame();
});

// ─────────────────────────────────────────────────────────────────────────────
// FIRESTORE SYNC
// ─────────────────────────────────────────────────────────────────────────────
function startDataFetch() {
    if (!db) { renderAllDefaults(); return; }

    // ── Intro text ────────────────────────────────────────────────────────────
    onSnapshot(uiDocPath('main_intro'), snap => {
        if (!snap.exists()) return;
        const d = snap.data();
        const fields = ['tech_hook','tech_p1','tech_p2','tech_p3','tech_p4',
                        'crea_hook','crea_p1','crea_p2','crea_p3','crea_p4'];
        fields.forEach(f => {
            const uiEl    = document.getElementById('ui-'    + f.replace(/_/g, '-'));
            const adminEl = document.getElementById('admin-' + f.replace(/_/g, '-'));
            if (uiEl)    uiEl.textContent = d[f] || '';
            if (adminEl) adminEl.value    = d[f] || '';
        });
    }, err => console.warn('[main] intro fetch failed:', err));

    // ── Spotify ───────────────────────────────────────────────────────────────
    onSnapshot(uiDocPath('spotify'), snap => {
        if (!snap.exists() || !snap.data().url) return;
        const url = snap.data().url;
        const pl  = document.getElementById('live-spotify-player');
        const adm = document.getElementById('admin-spotify-url');
        if (pl)  pl.src   = url;
        if (adm) adm.value = url;
        localStorage.setItem('spotifyEmbedUrl', url);
    }, err => console.warn('[main] spotify fetch failed:', err));

    // ── Generic collection sync ───────────────────────────────────────────────
    function syncCollection(collName, defaults, renderFn) {
        onSnapshot(dataPath(collName), snap => {
            const items = [];
            snap.forEach(d => items.push({ id: d.id, ...d.data() }));

            items.sort((a, b) => {
                const pA = a.priority ? Number(a.priority) : 999;
                const pB = b.priority ? Number(b.priority) : 999;
                return pA !== pB ? pA - pB : (b.addedAt || 0) - (a.addedAt || 0);
            });

            window.globalManageData[collName] = items;

            // Refresh manage panel whenever it is open (any category updated)
            const managePanel = document.getElementById('panel-manage');
            if (managePanel?.classList.contains('active')) window._cmsRenderManageList?.();

            renderFn(items.length ? items : defaults);
        }, err => {
            console.warn(`[main] ${collName} read failed:`, err);
            renderFn(defaults);
        });
    }

    syncCollection('projects',       defaultProjects,       renderProjects);
    syncCollection('experience',     defaultExperience,     renderExperience);
    syncCollection('education',      defaultEducation,      renderEducation);
    syncCollection('certifications', defaultCertifications, renderCertifications);
    syncCollection('gallery',        defaultGallery,        renderGallery);
    syncCollection('poetry',         defaultPoetry,         renderPoetry);
    syncCollection('articles',       defaultArticles,       renderArticles);
    syncCollection('videos',         defaultVideos,         renderVideos);
    syncCollection('playlists',      defaultPlaylists,      renderPlaylists);
    syncCollection('skills',         defaultSkills,         renderSkills);

    // Quotes get split into two buckets
    onSnapshot(dataPath('quotes'), snap => {
        const items = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        window.globalManageData['quotes'] = items;

        techQuotes     = items.filter(q => q.category === 'tech');
        creativeQuotes = items.filter(q => q.category !== 'tech');
        if (!techQuotes.length)     techQuotes     = defaultTechQuotes;
        if (!creativeQuotes.length) creativeQuotes = defaultCreativeQuotes;
        renderQuotes();
    }, err => {
        console.warn('[main] quotes read failed:', err);
        techQuotes     = defaultTechQuotes;
        creativeQuotes = defaultCreativeQuotes;
        renderQuotes();
    });
}

function renderAllDefaults() {
    renderProjects(defaultProjects);
    renderExperience(defaultExperience);
    renderEducation(defaultEducation);
    renderCertifications(defaultCertifications);
    renderGallery(defaultGallery);
    renderPoetry(defaultPoetry);
    renderArticles(defaultArticles);
    renderVideos(defaultVideos);
    renderPlaylists(defaultPlaylists);
    renderSkills(defaultSkills);
    techQuotes     = defaultTechQuotes;
    creativeQuotes = defaultCreativeQuotes;
    renderQuotes();
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

// Shared "read more" expander for long text
function makeExpandable(text, id, prefix, limit = 150) {
    if (text.length <= limit) return `<p class="project-desc">${escapeHtml(text)}</p>`;
    const short = escapeHtml(text.substring(0, limit).trim()) + '…';
    const full  = escapeHtml(text);
    return `
        <p class="project-desc" id="${prefix}-short-${id}">${short}</p>
        <p class="project-desc" id="${prefix}-full-${id}" style="display:none;white-space:pre-wrap;">${full}</p>
        <button class="show-more-toggle"
            onclick="(function(btn){
                var s=document.getElementById('${prefix}-short-${id}');
                var show=s.style.display!=='none';
                s.style.display=show?'none':'block';
                document.getElementById('${prefix}-full-${id}').style.display=show?'block':'none';
                btn.textContent=show?'Show Less':'Read More';
            })(this)">Read More</button>`;
}

function renderProjects(items) {
    const c = document.getElementById('projects-container');
    if (!c) return;
    c.innerHTML = items.map(item => `
        <article class="project-card">
            <h3 class="project-title">${escapeHtml(item.title)}</h3>
            ${makeExpandable(item.desc || '', item.id, 'proj')}
            ${item.tags ? `<div class="proj-tags">${item.tags.split(',').map(t=>`<span class="proj-tag">${escapeHtml(t.trim())}</span>`).join('')}</div>` : ''}
            <a href="${item.link || '#'}" target="_blank" rel="noopener" class="project-link" style="margin-top:1rem;">View Repository</a>
        </article>`).join('');
}

function renderExperience(items) {
    const c = document.getElementById('experience-container');
    if (!c) return;
    c.innerHTML = items.map(item => `
        <div class="glass-card">
            <h3 class="project-title">${escapeHtml(item.title)}</h3>
            ${makeExpandable(item.desc || '', item.id, 'exp')}
            <span class="media-meta">${escapeHtml(item.meta || '')}</span>
        </div>`).join('');
}

function renderEducation(items) {
    const c = document.getElementById('education-container');
    if (!c) return;
    c.innerHTML = items.map(item => `
        <li>
            <span class="media-title" style="font-size:1.3rem;border:none;line-height:1.2;">${escapeHtml(item.title)}</span>
            <span class="media-meta" style="margin-top:0.3rem;text-transform:none;font-size:0.85rem;letter-spacing:0;">${escapeHtml(item.meta || '')}</span>
        </li>`).join('');
}

function renderCertifications(items) {
    const c = document.getElementById('certifications-container');
    if (!c) return;
    c.innerHTML = items.map(item => `
        <li>
            <span class="media-title" style="font-size:1.1rem;border:none;">
                ${item.link ? `<a href="${item.link}" target="_blank" rel="noopener" style="color:inherit;">${escapeHtml(item.title)}</a>` : escapeHtml(item.title)}
            </span>
            <span class="media-meta" style="text-transform:none;font-size:0.85rem;letter-spacing:0;">${escapeHtml(item.meta || '')}</span>
        </li>`).join('');
}

function renderGallery(items) {
    if (items) currentGalleryItems = items;
    const c   = document.getElementById('gallery-container');
    const btn = document.getElementById('show-more-gallery-btn');
    if (!c) return;
    c.innerHTML = currentGalleryItems.map((item, i) => `
        <div class="gallery-item${i >= GALLERY_LIMIT && !galleryShowingAll ? ' hidden-item' : ''}" onclick="openLightbox('${item.url.replace(/'/g, "\\'")}')"
             role="button" tabindex="0" aria-label="View ${escapeHtml(item.title || 'photo')} full screen">
            <img src="${item.url}" alt="${escapeHtml(item.alt || item.title || '')}" loading="lazy">
            <div class="ig-overlay">${escapeHtml(item.title || '')}</div>
        </div>`).join('');
    if (btn) {
        btn.style.display = currentGalleryItems.length > GALLERY_LIMIT ? 'inline-flex' : 'none';
        if (btn.style.display !== 'none')
            btn.textContent = galleryShowingAll ? 'View Less' : `View All Frames (${currentGalleryItems.length})`;
    }
}

// ── Lightbox ─────────────────────────────────────────────────────────────────
function openLightbox(src) {
    let lb = document.getElementById('photo-lightbox');
    if (!lb) {
        lb = document.createElement('div');
        lb.id = 'photo-lightbox';
        lb.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.95);display:flex;align-items:center;justify-content:center;cursor:zoom-out;opacity:0;transition:opacity 0.3s ease;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);';
        lb.innerHTML = '<img style="max-width:92vw;max-height:92vh;object-fit:contain;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.8);" alt="Fullscreen photo">';
        lb.addEventListener('click', () => {
            lb.style.opacity = '0';
            setTimeout(() => lb.style.display = 'none', 300);
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && lb.style.display === 'flex') {
                lb.style.opacity = '0';
                setTimeout(() => lb.style.display = 'none', 300);
            }
        });
        document.body.appendChild(lb);
    }
    lb.querySelector('img').src = src;
    lb.style.display = 'flex';
    requestAnimationFrame(() => lb.style.opacity = '1');
}
window.openLightbox = openLightbox; // expose for inline onclick

function renderPoetry(items) {
    if (items) currentPoetryItems = items;
    const c   = document.getElementById('poetry-container');
    const btn = document.getElementById('show-more-poetry-btn');
    if (!c) return;
    c.innerHTML = currentPoetryItems.map((item, i) => `
        <li class="${i >= POETRY_LIMIT && !poetryShowingAll ? 'hidden-item' : ''}">
            <span class="media-title">${escapeHtml(item.title)}</span>
            <span class="media-meta" style="margin-bottom:1rem;">${escapeHtml(item.type || '')}</span>
            ${makeExpandable(item.content || '', item.id, 'poem', 250)}
            ${item.link ? `<a href="${item.link}" target="_blank" rel="noopener" class="project-link" style="margin-top:1rem;">Read on Rekhta</a>` : ''}
        </li>`).join('');
    if (btn) {
        btn.style.display = currentPoetryItems.length > POETRY_LIMIT ? 'inline-flex' : 'none';
        if (btn.style.display !== 'none')
            btn.textContent = poetryShowingAll ? 'View Less' : `View All Poetry (${currentPoetryItems.length})`;
    }
}

function renderArticles(items) {
    if (items) currentArticlesItems = items;
    const c   = document.getElementById('articles-container');
    const btn = document.getElementById('show-more-articles-btn');
    if (!c) return;
    c.innerHTML = currentArticlesItems.map((item, i) => `
        <li class="${i >= ARTICLES_LIMIT && !articlesShowingAll ? 'hidden-item' : ''}">
            <a href="${item.link || '#'}" target="_blank" rel="noopener" class="media-title" style="border:none">${escapeHtml(item.title)}</a>
            <span class="media-meta">${escapeHtml(item.meta || '')}</span>
            ${item.note ? `<span class="media-note" style="font-size:0.8rem;color:var(--text-muted);margin-top:0.2rem;">${escapeHtml(item.note)}</span>` : ''}
        </li>`).join('');
    if (btn) {
        btn.style.display = currentArticlesItems.length > ARTICLES_LIMIT ? 'inline-flex' : 'none';
        if (btn.style.display !== 'none')
            btn.textContent = articlesShowingAll ? 'View Less' : `View All Reads (${currentArticlesItems.length})`;
    }
}

function renderVideos(items) {
    if (items) currentVideosItems = items;
    const c   = document.getElementById('videos-container');
    const btn = document.getElementById('show-more-videos-btn');
    if (!c) return;
    c.innerHTML = currentVideosItems.map((item, i) => {
        let thumbHtml = '';
        if (item.link?.includes('spotify.com/embed')) {
            thumbHtml = `<div style="width:100%;margin-bottom:0.8rem;border-radius:8px;overflow:hidden;">
                <iframe src="${item.link}" width="100%" height="152" frameborder="0"
                    allow="autoplay;clipboard-write;encrypted-media;fullscreen;picture-in-picture"
                    loading="lazy"></iframe></div>`;
        } else if (item.thumbnail && item.thumbnail !== item.link) {
            thumbHtml = `<div style="width:100%;aspect-ratio:16/9;margin-bottom:0.8rem;border-radius:8px;overflow:hidden;background:#111;">
                <img src="${item.thumbnail}" style="width:100%;height:100%;object-fit:cover;"
                    loading="lazy" onerror="this.parentElement.style.display='none'"></div>`;
        }
        return `<li class="${i >= VIDEOS_LIMIT && !videosShowingAll ? 'hidden-item' : ''}">
            ${thumbHtml}
            <a href="${item.link || '#'}" target="_blank" rel="noopener" class="media-title" style="border:none">${escapeHtml(item.title)}</a>
            <span class="media-meta">${escapeHtml(item.meta || '')}</span>
        </li>`;
    }).join('');
    if (btn) {
        btn.style.display = currentVideosItems.length > VIDEOS_LIMIT ? 'inline-flex' : 'none';
        if (btn.style.display !== 'none')
            btn.textContent = videosShowingAll ? 'View Less' : `View All Watchlist (${currentVideosItems.length})`;
    }
}

function renderPlaylists(items) {
    const c = document.getElementById('playlists-container');
    if (!c) return;
    if (!items || items.length === 0) {
        c.innerHTML = '<li style="color:var(--text-muted);font-size:0.9rem;padding:1rem 0;">No playlists added yet.</li>';
        return;
    }
    c.innerHTML = items.map(item => {
        if (item.link?.includes('spotify.com/embed')) {
            return `<li style="padding:1.2rem 0;">
                <span class="media-title" style="font-size:1.1rem;display:block;margin-bottom:0.8rem;">${escapeHtml(item.title)}</span>
                <iframe src="${item.link}" width="100%" height="80" frameborder="0"
                    allow="autoplay;clipboard-write;encrypted-media;fullscreen;picture-in-picture"
                    loading="lazy" style="border-radius:8px;"></iframe>
            </li>`;
        }
        return `<li>
            <a href="${item.link || '#'}" target="_blank" rel="noopener" class="media-title" style="border:none">${escapeHtml(item.title)}</a>
            <span class="media-meta">Spotify Playlist</span>
        </li>`;
    }).join('');
}

function applyQuote(displayEl, authorEl, quote) {
    if (!displayEl || !quote) return;
    displayEl.classList.add('fading');
    if (authorEl) authorEl.classList.add('fading');
    setTimeout(() => {
        displayEl.textContent = `"${quote.text}"`;
        if (authorEl) authorEl.textContent = `- ${quote.author}`;
        displayEl.classList.remove('fading');
        if (authorEl) authorEl.classList.remove('fading');
    }, 520);
}

let _quoteRotationStarted = false;
function renderQuotes() {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];

    if (techQuotes.length) {
        const q = pick(techQuotes);
        const d = document.getElementById('tech-quote-display');
        const a = document.getElementById('tech-quote-author');
        if (d) d.textContent = `"${q.text}"`;
        if (a) a.textContent = `- ${q.author}`;
    }
    if (creativeQuotes.length) {
        const q = pick(creativeQuotes);
        const d = document.getElementById('creative-quote-display');
        const a = document.getElementById('creative-quote-author');
        if (d) d.textContent = `"${q.text}"`;
        if (a) a.textContent = `- ${q.author}`;
    }

    // Start auto-rotation once quotes are ready (idempotent)
    if (!_quoteRotationStarted && (techQuotes.length || creativeQuotes.length)) {
        _quoteRotationStarted = true;
        setInterval(() => {
            const pick2 = arr => arr[Math.floor(Math.random() * arr.length)];
            if (techQuotes.length)
                applyQuote(
                    document.getElementById('tech-quote-display'),
                    document.getElementById('tech-quote-author'),
                    pick2(techQuotes)
                );
            if (creativeQuotes.length)
                applyQuote(
                    document.getElementById('creative-quote-display'),
                    document.getElementById('creative-quote-author'),
                    pick2(creativeQuotes)
                );
        }, 9000);
    }
}

function renderSkills(items) {
    const c = document.getElementById('skills-container');
    if (!c) return;
    const list = (items && items.length) ? items : defaultSkills;
    c.innerHTML = list.map(s => `<div class="skill-tag">${escapeHtml(s.name)}</div>`).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// SHOW MORE BUTTONS
// ─────────────────────────────────────────────────────────────────────────────
function initShowMoreButtons() {
    document.getElementById('show-more-gallery-btn')?.addEventListener('click', () => {
        galleryShowingAll = !galleryShowingAll; renderGallery();
    });
    document.getElementById('show-more-poetry-btn')?.addEventListener('click', () => {
        poetryShowingAll = !poetryShowingAll; renderPoetry();
    });
    document.getElementById('show-more-articles-btn')?.addEventListener('click', () => {
        articlesShowingAll = !articlesShowingAll; renderArticles();
    });
    document.getElementById('show-more-videos-btn')?.addEventListener('click', () => {
        videosShowingAll = !videosShowingAll; renderVideos();
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// ALTER EGO TOGGLE
// ─────────────────────────────────────────────────────────────────────────────
function initAlterEgoToggle() {
    const toggleBtn     = document.getElementById('alter-ego-toggle');
    const techContent   = document.getElementById('tech-content');
    const creaContent   = document.getElementById('creative-content');
    const techHero      = document.getElementById('tech-hero-section');
    const creaHero      = document.getElementById('creative-hero-section');
    const bgTech        = document.getElementById('bg-tech');
    const bgCreative    = document.getElementById('bg-creative');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
        const isTech = !document.body.classList.contains('creative-mode');

        if (isTech) {
            if (techContent) techContent.style.opacity = '0';
            if (techHero)    techHero.style.opacity    = '0';
            if (bgTech)      bgTech.style.opacity      = '0';
        } else {
            if (creaContent) creaContent.style.opacity = '0';
            if (creaHero)    creaHero.style.opacity    = '0';
            if (bgCreative)  bgCreative.style.opacity  = '0';
        }

        setTimeout(() => {
            document.body.classList.toggle('creative-mode');
            techContent?.classList.toggle('hidden');
            creaContent?.classList.toggle('hidden');
            techHero?.classList.toggle('hidden');
            creaHero?.classList.toggle('hidden');

            setTimeout(() => {
                if (isTech) {
                    if (creaContent) creaContent.style.opacity = '1';
                    if (creaHero)    creaHero.style.opacity    = '1';
                    if (bgCreative)  bgCreative.style.opacity  = '0.7';
                } else {
                    if (techContent) techContent.style.opacity = '1';
                    if (techHero)    techHero.style.opacity    = '1';
                    if (bgTech)      bgTech.style.opacity      = '0.7';
                }
                // Update toggle button label
                const label = document.getElementById('toggle-label');
                if (label) label.textContent = isTech ? 'TECH' : 'CREATIVE';
            }, 50);
        }, 400);
    });

    const creaShowBtn = document.getElementById('crea-show-more-btn');
    if (creaShowBtn) {
        creaShowBtn.addEventListener('click', () => {
            const els    = document.querySelectorAll('.crea-more-txt');
            const hidden = els[0]?.style.display === 'none';
            els.forEach(el => el.style.display = hidden ? 'block' : 'none');
            creaShowBtn.textContent = hidden ? 'Show Less' : 'Show More';
        });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CANVAS: FALLING PARTICLES (Tech hero)
// ─────────────────────────────────────────────────────────────────────────────
function initTechCanvas() {
    const canvas = document.getElementById('falling-pattern-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height, particles = [];
    let animFrameId = null;

    function resize() {
        width  = canvas.parentElement.clientWidth;
        height = canvas.parentElement.clientHeight;
        const dpr = window.devicePixelRatio || 1;
        // Cancel any running frame before resetting the canvas context
        if (animFrameId) cancelAnimationFrame(animFrameId);
        canvas.width  = width  * dpr;
        canvas.height = height * dpr;
        canvas.style.width  = width  + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);
        const n = Math.min(150, Math.floor((width * height) / 10000));
        particles = Array.from({ length: n }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 2 + 1.5,
            speed:  Math.random() * 1.5 + 0.5
        }));
        animate(); // restart a single loop
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#00e1ff';
        particles.forEach(p => {
            p.y += p.speed;
            if (p.y > height + 10) { p.y = -10; p.x = Math.random() * width; }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        animFrameId = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
}

// ─────────────────────────────────────────────────────────────────────────────
// CANVAS: ENTROPY (Creative hero)
// ─────────────────────────────────────────────────────────────────────────────
function initEntropyCanvas() {
    const canvas = document.getElementById('entropy-canvas');
    if (!canvas) return;
    const ctx  = canvas.getContext('2d');
    const SIZE = 400;
    const COL  = '#ffffff';
    let time = 0, particles = [];

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = SIZE * dpr;
    canvas.height = SIZE * dpr;
    // CSS (width:100%; height:100%) handles responsive display sizing
    ctx.scale(dpr, dpr);

    class Particle {
        constructor(x, y, ordered) {
            this.x = this.ox = x;
            this.y = this.oy = y;
            this.ordered   = ordered;
            this.size      = 2;
            this.vel       = { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 };
            this.influence = 0;
            this.neighbors = [];
        }
        update() {
            if (this.ordered) {
                const ci = { x: 0, y: 0 };
                this.neighbors.forEach(n => {
                    if (!n.ordered) {
                        const d = Math.hypot(this.x - n.x, this.y - n.y);
                        const s = Math.max(0, 1 - d / 100);
                        ci.x += n.vel.x * s;
                        ci.y += n.vel.y * s;
                        this.influence = Math.max(this.influence, s);
                    }
                });
                const f = 1 - this.influence;
                this.x += (this.ox - this.x) * 0.05 * f + ci.x * this.influence;
                this.y += (this.oy - this.y) * 0.05 * f + ci.y * this.influence;
                this.influence *= 0.99;
            } else {
                this.vel.x += (Math.random() - 0.5) * 0.5;
                this.vel.y += (Math.random() - 0.5) * 0.5;
                this.vel.x *= 0.95; this.vel.y *= 0.95;
                this.x += this.vel.x; this.y += this.vel.y;
                if (this.x < SIZE/2 || this.x > SIZE) this.vel.x *= -1;
                if (this.y < 0     || this.y > SIZE)  this.vel.y *= -1;
                this.x = Math.max(SIZE/2, Math.min(SIZE, this.x));
                this.y = Math.max(0,      Math.min(SIZE, this.y));
            }
        }
        draw() {
            const a = this.ordered ? 0.8 - this.influence * 0.5 : 0.8;
            ctx.fillStyle = COL + Math.round(a * 255).toString(16).padStart(2, '0');
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const gs = 25, sp = SIZE / gs;
    for (let i = 0; i < gs; i++)
        for (let j = 0; j < gs; j++)
            particles.push(new Particle(sp*i + sp/2, sp*j + sp/2, sp*i + sp/2 < SIZE/2));

    function updateNeighbors() {
        particles.forEach(p => {
            p.neighbors = particles.filter(o => o !== p && Math.hypot(p.x - o.x, p.y - o.y) < 100);
        });
    }

    function animate() {
        ctx.clearRect(0, 0, SIZE, SIZE);
        if (time % 30 === 0) updateNeighbors();
        particles.forEach(p => {
            p.update(); p.draw();
            p.neighbors.forEach(n => {
                const d = Math.hypot(p.x - n.x, p.y - n.y);
                if (d < 50) {
                    ctx.strokeStyle = COL + Math.round(0.2 * (1 - d/50) * 255).toString(16).padStart(2,'0');
                    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(n.x, n.y); ctx.stroke();
                }
            });
        });
        ctx.strokeStyle = COL + '4D';
        ctx.lineWidth   = 0.5;
        ctx.beginPath(); ctx.moveTo(SIZE/2, 0); ctx.lineTo(SIZE/2, SIZE); ctx.stroke();
        time++;
        requestAnimationFrame(animate);
    }
    animate();
}

// ─────────────────────────────────────────────────────────────────────────────
// DINO GAME
// ─────────────────────────────────────────────────────────────────────────────
function initDinoGame() {
    const canvas       = document.getElementById('dino-game');
    const startBtn     = document.getElementById('dino-start-btn');
    const overlay      = document.getElementById('dino-overlay');
    const scoreDisplay = document.getElementById('dino-score-display');
    if (!canvas) return;

    const ctx      = canvas.getContext('2d');
    const groundY  = 320;
    let dinoY, dinoVel, obstacles, score, frameCount, gameSpeed, isOver, rafId;

    function start() {
        dinoY = groundY; dinoVel = 0; obstacles = [];
        score = 0; frameCount = 0; gameSpeed = 6; isOver = false;
        scoreDisplay.textContent = 'Score: 000';
        overlay.style.display = 'none';
        if (rafId) cancelAnimationFrame(rafId);
        loop();
    }

    function loop() {
        if (isOver) {
            overlay.style.display = 'flex';
            scoreDisplay.textContent = `System Halted. Score: ${Math.floor(score)}`;
            startBtn.textContent = 'Reboot Sequence';
            rafId = null;
            return;
        }
        update(); draw();
        rafId = requestAnimationFrame(loop);
    }

    function update() {
        frameCount++; score += 0.1;
        if (frameCount % 600 === 0) gameSpeed += 0.5;
        dinoVel += 0.6; dinoY += dinoVel;
        if (dinoY >= groundY) { dinoY = groundY; dinoVel = 0; }

        if (frameCount % Math.max(40, Math.floor(100 - gameSpeed * 2)) === 0) {
            let w = 15 + Math.random() * 15, h = 30 + Math.random() * 30;
            let y = groundY + 20 - h;
            if (Math.random() > 0.85) { y = groundY - 40 - Math.random()*30; h = 15; w = 30; }
            obstacles.push({ x: canvas.width, y, w, h });
        }
        obstacles.forEach(o => o.x -= gameSpeed);
        obstacles = obstacles.filter(o => o.x + o.w > 0);

        const hx = 90, hw = 30, hy = dinoY - 20, hh = 35;
        if (obstacles.some(o => hx < o.x+o.w && hx+hw > o.x && hy < o.y+o.h && hy+hh > o.y)) isOver = true;
    }

    function draw() {
        ctx.fillStyle = '#010101';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(41,151,255,0.05)'; ctx.lineWidth = 1; ctx.beginPath();
        const off = -(frameCount * gameSpeed) % 40;
        for (let i = off; i <= canvas.width; i += 40) { ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); }
        for (let i = 0; i <= canvas.height; i += 40) { ctx.moveTo(0,i); ctx.lineTo(canvas.width,i); }
        ctx.stroke();

        ctx.strokeStyle = '#2997ff'; ctx.lineWidth = 2;
        ctx.shadowBlur = 10; ctx.shadowColor = '#2997ff';
        ctx.beginPath(); ctx.moveTo(0, groundY+20); ctx.lineTo(canvas.width, groundY+20); ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.font = `bold 80px var(--font-body)`;
        ctx.fillText(Math.floor(score).toString().padStart(3,'0'), canvas.width - 200, 100);

        obstacles.forEach(o => {
            ctx.fillStyle = 'rgba(255,51,51,0.2)'; ctx.strokeStyle = '#ff3333';
            ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = '#ff3333';
            ctx.fillRect(o.x,o.y,o.w,o.h); ctx.strokeRect(o.x,o.y,o.w,o.h);
            ctx.beginPath(); ctx.moveTo(o.x,o.y+o.h/2); ctx.lineTo(o.x+o.w,o.y+o.h/2); ctx.stroke();
            ctx.shadowBlur = 0;
        });

        ctx.save(); ctx.translate(100, dinoY);
        ctx.shadowBlur = 15; ctx.shadowColor = '#E5A93C'; ctx.fillStyle = '#E5A93C';
        ctx.fillRect(4,-26,18,14); ctx.fillRect(22,-26,10,8); ctx.fillRect(22,-14,8,4);
        ctx.fillStyle = '#010101'; ctx.shadowBlur = 0; ctx.fillRect(10,-22,4,4);
        ctx.fillStyle = '#E5A93C'; ctx.shadowBlur = 15;
        ctx.fillRect(-6,-12,16,22); ctx.fillRect(-12,-6,6,14);
        ctx.fillRect(-18,-10,6,10); ctx.fillRect(-24,-14,6,8); ctx.fillRect(10,-4,8,4); ctx.fillRect(14,0,4,4);
        const frame = dinoY === groundY ? Math.floor(frameCount/6)%2 : 0;
        if (dinoY !== groundY) { ctx.fillRect(-6,10,6,6); ctx.fillRect(4,10,6,6); }
        else if (frame === 0)  { ctx.fillRect(-6,10,6,10); ctx.fillRect(-2,16,4,4); ctx.fillRect(4,10,6,4); }
        else                   { ctx.fillRect(-6,10,6,4);  ctx.fillRect(4,10,6,10); ctx.fillRect(8,16,4,4); }
        ctx.restore();
    }

    function jump() {
        if (overlay.style.display !== 'none') return;
        if (dinoY >= groundY) dinoVel = -11.5;
    }

    startBtn?.addEventListener('click', start);
    document.addEventListener('keydown', e => {
        if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); }
    });
    canvas.addEventListener('mousedown', jump);
    canvas.addEventListener('touchstart', e => {
        if (e.target === canvas) { e.preventDefault(); jump(); }
    }, { passive: false });
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─────────────────────────────────────────────────────────────────────────────
// COPY EMAIL
// ─────────────────────────────────────────────────────────────────────────────
document.getElementById('copy-email-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('copy-email-btn');
    try {
        await navigator.clipboard.writeText('shayanazmi2006@gmail.com');
        btn.classList.add('copied');
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
        }, 2000);
    } catch (e) {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = 'shayanazmi2006@gmail.com';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    }
});