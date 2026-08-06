import { syncGallery } from './gallery-api.js';
import { renderGallery, initGalleryUI } from './gallery-ui.js';
import { DebugLogger } from '../../shared/utils/logger.js';

export function initGallery() {
    try {
        DebugLogger.trackInit('Gallery', 'PENDING');
        initGalleryUI();
        syncGallery((items) => {
            renderGallery(items);
        });
        DebugLogger.trackInit('Gallery', 'OK');
    } catch (err) {
        DebugLogger.trackInit('Gallery', 'FAILED', err);
    }
}
