import { checkAuthState } from './features/authentication/index.js';
import { initGallery } from './features/gallery/index.js';
import { initResumeSection } from './features/portfolio-resume/index.js';
import { initContactForm } from './features/contact/index.js';
import { initCMSDashboard } from './features/cms-admin/index.js';
import { initDebugOverlay } from './shared/ui/debug-overlay.js';
import { DebugLogger } from './shared/utils/logger.js';

// ─── Scroll Reveal Observer ──────────────────────────────────────────────────
let globalObserver = null;
function initScrollReveal() {
    globalObserver = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (e.isIntersecting) {
                e.target.classList.add('active');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal-up').forEach((el) => globalObserver.observe(el));
}

// ─── Alter Ego Mode Switcher ─────────────────────────────────────────────────
function initAlterEgoToggle() {
    const toggleBtn   = document.getElementById('alter-ego-toggle');
    const techContent = document.getElementById('tech-content');
    const creaContent = document.getElementById('creative-content');
    const techHero    = document.getElementById('tech-hero-section');
    const creaHero    = document.getElementById('creative-hero-section');
    const bgTech      = document.getElementById('bg-tech');
    const bgCreative  = document.getElementById('bg-creative');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
        const isTech = !document.body.classList.contains('creative-mode');

        if (isTech) {
            if (techContent) techContent.style.opacity = '0';
            if (techHero)    techHero.style.opacity    = '0';
            if (bgTech)      bgTech.style.opacity      = '0';
            if (window._pauseTechCanvas) window._pauseTechCanvas();
            if (window._resumeEntropyCanvas) window._resumeEntropyCanvas();
        } else {
            if (creaContent) creaContent.style.opacity = '0';
            if (creaHero)    creaHero.style.opacity    = '0';
            if (bgCreative)  bgCreative.style.opacity  = '0';
            if (window._pauseEntropyCanvas) window._pauseEntropyCanvas();
            if (window._resumeTechCanvas) window._resumeTechCanvas();
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
                const label = document.getElementById('toggle-label');
                if (label) label.textContent = isTech ? 'TECH' : 'CREATIVE';
                if (globalObserver) {
                    document.querySelectorAll('.reveal-up').forEach((el) => globalObserver.observe(el));
                }
            }, 50);
        }, 400);
    });

    const creaShowBtn = document.getElementById('crea-show-more-btn');
    if (creaShowBtn) {
        creaShowBtn.addEventListener('click', () => {
            const els = document.querySelectorAll('.crea-more-txt');
            const hidden = els[0]?.style.display === 'none';
            els.forEach((el) => (el.style.display = hidden ? 'block' : 'none'));
            creaShowBtn.textContent = hidden ? 'Show Less' : 'Show More';
        });
    }
}

// ─── Tech Falling Pattern Canvas ─────────────────────────────────────────────
function initTechCanvas() {
    const canvas = document.getElementById('falling-pattern-canvas');
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let width, height, particles = [];
    let animFrameId = null;
    let isRunning = true;

    function resize() {
        if (!canvas.parentElement) return;
        width = canvas.parentElement.clientWidth;
        height = canvas.parentElement.clientHeight;
        const dpr = window.devicePixelRatio || 1;
        if (animFrameId) cancelAnimationFrame(animFrameId);
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);
        const n = Math.min(150, Math.floor((width * height) / 10000));
        particles = Array.from({ length: n }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 2 + 1.5,
            speed: Math.random() * 1.5 + 0.5
        }));
        if (isRunning) animate();
    }

    function animate() {
        if (!isRunning) return;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#00e1ff';
        particles.forEach((p) => {
            p.y += p.speed;
            if (p.y > height + 10) { p.y = -10; p.x = Math.random() * width; }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        animFrameId = requestAnimationFrame(animate);
    }

    window._pauseTechCanvas = () => {
        isRunning = false;
        if (animFrameId) cancelAnimationFrame(animFrameId);
    };
    window._resumeTechCanvas = () => {
        if (!isRunning) {
            isRunning = true;
            animate();
        }
    };

    window.addEventListener('resize', resize);
    resize();
}

// ─── Creative Entropy Canvas ──────────────────────────────────────────────────
function initEntropyCanvas() {
    const canvas = document.getElementById('entropy-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const SIZE = 400;
    const COL = '#ffffff';
    let time = 0, particles = [];
    let animFrameId = null;
    let isRunning = false; // Starts paused if not in creative mode

    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.scale(dpr, dpr);

    class Particle {
        constructor(x, y, ordered) {
            this.x = this.ox = x;
            this.y = this.oy = y;
            this.ordered = ordered;
            this.size = 2;
            this.vel = { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 };
            this.influence = 0;
            this.neighbors = [];
        }
        update() {
            if (this.ordered) {
                const ci = { x: 0, y: 0 };
                this.neighbors.forEach((n) => {
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
                if (this.x < SIZE / 2 || this.x > SIZE) this.vel.x *= -1;
                if (this.y < 0 || this.y > SIZE) this.vel.y *= -1;
                this.x = Math.max(SIZE / 2, Math.min(SIZE, this.x));
                this.y = Math.max(0, Math.min(SIZE, this.y));
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
    for (let i = 0; i < gs; i++) {
        for (let j = 0; j < gs; j++) {
            particles.push(new Particle(sp * i + sp / 2, sp * j + sp / 2, sp * i + sp / 2 < SIZE / 2));
        }
    }

    function updateNeighbors() {
        particles.forEach((p) => {
            p.neighbors = particles.filter((o) => o !== p && Math.hypot(p.x - o.x, p.y - o.y) < 100);
        });
    }

    function animate() {
        if (!isRunning) return;
        ctx.clearRect(0, 0, SIZE, SIZE);
        if (time % 30 === 0) updateNeighbors();
        particles.forEach((p) => {
            p.update(); p.draw();
            p.neighbors.forEach((n) => {
                const d = Math.hypot(p.x - n.x, p.y - n.y);
                if (d < 50) {
                    ctx.strokeStyle = COL + Math.round(0.2 * (1 - d / 50) * 255).toString(16).padStart(2, '0');
                    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(n.x, n.y); ctx.stroke();
                }
            });
        });
        ctx.strokeStyle = COL + '4D';
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(SIZE / 2, 0); ctx.lineTo(SIZE / 2, SIZE); ctx.stroke();
        time++;
        animFrameId = requestAnimationFrame(animate);
    }

    window._pauseEntropyCanvas = () => {
        isRunning = false;
        if (animFrameId) cancelAnimationFrame(animFrameId);
    };
    window._resumeEntropyCanvas = () => {
        if (!isRunning) {
            isRunning = true;
            animate();
        }
    };
}

// ─── Cyber Dino Runner Game (Authentic Character Drawing) ────────────────────
function initDinoGame() {
    const canvas       = document.getElementById('dino-game');
    const startBtn     = document.getElementById('dino-start-btn');
    const overlay      = document.getElementById('dino-overlay');
    const scoreDisplay = document.getElementById('dino-score-display');
    if (!canvas) return;

    const ctx      = canvas.getContext('2d');
    const groundY  = 320;
    let dinoY, dinoVel, obstacles, score, frameCount, gameSpeed, isOver, rafId;

    function jump() {
        if (dinoY === groundY && !isOver) dinoVel = -12;
    }

    window.addEventListener('keydown', (e) => {
        if (['Space', 'ArrowUp'].includes(e.code)) {
            jump();
        }
    });

    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); jump(); });
    canvas.addEventListener('click', jump);
    startBtn?.addEventListener('click', () => start());

    function start() {
        dinoY = groundY; dinoVel = 0; obstacles = [];
        score = 0; frameCount = 0; gameSpeed = 6; isOver = false;
        if (scoreDisplay) scoreDisplay.textContent = 'Score: 000';
        if (overlay) overlay.style.display = 'none';
        if (rafId) cancelAnimationFrame(rafId);
        loop();
    }

    function loop() {
        if (isOver) {
            if (overlay) overlay.style.display = 'flex';
            if (scoreDisplay) scoreDisplay.textContent = `System Halted. Score: ${Math.floor(score)}`;
            if (startBtn) startBtn.textContent = 'Reboot Sequence';
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
            if (Math.random() > 0.85) { y = groundY - 40 - Math.random() * 30; h = 15; w = 30; }
            obstacles.push({ x: canvas.width, y, w, h });
        }
        obstacles.forEach((o) => o.x -= gameSpeed);
        obstacles = obstacles.filter((o) => o.x + o.w > 0);

        const hx = 90, hw = 30, hy = dinoY - 20, hh = 35;
        if (obstacles.some((o) => hx < o.x + o.w && hx + hw > o.x && hy < o.y + o.h && hy + hh > o.y)) {
            isOver = true;
        }
    }

    function draw() {
        ctx.fillStyle = '#010101';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Cyber Grid Lines
        ctx.strokeStyle = 'rgba(41,151,255,0.05)'; ctx.lineWidth = 1; ctx.beginPath();
        const off = -(frameCount * gameSpeed) % 40;
        for (let i = off; i <= canvas.width; i += 40) { ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); }
        for (let i = 0; i <= canvas.height; i += 40) { ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); }
        ctx.stroke();

        // Neon Cyan Ground Line
        ctx.strokeStyle = '#2997ff'; ctx.lineWidth = 2;
        ctx.shadowBlur = 10; ctx.shadowColor = '#2997ff';
        ctx.beginPath(); ctx.moveTo(0, groundY + 20); ctx.lineTo(canvas.width, groundY + 20); ctx.stroke();
        ctx.shadowBlur = 0;

        // Big Background Score
        ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.font = `bold 80px sans-serif`;
        ctx.fillText(Math.floor(score).toString().padStart(3, '0'), canvas.width - 200, 100);

        // Red Glowing Obstacles
        obstacles.forEach((o) => {
            ctx.fillStyle = 'rgba(255,51,51,0.2)'; ctx.strokeStyle = '#ff3333';
            ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = '#ff3333';
            ctx.fillRect(o.x, o.y, o.w, o.h); ctx.strokeRect(o.x, o.y, o.w, o.h);
            ctx.beginPath(); ctx.moveTo(o.x, o.y + o.h / 2); ctx.lineTo(o.x + o.w, o.y + o.h / 2); ctx.stroke();
            ctx.shadowBlur = 0;
        });

        // Golden Pixelated Dino Character with Running Animation
        ctx.save(); ctx.translate(100, dinoY);
        ctx.shadowBlur = 15; ctx.shadowColor = '#E5A93C'; ctx.fillStyle = '#E5A93C';
        ctx.fillRect(4, -26, 18, 14); ctx.fillRect(22, -26, 10, 8); ctx.fillRect(22, -14, 8, 4);
        ctx.fillStyle = '#010101'; ctx.shadowBlur = 0; ctx.fillRect(10, -22, 4, 4);
        ctx.fillStyle = '#E5A93C'; ctx.shadowBlur = 15;
        ctx.fillRect(-6, -12, 16, 22); ctx.fillRect(-12, -6, 6, 14);
        ctx.fillRect(-18, -10, 6, 10); ctx.fillRect(-24, -14, 6, 8); ctx.fillRect(10, -4, 8, 4); ctx.fillRect(14, 0, 4, 4);
        const frame = dinoY === groundY ? Math.floor(frameCount / 6) % 2 : 0;
        if (dinoY !== groundY) { ctx.fillRect(-6, 10, 6, 6); ctx.fillRect(4, 10, 6, 6); }
        else if (frame === 0)  { ctx.fillRect(-6, 10, 6, 10); ctx.fillRect(-2, 16, 4, 4); ctx.fillRect(4, 10, 6, 4); }
        else                   { ctx.fillRect(-6, 10, 6, 4);  ctx.fillRect(4, 10, 6, 10); ctx.fillRect(8, 16, 4, 4); }
        ctx.restore();
    }
}

function loadCachedSpotify() {
    const cachedUrl = localStorage.getItem('spotify_embed_url');
    const iframe = document.getElementById('spotify-player-iframe');
    if (cachedUrl && iframe) {
        iframe.src = cachedUrl;
    }
}

// Defensive Feature Orchestrator
async function initApp() {
    DebugLogger.trackInit('App', 'PENDING');
    initDebugOverlay();

    const inits = [
        ['ScrollReveal',  () => initScrollReveal()],
        ['AlterEgo',      () => initAlterEgoToggle()],
        ['TechCanvas',    () => initTechCanvas()],
        ['EntropyCanvas', () => initEntropyCanvas()],
        ['DinoGame',      () => initDinoGame()],
        ['Spotify',       () => loadCachedSpotify()],
        ['Auth',          () => checkAuthState()],
        ['Gallery',       () => initGallery()],
        ['Resume',        () => initResumeSection()],
        ['Contact',       () => initContactForm()],
        ['CMS',           () => initCMSDashboard()],
    ];

    for (const [name, fn] of inits) {
        try {
            await fn();
        } catch (e) {
            DebugLogger.recordError('Module Init Warning', `[app] ${name} init failed: ${e.message}`, null, null, e);
        }
    }

    DebugLogger.trackInit('App', 'OK');
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
}
