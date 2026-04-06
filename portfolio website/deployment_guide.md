# Quick Deployment Guide
## Portfolio Website - Step-by-Step

---

## 🔥 PRIMARY: Firebase Hosting (REQUIRED)

### Why Firebase?
- **Backend Integration**: Firebase provides hosting + backend services in one platform
- **Firestore Database**: NoSQL database for storing game scores, user preferences
- **Cloud Functions**: Serverless backend logic
- **Authentication**: Built-in user authentication if needed
- **Real-time**: Real-time database updates
- **Free Tier**: Generous free tier for personal projects

---

## Firebase Complete Setup Guide

### Step 1: Create Firebase Project

1. **Go to Firebase Console:**
   - Visit https://console.firebase.google.com
   - Click "Add Project" or "Create a project"

2. **Project Configuration:**
   ```
   Project Name: portfolio-website (or your choice)
   Project ID: portfolio-website-xxxxx (auto-generated)
   Analytics: Enable (recommended)
   Analytics Location: [Your country]
   ```

3. **Wait for project creation** (~30 seconds)

### Step 2: Install Firebase CLI

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Verify installation
firebase --version

# Login to Firebase
firebase login

# This opens browser for authentication
# Sign in with your Google account
```

### Step 3: Initialize Firebase in Your Project

```bash
# Navigate to your project directory
cd portfolio-website

# Initialize Firebase
firebase init

# Select features (use SPACE to select, ENTER to confirm):
☑ Firestore: Deploy rules and create indexes
☑ Functions: Configure a Cloud Functions directory
☑ Hosting: Configure files for Firebase Hosting
☐ Storage: Deploy storage rules (select if you need file uploads)
☐ Emulators: Set up local emulators (recommended for development)

# Firestore Setup:
# Use default firestore.rules
# Use default firestore.indexes.json

# Functions Setup:
# Language: JavaScript (or TypeScript if you prefer)
# ESLint: Yes (recommended)
# Install dependencies: Yes

# Hosting Setup:
# Public directory: public (or dist if you have a build process)
# Single-page app: Yes
# Set up automatic builds with GitHub: No (we'll do this manually)
# Overwrite index.html: No (important!)
```

### Step 4: Project Structure Setup

After initialization, organize your files:

```bash
# Move your current files to public directory
mkdir -p public/css public/js public/assets

# If you have a single HTML file:
mv portfolio_website.html public/index.html

# Or if already organized:
mv index.html public/
mv css/* public/css/
mv js/* public/js/
mv assets/* public/assets/
```

**Final Structure:**
```
portfolio-website/
├── public/                      # Frontend (served by Firebase Hosting)
│   ├── index.html
│   ├── css/
│   │   ├── reset.css
│   │   ├── variables.css
│   │   ├── themes.css
│   │   ├── animations.css
│   │   ├── components.css
│   │   └── game.css
│   ├── js/
│   │   ├── main.js
│   │   ├── firebase-config.js  # Firebase initialization
│   │   ├── theme-toggle.js
│   │   ├── animations.js
│   │   └── game.js
│   └── assets/
│       └── images/
├── functions/                   # Backend (Cloud Functions)
│   ├── index.js                # Your backend logic
│   ├── package.json
│   └── .env                    # Environment variables
├── firestore.rules             # Database security rules
├── firestore.indexes.json      # Database indexes
├── firebase.json               # Firebase configuration
├── .firebaserc                 # Project configuration
└── .gitignore
```

### Step 5: Configure Firebase in Your Website

Create `public/js/firebase-config.js`:

```javascript
// Firebase configuration
// Get these values from Firebase Console → Project Settings → General
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services you need
const db = firebase.firestore();
const auth = firebase.auth();
const analytics = firebase.analytics();

// Export for use in other files
window.firebaseDb = db;
window.firebaseAuth = auth;
window.firebaseAnalytics = analytics;
```

**Add Firebase SDK to `public/index.html`** (in `<head>` before your scripts):

```html
<!-- Firebase App (core) -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>

<!-- Firebase services you need -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics-compat.js"></script>

<!-- Your Firebase config -->
<script src="./js/firebase-config.js"></script>
```

### Step 6: Get Your Firebase Config Values

1. **Open Firebase Console** → Your Project
2. Click **⚙️ Settings** (gear icon) → **Project Settings**
3. Scroll down to **"Your apps"** section
4. Click **</> Web** icon to add a web app
5. Register app with nickname: "Portfolio Website"
6. **Copy the firebaseConfig object** and paste into `firebase-config.js`

### Step 7: Set Up Firestore Database

1. **In Firebase Console → Firestore Database**
2. Click **"Create database"**
3. **Location:** Choose closest to your users
4. **Security rules:** Start in test mode (we'll secure it later)

5. **Configure `firestore.rules`** for security:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Game scores collection
    match /gameScores/{scoreId} {
      // Anyone can read scores
      allow read: if true;
      
      // Only authenticated users can write their own scores
      allow create: if request.auth != null 
                    && request.resource.data.userId == request.auth.uid;
      
      // Users can update their own scores
      allow update: if request.auth != null 
                    && resource.data.userId == request.auth.uid;
      
      // No deletions
      allow delete: if false;
    }
    
    // User preferences collection
    match /userPreferences/{userId} {
      // Users can only read/write their own preferences
      allow read, write: if request.auth != null 
                          && request.auth.uid == userId;
    }
    
    // Analytics/anonymous data
    match /analytics/{document=**} {
      allow read: if false;  // Only backend can read
      allow write: if true;   // Anyone can write events
    }
  }
}
```

### Step 8: Example - Save Game Scores to Firestore

Update your game code (`public/js/game.js`):

```javascript
// Save high score when game ends
async function saveHighScore(score, playerName = 'Anonymous') {
  try {
    const scoreData = {
      score: Math.floor(score),
      playerName: playerName,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      userId: firebaseAuth.currentUser?.uid || 'anonymous'
    };
    
    await firebaseDb.collection('gameScores').add(scoreData);
    console.log('Score saved successfully!');
    
  } catch (error) {
    console.error('Error saving score:', error);
  }
}

// Get top 10 high scores
async function getTopScores() {
  try {
    const snapshot = await firebaseDb
      .collection('gameScores')
      .orderBy('score', 'desc')
      .limit(10)
      .get();
    
    const scores = [];
    snapshot.forEach(doc => {
      scores.push(doc.data());
    });
    
    return scores;
    
  } catch (error) {
    console.error('Error getting scores:', error);
    return [];
  }
}

// Call when game ends
function gameOver() {
  isGameOver = true;
  scoreDisplay.innerText = `System Halted. Score: ${Math.floor(score).toString().padStart(3, '0')}`;
  startBtn.innerText = 'Reboot Sequence';
  
  // Save score to Firebase
  saveHighScore(score);
  
  clearInterval(gameInterval);
}
```

### Step 9: Set Up Cloud Functions (Optional Backend Logic)

If you need backend processing, edit `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Example: Clean up old scores (runs daily)
exports.cleanupOldScores = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const oldScores = await db.collection('gameScores')
      .where('timestamp', '<', thirtyDaysAgo)
      .get();
    
    const batch = db.batch();
    oldScores.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    console.log(`Deleted ${oldScores.size} old scores`);
  });

// Example: Validate and sanitize score submissions
exports.validateScore = functions.firestore
  .document('gameScores/{scoreId}')
  .onCreate(async (snap, context) => {
    const score = snap.data();
    
    // Validate score isn't impossibly high
    if (score.score > 9999) {
      console.warn('Suspicious score detected:', score);
      // Could delete or flag the document
      await snap.ref.delete();
    }
  });

// Example: HTTP endpoint for getting leaderboard
exports.getLeaderboard = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  
  const db = admin.firestore();
  const topScores = await db.collection('gameScores')
    .orderBy('score', 'desc')
    .limit(100)
    .get();
  
  const leaderboard = [];
  topScores.forEach(doc => leaderboard.push(doc.data()));
  
  res.json(leaderboard);
});
```

### Step 10: Configure `firebase.json`

Update your `firebase.json` for optimal configuration:

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run lint"
    ],
    "source": "functions"
  },
  "hosting": {
    "public": "public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "/**",
        "headers": [
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          }
        ]
      }
    ],
    "cleanUrls": true,
    "trailingSlash": false
  }
}
```

### Step 11: Test Locally with Firebase Emulators

```bash
# Start Firebase emulators (recommended before deploying)
firebase emulators:start

# This starts:
# - Hosting: http://localhost:5000
# - Firestore: localhost:8080 (Emulator UI)
# - Functions: http://localhost:5001

# Test your site at http://localhost:5000
# Check Firestore data at http://localhost:4000
```

**Test checklist:**
- [ ] Website loads correctly
- [ ] Theme toggle works
- [ ] Game plays smoothly
- [ ] Scores save to Firestore (check Emulator UI)
- [ ] No console errors
- [ ] Mobile responsive

### Step 12: Deploy to Firebase

```bash
# Deploy everything (Hosting + Firestore + Functions)
firebase deploy

# Or deploy specific services:
firebase deploy --only hosting          # Just the website
firebase deploy --only firestore:rules  # Just database rules
firebase deploy --only functions        # Just cloud functions

# First deployment output:
# ✔  Deploy complete!
# 
# Hosting URL: https://your-project.web.app
#              https://your-project.firebaseapp.com
```

**Your site is now live!** 🎉

### Step 13: Custom Domain Setup (Optional)

1. **In Firebase Console → Hosting → Add custom domain**
2. **Enter your domain:** `yourdomain.com`
3. **Verify ownership:**
   - Add TXT record to DNS
   - Wait for verification (can take 24 hours)
4. **Connect domain:**
   - Add A records provided by Firebase
   - Wait for SSL certificate (automatic, ~15 minutes)

**DNS Records for Custom Domain:**
```
Type: A
Name: @
Value: (Firebase provides these IPs)

Type: A
Name: www
Value: (Firebase provides these IPs)

Type: TXT (for verification)
Name: @
Value: (Firebase provides this)
```

### Step 14: Enable Firebase Analytics

Already enabled if you added the Analytics script! Track:
- Page views
- User interactions
- Custom events

```javascript
// Track custom events
firebase.analytics().logEvent('game_start');
firebase.analytics().logEvent('theme_toggle', { mode: 'creative' });
firebase.analytics().logEvent('high_score', { value: score });
```

---

## Alternative Hosting Options (If Not Using Firebase)

### Option 1: Netlify (Alternative - Easiest)

### Method A: Drag & Drop (No Git Required)

1. **Build your production files:**
```bash
# If you have a build process
npm run build

# Otherwise, just organize your files:
portfolio-website/
├── index.html
├── css/
├── js/
└── assets/
```

2. **Deploy:**
   - Go to https://app.netlify.com/drop
   - Drag your project folder
   - Done! You get a URL like `random-name.netlify.app`

3. **Configure custom domain (optional):**
   - In Netlify dashboard → Domain Settings
   - Add custom domain
   - Update DNS records (Netlify provides instructions)

### Method B: Git Integration (Recommended for Updates)

1. **Initialize Git repository:**
```bash
cd portfolio-website
git init
git add .
git commit -m "Initial commit"
```

2. **Create GitHub repository:**
```bash
# Using GitHub CLI
gh repo create portfolio-website --public --source=. --remote=origin --push

# Or manually:
# - Create repo on github.com
# - Add remote: git remote add origin <YOUR_REPO_URL>
# - Push: git push -u origin main
```

3. **Connect to Netlify:**
   - Go to https://app.netlify.com
   - New site from Git → Choose GitHub
   - Select your repository
   - Build settings:
     - Build command: `npm run build` (or leave empty)
     - Publish directory: `dist` (or `.` for root)
   - Deploy!

4. **Create `netlify.toml` for configuration:**
```toml
[build]
  publish = "."
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
    
[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    
[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

---

## Option 2: Vercel

### Deploy via CLI

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Deploy:**
```bash
cd portfolio-website
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (Choose your account)
# - Link to existing project? N
# - Project name? portfolio-website
# - In which directory? ./
# - Override settings? N
```

3. **Production deployment:**
```bash
vercel --prod
```

### Deploy via Git (Automatic)

1. **Push to GitHub** (same as Netlify instructions above)

2. **Import to Vercel:**
   - Go to https://vercel.com/new
   - Import Git Repository
   - Select your repo
   - Deploy!

3. **Create `vercel.json` for configuration:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## Option 3: GitHub Pages

### Setup

1. **Create repository:**
```bash
# Repository must be named: <username>.github.io
# Or use project repository: <username>.github.io/<project-name>

git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<username>/<repo-name>.git
git push -u origin main
```

2. **Create `gh-pages` branch (if using project repo):**
```bash
git checkout -b gh-pages
git push origin gh-pages
```

3. **Enable GitHub Pages:**
   - Go to repository → Settings → Pages
   - Source: Deploy from branch
   - Branch: `gh-pages` (or `main`)
   - Folder: `/ (root)` or `/docs`
   - Save

4. **Automated deployment with GitHub Actions:**

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: './dist'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

**Access at:** `https://<username>.github.io/<repo-name>/`

---

## Option 4: Cloudflare Pages

1. **Connect Git repository:**
   - Go to https://dash.cloudflare.com
   - Pages → Create a project
   - Connect to Git → Select repository

2. **Build configuration:**
   - Framework preset: None
   - Build command: `npm run build` (or leave empty)
   - Build output directory: `dist` (or `/`)
   - Root directory: `/`

3. **Custom domain:**
   - Pages → Custom domains → Set up a custom domain
   - Add DNS records (automatic if domain on Cloudflare)

4. **Create `_headers` file for security:**
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable
```

5. **Create `_redirects` for SPA routing:**
```
/*    /index.html   200
```

---

## Option 5: Firebase Hosting

1. **Install Firebase CLI:**
```bash
npm install -g firebase-tools
```

2. **Login and initialize:**
```bash
firebase login
firebase init hosting

# Select options:
# - Use existing project or create new
# - Public directory: dist (or .)
# - Configure as single-page app: Yes
# - Set up automatic builds with GitHub: No (or Yes)
```

3. **Configure `firebase.json`:**
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

4. **Deploy:**
```bash
firebase deploy
```

---

## Pre-Deployment Optimization Script

Create `scripts/build.sh`:
```bash
#!/bin/bash

echo "🚀 Building production site..."

# Create dist directory
mkdir -p dist

# Copy files
cp index.html dist/
cp -r css dist/
cp -r js dist/
cp -r assets dist/ 2>/dev/null || :

# Minify CSS (requires npm package: clean-css-cli)
if command -v cleancss &> /dev/null; then
    echo "📦 Minifying CSS..."
    find dist/css -name "*.css" -exec cleancss -o {} {} \;
fi

# Minify JavaScript (requires npm package: terser)
if command -v terser &> /dev/null; then
    echo "📦 Minifying JavaScript..."
    find dist/js -name "*.js" -exec terser {} -o {} --compress --mangle \;
fi

# Generate integrity hashes
echo "🔒 Generating integrity hashes..."
find dist -type f \( -name "*.js" -o -name "*.css" \) -exec sha384sum {} \; > dist/integrity.txt

echo "✅ Build complete! Files ready in dist/"
```

Make executable:
```bash
chmod +x scripts/build.sh
```

---

## Custom Domain Setup (General)

### 1. Purchase domain (if needed)
- Namecheap, Google Domains, Cloudflare

### 2. Add DNS records

**For Netlify:**
```
Type: A
Name: @
Value: 75.2.60.5

Type: CNAME
Name: www
Value: <your-site>.netlify.app
```

**For Vercel:**
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**For GitHub Pages:**
```
Type: A
Name: @
Value: 185.199.108.153
       185.199.109.153
       185.199.110.153
       185.199.111.153

Type: CNAME
Name: www
Value: <username>.github.io
```

**For Cloudflare Pages:**
```
Type: CNAME
Name: @
Value: <project>.pages.dev
```

### 3. Enable HTTPS
All platforms provide free SSL - just enable in settings

### 4. Verify
```bash
# Check DNS propagation
dig <your-domain.com>

# Check HTTPS
curl -I https://<your-domain.com>
```

---

## Post-Deployment Checklist

```bash
# Test the deployed site
curl -I https://<your-url>

# Check for mixed content
# Visit site and open browser console
# Should have no warnings

# Test from different locations
# Use: https://www.webpagetest.org/

# Verify security headers
# Use: https://securityheaders.com/

# Check performance
# Use: https://pagespeed.web.dev/

# Verify mobile responsiveness
# Use Chrome DevTools device emulation
```

---

## Environment-Specific Configuration

### Development
```bash
# .env.development
NODE_ENV=development
DEBUG=true
```

### Production
```bash
# .env.production
NODE_ENV=production
DEBUG=false
```

---

## Rollback Procedure

### Netlify
```bash
# Via CLI
netlify deploy --prod --message "Rollback to previous version"

# Via UI: Deploys → Choose previous deploy → Publish deploy
```

### Vercel
```bash
# Via CLI
vercel rollback <deployment-url>

# Via UI: Deployments → Choose previous → Promote to Production
```

### GitHub Pages
```bash
# Revert Git commit
git revert HEAD
git push origin main
```

---

## Monitoring & Analytics Setup

### Google Analytics 4
```html
<!-- Add to <head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Plausible Analytics (Privacy-friendly)
```html
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

### Sentry Error Tracking
```javascript
// In your main.js
import * as Sentry from "@sentry/browser";

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: "YOUR_SENTRY_DSN",
    environment: "production",
    release: "portfolio@1.0.0"
  });
}
```

---

## Continuous Deployment Workflow

```
Developer → Commit to Git → Push to GitHub
    ↓
Auto-trigger build on hosting platform
    ↓
Run tests → Build production assets
    ↓
Deploy to staging (preview URL)
    ↓
Manual approval or auto-promote
    ↓
Deploy to production
    ↓
Notify team (Slack/Discord webhook)
```

---

## Troubleshooting Common Issues

### Issue: "404 Not Found" on refresh
**Solution:** Configure redirects to index.html (see platform-specific configs)

### Issue: CSS/JS not loading
**Solution:** Check paths - should be relative: `./css/style.css` not `/css/style.css`

### Issue: Mixed content warnings
**Solution:** Change all `http://` links to `https://` or use protocol-relative URLs

### Issue: Fonts not loading
**Solution:** Check CORS headers and font file paths

### Issue: Slow load times
**Solution:** 
- Enable compression (gzip/brotli)
- Implement CDN
- Optimize images
- Minify CSS/JS
- Use lazy loading

---

Remember: Always test locally before deploying to production!

```bash
# Test production build locally
npm run build
npx serve dist
# Visit http://localhost:3000
```
