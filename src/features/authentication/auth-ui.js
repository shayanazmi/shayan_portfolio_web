import { login, logout, registerAdmin, resetPassword } from './auth-service.js';
import { showToast } from '../cms-admin/toast.js';

export function setupAuthUI(user) {
    const dot = document.getElementById('cms-auth-dot');
    const statusText = document.getElementById('cms-auth-label');
    const logoutBtn = document.getElementById('admin-logout-btn');
    const adminPanel = document.getElementById('admin-panel');

    if (dot) {
        dot.className = user ? 'online' : 'offline';
        dot.title = user ? `Logged in as ${user.email}` : 'Not logged in';
    }

    if (statusText) {
        statusText.textContent = user ? `Connected (${user.email})` : 'Offline';
    }

    if (logoutBtn) {
        logoutBtn.style.display = user ? 'inline-flex' : 'none';
    }

    if (adminPanel) {
        if (user) {
            adminPanel.style.display = 'flex';
        } else {
            adminPanel.style.display = 'none';
        }
    }
}

export function initAuthListeners(onLoginSuccess) {
    const emailInput = document.getElementById('admin-email');
    const passInput = document.getElementById('admin-password');
    const passError = document.getElementById('passcode-error');
    const submitBtn = document.getElementById('passcode-submit');
    const registerBtn = document.getElementById('admin-register-btn');
    const resetBtn = document.getElementById('admin-reset-btn');
    const modal = document.getElementById('passcode-modal');
    const modalClose = document.getElementById('close-passcode');
    const panelClose = document.getElementById('close-admin');
    const trigger = document.getElementById('admin-trigger');
    const logoutBtn = document.getElementById('admin-logout-btn');
    const togglePass = document.getElementById('toggle-pass-vis');
    const adminPanel = document.getElementById('admin-panel');

    if (trigger) {
        trigger.addEventListener('click', () => {
            if (modal) {
                modal.style.display = 'flex';
                if (passError) passError.style.display = 'none';
            }
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            if (modal) modal.style.display = 'none';
        });
    }

    if (panelClose && adminPanel) {
        panelClose.addEventListener('click', () => {
            adminPanel.style.display = 'none';
        });
    }

    if (togglePass && passInput) {
        togglePass.addEventListener('click', () => {
            const isPass = passInput.type === 'password';
            passInput.type = isPass ? 'text' : 'password';
            togglePass.textContent = isPass ? 'Hide' : 'Show';
        });
    }

    const handleLoginSubmit = async () => {
        if (passError) passError.style.display = 'none';

        let email = emailInput?.value.trim();
        const pass = passInput?.value;

        if (!email || !pass) {
            if (passError) {
                passError.textContent = 'Please enter both email and password.';
                passError.style.display = 'block';
            }
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Logging in…';
        }

        try {
            await login(email, pass);
            showToast('Logged in as Admin!');
            if (modal) modal.style.display = 'none';
            if (adminPanel) adminPanel.style.display = 'flex';
            if (typeof onLoginSuccess === 'function') onLoginSuccess();
        } catch (err) {
            console.error('[Firebase Auth Error Details]', err.code, err.message, err);
            let msg = 'Wrong email or password.';
            if (err.code === 'auth/invalid-email') msg = 'Invalid email format.';
            else if (err.code === 'auth/user-not-found') msg = 'No user account found for this email. Click "Register Account" below to create it.';
            else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                msg = 'Wrong email or password. If you forgot your password, click "Forgot Password?" below.';
            }
            else if (err.code === 'auth/too-many-requests') msg = 'Too many failed attempts. Try again later.';
            else if (err.code === 'auth/network-request-failed') msg = 'Network error. Check connection.';

            if (passError) {
                passError.textContent = msg;
                passError.style.display = 'block';
            }
            showToast(msg, 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Unlock CMS';
            }
        }
    };

    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLoginSubmit();
        });
    }

    // Register Account handler
    if (registerBtn) {
        registerBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = emailInput?.value.trim();
            const pass = passInput?.value;

            if (!email || !pass) {
                showToast('Please enter email and password to register.', 'error');
                return;
            }

            try {
                showToast('Registering admin account...');
                await registerAdmin(email, pass);
                showToast('Account registered & logged in!');
                if (modal) modal.style.display = 'none';
                if (adminPanel) adminPanel.style.display = 'flex';
            } catch (err) {
                showToast(`Register failed: ${err.message}`, 'error');
            }
        });
    }

    // Reset Password handler
    if (resetBtn) {
        resetBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = emailInput?.value.trim();
            if (!email) {
                showToast('Enter your email address first.', 'error');
                return;
            }
            try {
                await resetPassword(email);
                showToast(`Password reset email sent to ${email}!`);
            } catch (err) {
                showToast(`Reset failed: ${err.message}`, 'error');
            }
        });
    }

    [emailInput, passInput].forEach(input => {
        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleLoginSubmit();
            }
        });
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await logout();
                showToast('Logged out.');
                if (adminPanel) adminPanel.style.display = 'none';
            } catch (err) {
                showToast('Logout failed.', 'error');
            }
        });
    }
}
