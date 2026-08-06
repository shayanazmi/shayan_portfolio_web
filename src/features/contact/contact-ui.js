import { showToast } from '../cms-admin/toast.js';

export function initContactUI() {
    const copyBtn = document.getElementById('copy-email-btn');
    const emailEl = document.getElementById('contact-email-text');
    const emailStr = emailEl?.textContent?.trim() || 'shayanazmi.work@gmail.com';

    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(emailStr);
                } else {
                    const temp = document.createElement('textarea');
                    temp.value = emailStr;
                    document.body.appendChild(temp);
                    temp.select();
                    document.execCommand('copy');
                    temp.remove();
                }

                copyBtn.classList.add('copied');
                showToast('Email copied to clipboard!');

                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                }, 2000);
            } catch (err) {
                showToast('Failed to copy email.', 'error');
            }
        });
    }
}
