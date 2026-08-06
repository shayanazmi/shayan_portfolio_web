import { initCMSListeners } from './cms-ui.js';
import { DebugLogger } from '../../shared/utils/logger.js';

export function initCMSDashboard() {
    try {
        DebugLogger.trackInit('CMS', 'PENDING');
        initCMSListeners();
        DebugLogger.trackInit('CMS', 'OK');
    } catch (err) {
        DebugLogger.trackInit('CMS', 'FAILED', err);
    }
}
