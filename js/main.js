import { db, appId, onSnapshot, collection, doc, dataPath, docPath } from "./firebase-config.js";

// --- INTERSECTION OBSERVER FOR SCROLL ANIMATIONS ---
        document.addEventListener("DOMContentLoaded", () => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if(entry.isIntersecting) {
                        entry.target.classList.add('active');
                    }
                });
            }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

            document.querySelectorAll('.reveal-up').forEach(el => observer.observe(el));
            
            document.getElementById('alter-ego-toggle').addEventListener('click', () => {
                setTimeout(() => {
                    document.querySelectorAll('.reveal-up').forEach(el => observer.observe(el));
                }, 400);
            });
            
            initEntropyCanvas(); 
            initTechCanvas();
        });

        // --- TECH CANVAS LOGIC (Replaces Heavy CSS) ---
        function initTechCanvas() {
            const canvas = document.getElementById('falling-pattern-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            let width, height;
            let particles = [];

            function resize() {
                width = canvas.parentElement.clientWidth;
                height = canvas.parentElement.clientHeight;
                const dpr = window.devicePixelRatio || 1;
                canvas.width = width * dpr;
                canvas.height = height * dpr;
                ctx.scale(dpr, dpr);
                createParticles();
            }

            function createParticles() {
                particles = [];
                // Cap particles dynamically for performance
                const numParticles = Math.min(150, Math.floor((width * height) / 10000));
                for(let i=0; i<numParticles; i++) {
                    particles.push({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        radius: Math.random() * 2 + 1.5,
                        speed: Math.random() * 1.5 + 0.5
                    });
                }
            }

            function animate() {
                ctx.clearRect(0, 0, width, height);
                // Accent color matching the original vibe
                ctx.fillStyle = '#00e1ff';
                
                particles.forEach(p => {
                    p.y += p.speed;
                    if(p.y > height + 10) {
                        p.y = -10;
                        p.x = Math.random() * width;
                    }
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fill();
                });
                
                requestAnimationFrame(animate);
            }

            window.addEventListener('resize', resize);
            resize();
            animate();
        }

        // --- ENTROPY CANVAS LOGIC (Re-Engineered Demo Component) ---
        function initEntropyCanvas() {
            const canvas = document.getElementById('entropy-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            let animationId, time = 0;
            let particles = [];
            
            const size = 400; // Fixed size to exactly match requested React component style
            const particleColor = '#ffffff'; // White theme

            function setup() {
                const dpr = window.devicePixelRatio || 1;
                canvas.width = size * dpr;
                canvas.height = size * dpr;
                canvas.style.width = `${size}px`;
                canvas.style.height = `${size}px`;
                ctx.scale(dpr, dpr);
                createParticles();
            }

            class Particle {
                constructor(x, y, order) {
                    this.x = x; this.y = y;
                    this.originalX = x; this.originalY = y;
                    this.size = 2;
                    this.order = order;
                    this.velocity = { x: (Math.random() - 0.5)*2, y: (Math.random() - 0.5)*2 };
                    this.influence = 0;
                    this.neighbors = [];
                }
                update() {
                    if(this.order) {
                        const dx = this.originalX - this.x;
                        const dy = this.originalY - this.y;
                        const chaosInfluence = {x:0, y:0};
                        
                        this.neighbors.forEach(neighbor => {
                            if(!neighbor.order) {
                                const distance = Math.hypot(this.x - neighbor.x, this.y - neighbor.y);
                                const strength = Math.max(0, 1 - distance/100);
                                chaosInfluence.x += neighbor.velocity.x * strength;
                                chaosInfluence.y += neighbor.velocity.y * strength;
                                this.influence = Math.max(this.influence, strength);
                            }
                        });
                        
                        this.x += dx * 0.05 * (1 - this.influence) + chaosInfluence.x * this.influence;
                        this.y += dy * 0.05 * (1 - this.influence) + chaosInfluence.y * this.influence;
                        this.influence *= 0.99;
                    } else {
                        this.velocity.x += (Math.random() - 0.5) * 0.5;
                        this.velocity.y += (Math.random() - 0.5) * 0.5;
                        this.velocity.x *= 0.95;
                        this.velocity.y *= 0.95;
                        this.x += this.velocity.x;
                        this.y += this.velocity.y;
                        
                        if(this.x < size/2 || this.x > size) this.velocity.x *= -1;
                        if(this.y < 0 || this.y > size) this.velocity.y *= -1;
                        this.x = Math.max(size/2, Math.min(size, this.x));
                        this.y = Math.max(0, Math.min(size, this.y));
                    }
                }
                draw(ctx) {
                    const alpha = this.order ? 0.8 - this.influence * 0.5 : 0.8;
                    ctx.fillStyle = `${particleColor}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
                    ctx.fill();
                }
            }

            function createParticles() {
                particles = [];
                const gridSize = 25;
                const spacing = size / gridSize;

                for (let i = 0; i < gridSize; i++) {
                    for (let j = 0; j < gridSize; j++) {
                        const x = spacing * i + spacing / 2;
                        const y = spacing * j + spacing / 2;
                        const order = x < size / 2; 
                        particles.push(new Particle(x, y, order));
                    }
                }
            }

            function updateNeighbors() {
                particles.forEach(particle => {
                    particle.neighbors = particles.filter(other => {
                        if (other === particle) return false;
                        const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
                        return distance < 100;
                    });
                });
            }

            function animate() {
                ctx.clearRect(0, 0, size, size);
                
                if (time % 30 === 0) updateNeighbors();

                particles.forEach(particle => {
                    particle.update();
                    particle.draw(ctx);

                    particle.neighbors.forEach(neighbor => {
                        const distance = Math.hypot(particle.x - neighbor.x, particle.y - neighbor.y);
                        if (distance < 50) {
                            const alpha = 0.2 * (1 - distance / 50);
                            ctx.strokeStyle = `${particleColor}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
                            ctx.beginPath();
                            ctx.moveTo(particle.x, particle.y);
                            ctx.lineTo(neighbor.x, neighbor.y);
                            ctx.stroke();
                        }
                    });
                });

                ctx.strokeStyle = `${particleColor}4D`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(size / 2, 0);
                ctx.lineTo(size / 2, size);
                ctx.stroke();

                time++;
                animationId = requestAnimationFrame(animate);
            }

            setup();
            animate();
        }

        // --- LOCAL STATE & DEFAULTS ---
        let galleryShowingAll = false; const GALLERY_LIMIT = 6;
        let poetryShowingAll = false; const POETRY_LIMIT = 1;
        let articlesShowingAll = false; const ARTICLES_LIMIT = 3;
        let videosShowingAll = false; const VIDEOS_LIMIT = 5;

        let techQuotes = [];
        let creativeQuotes = [];
        
        window.globalManageData = { 
            projects: [], experience: [], education: [], certifications: [], 
            gallery: [], poetry: [], articles: [], videos: [], quotes: [], playlists: []
        };

        const defaultProjects = [
            { id: 'dp1', title: "Olympia Academia", desc: "RAG chatbot using FAISS and Semantic Search with an upcoming XAI UI.", link: "https://github.com/shayanazmi/olympia-academia-ragChatBot", priority: 1 },
            { id: 'dp2', title: "Face Mask Detection", desc: "Real-time Streamlit AI Dashboard using VGG16 and Haar Cascades (93% accuracy).", link: "https://github.com/shayanazmi/Face-mask-Detection-FInal", priority: 2 }
        ];

        const defaultPlaylists = [];
        // No hardcoded defaults — container is empty until user adds via CMS
        
        const defaultExperience = [
            { id: 'de1', title: "AI Intern @ C-DAC", desc: "Ranked #1 of 45+ trainees. Led a 4-person team to build a CNN/OpenCV Indian Sign Language model and optimized ML algorithms across 10+ datasets.", meta: "Jun 2025 - Jul 2025 • Patna, Bihar", priority: 1 },
            { id: 'de2', title: "Data Science Intern @ Codveda", desc: "Developed 12 Scikit-learn ML models and executed time-series trend analysis on data acquired via automated Beautiful Soup web scraping.", meta: "May 2025 - Jul 2025 • Remote", priority: 2 },
            { id: 'de3', title: "Leader @ Eulim Science Club", desc: "Orchestrated national science events for 1,500+ students and drove digital campaigns yielding 900K+ online engagements.", meta: "Aug 2025 - Present • Christ University", priority: 3 },
            { id: 'de4', title: "Stage Committee @ ICSCPS 2026", desc: "Directed a 15-member team executing seamless stage logistics and real-time session flows for 15 international speakers.", meta: "Christ University • Delhi NCR", priority: 4 }
        ];

        const defaultEducation = [
            { id: 'ded1', title: "B.Sc. Data Science & AI", meta: "Christ University • 3/4 GPA", priority: 1 },
            { id: 'ded2', title: "Intermediate (12th)", meta: "Al - Hafeez College • 68.6%", priority: 2 },
            { id: 'ded3', title: "Matriculation (10th)", meta: "St. Karens Secondary • 83.6%", priority: 3 }
        ];

        const defaultCertifications = [
            { id: 'dc1', title: "Data Analysis With R", meta: "Google • Scored 90%", priority: 1 },
            { id: 'dc2', title: "Python for Data Science & A.I.", meta: "IBM • Scored 92.5%", priority: 2 },
            { id: 'dc3', title: "AI & Machine Learning", meta: "Intel Unnati • Scored 80%", priority: 3 },
            { id: 'dc4', title: "Product & Brand Management", meta: "IIT Roorkee • Scored 77%", priority: 4 }
        ];

        const defaultGallery = [
            { id: 'dg1', url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80', title: 'Cinematography', priority: 1 },
            { id: 'dg2', url: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?auto=format&fit=crop&w=600&q=80', title: 'Street', priority: 2 }
        ];
        const defaultPoetry = [{ id: 'dp1', title: 'An Ode to the Code', type: 'Nazm', content: 'In loops we trust...', link: '#', priority: 1 }];
        const defaultArticles = [{ id: 'da1', title: 'The Psychology of Human Misjudgment', meta: 'Charlie Munger • Essay', link: '#', priority: 1 }];
        const defaultVideos = [{ id: 'dv1', title: 'The Art of Color Grading', meta: 'YouTube • Video Essay', link: '#', priority: 1 }];
        
        const defaultTechQuotes = [
            { id: 'dtq1', text: "The art of programming is the art of organizing complexity.", author: "Edsger W. Dijkstra", category: "tech", priority: 1 },
            { id: 'dtq2', text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs", category: "tech", priority: 2 }
        ];
        const defaultCreativeQuotes = [
            { id: 'dcq1', text: "Good design is invisible. Great design is inevitable.", author: "Anonymous", category: "creative", priority: 1 },
            { id: 'dcq2', text: "A photograph is a secret about a secret. The more it tells you the less you know.", author: "Diane Arbus", category: "creative", priority: 2 }
        ];

        // Apply localStorage as a UI fallback for the player URL only (so it feels fast)
        const savedSpotifyUrl = localStorage.getItem('spotifyEmbedUrl');
        if(savedSpotifyUrl) {
            const lp = document.getElementById('live-spotify-player');
            if(lp) lp.src = savedSpotifyUrl;
        }

        // --- FETCH PUBLIC DATA ---
        function startDataFetch() {
            if(!db) { renderAllDefaults(); return; }
            
            // 1. Fetch UI Text (Dual Intros)
            onSnapshot(docPath('ui_content', 'main_intro'), (docSnap) => {
                if(docSnap.exists()) {
                    const d = docSnap.data();
                    const fields = ['tech_hook','tech_p1','tech_p2','tech_p3','tech_p4','crea_hook','crea_p1','crea_p2','crea_p3','crea_p4'];
                    fields.forEach(f => {
                        const uiEl = document.getElementById('ui-' + f.replace('_','-'));
                        const adminEl = document.getElementById('admin-' + f.replace('_','-'));
                        if(uiEl) uiEl.innerText = d[f] || '';
                        if(adminEl) adminEl.value = d[f] || '';
                    });
                }
            }, (err) => { console.warn("Failed fetching intro:", err); renderAllDefaults(); });

            // 2. Fetch Spotify Global Player
            onSnapshot(docPath('ui_content', 'spotify'), (docSnap) => {
                if(docSnap.exists() && docSnap.data().url) {
                    const url = docSnap.data().url;
                    document.getElementById('live-spotify-player').src = url;
                    document.getElementById('admin-spotify-url').value = url;
                    localStorage.setItem('spotifyEmbedUrl', url);
                }
            }, (err) => console.warn("Failed fetching spotify:", err));

            // 3. Generic Collection Syncer
            const syncCollection = (collName, defaultArr, renderFn) => {
                onSnapshot(dataPath(collName), (snapshot) => {
                    const fetched = [];
                    snapshot.forEach(doc => fetched.push({ id: doc.id, ...doc.data() }));
                    
                    fetched.sort((a,b) => {
                        const pA = a.priority ? Number(a.priority) : 999;
                        const pB = b.priority ? Number(b.priority) : 999;
                        if(pA !== pB) return pA - pB;
                        return (b.addedAt || 0) - (a.addedAt || 0);
                    });

                    window.globalManageData[collName] = fetched;
                    const manageCat = document.getElementById('manage-category');
                    if(manageCat && manageCat.value === collName) renderManageList();
                    
                    renderFn(fetched.length ? fetched : defaultArr);
                }, (err) => {
                    console.warn(`Failed reading ${collName}:`, err);
                    renderFn(defaultArr);
                });
            };

            // Sync all sections
            syncCollection('projects', defaultProjects, renderProjects);
            syncCollection('experience', defaultExperience, renderExperience);
            syncCollection('education', defaultEducation, renderEducation);
            syncCollection('certifications', defaultCertifications, renderCertifications);
            syncCollection('gallery', defaultGallery, renderGallery);
            syncCollection('poetry', defaultPoetry, renderPoetry);
            syncCollection('articles', defaultArticles, renderArticles);
            syncCollection('videos', defaultVideos, renderVideos);
            syncCollection('playlists', defaultPlaylists, renderPlaylists);

            // Quotes
            onSnapshot(dataPath('quotes'), (snapshot) => {
                const fetched = [];
                snapshot.forEach(doc => fetched.push({ id: doc.id, ...doc.data() }));
                window.globalManageData['quotes'] = fetched;
                
                techQuotes = fetched.filter(q => q.category === 'tech');
                creativeQuotes = fetched.filter(q => q.category !== 'tech');
                
                if(techQuotes.length === 0) techQuotes = defaultTechQuotes;
                if(creativeQuotes.length === 0) creativeQuotes = defaultCreativeQuotes;
                renderQuotes();
            }, (err) => {
                console.warn("Failed reading quotes:", err);
                techQuotes = defaultTechQuotes; creativeQuotes = defaultCreativeQuotes; renderQuotes();
            });
        }
        
        startDataFetch();

        // --- RENDER FUNCTIONS ---
        function renderExperience(items) {
            const container = document.getElementById('experience-container');
            container.innerHTML = '';
            items.forEach(item => {
                let text = item.desc || "";
                let descHtml = `<p class="project-desc">${text}</p>`;
                if (text.length > 150) {
                    const shortText = text.substring(0, 150).trim() + '...';
                    descHtml = `<p class="project-desc" id="exp-short-${item.id}">${shortText}</p>
                                <p class="project-desc" id="exp-full-${item.id}" style="display:none; white-space: pre-wrap;">${text}</p>
                                <button class="show-more-toggle" onclick="
                                    const shortEl = document.getElementById('exp-short-${item.id}');
                                    const isShort = shortEl.style.display !== 'none';
                                    shortEl.style.display = isShort ? 'none' : 'block';
                                    document.getElementById('exp-full-${item.id}').style.display = isShort ? 'block' : 'none';
                                    this.innerText = isShort ? 'Show Less' : 'Read More';
                                ">Read More</button>`;
                }
                container.innerHTML += `
                    <div class="glass-card">
                        <h3 class="project-title">${item.title}</h3>
                        ${descHtml}
                        <span class="media-meta">${item.meta}</span>
                    </div>`;
            });
        }

        function renderEducation(items) {
            const container = document.getElementById('education-container');
            container.innerHTML = '';
            items.forEach(item => {
                container.innerHTML += `
                    <li>
                        <span class="media-title" style="font-size: 1.3rem; border:none; line-height: 1.2;">${item.title}</span>
                        <span class="media-meta" style="margin-top: 0.3rem; text-transform: none; font-size: 0.85rem; letter-spacing: 0;">${item.meta}</span>
                    </li>`;
            });
        }

        function renderCertifications(items) {
            const container = document.getElementById('certifications-container');
            container.innerHTML = '';
            items.forEach(item => {
                container.innerHTML += `
                    <li>
                        <span class="media-title" style="font-size: 1.1rem; border:none;">${item.title}</span>
                        <span class="media-meta" style="text-transform: none; font-size: 0.85rem; letter-spacing: 0;">${item.meta}</span>
                    </li>`;
            });
        }

        function renderProjects(items) {
            const container = document.getElementById('projects-container');
            container.innerHTML = '';
            items.forEach(item => {
                let text = item.desc || "";
                let descHtml = `<p class="project-desc">${text}</p>`;
                if (text.length > 150) {
                    const shortText = text.substring(0, 150).trim() + '...';
                    descHtml = `<p class="project-desc" id="proj-short-${item.id}">${shortText}</p>
                                <p class="project-desc" id="proj-full-${item.id}" style="display:none; white-space: pre-wrap;">${text}</p>
                                <button class="show-more-toggle" onclick="
                                    const shortEl = document.getElementById('proj-short-${item.id}');
                                    const isShort = shortEl.style.display !== 'none';
                                    shortEl.style.display = isShort ? 'none' : 'block';
                                    document.getElementById('proj-full-${item.id}').style.display = isShort ? 'block' : 'none';
                                    this.innerText = isShort ? 'Show Less' : 'Read More';
                                ">Read More</button>`;
                }
                container.innerHTML += `
                    <article class="project-card">
                        <h3 class="project-title">${item.title}</h3>
                        ${descHtml}
                        <a href="${item.link || '#'}" target="_blank" class="project-link" style="margin-top: 1rem;">View Repository</a>
                    </article>`;
            });
        }

        let currentGalleryItems = [];
        function renderGallery(items) {
            if(items) currentGalleryItems = items;
            const container = document.getElementById('gallery-container');
            const btn = document.getElementById('show-more-gallery-btn');
            container.innerHTML = '';
            currentGalleryItems.forEach((item, index) => {
                const hiddenClass = (index >= GALLERY_LIMIT && !galleryShowingAll) ? 'hidden-item' : '';
                container.innerHTML += `
                    <div class="gallery-item ${hiddenClass}">
                        <img src="${item.url}" alt="${item.title}">
                        <div class="ig-overlay">${item.title}</div>
                    </div>`;
            });
            if (currentGalleryItems.length > GALLERY_LIMIT) {
                btn.style.display = 'inline-flex';
                btn.innerText = galleryShowingAll ? 'View Less' : `View All Frames (${currentGalleryItems.length})`;
            } else { btn.style.display = 'none'; }
        }

        document.getElementById('show-more-gallery-btn').addEventListener('click', () => { galleryShowingAll = !galleryShowingAll; renderGallery(); });

        let currentPoetryItems = [];
        function renderPoetry(items) {
            if(items) currentPoetryItems = items;
            const container = document.getElementById('poetry-container');
            const btn = document.getElementById('show-more-poetry-btn');
            container.innerHTML = '';
            currentPoetryItems.forEach((item, index) => {
                let linkHtml = item.link ? `<a href="${item.link}" target="_blank" class="project-link" style="margin-top: 1rem;">Read on Rekhta</a>` : '';
                const hiddenClass = (index >= POETRY_LIMIT && !poetryShowingAll) ? 'hidden-item' : '';
                let text = item.content || "";
                let contentHtml = `<p style="color:var(--text-muted); font-size:0.95rem; line-height:1.6; font-weight:300; white-space: pre-wrap;">${text}</p>`;
                if (text.length > 250) {
                    const shortText = text.substring(0, 250).trim() + '...';
                    contentHtml = `<p id="poem-short-${item.id}" style="color:var(--text-muted); font-size:0.95rem; line-height:1.6; font-weight:300; white-space: pre-wrap;">${shortText}</p>
                                   <p id="poem-full-${item.id}" style="display:none; color:var(--text-muted); font-size:0.95rem; line-height:1.6; font-weight:300; white-space: pre-wrap;">${text}</p>
                                   <button class="show-more-toggle" onclick="
                                       const shortEl = document.getElementById('poem-short-${item.id}');
                                       const isShort = shortEl.style.display !== 'none';
                                       shortEl.style.display = isShort ? 'none' : 'block';
                                       document.getElementById('poem-full-${item.id}').style.display = isShort ? 'block' : 'none';
                                       this.innerText = isShort ? 'Show Less' : 'Read More';
                                   ">Read More</button>`;
                }
                
                container.innerHTML += `
                    <li class="${hiddenClass}">
                        <span class="media-title">${item.title}</span>
                        <span class="media-meta" style="margin-bottom:1rem;">${item.type}</span>
                        ${contentHtml}
                        ${linkHtml}
                    </li>`;
            });
            if (currentPoetryItems.length > POETRY_LIMIT) {
                btn.style.display = 'inline-flex';
                btn.innerText = poetryShowingAll ? 'View Less' : `View All Poetry (${currentPoetryItems.length})`;
            } else { btn.style.display = 'none'; }
        }

        let currentArticlesItems = [];
        function renderArticles(items) {
            if(items) currentArticlesItems = items;
            const container = document.getElementById('articles-container');
            const btn = document.getElementById('show-more-articles-btn');
            container.innerHTML = '';
            currentArticlesItems.forEach((item, index) => {
                const hiddenClass = (index >= ARTICLES_LIMIT && !articlesShowingAll) ? 'hidden-item' : '';
                container.innerHTML += `<li class="${hiddenClass}"><a href="${item.link||'#'}" target="_blank" class="media-title" style="border:none">${item.title}</a><span class="media-meta">${item.meta}</span></li>`;
            });
            if (currentArticlesItems.length > ARTICLES_LIMIT) {
                btn.style.display = 'inline-flex';
                btn.innerText = articlesShowingAll ? 'View Less' : `View All Reads (${currentArticlesItems.length})`;
            } else { btn.style.display = 'none'; }
        }

        let currentVideosItems = [];
        function renderVideos(items) {
            if(items) currentVideosItems = items;
            const container = document.getElementById('videos-container');
            const btn = document.getElementById('show-more-videos-btn');
            container.innerHTML = '';
            currentVideosItems.forEach((item, index) => {
                const hiddenClass = (index >= VIDEOS_LIMIT && !videosShowingAll) ? 'hidden-item' : '';
                let thumbHtml = '';
                if (item.link && item.link.includes('spotify.com/embed')) {
                    thumbHtml = `<div style="width: 100%; margin-bottom: 0.8rem; border-radius: 8px; overflow: hidden;"><iframe src="${item.link}" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe></div>`;
                } else if (item.thumbnail && item.thumbnail !== item.link) {
                    thumbHtml = `<div style="width: 100%; aspect-ratio: 16/9; margin-bottom: 0.8rem; border-radius: 8px; overflow: hidden; background: #111;"><img src="${item.thumbnail}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.style.display='none'"></div>`;
                }
                container.innerHTML += `<li class="${hiddenClass}">${thumbHtml}<a href="${item.link||'#'}" target="_blank" class="media-title" style="border:none">${item.title}</a><span class="media-meta">${item.meta}</span></li>`;
            });
            if (currentVideosItems.length > VIDEOS_LIMIT) {
                btn.style.display = 'inline-flex';
                btn.innerText = videosShowingAll ? 'View Less' : `View All Watchlist (${currentVideosItems.length})`;
            } else { btn.style.display = 'none'; }
        }

        document.getElementById('show-more-poetry-btn').addEventListener('click', () => { poetryShowingAll = !poetryShowingAll; renderPoetry(); });
        document.getElementById('show-more-articles-btn').addEventListener('click', () => { articlesShowingAll = !articlesShowingAll; renderArticles(); });
        document.getElementById('show-more-videos-btn').addEventListener('click', () => { videosShowingAll = !videosShowingAll; renderVideos(); });

        function renderPlaylists(items) {
            const container = document.getElementById('playlists-container');
            if(!container) return;
            container.innerHTML = '';
            if(!items || items.length === 0) {
                container.innerHTML = '<li style="color: var(--text-muted); font-size: 0.9rem; padding: 1rem 0;">No playlists added yet — add some via the Music tab in CMS.</li>';
                return;
            }
            items.forEach(item => {
                // If link is a Spotify embed URL, show a mini player
                if(item.link && item.link.includes('spotify.com/embed')) {
                    container.innerHTML += `
                        <li style="padding: 1.2rem 0;">
                            <span class="media-title" style="font-size: 1.1rem; display: block; margin-bottom: 0.8rem;">${item.title}</span>
                            <iframe src="${item.link}" width="100%" height="80" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style="border-radius: 8px;"></iframe>
                        </li>`;
                } else {
                    container.innerHTML += `<li><a href="${item.link||'#'}" target="_blank" class="media-title" style="border:none">${item.title}</a><span class="media-meta">Spotify Playlist</span></li>`;
                }
            });
        }

        function renderQuotes() {
            const techDisp = document.getElementById('tech-quote-display');
            const techAuth = document.getElementById('tech-quote-author');
            if(techQuotes.length > 0 && techDisp) {
                const q = techQuotes[Math.floor(Math.random() * techQuotes.length)];
                techDisp.innerText = `"${q.text}"`; techAuth.innerText = `- ${q.author}`;
            }
            
            const creaDisp = document.getElementById('creative-quote-display');
            const creaAuth = document.getElementById('creative-quote-author');
            if(creativeQuotes.length > 0 && creaDisp) {
                const q = creativeQuotes[Math.floor(Math.random() * creativeQuotes.length)];
                creaDisp.innerText = `"${q.text}"`; creaAuth.innerText = `- ${q.author}`;
            }
        }

        // --- ALTER EGO TOGGLE LOGIC (WITH DUAL INTROS & BG SWAP) ---
        const toggleBtn = document.getElementById('alter-ego-toggle');
        const techContent = document.getElementById('tech-content');
        const creativeContent = document.getElementById('creative-content');
        
        const techHero = document.getElementById('tech-hero-section');
        const creaHero = document.getElementById('creative-hero-section');
        
        const bgTech = document.getElementById('bg-tech');
        const bgCreative = document.getElementById('bg-creative');

        toggleBtn.addEventListener('click', () => {
            const isCurrentlyTech = !document.body.classList.contains('creative-mode');
            
            if(isCurrentlyTech) {
                techContent.style.opacity = '0';
                techHero.style.opacity = '0';
                bgTech.style.opacity = '0';
            } else {
                creativeContent.style.opacity = '0';
                creaHero.style.opacity = '0';
                bgCreative.style.opacity = '0';
            }
            
            setTimeout(() => {
                document.body.classList.toggle('creative-mode');
                
                techContent.classList.toggle('hidden');
                creativeContent.classList.toggle('hidden');
                techHero.classList.toggle('hidden');
                creaHero.classList.toggle('hidden');
                
                setTimeout(() => {
                    if(isCurrentlyTech) {
                        creativeContent.style.opacity = '1';
                        creaHero.style.opacity = '1';
                        bgCreative.style.opacity = '0.7'; 
                    } else {
                        techContent.style.opacity = '1';
                        techHero.style.opacity = '1';
                        bgTech.style.opacity = '0.7'; 
                    }
                }, 50);
                
                // Button text 'ALTEREGO' is static now
            }, 400); 
        });

        // --- CYBER DINO RUN GAME LOGIC ---
        const gameCanvas = document.getElementById('dino-game');
        const gameCtx = gameCanvas.getContext('2d');
        const startBtn = document.getElementById('dino-start-btn');
        const overlay = document.getElementById('dino-overlay');
        const scoreDisplay = document.getElementById('dino-score-display');

        let dinoY = 300;
        let dinoVelocity = 0;
        const gravity = 0.6;
        const jumpPower = -11.5;
        const groundY = 320;
        let obstacles = [];
        let score = 0;
        let gameInterval;
        let isGameOver = false;
        let frameCount = 0;
        let gameSpeed = 6;

        startBtn.addEventListener('click', startGame);

        function startGame() {
            dinoY = groundY;
            dinoVelocity = 0;
            obstacles = [];
            score = 0;
            frameCount = 0;
            gameSpeed = 6;
            isGameOver = false;
            scoreDisplay.innerText = `Score: 000`;
            overlay.style.display = 'none';
            if(gameInterval) clearInterval(gameInterval);
            gameInterval = setInterval(mainLoop, 1000/60); 
        }

        function mainLoop() {
            if (isGameOver) {
                overlay.style.display = 'flex';
                scoreDisplay.innerText = `System Halted. Score: ${Math.floor(score).toString().padStart(3, '0')}`;
                startBtn.innerText = 'Reboot Sequence';
                clearInterval(gameInterval);
                return;
            }
            updateGame();
            drawGame();
        }

        function updateGame() {
            frameCount++;
            score += 0.1; 
            if (frameCount % 600 === 0) gameSpeed += 0.5; 

            dinoVelocity += gravity;
            dinoY += dinoVelocity;
            if (dinoY >= groundY) {
                dinoY = groundY;
                dinoVelocity = 0;
            }

            if (frameCount % Math.max(40, Math.floor(100 - gameSpeed * 2)) === 0) {
                let w = 15 + Math.random() * 15;
                let h = 30 + Math.random() * 30;
                let y = groundY + 20 - h; 
                
                if (Math.random() > 0.85) {
                    y = groundY - 40 - Math.random() * 30;
                    h = 15; w = 30;
                }
                obstacles.push({x: gameCanvas.width, y: y, w: w, h: h});
            }

            for (let i = 0; i < obstacles.length; i++) {
                obstacles[i].x -= gameSpeed;
            }
            obstacles = obstacles.filter(ob => ob.x + ob.w > 0);

            const dx = 100;
            const hitX = dx - 10; 
            const hitW = 30;
            const hitY = dinoY - 20;
            const hitH = 35;

            for (let i = 0; i < obstacles.length; i++) {
                let ob = obstacles[i];
                if (hitX < ob.x + ob.w && hitX + hitW > ob.x && hitY < ob.y + ob.h && hitY + hitH > ob.y) {
                    isGameOver = true;
                }
            }
        }

        function drawGame() {
            gameCtx.fillStyle = '#010101';
            gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
            
            gameCtx.strokeStyle = 'rgba(41, 151, 255, 0.05)';
            gameCtx.lineWidth = 1;
            gameCtx.beginPath();
            let offset = -(frameCount * gameSpeed) % 40;
            for(let i=offset; i<=gameCanvas.width; i+=40) { gameCtx.moveTo(i, 0); gameCtx.lineTo(i, gameCanvas.height); }
            for(let i=0; i<=gameCanvas.height; i+=40) { gameCtx.moveTo(0, i); gameCtx.lineTo(gameCanvas.width, i); }
            gameCtx.stroke();

            gameCtx.strokeStyle = '#2997ff';
            gameCtx.lineWidth = 2;
            gameCtx.shadowBlur = 10;
            gameCtx.shadowColor = '#2997ff';
            gameCtx.beginPath();
            gameCtx.moveTo(0, groundY + 20);
            gameCtx.lineTo(gameCanvas.width, groundY + 20);
            gameCtx.stroke();
            gameCtx.shadowBlur = 0;

            gameCtx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            gameCtx.font = "bold 80px var(--font-body)";
            gameCtx.fillText(Math.floor(score).toString().padStart(3, '0'), gameCanvas.width - 200, 100);

            obstacles.forEach(ob => {
                gameCtx.fillStyle = 'rgba(255, 51, 51, 0.2)';
                gameCtx.strokeStyle = '#ff3333';
                gameCtx.lineWidth = 2;
                gameCtx.shadowBlur = 10;
                gameCtx.shadowColor = '#ff3333';
                gameCtx.fillRect(ob.x, ob.y, ob.w, ob.h);
                gameCtx.strokeRect(ob.x, ob.y, ob.w, ob.h);
                
                gameCtx.beginPath();
                gameCtx.moveTo(ob.x, ob.y + ob.h/2);
                gameCtx.lineTo(ob.x + ob.w, ob.y + ob.h/2);
                gameCtx.stroke();
                gameCtx.shadowBlur = 0;
            });

            const dx = 100;
            gameCtx.save();
            gameCtx.translate(dx, dinoY);

            gameCtx.shadowBlur = 15;
            gameCtx.shadowColor = '#E5A93C';
            gameCtx.fillStyle = '#E5A93C';

            gameCtx.fillRect(4, -26, 18, 14);
            gameCtx.fillRect(22, -26, 10, 8);
            gameCtx.fillRect(22, -14, 8, 4);

            gameCtx.fillStyle = '#010101';
            gameCtx.shadowBlur = 0;
            gameCtx.fillRect(10, -22, 4, 4);

            gameCtx.fillStyle = '#E5A93C';
            gameCtx.shadowBlur = 15;
            gameCtx.fillRect(-6, -12, 16, 22);
            gameCtx.fillRect(-12, -6, 6, 14);
            gameCtx.fillRect(-18, -10, 6, 10);
            gameCtx.fillRect(-24, -14, 6, 8);
            
            gameCtx.fillRect(10, -4, 8, 4);
            gameCtx.fillRect(14, 0, 4, 4);

            const isRunning = dinoY === groundY;
            const runFrame = isRunning ? Math.floor(frameCount / 6) % 2 : 0;
            
            if (!isRunning) {
                gameCtx.fillRect(-6, 10, 6, 6);
                gameCtx.fillRect(4, 10, 6, 6);
            } else if (runFrame === 0) {
                gameCtx.fillRect(-6, 10, 6, 10); 
                gameCtx.fillRect(-2, 16, 4, 4); 
                gameCtx.fillRect(4, 10, 6, 4); 
            } else {
                gameCtx.fillRect(-6, 10, 6, 4); 
                gameCtx.fillRect(4, 10, 6, 10); 
                gameCtx.fillRect(8, 16, 4, 4); 
            }

            gameCtx.restore();
        }

        function jump() {
            if(overlay.style.display !== 'none') return;
            if (dinoY >= groundY) { 
                dinoVelocity = jumpPower;
            }
        }

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                jump();
            }
        });

        gameCanvas.addEventListener('mousedown', jump);
        gameCanvas.addEventListener('touchstart', (e) => {
            if(e.target === gameCanvas) {
                e.preventDefault();
                jump();
            }
        }, {passive: false});

        const creaShowBtn = document.getElementById('crea-show-more-btn');
        if(creaShowBtn) {
            creaShowBtn.addEventListener('click', () => {
                const hiddenTexts = document.querySelectorAll('.crea-more-txt');
                let isHidden = hiddenTexts[0].style.display === 'none';
                hiddenTexts.forEach(el => el.style.display = isHidden ? 'block' : 'none');
                creaShowBtn.innerText = isHidden ? 'Show Less' : 'Show More';
            });
        }