import { DebugLogger } from '../utils/logger.js';
import { showToast } from '../../features/cms-admin/toast.js';

let activeTab = 'modules';

export function initDebugOverlay() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    let hudEl = document.getElementById('portfolio-debug-hud');
    const urlParams = new URLSearchParams(window.location.search);
    const forceShow = urlParams.has('debug');

    if (!hudEl) {
        hudEl = document.createElement('div');
        hudEl.id = 'portfolio-debug-hud';
        if (!forceShow) hudEl.classList.add('hidden');

        hudEl.innerHTML = `
            <div class="debug-hud-header">
                <div class="debug-hud-title">
                    <span>⚡ Comprehensive System Diagnostics</span>
                </div>
                <button id="debug-hud-close" style="background:none;border:none;color:#8b949e;cursor:pointer;font-size:16px;">✕</button>
            </div>
            <div class="debug-hud-nav">
                <button class="debug-nav-btn active" data-tab="modules">Modules</button>
                <button class="debug-nav-btn" data-tab="dom">DOM Check</button>
                <button class="debug-nav-btn" data-tab="data">Data Schemas</button>
                <button class="debug-nav-btn" data-tab="system">System Info</button>
                <button class="debug-nav-btn" data-tab="errors">Errors (${DebugLogger.errors.length})</button>
            </div>
            <div class="debug-hud-body" id="debug-hud-content">
                <div>Loading live telemetry...</div>
            </div>
            <div class="debug-actions-bar">
                <button class="debug-action-btn" id="debug-btn-refresh">🔄 Audit Now</button>
                <button class="debug-action-btn" id="debug-btn-test-toast">🧪 Test Toast</button>
                <button class="debug-action-btn" id="debug-btn-export">📋 Copy JSON</button>
            </div>
        `;
        document.body.appendChild(hudEl);

        document.getElementById('debug-hud-close')?.addEventListener('click', () => {
            hudEl.classList.add('hidden');
        });

        // Tab Navigation Event Handlers
        hudEl.querySelectorAll('.debug-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                hudEl.querySelectorAll('.debug-nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeTab = btn.dataset.tab;
                updateHUD(DebugLogger.runAuditReport());
            });
        });

        // Action Buttons
        document.getElementById('debug-btn-refresh')?.addEventListener('click', () => {
            showToast('Running live system audit...');
            updateHUD(DebugLogger.runAuditReport());
        });

        document.getElementById('debug-btn-test-toast')?.addEventListener('click', () => {
            showToast('Diagnostic toast system operational!');
        });

        document.getElementById('debug-btn-export')?.addEventListener('click', async () => {
            const report = DebugLogger.runAuditReport();
            const jsonStr = JSON.stringify(report, null, 2);
            try {
                await navigator.clipboard.writeText(jsonStr);
                showToast('Diagnostic report copied to clipboard!');
            } catch (err) {
                console.log('Diagnostic JSON:', jsonStr);
                showToast('Printed diagnostic JSON to console.');
            }
        });

        // Global Key Shortcut: Ctrl + Shift + D
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                hudEl.classList.toggle('hidden');
            }
        });
    }

    const updateHUD = (report) => {
        const contentEl = document.getElementById('debug-hud-content');
        if (!contentEl) return;

        let html = '';

        if (activeTab === 'modules') {
            html = report.modules.map(m => `
                <div class="debug-item-row">
                    <div>
                        <strong>${m.name}</strong>
                        ${m.details ? `<div style="font-size:10px;color:#f85149;">${m.details}</div>` : ''}
                    </div>
                    <span class="debug-badge ${m.status.toLowerCase()}">${m.status}</span>
                </div>
            `).join('') || '<div style="color:#8b949e;">No module initializations registered.</div>';
        }
        else if (activeTab === 'dom') {
            html = report.domChecks.map(d => `
                <div class="debug-item-row">
                    <div>
                        <strong>#${d.id}</strong>
                        <div style="font-size:10px;color:#8b949e;">${d.description}</div>
                    </div>
                    <span class="debug-badge ${d.found ? 'ok' : 'failed'}">${d.found ? 'BOUND' : 'MISSING'}</span>
                </div>
            `).join('') || '<div style="color:#8b949e;">No DOM bindings checked.</div>';
        }
        else if (activeTab === 'data') {
            html = report.dataValidations.map(v => `
                <div class="debug-item-row">
                    <div>
                        <strong>Collection: [${v.category}]</strong>
                        <div style="font-size:10px;color:#38bdf8;">${v.schemaDetails}</div>
                    </div>
                    <span class="debug-badge ${v.isValid ? 'ok' : 'warning'}">${v.count} Items</span>
                </div>
            `).join('') || '<div style="color:#8b949e;">No Firestore data collections loaded yet.</div>';
        }
        else if (activeTab === 'system') {
            html = `
                <div class="debug-item-row"><span>Online Status</span><span class="debug-badge ok">${report.systemInfo.onlineState}</span></div>
                <div class="debug-item-row"><span>Viewport</span><span style="font-family:monospace;">${report.systemInfo.resolution}</span></div>
                <div class="debug-item-row"><span>Spotify Cache</span><span class="debug-badge ${report.systemInfo.spotifyCached ? 'ok' : 'warning'}">${report.systemInfo.spotifyCached ? 'CACHED' : 'NONE'}</span></div>
                <div class="debug-item-row" style="flex-direction:column;align-items:flex-start;gap:4px;">
                    <span>User Agent</span>
                    <div style="font-size:10px;color:#8b949e;word-break:break-all;">${report.systemInfo.userAgent}</div>
                </div>
            `;
        }
        else if (activeTab === 'errors') {
            if (!report.errors.length) {
                html = '<div style="color:#3fb950;padding:8px;">✓ Zero unhandled errors reported. System clean!</div>';
            } else {
                html = report.errors.map(err => `
                    <div style="background:rgba(248,81,73,0.1);border:1px solid rgba(248,81,73,0.3);padding:8px;border-radius:6px;margin-bottom:6px;">
                        <div style="font-weight:700;color:#f85149;">[${err.timestamp}] ${err.type}</div>
                        <div style="font-family:monospace;font-size:11px;color:#fca5a5;margin-top:4px;">${err.message}</div>
                    </div>
                `).join('');
            }
        }

        contentEl.innerHTML = html;
    };

    DebugLogger.registerListener(updateHUD);
    updateHUD(DebugLogger.runAuditReport());
}
