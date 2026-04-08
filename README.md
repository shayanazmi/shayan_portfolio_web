# Shayan Azmi — Cinematic Portfolio

> A dual-mode, Firebase-powered portfolio with a built-in CMS. Switch between **Tech Mode** and **Creative Mode** for a living archive of work, thoughts, and evolution.

---

## ✨ Features

- **Dual-Mode Interface** — Toggle between **Tech Mode** (analytical, data-driven) and **Creative Mode** (expressive, artistic) with a cinematic transition
- **Dynamic Backgrounds**
  - Tech Mode: Canvas-based falling particle animation
  - Creative Mode: Interactive entropy particle field
- **Live CMS** — Sidebar admin panel backed by Firebase Firestore for real-time content updates
- **Sections**: Experience, Projects, Education, Certifications, Gallery, Poetry, Reading List, Watchlist, Curated Playlists
- **Cyber Dino Game** — A playable mini-game embedded in the portfolio
- **Cinematic Details** — Film grain overlay, ambient glow, glassmorphism cards, scroll reveal animations

---

## 🏗️ File Structure

```
portfolio-website/
│
├── index.html                  # Main entry point — pure HTML, no inline CSS/JS
│
├── css/
│   └── style.css               # All styles: variables, layout, components, CMS UI
│
├── js/
│   ├── firebase-config.js      # Firebase App/Auth/Firestore init + ES module exports
│   ├── main.js                 # Canvas animations, data fetching, render functions,
│   │                           # Cyber Dino game, Alter Ego toggle
│   └── cms.js                  # Admin auth, CMS sidebar nav, all save/delete logic
│
├── firebase.json               # Firebase Hosting config
├── .firebaserc                 # Firebase project alias
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 (Semantic) |
| Styling | Vanilla CSS (Custom Properties, Glassmorphism) |
| Logic | Vanilla JS (ES Modules, Canvas API) |
| Database | Firebase Firestore (real-time sync) |
| Auth | Firebase Authentication (Email/Password) |
| Hosting | Firebase Hosting / GitHub Pages |

---

## 🍴 Forking & Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`
- A Firebase project (free Spark plan works)

### 1. Fork & Clone

```bash
# Fork this repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/portfolio-website.git
cd portfolio-website
```

### 2. Set Up Your Own Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a new project
2. Enable **Firestore Database** (start in test mode)
3. Enable **Authentication → Email/Password**
4. In **Project Settings → General**, find your Web App config

### 3. Update Firebase Config

Open `js/firebase-config.js` and replace the config with your own:

```js
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

Also update the `appId` export variable at the bottom to match your Firestore collection root:

```js
appId = 'YOUR_PROJECT_ID';
```

### 4. Create an Admin User

In Firebase Console → Authentication → Users → **Add User**. These credentials are what you'll enter in the CMS login modal.

### 5. Set Firestore Security Rules

In Firebase Console → Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public can read all content
    match /{document=**} {
      allow read: if true;
    }
    // Only authenticated users can write
    match /artifacts/{appId}/public/data/{document=**} {
      allow write: if request.auth != null;
    }
  }
}
```

### 6. Run Locally

Since this is plain HTML/CSS/JS with ES Modules, you need a local server (ES modules don't work via `file://`):

```bash
# Option A — Firebase Hosting emulator (recommended)
firebase emulators:start

# Option B — Python
python -m http.server 8080

# Option C — VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

Open `http://localhost:5000` (Firebase) or `http://localhost:8080` (Python).

---

## 🚀 Deployment

### Firebase Hosting (Recommended)

```bash
firebase login
firebase init hosting   # select your project, set public dir to "."
firebase deploy
```

### GitHub Pages

1. Push to a GitHub repo
2. Go to **Settings → Pages → Source**: Deploy from branch `main`, folder `/`
3. Your site will be live at `https://YOUR_USERNAME.github.io/REPO_NAME/`

> ⚠️ GitHub Pages doesn't support server-side routing, but since this is a single `index.html`, it works perfectly.

---

## ✏️ Customizing Content

### Via CMS (Recommended)
1. Open your live site
2. Scroll to the footer and click the tiny **"Admin Access"** text (bottom-right, barely visible)
3. Log in with your Firebase credentials
4. Use the sidebar to add/edit/delete: Projects, Experience, Education, Photos, Poetry, Reading List, Watchlist, Quotes, and Music

### Directly in Code
- **Hero text & default content** — Edit the `default*` arrays in `js/main.js`
- **Skills list** — Edit the `.skills-container` section in `index.html`
- **Footer links** — Edit `<footer>` in `index.html`
- **Colors/fonts** — Edit CSS variables in `css/style.css` under `:root`

---

## 🔐 Admin Panel

The admin panel is accessible via the hidden **"Admin Access"** trigger in the footer. It requires a valid Firebase Email/Password account. Content changes are saved to Firestore and sync in real-time across all visitors.

**Never share your Firebase credentials or commit them to a public repo.** Consider using environment variables or splitting the config into a `.env`-loaded file if making this public.

---

## 🎨 Design Philosophy

This project rejects the sterile uniformity of template portfolios. It's built on the idea that a portfolio should reflect the dual nature of its creator — structured and logical, yet chaotic and creative. Every detail, from the film grain overlay to the particle entropy field, is intentional.

---

## 🤝 Contributing

If you fork this and make something cool, I'd love to see it. PRs for bug fixes or features are welcome. Open an issue first for significant changes so we can discuss direction.
