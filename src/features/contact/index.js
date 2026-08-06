import { initContactUI } from './contact-ui.js';
import { DebugLogger } from '../../shared/utils/logger.js';

export function initContactForm() {
    try {
        DebugLogger.trackInit('Contact', 'PENDING');
        initContactUI();
        DebugLogger.trackInit('Contact', 'OK');
    } catch (err) {
        DebugLogger.trackInit('Contact', 'FAILED', err);
    }
}
