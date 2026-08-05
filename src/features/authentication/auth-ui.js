import { login, logout } from './auth-service.js';

export function setupAuthUI(user) {
    const dot = document.getElementById('cms-auth-dot');
    const lbl = document.getElementById('cms-auth-label');
    const logoutBtn = document.getElementById('admin-logout-btn');

    if (user) {
        if (dot) dot.className = 'online';
        if (lbl) lbl.textContent = 'Connected';
        if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    } else {
        if (dot) dot.className = 'offline';
        if (lbl) lbl.textContent = 'Offline';
        if (logoutBtn) logoutBtn.style.display = 'none';
        const panel = document.getElementById('admin-panel');
        if (panel) panel.style.display = 'none';
    }
}

export function initAuthListeners(onLoginSuccess) {
    const passcodeModal  = document.getElementById('passcode-modal');
    const emailInput     = document.getElementById('admin-email');
    const passInput      = document.getElementById('admin-password');
    const passError      = document.getElementById('passcode-error');
    const togglePassBtn  = document.getElementById('toggle-pass-vis');

    togglePassBtn?.addEventListener('click', () => {
        const isHidden = passInput.type === 'password';
        passInput.type = isHidden ? 'text' : 'password';
        togglePassBtn.textContent = isHidden ? 'Hide' : 'Show';
    });

    document.getElementById('admin-trigger')?.addEventListener('click', () => {
        if (passcodeModal) {
            passcodeModal.style.display = 'flex';
            passInput.value = '';
            emailInput.value = '';
            passInput.type = 'password';
            if (togglePassBtn) togglePassBtn.textContent = 'Show';
            if (passError) passError.style.display = 'none';
        }
    });

    document.getElementById('close-passcode')?.addEventListener('click', () => {
        if (passcodeModal) passcodeModal.style.display = 'none';
    });

    document.getElementById('passcode-submit')?.addEventListener('click', async () => {
        if (passError) passError.style.display = 'none';
        const submitBtn = document.getElementById('passcode-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in…';
        try {
            await login(emailInput.value.trim(), passInput.value);
            if (passcodeModal) passcodeModal.style.display = 'none';
            document.getElementById('admin-panel').style.display = 'flex';
            if (typeof window.showToast === 'function') {
                window.showToast('Logged in as Admin!');
            }
            if (onLoginSuccess) onLoginSuccess();
        } catch (e) {
            console.error('[Auth] Login failed:', e);
            if (passError) {
                passError.textContent = e.code === 'auth/invalid-credential'
                    ? 'Wrong email or password.'
                    : `Login error: ${e.message}`;
                passError.style.display = 'block';
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    });

    document.getElementById('admin-logout-btn')?.addEventListener('click', async () => {
        await logout();
        if (typeof window.showToast === 'function') {
            window.showToast('Logged out.');
        }
    });
}
