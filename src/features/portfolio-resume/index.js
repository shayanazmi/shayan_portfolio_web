import {
    syncCollection, syncQuotes, syncSpotifyPlayer,
    defaultProjects, defaultExperience, defaultEducation,
    defaultCertifications, defaultSkills
} from './resume-data.js';
import {
    renderProjects, renderExperience, renderEducation,
    renderCertifications, renderSkills, renderArticles,
    renderVideos, renderPlaylists, renderPoetry, renderQuotes
} from './resume-ui.js';
import { DebugLogger } from '../../shared/utils/logger.js';

export function initResumeSection() {
    try {
        DebugLogger.trackInit('Resume', 'PENDING');

        syncCollection('projects', defaultProjects, renderProjects);
        syncCollection('experience', defaultExperience, renderExperience);
        syncCollection('education', defaultEducation, renderEducation);
        syncCollection('certifications', defaultCertifications, renderCertifications);
        syncCollection('skills', defaultSkills, renderSkills);
        syncCollection('articles', [], renderArticles);
        syncCollection('videos', [], renderVideos);
        syncCollection('playlists', [], renderPlaylists);
        syncCollection('poetry', [], renderPoetry);

        syncQuotes(renderQuotes);
        syncSpotifyPlayer();

        DebugLogger.trackInit('Resume', 'OK');
    } catch (err) {
        DebugLogger.trackInit('Resume', 'FAILED', err);
    }
}
