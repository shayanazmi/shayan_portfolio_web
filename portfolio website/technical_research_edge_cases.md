# Technical Research: Edge Cases & Testing Strategies
## Portfolio Website - Cinematic Theme

---

## 1. CSS Animation Edge Cases & Solutions

### 1.1 Falling Pattern Background Animation

**Current Implementation Risks:**
- Complex radial gradients (36+ layers) = CPU-intensive
- 150s animation duration on multiple background layers
- Potential performance degradation on low-end devices

**Edge Cases to Test:**
```
✓ Multiple tabs open simultaneously
✓ Animation running for >30 minutes
✓ Browser throttling (tab in background)
✓ Mobile devices (iOS Safari, Chrome Mobile)
✓ Devices with <4GB RAM
✓ High refresh rate displays (120Hz, 144Hz)
✓ Browsers with hardware acceleration disabled
```

**Solutions & Optimizations:**

1. **Reduce Complexity:**
```css
/* Use CSS Houdini Paint API for better performance */
@supports (background: paint(falling-dots)) {
  .falling-pattern-bg {
    background: paint(falling-dots);
  }
}

/* Fallback: Simplified version */
@supports not (background: paint(falling-dots)) {
  .falling-pattern-bg {
    /* Reduce to 12-18 layers instead of 36 */
    background-image: /* simplified gradients */;
  }
}
```

2. **Performance Monitoring:**
```javascript
// Detect poor performance and disable heavy animations
const checkPerformance = () => {
  let lastTime = performance.now();
  let frames = 0;
  
  const measureFPS = () => {
    frames++;
    const currentTime = performance.now();
    
    if (currentTime >= lastTime + 1000) {
      const fps = Math.round((frames * 1000) / (currentTime - lastTime));
      
      if (fps < 30) {
        // Disable heavy animations
        document.body.classList.add('reduce-animations');
      }
      
      frames = 0;
      lastTime = currentTime;
    }
    
    requestAnimationFrame(measureFPS);
  };
  
  requestAnimationFrame(measureFPS);
};
```

3. **Respect User Preferences:**
```css
@media (prefers-reduced-motion: reduce) {
  .falling-pattern-bg {
    animation: none !important;
  }
  
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 1.2 Theme Transition Animation

**Edge Cases:**
```
✓ Rapid clicking (toggle spam)
✓ Mid-transition interruption
✓ Browser paint timing issues
✓ CSS variable transition browser support
✓ Local storage failures
```

**Robust Implementation:**
```javascript
// Debounced theme toggle with state locking
let isTransitioning = false;

function toggleTheme() {
  if (isTransitioning) return;
  
  isTransitioning = true;
  const body = document.body;
  
  // Add transitioning class
  body.classList.add('theme-transitioning');
  
  // Toggle theme
  body.classList.toggle('creative-mode');
  
  // Store preference
  try {
    const theme = body.classList.contains('creative-mode') ? 'creative' : 'tech';
    localStorage.setItem('preferred-theme', theme);
  } catch (e) {
    console.warn('LocalStorage unavailable:', e);
  }
  
  // Remove lock after transition completes
  setTimeout(() => {
    isTransitioning = false;
    body.classList.remove('theme-transitioning');
  }, 1000); // Match CSS transition duration
}
```

---

## 2. Game Logic Edge Cases

### 2.1 Collision Detection Issues

**Current Risks:**
- Hitbox calculations may have off-by-one errors
- High-speed obstacles might phase through player
- Floating-point precision issues with score

**Edge Cases:**
```
✓ Extremely high speeds (score > 1000)
✓ Multiple obstacles at same X position
✓ Player at exact ground level boundary
✓ Canvas resize during gameplay
✓ requestAnimationFrame throttling
✓ Rapid jump spam
```

**Improved Collision Detection:**
```javascript
// Use swept AABB (continuous collision detection)
function checkCollision(player, obstacle, deltaTime) {
  // Calculate how far obstacle moved this frame
  const obstacleMovement = gameSpeed * deltaTime;
  
  // Check if obstacle swept through player this frame
  const willCollide = 
    player.x < obstacle.x + obstacle.w + obstacleMovement &&
    player.x + player.w > obstacle.x - obstacleMovement &&
    player.y < obstacle.y + obstacle.h &&
    player.y + player.h > obstacle.y;
  
  return willCollide;
}

// Time-corrected game loop
let lastTime = performance.now();

function gameLoop(currentTime) {
  const deltaTime = (currentTime - lastTime) / 16.67; // Normalize to 60fps
  lastTime = currentTime;
  
  updateGame(deltaTime);
  drawGame();
  
  if (!isGameOver) {
    requestAnimationFrame(gameLoop);
  }
}
```

### 2.2 Score Overflow & Display

**Edge Cases:**
```
✓ Score exceeds display width (999+)
✓ Floating-point precision loss (very long sessions)
✓ Score display during fast transitions
```

**Solution:**
```javascript
// Safe score handling
const MAX_SCORE = 9999;

function updateScore(increment) {
  score = Math.min(score + increment, MAX_SCORE);
  
  // Format with proper padding
  const displayScore = Math.floor(score)
    .toString()
    .padStart(4, '0')
    .slice(-4); // Always show last 4 digits
  
  scoreDisplay.textContent = displayScore;
}
```

### 2.3 Game State Management

**Edge Cases:**
```
✓ Start button clicked during active game
✓ Tab loses focus during gameplay
✓ Window resize mid-game
✓ Multiple start events queued
```

**Robust State Machine:**
```javascript
const GameState = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  GAME_OVER: 'game_over'
};

let currentState = GameState.IDLE;

function startGame() {
  if (currentState === GameState.RUNNING) return;
  
  currentState = GameState.RUNNING;
  resetGame();
  gameLoop(performance.now());
}

function pauseGame() {
  if (currentState !== GameState.RUNNING) return;
  currentState = GameState.PAUSED;
}

function resumeGame() {
  if (currentState !== GameState.PAUSED) return;
  currentState = GameState.RUNNING;
  lastTime = performance.now();
  gameLoop(lastTime);
}

// Auto-pause when tab loses focus
document.addEventListener('visibilitychange', () => {
  if (document.hidden && currentState === GameState.RUNNING) {
    pauseGame();
  }
});

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (currentState !== GameState.IDLE) {
      resizeCanvas();
      redrawGame();
    }
  }, 250);
});
```

---

## 3. Responsive Design Edge Cases

### 3.1 Viewport Extremes

**Test Cases:**
```
✓ Ultra-wide (3440x1440, 5120x1440)
✓ Small mobile (320px width - iPhone SE)
✓ Foldable devices (Galaxy Fold: 280px folded, 512px unfolded)
✓ Tablets in portrait/landscape
✓ Browser zoom (50% to 200%)
✓ Desktop with narrow window (<600px)
```

**Adaptive Solutions:**
```css
/* Ultra-wide monitors */
@media (min-width: 2000px) {
  .container {
    max-width: 1600px; /* Prevent excessive line length */
  }
  
  .falling-pattern-container {
    /* Scale pattern appropriately */
    transform: scale(1.5);
  }
}

/* Small mobile devices */
@media (max-width: 375px) {
  nav {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }
  
  .toggle-btn {
    padding: 0.4rem 1rem;
    font-size: 0.7rem;
  }
  
  /* Simplify animations on small screens */
  .falling-pattern-container {
    opacity: 0.5;
    animation-duration: 200s; /* Slower = less CPU */
  }
}

/* Landscape mobile (game optimization) */
@media (max-height: 500px) and (orientation: landscape) {
  #easterEggGame canvas {
    max-height: 80vh;
  }
}

/* Handle browser zoom */
@media (min-resolution: 192dpi) {
  /* Adjust for high DPI displays */
  .noise-overlay {
    opacity: 0.02; /* Reduce grain on retina */
  }
}
```

### 3.2 Touch vs Mouse Interaction

**Edge Cases:**
```
✓ Hybrid devices (touch + mouse)
✓ Touch precision on small elements
✓ Hover effects on touch devices
✓ Double-tap zoom conflicts
✓ Swipe gestures interfering with navigation
```

**Touch-Optimized Code:**
```javascript
// Detect input method and adapt
let inputMethod = 'mouse';

document.addEventListener('touchstart', () => {
  inputMethod = 'touch';
  document.body.classList.add('touch-device');
}, { once: true });

document.addEventListener('mousemove', () => {
  if (inputMethod !== 'touch') {
    document.body.classList.add('mouse-device');
  }
}, { once: true });

// Prevent double-tap zoom on game
gameCanvas.addEventListener('touchstart', (e) => {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });

// Better touch target size
document.addEventListener('DOMContentLoaded', () => {
  if ('ontouchstart' in window) {
    // Increase minimum touch targets to 44x44px (Apple guidelines)
    document.querySelectorAll('button, a').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        el.style.minWidth = '44px';
        el.style.minHeight = '44px';
      }
    });
  }
});
```

---

## 4. Browser Compatibility Edge Cases

### 4.1 CSS Custom Properties Fallbacks

**Browser Support Issues:**
```
✓ Internet Explorer (no support)
✓ Opera Mini (limited support)
✓ Old Android browsers (<Android 5.0)
```

**Progressive Enhancement:**
```css
/* Fallback for browsers without CSS variables */
body {
  background-color: #030304; /* Hard-coded fallback */
  background-color: var(--bg-color); /* Modern browsers */
}

/* Feature detection in JS */
if (!CSS.supports('color', 'var(--test)')) {
  // Load alternative stylesheet or show upgrade message
  const fallbackStyles = document.createElement('link');
  fallbackStyles.rel = 'stylesheet';
  fallbackStyles.href = 'css/fallback-legacy.css';
  document.head.appendChild(fallbackStyles);
}
```

### 4.2 Backdrop Filter Support

**Browser Support:**
```
✓ Safari: Full support
✓ Chrome: Full support (with prefix historically)
✓ Firefox: Enabled by default since v103
✓ Older browsers: No support
```

**Graceful Degradation:**
```css
@supports (backdrop-filter: blur(20px)) or (-webkit-backdrop-filter: blur(20px)) {
  nav {
    background: rgba(10, 10, 12, 0.4);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
}

@supports not ((backdrop-filter: blur(20px)) or (-webkit-backdrop-filter: blur(20px))) {
  nav {
    background: rgba(10, 10, 12, 0.95); /* More opaque fallback */
  }
}
```

---

## 5. Performance Testing Methodology

### 5.1 Automated Performance Tests

**Tools & Metrics:**

1. **Lighthouse CI** (continuous integration)
```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: 'npm run serve',
      url: ['http://localhost:8080']
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'interactive': ['error', { maxNumericValue: 3000 }],
        'speed-index': ['error', { maxNumericValue: 2500 }]
      }
    }
  }
};
```

2. **Custom Performance Monitors:**
```javascript
// performance-monitor.js
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.observers = {};
  }
  
  // Monitor Long Tasks (>50ms)
  monitorLongTasks() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.warn('Long task detected:', entry.duration.toFixed(2) + 'ms');
          // Send to analytics
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.longTask = observer;
    }
  }
  
  // Monitor Layout Shifts (CLS)
  monitorLayoutShifts() {
    let clsValue = 0;
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      
      this.metrics.cls = clsValue;
      
      if (clsValue > 0.1) {
        console.warn('High Cumulative Layout Shift:', clsValue.toFixed(3));
      }
    });
    
    observer.observe({ type: 'layout-shift', buffered: true });
    this.observers.layoutShift = observer;
  }
  
  // Monitor Memory Usage
  monitorMemory() {
    if (performance.memory) {
      setInterval(() => {
        const usedMB = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
        const limitMB = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2);
        
        this.metrics.memory = {
          used: usedMB,
          limit: limitMB,
          percentage: ((usedMB / limitMB) * 100).toFixed(1)
        };
        
        if ((usedMB / limitMB) > 0.9) {
          console.warn('High memory usage detected:', usedMB + 'MB / ' + limitMB + 'MB');
        }
      }, 10000); // Check every 10 seconds
    }
  }
  
  // Generate Performance Report
  getReport() {
    const navigation = performance.getEntriesByType('navigation')[0];
    
    return {
      pageLoad: {
        dns: (navigation.domainLookupEnd - navigation.domainLookupStart).toFixed(2) + 'ms',
        tcp: (navigation.connectEnd - navigation.connectStart).toFixed(2) + 'ms',
        request: (navigation.responseStart - navigation.requestStart).toFixed(2) + 'ms',
        response: (navigation.responseEnd - navigation.responseStart).toFixed(2) + 'ms',
        domProcessing: (navigation.domComplete - navigation.domLoading).toFixed(2) + 'ms',
        total: (navigation.loadEventEnd - navigation.fetchStart).toFixed(2) + 'ms'
      },
      coreWebVitals: {
        cls: this.metrics.cls?.toFixed(3) || 'N/A',
        fcp: this.getMetric('first-contentful-paint'),
        lcp: this.getMetric('largest-contentful-paint'),
        fid: this.getMetric('first-input'),
        ttfb: (navigation.responseStart - navigation.fetchStart).toFixed(2) + 'ms'
      },
      memory: this.metrics.memory || 'N/A'
    };
  }
  
  getMetric(name) {
    const entry = performance.getEntriesByName(name)[0];
    return entry ? entry.startTime.toFixed(2) + 'ms' : 'N/A';
  }
}

// Initialize monitoring in development
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  const monitor = new PerformanceMonitor();
  monitor.monitorLongTasks();
  monitor.monitorLayoutShifts();
  monitor.monitorMemory();
  
  // Expose to console
  window.getPerformanceReport = () => console.table(monitor.getReport());
}
```

### 5.2 Load Testing Scenarios

**Stress Tests:**
```
1. Idle page for 1 hour (check for memory leaks)
2. Rapid theme toggling (100 switches in 30 seconds)
3. Game session >20 minutes (check performance degradation)
4. Multiple browser tabs (10+ tabs with same site)
5. Slow 3G network simulation
6. CPU throttling (4x slowdown in DevTools)
7. Simultaneous animations (scroll + game + theme transition)
```

---

## 6. Accessibility Testing & Fixes

### 6.1 Keyboard Navigation

**Requirements:**
```
✓ Tab through all interactive elements
✓ Skip to content link
✓ Focus indicators visible
✓ Escape key closes modals
✓ Arrow keys for carousel/sliders
✓ Enter/Space activate buttons
```

**Implementation:**
```javascript
// Keyboard navigation enhancement
document.addEventListener('keydown', (e) => {
  // Escape key handling
  if (e.key === 'Escape') {
    closeModals();
    if (currentState === GameState.RUNNING) {
      pauseGame();
    }
  }
  
  // Skip to main content
  if (e.key === '1' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    document.querySelector('main').focus();
  }
});

// Visible focus indicators
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    document.body.classList.add('user-is-tabbing');
  }
});

document.addEventListener('mousedown', () => {
  document.body.classList.remove('user-is-tabbing');
});
```

```css
/* Only show focus outlines for keyboard users */
body:not(.user-is-tabbing) *:focus {
  outline: none;
}

.user-is-tabbing *:focus {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
}
```

### 6.2 Screen Reader Support

**ARIA Enhancements:**
```html
<!-- Improved navigation -->
<nav aria-label="Main navigation">
  <div class="nav-logo" aria-label="Shayan Azmi, Home">SA</div>
  <button 
    class="toggle-btn" 
    aria-label="Toggle between tech and creative mode"
    aria-pressed="false"
    id="themeToggle">
    <span aria-hidden="true">Mode</span>
  </button>
</nav>

<!-- Game with proper ARIA -->
<section id="easterEggGame" aria-label="Interactive game section">
  <canvas 
    id="gameCanvas" 
    role="application"
    aria-label="Pixelated runner game. Press space or tap to jump."></canvas>
  <div id="gameOverlay" aria-live="polite">
    <div id="scoreDisplay">000</div>
    <button id="startBtn" aria-label="Start game">Initialize</button>
  </div>
</section>

<!-- Announce theme changes -->
<div id="announcer" class="sr-only" aria-live="polite" aria-atomic="true"></div>
```

```javascript
// Announce theme changes
function announceThemeChange(newTheme) {
  const announcer = document.getElementById('announcer');
  announcer.textContent = `Theme changed to ${newTheme} mode`;
}
```

---

## 7. Security Considerations

### 7.1 Content Security Policy

```html
<!-- Recommended CSP headers -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data:;
  connect-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
">
```

### 7.2 Input Sanitization

**If adding forms or user input:**
```javascript
// Sanitize any user input
function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

// Validate before localStorage
function safeLocalStorage(key, value) {
  try {
    if (typeof value === 'string' && value.length < 1000) {
      localStorage.setItem(sanitizeInput(key), sanitizeInput(value));
    }
  } catch (e) {
    console.warn('Storage failed:', e);
  }
}
```

---

## 8. Deployment Checklist

### Pre-Deployment Tests

```markdown
## Final QA Checklist

### Functionality
- [ ] Theme toggle works in all browsers
- [ ] All animations play smoothly
- [ ] Game is playable and responsive
- [ ] No console errors
- [ ] No console warnings (or documented)
- [ ] All links work
- [ ] Forms submit correctly (if any)

### Performance
- [ ] Lighthouse score >90 (Performance)
- [ ] First Contentful Paint <2s
- [ ] Time to Interactive <3s
- [ ] No layout shifts (CLS < 0.1)
- [ ] No memory leaks (tested 1hr session)
- [ ] Animations maintain 60fps

### Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] iOS Safari
- [ ] Chrome Mobile
- [ ] Tested on slow 3G
- [ ] Tested with JS disabled (graceful degradation)

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Color contrast WCAG AA
- [ ] No flashing content >3Hz
- [ ] Resize text to 200% (readable)
- [ ] Alt text on images

### SEO & Meta
- [ ] Title tag optimized
- [ ] Meta description set
- [ ] Open Graph tags
- [ ] Twitter Card tags
- [ ] Favicon.ico
- [ ] robots.txt
- [ ] sitemap.xml
- [ ] Structured data (Schema.org)

### Security
- [ ] HTTPS enabled
- [ ] CSP headers set
- [ ] No inline scripts (or nonce)
- [ ] No mixed content warnings
- [ ] Security headers (X-Frame-Options, etc.)

### Analytics & Monitoring
- [ ] Analytics installed
- [ ] Error tracking set up
- [ ] Uptime monitoring configured
- [ ] Performance monitoring active
```

---

## 9. Common Pitfalls & Solutions

### 9.1 Memory Leaks

**Common Sources:**
```javascript
// ❌ BAD: Event listeners never removed
window.addEventListener('scroll', handleScroll);

// ✅ GOOD: Clean up properly
const controller = new AbortController();
window.addEventListener('scroll', handleScroll, { signal: controller.signal });
// Later: controller.abort();

// ❌ BAD: setInterval never cleared
setInterval(() => updateAnimation(), 16);

// ✅ GOOD: Store and clear
const intervalId = setInterval(() => updateAnimation(), 16);
// Later: clearInterval(intervalId);

// ❌ BAD: DOM references in closures
function createHandler() {
  const element = document.querySelector('.heavy-element');
  return () => doSomethingWith(element); // Keeps element alive
}

// ✅ GOOD: Clear references when done
function createHandler() {
  const element = document.querySelector('.heavy-element');
  const handler = () => {
    doSomethingWith(element);
    element = null; // Allow GC
  };
  return handler;
}
```

### 9.2 Z-Index Conflicts

**Current Stack:**
```
.nav-wrapper: z-index: 100
.noise-overlay: z-index: 9998
```

**Solution: Define z-index scale:**
```css
:root {
  --z-background: -1;
  --z-content: 1;
  --z-overlay: 10;
  --z-modal: 100;
  --z-nav: 1000;
  --z-effects: 9998;
  --z-toast: 9999;
}
```

---

## 10. Recommended Testing Tools

### Automated Testing
1. **Playwright** - E2E testing
2. **Jest** - Unit testing
3. **Lighthouse CI** - Performance
4. **axe-core** - Accessibility
5. **Percy** - Visual regression

### Manual Testing
1. **BrowserStack** - Cross-browser testing
2. **Chrome DevTools** - Performance profiling
3. **Firefox Accessibility Inspector**
4. **Wave** - Accessibility checker
5. **PageSpeed Insights**

### Monitoring (Post-Deploy)
1. **Sentry** - Error tracking
2. **Google Analytics** - Usage analytics
3. **UptimeRobot** - Uptime monitoring
4. **Cloudflare Analytics** - Traffic insights

---

This document should be used as a reference during development and testing phases. Each edge case should be documented when discovered and the solution should be tested before deployment.
