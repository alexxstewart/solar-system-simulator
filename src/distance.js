const PLANET_AU = {
    '0': 0,
    '1': 0.39,
    '2': 0.72,
    '3': 1,
    '4': 1.52,
    '5': 5.2,
    '6': 9.58,
    '7': 19.2,
    '8': 30.1,
    '9': 0.00257
};

const EXTRA_DISTANCE = {
    pluto: { au: 39.5 },
    'asteroid-belt': { au: 2.7 },
    'kuiper-belt': { au: 45 },
    voyager1: { au: 166 },
    'oort-cloud': { au: 50000, ly: 0.79 }
};

export const attachPlanetDistances = (planets) => {
    planets.forEach((mesh) => {
        if (!mesh || mesh.distanceAu != null || mesh.distanceLy != null) {
            return;
        }
        const extra = EXTRA_DISTANCE[mesh.infoId];
        if (extra) {
            mesh.distanceAu = extra.au;
            if (extra.ly) mesh.distanceLy = extra.ly;
            return;
        }
        if (PLANET_AU[mesh.infoId] != null) {
            mesh.distanceAu = PLANET_AU[mesh.infoId];
        }
    });
};

export const formatRealDistance = (mesh) => {
    if (!mesh) {
        return '—';
    }
    if (mesh.distanceLabel) {
        return mesh.distanceLabel;
    }
    if (mesh.distanceLy != null && mesh.distanceLy >= 1) {
        if (mesh.distanceLy >= 1000000) {
            return `${(mesh.distanceLy / 1000000).toFixed(2)} million ly`;
        }
        if (mesh.distanceLy >= 1000) {
            return `${Math.round(mesh.distanceLy).toLocaleString()} ly`;
        }
        return `${mesh.distanceLy < 10 ? mesh.distanceLy.toFixed(2) : Math.round(mesh.distanceLy)} ly`;
    }
    if (mesh.distanceLy != null && mesh.distanceLy > 0) {
        return `${mesh.distanceLy.toFixed(2)} ly`;
    }
    if (mesh.infoId === '9' || mesh.planetName === 'The Moon') {
        return '384,400 km';
    }
    if (mesh.distanceAu === 0) {
        return 'home';
    }
    if (mesh.distanceAu != null) {
        return `${mesh.distanceAu} AU`;
    }
    return '';
};

export const flyEta = (sceneDistance, speed) => {
    const unitsPerSec = Math.max(speed, 0.12) * 38;
    const seconds = sceneDistance / unitsPerSec;
    if (seconds < 3) {
        return 'a short hop';
    }
    if (seconds < 55) {
        return `~${Math.round(seconds)}s to fly`;
    }
    if (seconds < 3600) {
        return `~${Math.round(seconds / 60)} min to fly · warp recommended`;
    }
    return 'warp recommended';
};

export const firstSentence = (html) => {
    if (!html) {
        return '';
    }
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const match = text.match(/.*?[.!?](\s|$)/);
    return (match ? match[0] : text).slice(0, 220);
};

export const wikiLink = (html) => {
    if (!html) {
        return null;
    }
    const match = html.match(/href="(https:\/\/en\.wikipedia\.org\/[^"]+)"/);
    return match ? match[1] : null;
};

export const shortFacts = (facts, count = 3) => {
    if (!facts) {
        return [];
    }
    return facts.split('|').map((item) => item.trim()).filter(Boolean).slice(0, count);
};
