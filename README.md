# Shayan Azmi —  Portfolio

> A dual-mode, Firebase-powered portfolio with a built-in CMS. Switch between **Tech Mode** and **Creative Mode** for a living archive of work, thoughts, and evolution.

---
## Link to my Portfolio website 
https://shayan-azmi.web.app

---

## ✨ Features

- **Dual-Mode Interface** — Toggle between **Tech Mode** (analytical) and **Creative Mode** (expressive) with cinematic transitions
- **Dynamic Backgrounds** — Canvas-based falling particles (Tech) and interactive entropy field (Creative)
- **Live CMS** — Sidebar admin panel backed by Firebase Firestore with real-time updates
- **Offline Support** — IndexedDB persistence keeps content visible without internet
- **Sections** — Experience, Projects, Education, Certifications, Gallery, Poetry, Reading List, Watchlist, Curated Playlists, Quotes
- **Cyber Dino Game** — Playable mini-game embedded in the Tech side
- **Cinematic Details** — Film grain overlay, ambient glow, glassmorphism cards, scroll reveal animations

---

## 🏗️ File Structure

```
shayan_portfolio_web/
├── index.html                  # Core layout shell, links to shared css and imports src/app.js
├── server.js                   # Local static server & Instagram proxy endpoint
├── src/
│   ├── app.js                  # Application bootstrap & orchestrator
│   │
│   ├── shared/                 # Common building blocks
│   │   ├── firebase/
│   │   │   └── firebase-config.js # Exports DB, Auth instances, and path helpers
│   │   ├── styles/
│   │   │   ├── variables.css   # Typography, theme variables, resets
│   │   │   └── layout.css      # Header, Footer, base typography
│   │   ├── ui/
│   │   │   ├── skeleton.css    # Shared skeleton loader rules
│   │   │   └── admin-controls.css # Shared input and button layouts
│   │   └── utils/
│   │       └── escape.js       # HTML sanitizing helper
│   │
│   └── features/               # Self-contained product domains (Vertical Slices)
│       ├── authentication/     # Admin auth modal logic, listeners & styling
│       ├── cms-admin/          # Editor forms panels, image compression & CRUD writes
│       ├── gallery/            # Instagram sync, photo grids & lightbox
│       ├── portfolio-resume/   # Projects, experience, timeline dynamic list renders
│       └── contact/            # Copy email button interaction
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 (Semantic) |
| Styling | Vanilla CSS (Custom Properties, Glassmorphism) |
| Logic | Vanilla JS (ES Modules, Canvas API) |
| Database | Firebase Firestore v11 (real-time + offline) |
| Auth | Firebase Authentication (Email/Password) |
| Hosting | Firebase Hosting |

---

## 🍴 Forking & Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project (free Spark plan works)

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/portfolio-website.git
cd portfolio-website
```

### 2. Set Up Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → create a new project
2. Enable **Firestore Database** (start in test mode)
3. Enable **Authentication → Email/Password**
4. Go to **Project Settings → General → Your Apps** → copy the SDK config

### 3. Update `src/shared/firebase/firebase-config.js`

Replace the `firebaseConfig` object and `appId` with your own:

```js
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Also update this line:
const appId = 'YOUR_PROJECT_ID';
```

### 4. Create an Admin User

Firebase Console → Authentication → Users → **Add User**
These are the credentials you'll use to log in to the CMS.

### 5. Set Firestore Security Rules

Firebase Console → Firestore → **Rules** tab:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
    }
    match /artifacts/{appId}/public/data/{document=**} {
      allow write: if request.auth != null;
    }
  }
}
```

### 6. Run Locally

The project ships with a Node/Express local server that also handles the Instagram proxy:

```bash
# Recommended — included Express server
npm install
npm run dev
# → http://localhost:3000

# Alternative — Firebase emulator
firebase emulators:start
```

---

## 🚀 Deployment

```bash
firebase login
firebase deploy
```

Your site will be live at `https://YOUR_PROJECT_ID.web.app`

---

## 🔧 Module Reference

### `src/shared/firebase/firebase-config.js`

Handles all Firebase setup and exports helpers used across every feature slice.

| Export | Type | Description |
|---|---|---|
| `auth`, `db`, `app` | Firebase instances | Core Firebase services |
| `appId` | `string` | Firestore collection root ID |
| `adminLogin(email, pass)` | `async fn` | Wraps `signInWithEmailAndPassword` |
| `adminLogout()` | `async fn` | Signs out the current admin |
| `isAuthenticated()` | `fn` | Returns `true` if admin is logged in |
| `dataPath(collName)` | `fn` | Returns Firestore `CollectionReference` for a named collection |
| `docPath(...segments)` | `fn` | Returns Firestore `DocumentReference` for a nested path |

### `src/app.js`

- Application bootstrap and orchestrator
- Scroll reveal animations (IntersectionObserver)
- Tech canvas (falling particles) + Creative canvas (entropy field)
- Alter Ego mode toggle
- Cyber Dino game
- Calls each feature's `init*()` gatekeeper

### Feature Slices (`src/features/*`)

Each slice is a self-contained directory with its own `index.js` gatekeeper:

| Feature | Gatekeeper Export | Responsibility |
|---|---|---|
| `authentication/` | `checkAuthState()` | Firebase auth listeners, login overlay |
| `gallery/` | `initGallery()` | Photo grid, lightbox, Behold/Instagram sync |
| `portfolio-resume/` | `initResumeSection()` | All Firestore data fetches and dynamic renders |
| `contact/` | `initContactForm()` | Copy-email button handler |
| `cms-admin/` | `initCMSDashboard()` | CMS sidebar, form saves, CRUD, image upload |

---

## ✏️ Customizing Content

**Via CMS (recommended)**
1. Open your live site
2. Scroll to footer → click the faint **"Admin Access"** text (bottom-right)
3. Log in with your Firebase credentials
4. Use the sidebar to manage all content in real-time

**Directly in code**
| What | Where |
|---|---|
| Default content fallbacks | `src/features/portfolio-resume/resume-data.js` — `defaultProjects`, etc. |
| Skills list | `index.html` — `.skills-container` section |
| Footer links | `index.html` — `<footer>` |
| Colors & fonts | `src/shared/styles/variables.css` — `:root` variables |
| Mode names & nav | `index.html` — `.nav-logo`, toggle button |
| Firebase config | `src/shared/firebase/firebase-config.js` |

---

## 🔐 Security Note

Never commit your Firebase API key to a **public** repo without restricting it.
In the Firebase Console → Project Settings → API restrictions, restrict your key to your hosting domain only.

---

## 🎨 Design Philosophy

This project rejects the sterile uniformity of template portfolios. Every detail — the film grain, the particle entropy field, the dual-mode toggle — reflects the dual nature of its creator: structured and logical, yet chaotic and creative.
