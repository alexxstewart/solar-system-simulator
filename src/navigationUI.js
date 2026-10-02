import { findNearestCelestial } from './explorationCamera.js';
import { formatRealDistance, flyEta } from './distance.js';

const TOUR_IDS = ['0', '3', '6', 'pluto', 'proxima', 'orion', 'sgr-a'];

const throttleLabel = (speed) => {
    if (speed < 0.8) return 'Slow';
    if (speed < 8) return 'Cruise';
    if (speed < 40) return 'Fast';
    return 'Warp-ready';
};

export const createSpaceHud = ({ flight, pickables, destinations, appState }) => {
    const body = document.getElementById('body');
    const uniqueDestinations = [];
    const usedIds = new Set();
    destinations.forEach((destination) => {
        if (!destination || usedIds.has(destination.id)) {
            return;
        }
        usedIds.add(destination.id);
        uniqueDestinations.push(destination);
    });

    const warpOverlay = document.createElement('div');
    warpOverlay.id = 'warp-overlay';
    body.appendChild(warpOverlay);

    const caption = document.createElement('div');
    caption.id = 'warp-caption';
    body.appendChild(caption);

    const toast = document.createElement('div');
    toast.id = 'arrival-toast';
    body.appendChild(toast);

    const hover = document.createElement('div');
    hover.id = 'hover-label';
    body.appendChild(hover);

    const arrow = document.createElement('div');
    arrow.id = 'target-arrow';
    arrow.innerHTML = '<span></span>Target';
    body.appendChild(arrow);

    const hud = document.createElement('div');
    hud.id = 'space-hud';
    hud.innerHTML = `
        <div id="hud-readout">
            <div><span>You are here</span> <strong id="hud-here">Solar System</strong></div>
            <div><span>Target</span> <strong id="hud-target">None selected</strong></div>
            <div><span>Range</span> <strong id="hud-range">—</strong></div>
            <div id="throttle-row">
                <span>Throttle</span>
                <div id="throttle-track"><div id="throttle-fill"></div></div>
                <strong id="hud-speed">Cruise</strong>
            </div>
            <div id="hud-eta"></div>
            <div id="hud-actions">
                <button type="button" id="mute-button">Mute</button>
                <button type="button" id="look-lock-button">Free look</button>
                <button type="button" id="tour-button">Start tour</button>
            </div>
        </div>
        <div id="hud-help">
            WASD fly · click empty sky for free look · Esc release · F fly nearest · [ ] cycle · R sun
        </div>
    `;
    body.appendChild(hud);

    const nav = document.createElement('div');
    nav.id = 'nav-panel';
    const groups = {};
    uniqueDestinations.forEach((destination) => {
        if (!groups[destination.group]) {
            groups[destination.group] = [];
        }
        groups[destination.group].push(destination);
    });

    nav.innerHTML = `
        <div id="nav-header">
            <h2>Galaxy Navigator</h2>
            <input id="nav-search" type="search" placeholder="Search Vega, Orion…" autocomplete="off">
            <button id="nav-home" type="button">Return to Sun</button>
        </div>
    `;
    Object.keys(groups).forEach((groupName) => {
        const section = document.createElement('div');
        section.className = 'nav-group';
        section.innerHTML = `<h3>${groupName}</h3>`;
        groups[groupName].forEach((destination) => {
            const row = document.createElement('div');
            row.className = 'nav-row';
            row.dataset.id = destination.id;
            row.innerHTML = `<button type="button" class="nav-jump">${destination.name}</button>
                <button type="button" class="nav-look">Look</button>
                <button type="button" class="nav-warp">Warp</button>`;
            row.querySelector('.nav-jump').addEventListener('click', (event) => {
                event.stopPropagation();
                appState.select(destination.mesh, { look: true, openCard: true });
            });
            row.querySelector('.nav-look').addEventListener('click', (event) => {
                event.stopPropagation();
                appState.select(destination.mesh, { look: true, openCard: false });
            });
            row.querySelector('.nav-warp').addEventListener('click', (event) => {
                event.stopPropagation();
                appState.warpTo(destination.mesh);
            });
            section.appendChild(row);
        });
        nav.appendChild(section);
    });
    body.appendChild(nav);

    const minimapWrap = document.createElement('div');
    minimapWrap.id = 'minimap-wrap';
    minimapWrap.innerHTML = `<canvas id="minimap" width="180" height="180"></canvas><div id="minimap-names"></div><div id="minimap-label">Click chart to warp</div>`;
    body.appendChild(minimapWrap);

    document.getElementById('nav-home').addEventListener('click', (event) => {
        event.stopPropagation();
        appState.goHome();
    });
    document.getElementById('nav-search').addEventListener('input', (event) => {
        const query = event.target.value.trim().toLowerCase();
        nav.querySelectorAll('.nav-row').forEach((row) => {
            const name = row.querySelector('.nav-jump').textContent.toLowerCase();
            row.style.display = !query || name.includes(query) ? '' : 'none';
        });
        nav.querySelectorAll('.nav-group').forEach((group) => {
            const visible = Array.from(group.querySelectorAll('.nav-row')).some((row) => row.style.display !== 'none');
            group.style.display = visible ? '' : 'none';
        });
    });
    document.getElementById('mute-button').addEventListener('click', (event) => {
        event.stopPropagation();
        appState.toggleMute();
        event.currentTarget.textContent = appState.muted ? 'Unmute' : 'Mute';
    });
    document.getElementById('look-lock-button').addEventListener('click', (event) => {
        event.stopPropagation();
        appState.togglePointerLock();
    });
    document.getElementById('tour-button').addEventListener('click', (event) => {
        event.stopPropagation();
        appState.toggleTour();
    });

    const map = document.getElementById('minimap');
    map.addEventListener('click', (event) => {
        event.stopPropagation();
        const rect = map.getBoundingClientRect();
        const clickX = (event.clientX - rect.left) / rect.width * 180;
        const clickY = (event.clientY - rect.top) / rect.height * 180;
        let best = null;
        let bestDist = 18;
        uniqueDestinations.forEach((destination) => {
            const plotted = destination._mapPos;
            if (!plotted) {
                return;
            }
            const dist = Math.hypot(plotted[0] - clickX, plotted[1] - clickY);
            if (dist < bestDist) {
                bestDist = dist;
                best = destination;
            }
        });
        if (best) {
            appState.warpTo(best.mesh);
        }
    });

    const hereEl = document.getElementById('hud-here');
    const targetEl = document.getElementById('hud-target');
    const rangeEl = document.getElementById('hud-range');
    const speedEl = document.getElementById('hud-speed');
    const etaEl = document.getElementById('hud-eta');
    const fillEl = document.getElementById('throttle-fill');
    const namesEl = document.getElementById('minimap-names');
    const ctx = map.getContext('2d');

    const refreshNav = () => {
        nav.querySelectorAll('.nav-row').forEach((row) => {
            const id = row.dataset.id;
            row.classList.toggle('selected', appState.selected && String(appState.selected.infoId) === id);
            row.classList.toggle('visited', appState.visited.has(id));
        });
        const tourButton = document.getElementById('tour-button');
        if (appState.tourIndex >= 0) {
            const next = uniqueDestinations.find((item) => item.id === TOUR_IDS[appState.tourIndex + 1]);
            tourButton.textContent = next ? `Next: ${next.name}` : 'Finish tour';
        } else {
            tourButton.textContent = 'Start tour';
        }
        document.getElementById('look-lock-button').classList.toggle('active', appState.pointerLocked);
    };

    const update = () => {
        const nearest = findNearestCelestial(flight.camera.position, pickables);
        const speed = flight.effectiveSpeed || (flight.baseSpeed * (flight.boost ? 5 : 1));
        if (nearest.mesh) {
            hereEl.textContent = nearest.mesh.planetName || 'Deep space';
        }
        const selected = appState.selected;
        if (selected) {
            const sceneDist = BABYLON.Vector3.Distance(flight.camera.position, selected.getAbsolutePosition());
            targetEl.textContent = selected.planetName || selected.objectName;
            rangeEl.textContent = formatRealDistance(selected) || `${sceneDist.toFixed(0)} units`;
            etaEl.textContent = flyEta(sceneDist, speed);
        } else {
            targetEl.textContent = 'None selected';
            rangeEl.textContent = nearest.mesh ? formatRealDistance(nearest.mesh) : '—';
            etaEl.textContent = '';
        }

        const t = Math.min(1, Math.log10(speed + 1) / Math.log10(flight.maxSpeed));
        fillEl.style.width = `${Math.max(8, t * 100)}%`;
        speedEl.textContent = throttleLabel(speed);

        ctx.fillStyle = '#05060c';
        ctx.fillRect(0, 0, 180, 180);
        ctx.strokeStyle = '#2c6ea5';
        ctx.strokeRect(1, 1, 178, 178);

        const cam = flight.camera.position;
        const scale = Math.max(40, (nearest.distance || 40) * 2.4);
        const toMap = (world) => {
            const dx = (world.x - cam.x) / scale * 80;
            const dz = (world.z - cam.z) / scale * 80;
            return [90 + dx, 90 + dz];
        };

        const nearby = [];
        uniqueDestinations.forEach((destination) => {
            const pos = destination.mesh.getAbsolutePosition();
            const [x, y] = toMap(pos);
            destination._mapPos = [x, y];
            if (x < 4 || x > 176 || y < 4 || y > 176) {
                return;
            }
            const isSelected = selected && destination.mesh.infoId === selected.infoId;
            ctx.fillStyle = isSelected ? '#ffffff' :
                destination.group === 'Solar System' ? '#7dffb3' :
                destination.group === 'Nearby Stars' ? '#ffd36a' :
                destination.group === 'Nebulae' ? '#ff7ad9' :
                destination.group === 'Deep Galaxy' ? '#6ab8ff' : '#ffffff';
            ctx.fillRect(x - (isSelected ? 3 : 1.5), y - (isSelected ? 3 : 1.5), isSelected ? 6 : 3, isSelected ? 6 : 3);
            nearby.push({
                name: destination.name,
                dist: BABYLON.Vector3.Distance(cam, pos),
                x, y
            });
        });

        if (selected) {
            const [tx, ty] = toMap(selected.getAbsolutePosition());
            ctx.strokeStyle = 'rgba(255,255,255,0.45)';
            ctx.beginPath();
            ctx.moveTo(90, 90);
            ctx.lineTo(Math.max(4, Math.min(176, tx)), Math.max(4, Math.min(176, ty)));
            ctx.stroke();
        }

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(90, 78);
        ctx.lineTo(84, 102);
        ctx.lineTo(96, 102);
        ctx.closePath();
        ctx.fill();

        nearby.sort((a, b) => a.dist - b.dist);
        namesEl.innerHTML = nearby.slice(0, 3).map((item) => item.name).join(' · ');

        const engine = flight.camera.getScene().getEngine();
        if (selected) {
            const transform = flight.camera.getScene().getTransformMatrix();
            const viewport = flight.camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
            const projected = BABYLON.Vector3.Project(
                selected.getAbsolutePosition(),
                BABYLON.Matrix.Identity(),
                transform,
                viewport
            );
            const onScreen = projected.z > 0 && projected.z < 1 && projected.x > 40 && projected.x < viewport.width - 40 && projected.y > 40 && projected.y < viewport.height - 40;
            arrow.classList.toggle('visible', !onScreen);
            if (!onScreen) {
                const angle = Math.atan2(projected.y - viewport.height / 2, projected.x - viewport.width / 2);
                arrow.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
            }
        } else {
            arrow.classList.remove('visible');
        }

        refreshNav();
    };

    const showWarpCaption = (name) => {
        caption.textContent = name ? `Warping to ${name}…` : '';
        caption.classList.toggle('visible', !!name);
    };

    const showArrival = (text) => {
        if (!text) {
            return;
        }
        toast.textContent = text;
        toast.classList.add('visible');
        window.clearTimeout(showArrival._timer);
        showArrival._timer = window.setTimeout(() => toast.classList.remove('visible'), 5200);
    };

    const setHover = (name, x, y) => {
        if (!name) {
            hover.classList.remove('visible');
            return;
        }
        hover.textContent = name;
        hover.style.left = `${x + 16}px`;
        hover.style.top = `${y + 12}px`;
        hover.classList.add('visible');
    };

    return {
        update,
        nav,
        uniqueDestinations,
        tourIds: TOUR_IDS,
        refreshNav,
        showWarpCaption,
        showArrival,
        setHover
    };
};
