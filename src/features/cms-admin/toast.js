import { escapeHtml } from '../../shared/utils/escape.js';

export function showToast(message, type = 'success') {
    const container = document.getElementById('cms-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `cms-toast ${type}`;
    toast.innerHTML = `<span>${escapeHtml(message)}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3200);
}

// Bind to window for external/auth usage
window.showToast = showToast;

export function showStatus(msg, isError = false) {
    showToast(msg, isError ? 'error' : 'success');
}
