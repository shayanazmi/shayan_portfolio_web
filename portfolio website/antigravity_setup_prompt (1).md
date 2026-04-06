# Portfolio Website Setup & Deployment Prompt

## Project Overview
I need help setting up and deploying my cinematic portfolio website (Shayan Azmi | Cinematic). The project is a single-page HTML file with advanced CSS animations, theme switching, and interactive elements including an embedded game.

## Current State
- **File:** Single HTML file (`portfolio_website.html`) containing all code (HTML, CSS, JavaScript)
- **Key Features:**
  - Dual theme mode (Tech Mode / Creative Mode) with smooth transitions
  - Cinematic effects (film grain, ambient lighting, falling patterns)
  - Floating navigation with glassmorphism
  - Interactive sections with scroll animations
  - Embedded pixel-art game (dino runner style)
  - Responsive design with custom scrollbar
  - Google Fonts integration (Inter, Playfair Display)

## My System Specifications

**Please analyze and adapt for:**
- Operating System: [SPECIFY: Windows/Mac/Linux + version]
- RAM: [SPECIFY: e.g., 8GB/16GB/32GB]
- Browser(s): [SPECIFY: Chrome/Firefox/Safari + versions]
- Code Editor: [SPECIFY: VS Code/Sublime/etc.]
- Node.js version (if installed): [SPECIFY or "Not installed"]
- Git installed: [Yes/No]

## Setup Requirements

### 1. Project Structure Organization
Create a proper project structure that separates concerns:

```
portfolio-website/
├── index.html              # Main HTML (refactored)
├── css/
│   ├── reset.css          # CSS reset and base styles
│   ├── variables.css      # CSS custom properties
│   ├── themes.css         # Tech/Creative mode themes
│   ├── animations.css     # Keyframes and transitions
│   ├── components.css     # Navigation, cards, sections
│   └── game.css           # Game-specific styles
├── js/
│   ├── main.js            # Core functionality
│   ├── theme-toggle.js    # Theme switching logic
│   ├── animations.js      # Scroll animations, parallax
│   ├── game.js            # Game logic separated
│   └── utils.js           # Helper functions
├── assets/
│   ├── images/            # Any images (if added later)
│   └── fonts/             # Local fonts (optional)
├── tests/
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── .gitignore
├── README.md
└── package.json           # If using npm for dev tools
```

**Task:** Refactor the single HTML file into this modular structure while maintaining all functionality.

### 2. Local Development Setup

#### A. Basic Setup (No Build Tools)
- Set up a local development server
- Configure live reload for development
- Test on multiple browsers (Chrome, Firefox, Safari if on Mac)
- Ensure mobile responsive testing

#### B. Advanced Setup (Recommended)
- Initialize npm/package.json
- Set up development dependencies:
  - Live server (e.g., `live-server` or `browser-sync`)
  - CSS preprocessor (optional: SCSS/SASS)
  - JavaScript linter (ESLint)
  - Code formatter (Prettier)
  - Minification tools for production
- Create npm scripts for:
  - `npm run dev` - Start development server
  - `npm run build` - Build for production
  - `npm run test` - Run tests
  - `npm run lint` - Check code quality

### 3. Testing & Quality Assurance

#### Critical Tests Needed:

**A. Visual Regression Testing**
- Theme switching (Tech ↔ Creative mode)
- Smooth color transitions between modes
- Falling pattern animations performance
- Film grain overlay consistency
- Glassmorphism effects on navigation

**B. Functionality Testing**
- [ ] Theme toggle button works correctly
- [ ] All navigation links function (if internal links exist)
- [ ] Scroll animations trigger at correct positions
- [ ] Game starts/restarts properly
- [ ] Game collision detection accuracy
- [ ] Score tracking and display
- [ ] Responsive breakpoints (mobile, tablet, desktop)

**C. Performance Testing**
- [ ] Page load time (target: <3 seconds)
- [ ] Animation frame rate (target: 60fps)
- [ ] Memory usage during extended sessions
- [ ] Game performance over time
- [ ] CSS animation performance (no janky scrolling)

**D. Cross-Browser Compatibility**
Test thoroughly on:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)  
- Safari (if on Mac)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

**E. Accessibility Testing**
- [ ] Keyboard navigation works
- [ ] Color contrast ratios meet WCAG AA standards
- [ ] Focus indicators visible
- [ ] Game is keyboard accessible (Space/Arrow keys work)
- [ ] Semantic HTML structure
- [ ] Screen reader compatibility (basic level)

### 4. Edge Cases & Error Handling

**Implement robust handling for:**

1. **Font Loading Failures**
   - Fallback fonts if Google Fonts fail to load
   - Flash of unstyled text (FOUT) prevention

2. **Animation Performance Issues**
   - Reduce motion for users with `prefers-reduced-motion`
   - Graceful degradation on low-end devices
   - Pause animations when tab is not visible

3. **Browser Support**
   - Fallbacks for older browsers (CSS Grid, Custom Properties)
   - Polyfills for missing features
   - Graceful degradation messages

4. **Viewport & Screen Sizes**
   - Ultra-wide monitors (>2000px)
   - Small mobile devices (<375px)
   - Orientation changes (portrait ↔ landscape)
   - Zoom levels (up to 200%)

5. **Game Edge Cases**
   - Rapid clicking/spamming
   - Tab switching during gameplay
   - Window resizing during game
   - Multiple instances prevention
   - Score overflow handling

6. **Network Issues**
   - Offline functionality considerations
   - CDN fallbacks (Google Fonts)
   - Asset loading errors

### 5. Code Quality & Optimization

**Implement:**
- [ ] CSS minification for production
- [ ] JavaScript minification and bundling
- [ ] Remove unused CSS (PurgeCSS or similar)
- [ ] Image optimization (if any are added)
- [ ] Font subsetting for Google Fonts
- [ ] Critical CSS inlining
- [ ] Lazy loading for non-critical elements
- [ ] Code splitting for JavaScript

**Best Practices:**
- Use semantic HTML5 elements
- Implement proper meta tags (SEO, social sharing)
- Add structured data (Schema.org)
- Ensure HTTPS deployment
- Add security headers
- Implement CSP (Content Security Policy)

### 6. Deployment Strategy

#### Option A: Static Hosting (Recommended for this project)
**Platforms to consider:**
1. **Netlify** (Easiest)
   - Drag-and-drop deployment
   - Free SSL/HTTPS
   - CDN included
   - Form handling support
   - Custom domain support

2. **Vercel**
   - GitHub integration
   - Automatic deployments
   - Edge network
   - Analytics included

3. **GitHub Pages**
   - Free hosting
   - Direct GitHub integration
   - Custom domain support
   - Requires public repo (or paid GitHub)

4. **Cloudflare Pages**
   - Fast global CDN
   - Free tier generous
   - DDoS protection

**Deployment Checklist:**
- [ ] Set up Git repository
- [ ] Create production build
- [ ] Test production build locally
- [ ] Set up deployment platform
- [ ] Configure custom domain (if applicable)
- [ ] Enable SSL/HTTPS
- [ ] Set up analytics (Google Analytics, Plausible, etc.)
- [ ] Configure redirects (if needed)
- [ ] Test deployed site thoroughly
- [ ] Set up continuous deployment (Git-based)

#### Option B: Self-Hosted
If you prefer control:
- Set up nginx/Apache
- Configure SSL with Let's Encrypt
- Set up proper caching headers
- Implement CDN (Cloudflare)

### 7. Git Workflow & Version Control

**Initialize repository:**
```bash
git init
git add .
git commit -m "Initial commit: Portfolio website refactored"
git branch -M main
git remote add origin [YOUR_REPO_URL]
git push -u origin main
```

**Branching strategy:**
- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `hotfix/*` - Emergency fixes

### 8. Continuous Improvement

**Set up monitoring:**
- [ ] Performance monitoring (Lighthouse CI)
- [ ] Error tracking (Sentry, LogRocket)
- [ ] Analytics (track user interactions)
- [ ] Uptime monitoring (UptimeRobot, Pingdom)

**Future enhancements to consider:**
- Progressive Web App (PWA) support
- Dark mode refinements
- Additional interactive elements
- Blog/projects dynamic content
- Contact form backend integration

## Specific Technical Requirements

### Critical Functionality to Preserve:
1. **Theme Toggle System**
   - Preserve the smooth 1s cubic-bezier transition
   - Maintain CSS variable system
   - Ensure localStorage persistence (add this!)

2. **Falling Pattern Animation**
   - Optimize for performance (currently CPU-intensive)
   - Consider using Canvas or WebGL for better performance
   - Add option to disable for low-end devices

3. **Game Functionality**
   - Ensure collision detection is pixel-perfect
   - Maintain 60fps during gameplay
   - Add pause/resume functionality
   - Save high score to localStorage

4. **Scroll Animations**
   - Use Intersection Observer API (if not already)
   - Ensure smooth performance
   - Debounce scroll events

### Performance Optimization Tasks:

1. **CSS Optimizations:**
   - Use `will-change` for animated elements
   - Implement CSS containment
   - Use `transform` and `opacity` for animations
   - Avoid layout thrashing

2. **JavaScript Optimizations:**
   - Use `requestAnimationFrame` for game loop
   - Debounce/throttle scroll and resize handlers
   - Use event delegation
   - Minimize DOM queries

3. **Loading Optimizations:**
   - Preconnect to Google Fonts
   - Use `font-display: swap`
   - Defer non-critical JavaScript
   - Implement resource hints

## Expected Deliverables

1. **Organized project structure** with separated files
2. **Development environment** with live reload
3. **Testing suite** with automated tests
4. **Production build** optimized and minified
5. **Deployed website** on chosen platform
6. **Documentation:**
   - README.md with setup instructions
   - DEPLOYMENT.md with deployment guide
   - CHANGELOG.md for version tracking
   - Code comments for complex logic

7. **Testing report** covering all edge cases
8. **Performance report** (Lighthouse scores)
9. **Browser compatibility matrix**

## Questions to Answer During Setup

1. Should we add a build process (Webpack/Vite/Parcel)?
2. Do you want TypeScript for type safety?
3. Should we implement a CMS for easy content updates?
4. Do you need a contact form backend?
5. Should we add more games/interactive elements?
6. Do you want analytics integrated?
7. Should we create a staging environment?

## Success Criteria

- ✅ Website runs smoothly on my local machine
- ✅ All features work identically to the original
- ✅ Code is modular and maintainable
- ✅ Tests pass with 100% critical path coverage
- ✅ Performance score >90 on Lighthouse
- ✅ Works on all major browsers
- ✅ Responsive on all screen sizes
- ✅ Successfully deployed and accessible via URL
- ✅ No console errors or warnings
- ✅ Smooth 60fps animations

## Timeline Suggestion

- Day 1: Project refactoring and structure setup
- Day 2: Testing infrastructure and edge case handling  
- Day 3: Performance optimization
- Day 4: Deployment and DNS configuration
- Day 5: Final testing and documentation

---

## CRITICAL: Firebase Backend Hosting Requirement

**Backend hosting MUST be done on Firebase.** The setup must include:

### Firebase Configuration Required:
1. **Firebase Hosting** - For the static frontend
2. **Firebase Firestore** - For any database needs (game scores, user preferences, etc.)
3. **Firebase Authentication** - If user accounts are needed
4. **Firebase Functions** - For any backend logic/API endpoints
5. **Firebase Storage** - For any file uploads (if needed)

### Firebase Setup Tasks:
- [ ] Create Firebase project
- [ ] Initialize Firebase in the project directory
- [ ] Configure Firebase Hosting for the portfolio
- [ ] Set up Firestore rules and security
- [ ] Configure environment variables for Firebase config
- [ ] Set up Firebase Functions for any backend logic
- [ ] Test Firebase deployment pipeline
- [ ] Configure custom domain on Firebase Hosting

**Firebase Project Structure Required:**
```
portfolio-website/
├── public/                 # Frontend files (served by Firebase Hosting)
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
├── functions/              # Firebase Cloud Functions (backend)
│   ├── index.js
│   ├── package.json
│   └── .env
├── firestore.rules         # Database security rules
├── storage.rules           # Storage security rules (if needed)
├── firebase.json           # Firebase configuration
└── .firebaserc             # Firebase project settings
```

---

## MANDATORY: User Confirmation & Core Logic Preservation Rules

### RULE 1: ASK FOR ALL USER DETAILS - NEVER ASSUME

**When you need information, ALWAYS ask the user directly:**
- System specifications (OS, RAM, browser, etc.)
- Firebase project details (project ID, region preferences)
- Domain name and DNS provider
- API keys or credentials (user will provide securely)
- Feature preferences and priorities
- Deployment timeline constraints
- Budget constraints (if any paid services)
- Any personal preferences for tools/frameworks

**DO NOT:**
- Assume default values
- Use placeholder values without confirmation
- Make decisions about user environment without asking
- Proceed with incomplete information

### RULE 2: ZERO TOLERANCE FOR UNAUTHORIZED CORE LOGIC CHANGES

**CORE LOGIC INCLUDES:**
- Theme switching mechanism (Tech ↔ Creative mode)
- Game physics and collision detection
- Animation timing and transitions
- CSS variable system
- Falling pattern animation algorithm
- Scroll behavior and triggers
- Canvas rendering logic
- Event handlers and user interactions
- State management
- Score calculation
- Navigation behavior

**BEFORE making ANY change to core logic, you MUST:**

1. **Identify the current behavior:**
   ```
   CURRENT LOGIC EXPLANATION:
   - What the code currently does
   - How it works (step-by-step)
   - What the expected behavior is
   - Why it was implemented this way
   ```

2. **Explain the proposed change:**
   ```
   PROPOSED CHANGE:
   - What will be modified
   - Why it needs to be changed
   - How the new implementation will work
   - What the new behavior will be
   - What might break or change for the user
   ```

3. **Wait for explicit user approval:**
   ```
   USER APPROVAL REQUIRED:
   [ ] User has reviewed current vs proposed logic
   [ ] User has explicitly approved the change
   [ ] User understands the implications
   ```

**ONLY AFTER USER SAYS "YES" OR "APPROVED" can you proceed.**

### Example of Required Confirmation Format:

```markdown
⚠️ CORE LOGIC CHANGE REQUEST ⚠️

LOCATION: js/game.js, line 156-178 (collision detection)

CURRENT LOGIC:
The collision detection currently uses simple AABB (Axis-Aligned Bounding Box) 
checking. It compares the player's hitbox (30x35px at position x=100, y=dinoY) 
with obstacle positions every frame. The hitbox is slightly smaller than the 
visual sprite to be more forgiving to the player.

PROPOSED CHANGE:
Implement swept AABB collision detection to prevent high-speed obstacles from 
phasing through the player at high game speeds (>20). This checks the path 
the obstacle traveled during the frame, not just its current position.

IMPACT:
- Game will feel slightly harder (fewer "close call" passes)
- No more unfair deaths from ultra-fast obstacles
- Adds ~5 lines of code
- Performance impact: negligible (<1ms per frame)

RISK LEVEL: Medium
- Changes how collisions feel
- Players might notice difference in difficulty

Do you approve this change? (Type "APPROVED" to proceed, or suggest modifications)
```

### RULE 3: Refactoring Rules

**You MAY refactor WITHOUT asking when:**
- Moving code to separate files (no logic changes)
- Adding comments and documentation
- Renaming variables for clarity (keeping behavior identical)
- Formatting code (prettier, linting)
- Adding console logs for debugging
- Creating utility functions that wrap existing code

**You MUST ask BEFORE:**
- Changing any algorithm or calculation
- Modifying timing values (animation durations, game speed)
- Altering event handlers or their triggers
- Changing CSS values that affect visual appearance
- Modifying data structures
- Adding new dependencies or libraries
- Changing any user-facing behavior

### RULE 4: Bug Fixes Require Explanation

**If you find a bug, follow this format:**

```markdown
🐛 BUG IDENTIFIED

LOCATION: [file and line numbers]

CURRENT BUGGY BEHAVIOR:
[Describe what's wrong and how to reproduce it]

ROOT CAUSE:
[Explain why it's happening]

PROPOSED FIX:
[Explain the solution]

WILL THIS CHANGE USER EXPERIENCE?
[Yes/No and explain how]

May I fix this? (Type "FIX IT" to approve)
```

---

## Instructions for AI Assistant (Antigravity)

### Your Mission:
Analyze the user's system specifications and portfolio website, then help them set up a production-ready deployment on Firebase with a clean, organized codebase.

### Your Constraints:
1. **Ask, don't assume** - Get all details from the user directly
2. **Preserve core logic** - Never change functionality without explicit approval
3. **Explain before acting** - Always clarify what you're about to do and why
4. **Firebase-first** - All backend services must use Firebase
5. **No surprises** - User should understand every decision you make

### Your Workflow:

**PHASE 1: Information Gathering (ASK USER)**
```
Before starting ANY work, ask the user for:
- [ ] System specifications (OS, RAM, Node.js version, browser)
- [ ] Firebase project details (do they have one? project ID?)
- [ ] Custom domain (if any)
- [ ] Do they want analytics? (GA4, Plausible, other?)
- [ ] Do they need user accounts? (Firebase Auth setup)
- [ ] Any backend features needed? (save high scores, contact form, etc.)
- [ ] Timeline and urgency level
- [ ] Preferred code editor
```

**PHASE 2: Analysis**
```
- Review the current HTML file thoroughly
- Identify all core logic components
- List potential issues or improvements
- Create refactoring plan
- PRESENT PLAN TO USER - wait for approval
```

**PHASE 3: Implementation (WITH ONGOING CONFIRMATION)**
```
For each major task:
1. Explain what you're about to do
2. If it touches core logic → Use the confirmation format above
3. Implement only after approval
4. Test thoroughly
5. Report results to user
```

**PHASE 4: Firebase Setup**
```
1. Guide user through Firebase project creation
2. Set up Firebase configuration files
3. Initialize Firebase services needed
4. Configure security rules
5. Set up deployment pipeline
6. Test Firebase hosting
```

**PHASE 5: Testing & Quality**
```
1. Run all tests from the testing checklist
2. Document any issues found
3. Get user approval for fixes
4. Implement approved fixes
5. Re-test until clean
```

**PHASE 6: Deployment**
```
1. Create production build
2. Deploy to Firebase Hosting
3. Configure custom domain (if applicable)
4. Set up monitoring and analytics
5. Verify everything works in production
```

### Communication Style:

**DO:**
- ✅ Ask questions before making assumptions
- ✅ Explain technical decisions in plain language
- ✅ Provide progress updates at each phase
- ✅ Highlight issues early with severity levels
- ✅ Offer alternatives when applicable
- ✅ Break complex tasks into clear steps
- ✅ Use formatting (checkboxes, code blocks, headers) for clarity
- ✅ Test thoroughly and report test results

**DON'T:**
- ❌ Make changes without explaining first
- ❌ Assume user's environment or preferences
- ❌ Touch core logic without the formal approval process
- ❌ Use vague language like "optimize" or "improve" (be specific)
- ❌ Skip testing steps
- ❌ Leave user guessing what you're doing
- ❌ Proceed with incomplete information

### When You Make Mistakes:

**If you accidentally changed core logic without approval:**
```
1. STOP immediately
2. Revert the change
3. Apologize to the user
4. Explain what you changed
5. Show the diff (before vs after)
6. Ask for proper approval using the format above
```

---

## Success Criteria

The project is complete when:
- ✅ User explicitly approves all core logic changes (if any)
- ✅ Website runs smoothly on user's local machine
- ✅ All features work identically to the original
- ✅ Code is modular and maintainable
- ✅ Tests pass with 100% critical path coverage
- ✅ Performance score >90 on Lighthouse
- ✅ Works on all major browsers
- ✅ Responsive on all screen sizes
- ✅ Successfully deployed to Firebase Hosting
- ✅ Custom domain configured (if applicable)
- ✅ No console errors or warnings
- ✅ Smooth 60fps animations
- ✅ User is happy and confident with the setup

---

**Remember: The user's trust is everything. When in doubt, ask. Never surprise them with changes to their website's behavior.**
