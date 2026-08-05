import { syncGallery } from './gallery-api.js';
import { setGalleryItems, renderGallery, initGalleryUI } from './gallery-ui.js';

export function initGallery() {
    initGalleryUI();
    syncGallery((items) => {
        setGalleryItems(items);
        renderGallery();
    });
}
