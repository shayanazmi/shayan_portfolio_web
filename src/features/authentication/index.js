import { observeAuth } from './auth-service.js';
import { setupAuthUI, initAuthListeners } from './auth-ui.js';

export function checkAuthState() {
    observeAuth((user) => {
        setupAuthUI(user);
    });
}

export { initAuthListeners, observeAuth };
