import { escapeHtml } from '../../shared/utils/escape.js';

export function showToast(message, type = 'success') {
    if (typeof document === 'undefined') return;
    let container = document.getElementById('cms-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'cms-toast-container';
        container.style.cssText = 'position:fixed;bottom:24px;left:24px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;max-width:380px;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const isError = type === 'error';
    toast.style.cssText = `padding: 12px 18px; border-radius: 8px; font-size: 0.85rem; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-weight: 500; color: #fff; background: ${isError ? 'rgba(220,38,38,0.92)' : 'rgba(16,185,129,0.92)'}; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); transition: opacity 0.3s ease, transform 0.3s ease; opacity: 1; transform: translateY(0); pointer-events: auto;`;
    toast.innerHTML = `<span>${escapeHtml(message)}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 350);
    }, 3200);
}

if (typeof window !== 'undefined') {
    window.showToast = showToast;
    window.showStatus = showToast;
}
