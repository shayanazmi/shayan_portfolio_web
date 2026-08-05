import {
    syncCollection,
    syncQuotes,
    syncIntroText,
    syncSpotifyPlayer,
    defaultProjects,
    defaultExperience,
    defaultEducation,
    defaultCertifications,
    defaultPoetry,
    defaultArticles,
    defaultVideos,
    defaultPlaylists,
    defaultSkills
} from './resume-data.js';

import {
    renderProjects,
    renderExperience,
    renderEducation,
    renderCertifications,
    renderPoetry,
    renderArticles,
    renderVideos,
    renderPlaylists,
    renderQuotes,
    renderSkills,
    initShowMoreButtons
} from './resume-ui.js';

export function initResumeSection() {
    // 1. Render all defaults first
    renderProjects(defaultProjects);
    renderExperience(defaultExperience);
    renderEducation(defaultEducation);
    renderCertifications(defaultCertifications);
    renderPoetry(defaultPoetry);
    renderArticles(defaultArticles);
    renderVideos(defaultVideos);
    renderPlaylists(defaultPlaylists);
    renderSkills(defaultSkills);

    // Initialize UI listeners (Show More/Less toggles)
    initShowMoreButtons();

    // 2. Sync from database
    syncIntroText();
    syncSpotifyPlayer();

    syncCollection('projects',       defaultProjects,       renderProjects);
    syncCollection('experience',     defaultExperience,     renderExperience);
    syncCollection('education',      defaultEducation,      renderEducation);
    syncCollection('certifications', defaultCertifications, renderCertifications);
    syncCollection('poetry',         defaultPoetry,         renderPoetry);
    syncCollection('articles',       defaultArticles,       renderArticles);
    syncCollection('videos',         defaultVideos,         renderVideos);
    syncCollection('playlists',      defaultPlaylists,      renderPlaylists);
    syncCollection('skills',         defaultSkills,         renderSkills);
    
    syncQuotes((quotes) => {
        renderQuotes(quotes);
    });
}
