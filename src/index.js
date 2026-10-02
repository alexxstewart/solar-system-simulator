import { createWelcomeSection, deleteLoadingScreen, showObjectCard, closeObjectCard } from './GUIManager.js';
import { createLighting, createGroundMesh, createSkyImage, createPlanets, createMusic } from './createOnScreenAssets.js';
import { renderPlanets, highlightLayerLogic } from './renderer.js';
import { loadTextures } from './loadAssets.js';
import { createExplorationCamera, warpToMesh, goHome, turnToward, findNearestCelestial } from './explorationCamera.js';
import { createGalaxyContent } from './galaxyBuilder.js';
import { createSpaceHud } from './navigationUI.js';
import { attachPlanetDistances } from './distance.js';
import { playWarpSound, playArrivalChime } from './warpArrival.js';

const defaultCamPos = new BABYLON.Vector3(5, 8, -30);
const UI_SELECTOR = '#nav-panel, #space-hud, #minimap-wrap, #object-card, #welcome-div, #background-div, #loading-screen, #hover-label, #warp-caption, #arrival-toast, #target-arrow';

const init = () => {
    Promise.all([
        fetch('data/planetInfo.json').then((response) => response.json()),
        fetch('data/planetData.json').then((response) => response.json()),
        fetch('data/galaxyObjects.json').then((response) => response.json()),
        fetch('data/galaxyInfo.json').then((response) => response.json())
    ]).then(([planetInfo, planetData, galaxyCatalog, galaxyInfo]) => {
        return startApp(planetInfo, planetData, galaxyCatalog, galaxyInfo);
    }).catch((error) => {
        console.error('Failed to load simulation data', error);
    });
};

const startApp = async (planetInfo, planetData, galaxyCatalog, galaxyInfo) => {
    const allInfo = Object.assign({}, planetInfo, galaxyInfo);
    const canvas = document.getElementById('canvas');
    const engineOptions = {
        adaptToDeviceRatio: true,
        antialias: true,
        stencil: true,
        powerPreference: 'high-performance'
    };
    let engine;
    try {
        engine = BABYLON.EngineFactory
            ? await BABYLON.EngineFactory.CreateAsync(canvas, engineOptions)
            : new BABYLON.Engine(canvas, true, engineOptions);
    } catch (error) {
        console.warn('Falling back to WebGL engine', error);
        engine = new BABYLON.Engine(canvas, true, engineOptions);
    }

    const createScene = () => {
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
        scene.collisionsEnabled = false;
        if (BABYLON.ScenePerformancePriority) {
            scene.performancePriority = BABYLON.ScenePerformancePriority.Intermediate;
        }

        loadTextures(scene, deleteLoadingScreen);

        const flight = createExplorationCamera(scene, canvas, defaultCamPos);
        const camera = flight.camera;

        const highlightLayer = new BABYLON.HighlightLayer('hl1', scene);
        const glowLayer = new BABYLON.GlowLayer('starGlow', scene);
        glowLayer.intensity = 0.55;

        const music = createMusic(scene);
        createLighting(scene, camera);
        const sky = createSkyImage(scene);
        const ground = createGroundMesh(scene);

        const planets = createPlanets(scene, planetData);
        if (planets[0]) {
            glowLayer.addIncludedOnlyMesh(planets[0]);
        }

        const solarDestinations = planets.filter((mesh) => mesh.isCelestial).map((mesh) => ({
            id: String(mesh.infoId),
            name: mesh.planetName,
            group: 'Solar System',
            mesh
        })).filter((destination, index, list) => (
            destination.name && list.findIndex((item) => item.name === destination.name) === index
        ));

        const galaxy = createGalaxyContent(scene, galaxyCatalog, glowLayer);
        planets.push(...galaxy.orbiters);
        attachPlanetDistances(planets);
        attachPlanetDistances(galaxy.pickables);

        const pickables = planets.filter((mesh) => mesh.isCelestial).concat(galaxy.pickables);
        const uniquePickables = [];
        const seen = new Set();
        pickables.forEach((mesh) => {
            if (!seen.has(mesh.infoId)) {
                seen.add(mesh.infoId);
                uniquePickables.push(mesh);
            }
        });

        const sunMesh = planets[0];
        const appState = {
            selected: null,
            visited: new Set(),
            tourIndex: -1,
            pauseOrbits: false,
            muted: false,
            pointerLocked: false,
            musicVolume: 0.5
        };

        const hud = createSpaceHud({
            flight,
            pickables: uniquePickables,
            destinations: solarDestinations.concat(galaxy.destinations),
            appState
        });

        const lookAt = (mesh) => {
            if (!mesh) return;
            appState.selected = mesh;
            turnToward(scene, flight, mesh);
        };

        const warpTo = (mesh) => {
            if (!mesh) return;
            appState.selected = mesh;
            playWarpSound(appState.muted);
            hud.showWarpCaption(mesh.planetName || mesh.objectName);
            warpToMesh(scene, flight, mesh, () => {
                hud.showWarpCaption(null);
                appState.visited.add(String(mesh.infoId));
                playArrivalChime(appState.muted);
                showObjectCard(mesh, allInfo, {
                    arrived: true,
                    lookAt,
                    warpTo,
                    onClose: () => { appState.pauseOrbits = false; }
                });
                appState.pauseOrbits = true;
            });
        };

        appState.select = (mesh, options = {}) => {
            appState.selected = mesh;
            if (options.look !== false) {
                lookAt(mesh);
            }
            if (options.openCard) {
                appState.pauseOrbits = true;
                showObjectCard(mesh, allInfo, { lookAt, warpTo, onClose: () => { appState.pauseOrbits = false; } });
            }
        };
        appState.lookAt = lookAt;
        appState.warpTo = warpTo;
        appState.goHome = () => {
            goHome(scene, flight, sunMesh);
            appState.selected = sunMesh;
        };
        appState.toggleMute = () => {
            appState.muted = !appState.muted;
            music.setVolume(appState.muted ? 0 : appState.musicVolume);
        };
        appState.togglePointerLock = () => {
            if (document.pointerLockElement === canvas) {
                document.exitPointerLock();
            } else {
                canvas.requestPointerLock();
            }
        };
        appState.toggleTour = () => {
            if (appState.tourIndex < 0) {
                appState.tourIndex = 0;
            } else {
                appState.tourIndex += 1;
            }
            if (appState.tourIndex >= hud.tourIds.length) {
                appState.tourIndex = -1;
                hud.showArrival('Tour complete. Pick anywhere in the navigator.');
                return;
            }
            const id = hud.tourIds[appState.tourIndex];
            const dest = hud.uniqueDestinations.find((item) => item.id === id);
            if (dest) {
                warpTo(dest.mesh);
            }
        };
        appState.closeCard = () => {
            closeObjectCard();
            appState.pauseOrbits = false;
        };

        flight.getSlowdownDistance = () => findNearestCelestial(camera.position, uniquePickables).distance;

        document.addEventListener('pointerlockchange', () => {
            appState.pointerLocked = document.pointerLockElement === canvas;
            const lookBtn = document.getElementById('look-lock-button');
            if (lookBtn) {
                lookBtn.textContent = appState.pointerLocked ? 'Looking' : 'Free look';
                lookBtn.classList.toggle('active', appState.pointerLocked);
            }
        });

        scene.beforeRender = () => {
            try {
                renderPlanets(planets, appState.pauseOrbits);
                galaxy.update(appState.pauseOrbits);
                hud.update();
                if (sky && !sky.infiniteDistance) {
                    sky.position.copyFrom(camera.position);
                }
                if (ground) {
                    ground.isVisible = camera.position.lengthSquared() < 500 * 500;
                }
                if (!flight.warping) {
                    highlightLayerLogic(scene, highlightLayer, uniquePickables, hud.setHover);
                }
            } catch (error) {
                console.error('frame update failed', error);
            }
        };

        window.addEventListener('click', (event) => {
            if (event.target.closest(`${UI_SELECTOR}, button, a, input, select, label`)) {
                return;
            }
            const pick = scene.pick(scene.pointerX, scene.pointerY);
            if (pick.pickedMesh && pick.pickedMesh.isCelestial) {
                appState.select(pick.pickedMesh, { look: true, openCard: true });
            } else if (!appState.pointerLocked) {
                canvas.requestPointerLock();
            }
        });

        window.addEventListener('keydown', (event) => {
            if (event.target && ['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
                return;
            }
            const key = event.key.toLowerCase();
            if (key === 'escape') {
                if (document.pointerLockElement) {
                    document.exitPointerLock();
                }
                appState.closeCard();
            }
            if (key === 'n') {
                document.getElementById('nav-panel').classList.toggle('collapsed');
            }
            if (key === 'r') {
                appState.goHome();
            }
            if (key === 'f') {
                const nearest = findNearestCelestial(camera.position, uniquePickables);
                if (nearest.mesh) {
                    warpTo(nearest.mesh);
                }
            }
            if (key === '[' || key === ']') {
                const list = hud.uniqueDestinations;
                const current = list.findIndex((item) => appState.selected && item.id === String(appState.selected.infoId));
                const next = key === ']'
                    ? (current + 1) % list.length
                    : (current - 1 + list.length) % list.length;
                if (list[next]) {
                    appState.select(list[next].mesh, { look: true, openCard: true });
                }
            }
        });

        window.addEventListener('resize', () => engine.resize());
        return scene;
    };

    const scene = createScene();
    engine.runRenderLoop(() => scene.render());
};

createWelcomeSection();
window.addEventListener('DOMContentLoaded', init());
