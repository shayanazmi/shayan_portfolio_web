/**
 * Advanced System Diagnostics & Telemetry Suite
 * Performs deep health audits across modules, rendering functions, DOM element bindings,
 * data schema structures, local storage, and Firestore snapshot connections.
 */

class ComprehensiveDiagnosticLogger {
    constructor() {
        this.modules = new Map();
        this.domChecks = new Map();
        this.dataValidations = new Map();
        this.errors = [];
        this.listeners = new Set();
        this.initListeners();
    }

    initListeners() {
        if (typeof window === 'undefined') return;

        window.addEventListener('error', (event) => {
            this.recordError('Global Error', event.message, event.filename, event.lineno, event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            const reason = event.reason ? (event.reason.stack || event.reason.message || event.reason) : 'Unhandled promise rejection';
            this.recordError('Unhandled Rejection', String(reason));
        });
    }

    trackInit(moduleName, status, details = null) {
        const record = {
            name: moduleName,
            status,
            details: details ? (details.message || String(details)) : null,
            timestamp: new Date().toLocaleTimeString()
        };
        this.modules.set(moduleName, record);
        this.notifyOverlay();
    }

    recordDOMCheck(elementId, found, description = '') {
        this.domChecks.set(elementId, {
            id: elementId,
            found: !!found,
            description,
            timestamp: new Date().toLocaleTimeString()
        });
        this.notifyOverlay();
    }

    recordDataValidation(category, isValid, count = 0, schemaDetails = '') {
        this.dataValidations.set(category, {
            category,
            isValid,
            count,
            schemaDetails,
            timestamp: new Date().toLocaleTimeString()
        });
        this.notifyOverlay();
    }

    recordError(type, message, source = null, line = null, errorObj = null) {
        const errorRecord = {
            type,
            message,
            source,
            line,
            stack: errorObj?.stack || null,
            timestamp: new Date().toLocaleTimeString()
        };
        this.errors.unshift(errorRecord);
        if (this.errors.length > 25) this.errors.pop();
        console.error(`[Diagnostics] [${type}] ${message}`, errorObj || '');
        this.notifyOverlay();
    }

    registerListener(fn) {
        this.listeners.add(fn);
    }

    unregisterListener(fn) {
        this.listeners.delete(fn);
    }

    notifyOverlay() {
        const report = this.runAuditReport();
        this.listeners.forEach(fn => {
            try { fn(report); } catch (e) { /* ignore listener errors */ }
        });
    }

    runAuditReport() {
        if (typeof document !== 'undefined') {
            const targetElements = [
                ['tech-hero-section', 'Tech Hero Section Container'],
                ['creative-hero-section', 'Creative Hero Section Container'],
                ['falling-pattern-canvas', 'Tech Particle Canvas'],
                ['entropy-canvas', 'Creative Entropy Canvas'],
                ['dino-game', 'Cyber Dino Runner Canvas'],
                ['projects-container', 'Projects List Container'],
                ['experience-container', 'Experience Timeline Container'],
                ['education-container', 'Education List Container'],
                ['gallery-container', 'Photo Gallery Grid Container'],
                ['copy-email-btn', 'Copy Email Action Button'],
                ['admin-panel', 'CMS Admin Panel Shell'],
                ['cms-toast-container', 'Stacked Toast Container']
            ];

            targetElements.forEach(([id, desc]) => {
                const el = document.getElementById(id);
                this.domChecks.set(id, {
                    id,
                    found: !!el,
                    visible: el ? el.offsetWidth > 0 && el.offsetHeight > 0 : false,
                    description: desc
                });
            });

            if (window.globalManageData) {
                Object.keys(window.globalManageData).forEach(cat => {
                    const data = window.globalManageData[cat];
                    const isArr = Array.isArray(data);
                    const count = isArr ? data.length : 0;
                    this.dataValidations.set(cat, {
                        category: cat,
                        isValid: isArr,
                        count,
                        schemaDetails: isArr ? `Array<Object> [${count} items]` : typeof data
                    });
                });
            }
        }

        return {
            modules: Array.from(this.modules.values()),
            domChecks: Array.from(this.domChecks.values()),
            dataValidations: Array.from(this.dataValidations.values()),
            errors: [...this.errors],
            systemInfo: {
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
                resolution: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight} @ DPR ${window.devicePixelRatio}` : '',
                onlineState: typeof navigator !== 'undefined' ? (navigator.onLine ? 'Online' : 'Offline') : 'Unknown',
                spotifyCached: typeof localStorage !== 'undefined' ? !!localStorage.getItem('spotify_embed_url') : false
            },
            timestamp: new Date().toLocaleTimeString()
        };
    }
}

export const DebugLogger = new ComprehensiveDiagnosticLogger();

if (typeof window !== 'undefined') {
    window.__PORTFOLIO_DIAGNOSTICS__ = () => {
        const report = DebugLogger.runAuditReport();
        console.group('⚡ Portfolio Comprehensive System Diagnostics Report');
        console.log('Modules Initialization Status:');
        console.table(report.modules);
        console.log('DOM Bindings & Containers:');
        console.table(report.domChecks);
        console.log('Data Schemas & Firestore Cache:');
        console.table(report.dataValidations);
        if (report.errors.length) {
            console.warn('Recent Errors Logged:');
            console.table(report.errors);
        }
        console.groupEnd();
        return report;
    };
}
