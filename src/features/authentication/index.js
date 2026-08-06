import { observeAuth } from './auth-service.js';
import { setupAuthUI, initAuthListeners } from './auth-ui.js';
import { DebugLogger } from '../../shared/utils/logger.js';

export function checkAuthState() {
    try {
        DebugLogger.trackInit('Auth', 'PENDING');
        
        observeAuth((user) => {
            setupAuthUI(user);
        });

        initAuthListeners();
        DebugLogger.trackInit('Auth', 'OK');
    } catch (err) {
        DebugLogger.trackInit('Auth', 'FAILED', err);
    }
}
