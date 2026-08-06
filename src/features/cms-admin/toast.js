import { escapeHtml } from '../../shared/utils/escape.js';

export function showToast(message, type = 'success') {
    if (typeof document === 'undefined') return;
    let container = document.getElementById('cms-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'cms-toast-container';
        container.className = 'cms-toast-container';
        document.body.appendChild(container);
    }

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

if (typeof window !== 'undefined') {
    window.showToast = showToast;
    window.showStatus = showToast; // Backward compatibility alias
}
