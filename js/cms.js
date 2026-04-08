import { app, auth, db, appId, signInWithEmailAndPassword, onAuthStateChanged, collection, addDoc, onSnapshot, doc, setDoc, deleteDoc } from "./firebase-config.js";

// --- AUTH LOGIC (ADMIN ONLY) ---
        if(auth) {
            onAuthStateChanged(auth, (user) => {
                const dot = document.getElementById('cms-auth-dot');
                const lbl = document.getElementById('cms-auth-label');

                if (!user) {
                    if(dot) dot.className = 'offline';
                    if(lbl) lbl.innerText = 'Offline';
                } else {
                    if(dot) dot.className = 'online';
                    if(lbl) lbl.innerText = 'Connected';
                }
            });
        } else {
            renderAllDefaults();
        }

        function renderAllDefaults() {
            renderProjects(defaultProjects); renderExperience(defaultExperience); 
            renderEducation(defaultEducation); renderCertifications(defaultCertifications);
            renderGallery(defaultGallery); renderPoetry(defaultPoetry);
            renderArticles(defaultArticles); renderVideos(defaultVideos);
            renderPlaylists(defaultPlaylists);
            techQuotes = defaultTechQuotes; creativeQuotes = defaultCreativeQuotes; renderQuotes();
        }

        // --- COMPRESSION UTILS ---
        function compressImage(file, maxSize = 800) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = event => {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width; let height = img.height;
                        if (width > height) { if (width > maxSize) { height *= maxSize / width; width = maxSize; } } 
                        else { if (height > maxSize) { width *= maxSize / height; height = maxSize; } }
                        canvas.width = width; canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/jpeg', 0.8));
                    };
                    img.onerror = reject;
                };
                reader.onerror = reject;
            });
        }

        function extractThumbnailFromUrl(url) {
            const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            if (ytMatch && ytMatch[1]) return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
            return url; 
        }

        // --- ADMIN CMS PANEL LOGIC ---
        const adminPanel = document.getElementById('admin-panel');
        const passcodeModal = document.getElementById('passcode-modal');
        const emailInput = document.getElementById('admin-email');
        const passcodeInput = document.getElementById('admin-password');
        const passcodeError = document.getElementById('passcode-error');
        const togglePassVis = document.getElementById('toggle-pass-vis');

        togglePassVis.addEventListener('click', () => {
            if (passcodeInput.type === 'password') {
                passcodeInput.type = 'text'; togglePassVis.innerText = 'Hide';
            } else {
                passcodeInput.type = 'password'; togglePassVis.innerText = 'Show';
            }
        });

        document.getElementById('admin-trigger').addEventListener('click', () => {
            passcodeModal.style.display = 'flex'; passcodeInput.value = ''; emailInput.value = '';
            passcodeInput.type = 'password'; togglePassVis.innerText = 'Show';
            passcodeError.style.display = 'none';
        });

        document.getElementById('close-passcode').addEventListener('click', () => { passcodeModal.style.display = 'none'; });

        document.getElementById('passcode-submit').addEventListener('click', async () => {
            passcodeError.style.display = 'none';
            try {
                await signInWithEmailAndPassword(auth, emailInput.value.trim(), passcodeInput.value);
                passcodeModal.style.display = 'none'; adminPanel.style.display = 'flex';
                showStatus("Logged in as Admin!");
            } catch(e) { 
                console.error("Login failed:", e);
                passcodeError.innerText = "Invalid credentials. Try again.";
                passcodeError.style.display = 'block'; 
            }
        });

        document.getElementById('close-admin').addEventListener('click', () => { adminPanel.style.display = 'none'; });

        // --- NEW SIDEBAR NAV LOGIC ---
        document.querySelectorAll('.cms-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.cms-nav-item').forEach(n => n.classList.remove('active'));
                document.querySelectorAll('.cms-form-panel').forEach(p => p.classList.remove('active'));
                item.classList.add('active');
                const panel = document.getElementById(item.dataset.panel);
                if(panel) panel.classList.add('active');
                if(item.dataset.panel === 'panel-manage') renderManageList();
            });
        });

        function showStatus(msg, isError = false) {
            const s = document.getElementById('admin-status');
            s.innerText = msg;
            s.className = 'status-msg ' + (isError ? 'error' : 'success');
            setTimeout(() => { s.innerText = ''; s.className = 'status-msg'; }, 3000);
        }

        async function saveItem(collectionName, dataObj, clearElements) {
            try {
                await addDoc(collection(db, 'artifacts', appId, 'public', 'data', collectionName), { ...dataObj, addedAt: Date.now() });
                clearElements.forEach(el => { if(el) el.value = ''; });
                showStatus("Saved successfully!");
            } catch(e) { console.error(e); showStatus("Failed to save.", true); }
        }

        // --- SAVE BUTTONS ---
        document.getElementById('save-ui-btn').addEventListener('click', async () => {
            try {
                await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ui_content', 'main_intro'), { 
                    tech_hook: document.getElementById('admin-tech-hook').value,
                    tech_p1: document.getElementById('admin-tech-p1').value,
                    tech_p2: document.getElementById('admin-tech-p2').value,
                    tech_p3: document.getElementById('admin-tech-p3').value,
                    tech_p4: document.getElementById('admin-tech-p4').value,
                    crea_hook: document.getElementById('admin-crea-hook').value,
                    crea_p1: document.getElementById('admin-crea-p1').value,
                    crea_p2: document.getElementById('admin-crea-p2').value,
                    crea_p3: document.getElementById('admin-crea-p3').value,
                    crea_p4: document.getElementById('admin-crea-p4').value
                }, { merge: true });
                showStatus("Both introductions updated!");
            } catch(e) { console.error(e); showStatus("Failed to save UI text.", true); }
        });

        document.getElementById('save-spotify-btn').addEventListener('click', async () => {
            let inputUrl = document.getElementById('admin-spotify-url').value.trim();
            const srcMatch = inputUrl.match(/src="([^"]+)"/);
            if(srcMatch) inputUrl = srcMatch[1];
            const rawMatch = inputUrl.match(/open\.spotify\.com\/(track|playlist|album|show|episode|artist)\/([a-zA-Z0-9]+)/);
            if(rawMatch && !inputUrl.includes('/embed/')) {
                inputUrl = `https://open.spotify.com/embed/${rawMatch[1]}/${rawMatch[2]}?utm_source=generator&theme=0`;
            }
            if(!inputUrl || !inputUrl.includes('spotify.com')) return showStatus('Please enter a valid Spotify URL.', true);
            
            try {
                await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ui_content', 'spotify'), { url: inputUrl }, { merge: true });
                showStatus('Currently Playing updated!');
            } catch(e) { showStatus('Failed to update player.', true); }
        });

        document.getElementById('save-proj-btn').addEventListener('click', () => {
            const prio = document.getElementById('admin-proj-priority'); const t = document.getElementById('admin-proj-title'); 
            const d = document.getElementById('admin-proj-desc'); const l = document.getElementById('admin-proj-link');
            if(t.value) saveItem('projects', { priority: prio.value, title: t.value, desc: d.value, link: l.value }, [prio, t, d, l]);
        });

        document.getElementById('save-exp-btn').addEventListener('click', () => {
            const p = document.getElementById('admin-exp-priority'); const t = document.getElementById('admin-exp-title');
            const d = document.getElementById('admin-exp-desc'); const m = document.getElementById('admin-exp-meta');
            if(t.value) saveItem('experience', { priority: p.value, title: t.value, desc: d.value, meta: m.value }, [p, t, d, m]);
        });

        document.getElementById('save-edu-btn').addEventListener('click', () => {
            const p = document.getElementById('admin-edu-priority'); const t = document.getElementById('admin-edu-title');
            const m = document.getElementById('admin-edu-meta');
            if(t.value) saveItem('education', { priority: p.value, title: t.value, meta: m.value }, [p, t, m]);
        });

        document.getElementById('save-cert-btn').addEventListener('click', () => {
            const p = document.getElementById('admin-cert-priority'); const t = document.getElementById('admin-cert-title');
            const m = document.getElementById('admin-cert-meta');
            if(t.value) saveItem('certifications', { priority: p.value, title: t.value, meta: m.value }, [p, t, m]);
        });

        document.getElementById('save-photo-btn').addEventListener('click', async () => {
            const prio = document.getElementById('admin-img-priority');
            const fileInput = document.getElementById('admin-img-file');
            const urlInput = document.getElementById('admin-img-url');
            const titleInput = document.getElementById('admin-img-title');
            
            let finalUrl = ""; showStatus("Processing image...");
            try {
                if (fileInput.files && fileInput.files[0]) { finalUrl = await compressImage(fileInput.files[0]); } 
                else if (urlInput.value) { finalUrl = extractThumbnailFromUrl(urlInput.value); } 
                else { return showStatus("Please select a file or enter a URL."); }
                
                await saveItem('gallery', { priority: prio.value, url: finalUrl, title: titleInput.value }, [prio, fileInput, urlInput, titleInput]);
            } catch(e) { console.error(e); showStatus("Error processing image."); }
        });

        document.getElementById('save-poem-btn').addEventListener('click', () => {
            const prio = document.getElementById('admin-poem-priority'); const t = document.getElementById('admin-poem-title'); 
            const type = document.getElementById('admin-poem-type'); const content = document.getElementById('admin-poem-content');
            const link = document.getElementById('admin-poem-link');
            if(t.value) saveItem('poetry', { priority: prio.value, title: t.value, type: type.value, content: content.value, link: link.value }, [prio, t, type, content, link]);
        });

        document.getElementById('save-playlist-btn').addEventListener('click', () => {
            const prio = document.getElementById('admin-playlist-priority');
            const t = document.getElementById('admin-playlist-title');
            const urlEl = document.getElementById('admin-playlist-url');
            if(!t.value || !urlEl.value) return showStatus('Please enter a name and URL.', true);
            
            let link = urlEl.value.trim();
            const rawMatch = link.match(/open\.spotify\.com\/(track|playlist|album|show|episode|artist)\/([a-zA-Z0-9]+)/);
            if(rawMatch && !link.includes('/embed/')) {
                link = `https://open.spotify.com/embed/${rawMatch[1]}/${rawMatch[2]}?utm_source=generator&theme=0`;
            }
            
            const existing = window.globalManageData['playlists'] || [];
            if(existing.some(p => p.link === link)) {
                return showStatus('This playlist is already in your curations.', true);
            }

            saveItem('playlists', { priority: prio.value, title: t.value, link }, [prio, t, urlEl]);
        });

        document.getElementById('save-art-btn').addEventListener('click', () => {
            const prio = document.getElementById('admin-art-priority'); const t = document.getElementById('admin-art-title'); 
            const m = document.getElementById('admin-art-meta'); const l = document.getElementById('admin-art-link');
            if(t.value) saveItem('articles', { priority: prio.value, title: t.value, meta: m.value, link: l.value }, [prio, t, m, l]);
        });

        document.getElementById('save-vid-btn').addEventListener('click', () => {
            const prio = document.getElementById('admin-vid-priority'); const t = document.getElementById('admin-vid-title'); 
            const m = document.getElementById('admin-vid-meta'); let l = document.getElementById('admin-vid-link');
            
            let finalLink = l.value;
            const rawMatch = finalLink.match(/open\.spotify\.com\/(track|playlist|album|show|episode|artist)\/([a-zA-Z0-9]+)/);
            if(rawMatch && !finalLink.includes('/embed/')) {
                finalLink = `https://open.spotify.com/embed/${rawMatch[1]}/${rawMatch[2]}?utm_source=generator&theme=0`;
            }
            
            const thumb = finalLink ? extractThumbnailFromUrl(finalLink) : '';
            if(t.value) saveItem('videos', { priority: prio.value, title: t.value, meta: m.value, link: finalLink, thumbnail: thumb }, [prio, t, m, l]);
        });

        document.getElementById('save-quote-btn').addEventListener('click', () => {
            const c = document.getElementById('admin-quote-category');
            const t = document.getElementById('admin-quote-text'); const a = document.getElementById('admin-quote-author');
            if(t.value) saveItem('quotes', { category: c.value, text: t.value, author: a.value }, [t, a]);
        });

        // --- MANAGE / DELETE LOGIC ---
        document.getElementById('manage-category').addEventListener('change', renderManageList);

        // Manage items render with better card style
        function renderManageList() {
            const category = document.getElementById('manage-category').value;
            const items = window.globalManageData[category] || [];
            const container = document.getElementById('manage-items-container');
            container.innerHTML = '';
            
            if(items.length === 0) {
                container.innerHTML = '<p style="color:rgba(255,255,255,0.3); font-size:0.9rem; padding: 1rem 0;">No items found in this section.</p>';
                return;
            }

            items.forEach(item => {
                let displayText = item.title || item.text || 'Untitled item';
                if(displayText.length > 50) displayText = displayText.substring(0, 50) + '...';
                let sub = '';
                if(item.priority) sub += `Priority ${item.priority}`;
                if(item.meta) sub += (sub ? ' · ' : '') + item.meta;
                if(item.category) sub += (sub ? ' · ' : '') + `[${item.category.toUpperCase()}]`;
                
                container.innerHTML += `
                    <div class="cms-manage-item">
                        <div>
                            <div class="cms-manage-item-text">${displayText}</div>
                            ${sub ? `<div class="cms-manage-item-sub">${sub}</div>` : ''}
                        </div>
                        <button class="admin-btn-delete" onclick="window.deleteItem('${category}', '${item.id}')">Delete</button>
                    </div>`;
            });
        }

        window.deleteItem = async function(category, docId) {
            if(!confirm("Are you sure you want to permanently delete this item?")) return;
            try {
                await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', category, docId));
                showStatus("Item successfully deleted!");
            } catch(e) { console.error(e); showStatus("Failed to delete item.", true); }
        };

        