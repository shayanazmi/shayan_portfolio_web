import { escapeHtml } from '../../shared/utils/escape.js';

let _quoteRotationStarted = false;
let techQuotes = [];
let creativeQuotes = [];
let currentTechQuoteIdx = 0;
let currentCreativeQuoteIdx = 0;

export function makeExpandable(text, id, prefix, limit = 150) {
    if (!text) return '';
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

let _activeProjectTag = null;
let _allProjectsCache = [];

export function renderProjects(items) {
    if (items) _allProjectsCache = items;
    const c = document.getElementById('projects-container');
    if (!c) return;

    const sectionEl = c.closest('section');

    if (!_allProjectsCache.length) {
        if (sectionEl) sectionEl.style.display = 'none';
        c.innerHTML = '';
        return;
    } else {
        if (sectionEl) sectionEl.style.display = 'block';
    }

    const filtered = _activeProjectTag 
        ? _allProjectsCache.filter(p => {
            const tagStr = Array.isArray(p.tags) ? p.tags.join(',') : (p.tags || '');
            return tagStr.toLowerCase().includes(_activeProjectTag.toLowerCase());
        })
        : _allProjectsCache;

    const filterHeader = _activeProjectTag 
        ? `<div style="grid-column:1/-1;margin-bottom:1rem;display:flex;align-items:center;gap:0.8rem;">
            <span style="color:var(--text-muted);font-size:0.85rem;">Filtered by tag: <strong style="color:var(--accent);">${escapeHtml(_activeProjectTag)}</strong></span>
            <button onclick="window.filterProjectsByTag(null)" class="show-more-toggle" style="margin:0;padding:2px 8px;font-size:0.75rem;">Clear Filter</button>
           </div>`
        : '';

    c.innerHTML = filterHeader + filtered.map(item => `
        <article class="project-card">
            <h3 class="project-title">${escapeHtml(item.title || '')}</h3>
            ${makeExpandable(item.desc || '', item.id, 'proj')}
            ${item.tags ? `<div class="proj-tags">${(Array.isArray(item.tags) ? item.tags.join(',') : item.tags).split(',').map(t => {
                const cleanTag = t.trim();
                const isSelected = _activeProjectTag && _activeProjectTag.toLowerCase() === cleanTag.toLowerCase();
                return `<span class="proj-tag ${isSelected ? 'active-tag' : ''}" style="cursor:pointer;" onclick="window.filterProjectsByTag('${escapeHtml(cleanTag).replace(/'/g, "\\'")}')">${escapeHtml(cleanTag)}</span>`;
            }).join('')}</div>` : ''}
            <a href="${item.link || '#'}" target="_blank" rel="noopener" class="project-link" style="margin-top:1rem;">View Repository</a>
        </article>`).join('');
}

if (typeof window !== 'undefined') {
    window.filterProjectsByTag = (tag) => {
        _activeProjectTag = (_activeProjectTag === tag) ? null : tag;
        renderProjects();
    };
}

export function renderExperience(items) {
    const c = document.getElementById('experience-container');
    if (!c) return;
    const sec = c.closest('section');
    if (!items || !items.length) {
        if (sec) sec.style.display = 'none';
        c.innerHTML = '';
        return;
    }
    if (sec) sec.style.display = 'block';

    c.innerHTML = items.map(item => `
        <div class="glass-card">
            <h3 class="project-title">${escapeHtml(item.role || item.title || '')} ${item.company ? `<span style="color:var(--accent); font-size:1.1rem;">@ ${escapeHtml(item.company)}</span>` : ''}</h3>
            ${makeExpandable(item.desc || '', item.id, 'exp')}
            <span class="media-meta">${escapeHtml(item.period || item.meta || '')}</span>
        </div>`).join('');
}

export function renderEducation(items) {
    const c = document.getElementById('education-container');
    if (!c) return;
    c.innerHTML = items.map(item => `
        <li>
            <span class="media-title" style="font-size:1.3rem;border:none;line-height:1.2;">${escapeHtml(item.degree || item.title || '')}</span>
            <span class="media-meta" style="margin-top:0.3rem;text-transform:none;font-size:0.85rem;letter-spacing:0;">${escapeHtml(item.institution || item.meta || '')} ${item.year ? `· ${escapeHtml(item.year)}` : ''}</span>
        </li>`).join('');
}

export function renderCertifications(items) {
    const c = document.getElementById('certifications-container');
    if (!c) return;
    c.innerHTML = items.map(item => `
        <li>
            <span class="media-title" style="font-size:1.1rem;border:none;">
                ${item.link ? `<a href="${item.link}" target="_blank" rel="noopener" style="color:inherit;">${escapeHtml(item.title)}</a>` : escapeHtml(item.title || '')}
            </span>
            <span class="media-meta" style="text-transform:none;font-size:0.85rem;letter-spacing:0;">${escapeHtml(item.issuer || item.meta || '')}</span>
        </li>`).join('');
}

export function renderSkills(items) {
    const c = document.getElementById('skills-container');
    if (!c) return;
    const sec = c.closest('section');
    if (!items || !items.length) {
        if (sec) sec.style.display = 'none';
        c.innerHTML = '';
        return;
    }
    if (sec) sec.style.display = 'block';

    c.innerHTML = items.map(item => `
        <span class="skill-tag">${escapeHtml(item.name || item.title || '')}</span>
    `).join('');
}

export function renderArticles(items) {
    const c = document.getElementById('articles-container');
    if (!c) return;
    c.innerHTML = items.map(item => `
        <li>
            <a href="${item.link || '#'}" target="_blank" rel="noopener" class="media-title" style="border:none">${escapeHtml(item.title || '')}</a>
            ${item.note ? `<span class="media-meta">${escapeHtml(item.note)}</span>` : ''}
        </li>`).join('');
}

export function renderVideos(items) {
    const c = document.getElementById('videos-container');
    if (!c) return;
    c.innerHTML = items.map(item => `
        <li>
            <a href="${item.link || '#'}" target="_blank" rel="noopener" class="media-title">${escapeHtml(item.title || '')}</a>
        </li>`).join('');
}

export function renderPlaylists(items) {
    const c = document.getElementById('playlists-container');
    if (!c) return;
    c.innerHTML = items.map(item => `
        <div class="playlist-card" style="margin-bottom:10px;">
            <iframe src="${item.link}" width="100%" height="80" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style="border-radius:8px;"></iframe>
        </div>
    `).join('');
}

let _activePoetryLang = 'all';
let _allPoetryCache = [];

export function renderPoetry(items) {
    if (items) _allPoetryCache = items;
    const c = document.getElementById('poetry-container');
    if (!c) return;

    if (!_allPoetryCache.length) {
        c.innerHTML = '<li style="color:var(--text-muted);font-size:0.85rem;padding:0.5rem 0;">No poetry entries published yet.</li>';
        return;
    }

    const filtered = _activePoetryLang === 'all'
        ? _allPoetryCache
        : _allPoetryCache.filter(p => (p.lang || '').toLowerCase() === _activePoetryLang.toLowerCase());

    const navPills = `
        <div style="display:flex;gap:0.5rem;margin-bottom:1rem;flex-wrap:wrap;">
            ${['all', 'ur', 'hi', 'en'].map(lang => {
                const label = lang === 'all' ? 'All' : lang === 'ur' ? 'Urdu' : lang === 'hi' ? 'Hindi' : 'English';
                const active = _activePoetryLang === lang;
                return `<button onclick="window.filterPoetryByLang('${lang}')" class="proj-tag ${active ? 'active-tag' : ''}" style="cursor:pointer;border:1px solid var(--card-border);background:${active ? 'var(--accent)' : 'transparent'};color:${active ? '#000' : 'var(--text-muted)'};padding:3px 10px;font-size:0.75rem;border-radius:12px;">${label}</button>`;
            }).join('')}
        </div>
    `;

    c.innerHTML = navPills + (filtered.length ? filtered.map(item => `
        <li>
            <span class="media-title">${escapeHtml(item.title || '')}</span>
            <span class="media-meta" style="margin-bottom:1rem;">${escapeHtml(item.lang || item.type || '')}</span>
            ${makeExpandable(item.body || item.content || '', item.id, 'poem', 250)}
            ${item.rekhta || item.link ? `<a href="${item.rekhta || item.link}" target="_blank" rel="noopener" class="project-link" style="margin-top:1rem;">Read on Rekhta</a>` : ''}
        </li>`).join('') : '<li style="color:var(--text-muted);font-size:0.85rem;">No poems matching selected language.</li>');
}

if (typeof window !== 'undefined') {
    window.filterPoetryByLang = (lang) => {
        _activePoetryLang = lang;
        renderPoetry();
    };
}

export function renderQuotes(quotesObj) {
    if (quotesObj) {
        if (quotesObj.tech) techQuotes = quotesObj.tech;
        if (quotesObj.creative) creativeQuotes = quotesObj.creative;
    }

    const techQuoteText = document.getElementById('tech-quote-display');
    const techQuoteAuth = document.getElementById('tech-quote-author');
    const creaQuoteText = document.getElementById('creative-quote-display');
    const creaQuoteAuth = document.getElementById('creative-quote-author');

    if (techQuotes.length && techQuoteText) {
        techQuoteText.textContent = `"${techQuotes[0].text}"`;
        if (techQuoteAuth) techQuoteAuth.textContent = techQuotes[0].author ? `— ${techQuotes[0].author}` : '';
    }

    if (creativeQuotes.length && creaQuoteText) {
        creaQuoteText.textContent = `"${creativeQuotes[0].text}"`;
        if (creaQuoteAuth) creaQuoteAuth.textContent = creativeQuotes[0].author ? `— ${creativeQuotes[0].author}` : '';
    }

    if (!_quoteRotationStarted && (techQuotes.length || creativeQuotes.length)) {
        _quoteRotationStarted = true;
        setInterval(() => {
            if (techQuotes.length > 1 && techQuoteText) {
                currentTechQuoteIdx = (currentTechQuoteIdx + 1) % techQuotes.length;
                applyQuote(techQuoteText, techQuoteAuth, techQuotes[currentTechQuoteIdx]);
            }
            if (creativeQuotes.length > 1 && creaQuoteText) {
                currentCreativeQuoteIdx = (currentCreativeQuoteIdx + 1) % creativeQuotes.length;
                applyQuote(creaQuoteText, creaQuoteAuth, creativeQuotes[currentCreativeQuoteIdx]);
            }
        }, 9000);
    }
}

function applyQuote(textEl, authEl, quoteData) {
    if (!textEl) return;
    textEl.style.opacity = '0';
    if (authEl) authEl.style.opacity = '0';

    setTimeout(() => {
        textEl.textContent = `"${quoteData.text}"`;
        if (authEl) authEl.textContent = quoteData.author ? `— ${quoteData.author}` : '';
        textEl.style.opacity = '1';
        if (authEl) authEl.style.opacity = '1';
    }, 500);
}
