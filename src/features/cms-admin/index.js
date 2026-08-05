import { initCMSListeners, renderCategoryList } from './cms-ui.js';
import { observeAuth } from '../authentication/auth-service.js';
import { categoryConfigs } from './cms-service.js';

export function initCMSDashboard() {
    initCMSListeners();

    observeAuth((user) => {
        if (user) {
            Object.keys(categoryConfigs).forEach((category) => {
                renderCategoryList(category);
            });
        }
    });
}
