import { firstSentence, shortFacts, wikiLink, formatRealDistance } from './distance.js';

export const createWelcomeSection = () => {
    const parentDiv = document.getElementById('body');
    const backgroundDiv = document.createElement('div');
    backgroundDiv.id = 'background-div';

    const contentDiv = document.createElement('div');
    contentDiv.id = 'welcome-div';
    contentDiv.innerHTML = `
        <h1>Explore the Milky Way</h1>
        <p class="info-p-text">Leave the Sun. Fly with WASD, look with the mouse, and warp from the navigator.</p>
        <ul id="welcome-list">
            <li>Click a destination to look at it, or Warp to jump.</li>
            <li>Click empty sky for free look. Esc to release.</li>
            <li>Start the tour for a guided path to the galactic centre.</li>
        </ul>
        <button type="button" id="welcome-start-button">Start exploring</button>
    `;

    const dismiss = () => {
        contentDiv.remove();
        backgroundDiv.remove();
    };
    contentDiv.querySelector('#welcome-start-button').addEventListener('click', dismiss);
    backgroundDiv.addEventListener('click', dismiss);
    parentDiv.appendChild(backgroundDiv);
    parentDiv.appendChild(contentDiv);
};

export const showObjectCard = (mesh, allInfo, handlers = {}) => {
    const existing = document.getElementById('object-card');
    if (existing) {
        existing.remove();
    }
    if (!mesh) {
        if (handlers.onClose) handlers.onClose();
        return;
    }
    const record = allInfo[mesh.infoId];
    const title = (record && record.title) || mesh.planetName || 'Object';
    const blurb = record && record.info ? firstSentence(record.info.split('|')[0]) : '';
    const facts = record ? shortFacts(record.facts, 3) : [];
    const more = record ? wikiLink(record.info) : null;
    const photo = mesh.posterTexture ? String(mesh.posterTexture).replace(/^\//, '') : '';

    const card = document.createElement('div');
    card.id = 'object-card';
    if (handlers.arrived) {
        card.classList.add('arriving');
    }
    card.innerHTML = `
        <button type="button" class="close" id="card-close"></button>
        ${handlers.arrived ? '<p class="card-kicker">Arrived</p>' : ''}
        ${photo ? `<img class="card-photo" alt="${title}" src="${photo}">` : ''}
        <h2>${title}</h2>
        <p class="card-distance"></p>
        <p class="card-blurb">${blurb}</p>
        <ul class="card-facts">${facts.map((fact) => `<li>${fact}</li>`).join('')}</ul>
        <div class="card-actions">
            <button type="button" id="card-look">Look at</button>
            <button type="button" id="card-warp">Warp here</button>
            ${more ? `<a href="${more}" target="_blank" rel="noopener">More info</a>` : ''}
        </div>
    `;
    document.getElementById('body').appendChild(card);
    card.querySelector('.card-distance').textContent = formatRealDistance(mesh);
    card.querySelector('#card-close').addEventListener('click', (event) => {
        event.stopPropagation();
        card.remove();
        if (handlers.onClose) handlers.onClose();
    });
    card.querySelector('#card-look').addEventListener('click', (event) => {
        event.stopPropagation();
        if (handlers.lookAt) handlers.lookAt(mesh);
    });
    card.querySelector('#card-warp').addEventListener('click', (event) => {
        event.stopPropagation();
        if (handlers.warpTo) handlers.warpTo(mesh);
    });
};

export const closeObjectCard = () => {
    const existing = document.getElementById('object-card');
    if (existing) {
        existing.remove();
    }
};

export const deleteLoadingScreen = () => {
    const element = document.getElementById('loading-screen');
    if (element && element.parentElement) {
        element.parentElement.removeChild(element);
    }
};
