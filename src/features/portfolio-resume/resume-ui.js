import { escapeHtml } from '../../shared/utils/escape.js';

const POETRY_LIMIT   = 1;
const ARTICLES_LIMIT = 3;
const VIDEOS_LIMIT   = 5;

let poetryShowingAll   = false;
let articlesShowingAll = false;
let videosShowingAll   = false;

let currentPoetryItems   = [];
let currentArticlesItems = [];
let currentVideosItems   = [];

let techQuotes     = [];
let creativeQuotes = [];
let _quoteRotationStarted = false;

// Shared "read more" expander for long text
export function makeExpandable(text, id, prefix, limit = 150) {
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

export function renderProjects(items) {
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

export function renderExperience(items) {
    const c = document.getElementById('experience-container');
    if (!c) return;
    c.innerHTML = items.map(item => `
        <div class="glass-card">
            <h3 class="project-title">${escapeHtml(item.title)}</h3>
            ${makeExpandable(item.desc || '', item.id, 'exp')}
            <span class="media-meta">${escapeHtml(item.meta || '')}</span>
        </div>`).join('');
}

export function renderEducation(items) {
    const c = document.getElementById('education-container');
    if (!c) return;
    c.innerHTML = items.map(item => `
        <li>
            <span class="media-title" style="font-size:1.3rem;border:none;line-height:1.2;">${escapeHtml(item.title)}</span>
            <span class="media-meta" style="margin-top:0.3rem;text-transform:none;font-size:0.85rem;letter-spacing:0;">${escapeHtml(item.meta || '')}</span>
        </li>`).join('');
}

export function renderCertifications(items) {
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

export function renderPoetry(items) {
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

export function renderArticles(items) {
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

export function renderVideos(items) {
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

export function renderPlaylists(items) {
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

export function renderQuotes(quotesObj) {
    if (quotesObj) {
        techQuotes = quotesObj.tech;
        creativeQuotes = quotesObj.creative;
    }
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

export function renderSkills(items) {
    const c = document.getElementById('skills-container');
    if (!c) return;
    c.innerHTML = items.map(s => `<div class="skill-tag">${escapeHtml(s.name)}</div>`).join('');
}

export function initShowMoreButtons() {
    document.getElementById('show-more-poetry-btn')?.addEventListener('click', () => {
        poetryShowingAll = !poetryShowingAll;
        renderPoetry();
    });
    document.getElementById('show-more-articles-btn')?.addEventListener('click', () => {
        articlesShowingAll = !articlesShowingAll;
        renderArticles();
    });
    document.getElementById('show-more-videos-btn')?.addEventListener('click', () => {
        videosShowingAll = !videosShowingAll;
        renderVideos();
    });
}
