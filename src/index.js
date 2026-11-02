import { createWelcomeSection, deleteLoadingScreen, showObjectCard, closeObjectCard } from './GUIManager.js';
import { createLighting, createGroundMesh, createSkyImage, createPlanets, createMusic, addShadowCaster, attachGlowOccluders } from './createOnScreenAssets.js';
import { renderPlanets, highlightLayerLogic } from './renderer.js';
import { loadTextures } from './loadAssets.js';
import { createExplorationCamera, warpToMesh, goHome, turnToward, findNearestCelestial, updateExamineCamera, endExamine } from './explorationCamera.js';
import { createGalaxyContent } from './galaxyBuilder.js';
import { createNebulaTheater } from './nebulaTheater.js';
import { createHubble } from './hubble.js';
import { createJwst } from './jwst.js';
import { galleryFor, slideForNebula, allSlides } from './observatoryGallery.js';
import { createSpaceHud } from './navigationUI.js';
import { createMoons, updateMoons } from './moons.js';
import { attachPlanetDistances } from './distance.js';
import { playArrivalChime } from './warpArrival.js';

const defaultCamPos = new BABYLON.Vector3(5, 8, -30);
const UI_SELECTOR = '#nav-panel, #nav-peek, #tour-panel, #moon-dock, #space-hud, #minimap-wrap, #object-card, #welcome-div, #background-div, #loading-screen, #hover-label, #warp-caption, #arrival-toast, #target-arrow, #exhibit';

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
        powerPreference: 'high-performance',
        audioEngine: true
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
        const sunShadows = createLighting(scene);
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
        planets.forEach((mesh) => {
            if (mesh.celestialKind === 'planet' && (mesh.orbit == null || mesh.orbit < 220)) {
                addShadowCaster(sunShadows, mesh);
            }
        });
        const moons = createMoons(scene, planets);
        const earth = planets.find((mesh) => String(mesh.infoId) === '3');
        const hubbleRig = createHubble(scene, earth);
        const hubbleMesh = hubbleRig && hubbleRig.mesh;
        const jwstRig = createJwst(scene, earth);
        const jwstMesh = jwstRig && jwstRig.mesh;
        attachGlowOccluders(glowLayer, planets.concat(moons, galaxy.pickables));
        attachPlanetDistances(planets);
        attachPlanetDistances(galaxy.pickables);

        const observatoryMeshes = [hubbleMesh, jwstMesh].filter(Boolean);
        const pickables = planets.filter((mesh) => mesh.isCelestial).concat(galaxy.pickables, moons, observatoryMeshes);
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
            mode: null,
            tourIndex: -1,
            pauseOrbits: false,
            muted: false,
            pointerLocked: false,
            musicVolume: 0.5
        };

        const moonDestinations = moons.map((moon) => ({
            id: moon.infoId,
            name: moon.planetName,
            group: moon.navGroup,
            mesh: moon
        }));
        const observatoryDestinations = observatoryMeshes.map((mesh) => ({
            id: mesh.infoId,
            name: mesh.planetName,
            group: 'Observatory',
            mesh
        }));
        const hud = createSpaceHud({
            flight,
            pickables: uniquePickables,
            destinations: solarDestinations.concat(galaxy.destinations, moonDestinations, observatoryDestinations),
            appState,
            moons
        });

        const theater = createNebulaTheater(scene);
        theater.setSky(sky);
        theater.preload(allSlides());
        let galleryHost = null;

        const cardHandlers = (arrived) => ({
            arrived,
            lookAt,
            warpTo,
            lookThrough,
            onClose: () => { appState.pauseOrbits = false; }
        });

        const releaseHold = (reattach) => {
            flight.holdView = false;
            if (!flight._plateDetached) {
                return;
            }
            flight._plateDetached = false;
            if (!reattach) {
                return;
            }
            try {
                camera.attachControl(canvas, true);
            } catch (error) {
                camera.attachControl(canvas, true);
            }
        };

        const holdForEyepiece = () => {
            flight.holdView = true;
            if (flight.examine) {
                flight.examine.dragging = false;
            }
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
        };

        const observatoryMesh = (id) => (id === 'jwst' ? jwstMesh : hubbleMesh);

        const openGallery = (observatoryId, startId, duration) => {
            const gallery = galleryFor(observatoryId);
            if (!gallery) {
                return;
            }
            const start = gallery.items.find((item) => item.id === startId) || gallery.items[0];
            const host = observatoryMesh(observatoryId);
            galleryHost = host;
            appState.closeCard();
            if (host) {
                appState.selected = host;
            }
            holdForEyepiece();
            theater.show(start, {
                duration,
                items: gallery.items,
                onPick: (next) => {
                    if (!next || (theater.current() && next.id === theater.current().id)) {
                        return;
                    }
                    openGallery(observatoryId, next.id, 0.95);
                },
                onArrive: () => {
                    appState.visited.add(observatoryId);
                }
            });
        };

        const lookThrough = (mesh) => {
            const id = mesh && (mesh.infoId === 'jwst' || mesh.infoId === 'hubble') ? mesh.infoId : 'hubble';
            openGallery(id, null, theater.isOpen() ? 0.95 : 1.65);
        };

        const closeExhibit = (after) => {
            if (!theater.isOpen() && theater.mode() !== 'leaving') {
                releaseHold(true);
                if (after) {
                    after();
                }
                return;
            }
            const host = galleryHost;
            theater.leave(() => {
                releaseHold(true);
                if (after) {
                    after();
                    return;
                }
                if (host) {
                    appState.selected = host;
                    showObjectCard(host, allInfo, cardHandlers(false));
                }
            });
        };

        theater.setCatalog(allInfo);
        theater.mountChrome(() => closeExhibit());

        const lookAt = (mesh) => {
            if (!mesh) return;
            if (mesh.celestialKind === 'nebula') {
                warpTo(mesh);
                return;
            }
            appState.selected = mesh;
            turnToward(scene, flight, mesh);
        };

        const warpTo = (mesh) => {
            if (!mesh) return;
            if (mesh.celestialKind === 'nebula') {
                const slide = slideForNebula(mesh.infoId);
                if (theater.isOpen()) {
                    openGallery('hubble', slide, 0.95);
                    return;
                }
                const atHubble = flight.examine && flight.examine.mesh && String(flight.examine.mesh.infoId) === 'hubble';
                if (atHubble || !hubbleMesh) {
                    openGallery('hubble', slide, 1.65);
                    return;
                }
                appState.selected = hubbleMesh;
                hud.showWarpCaption(hubbleMesh.planetName);
                warpToMesh(scene, flight, hubbleMesh, () => {
                    hud.showWarpCaption(null);
                    appState.visited.add('hubble');
                    playArrivalChime(appState.muted);
                    openGallery('hubble', slide, 1.65);
                });
                return;
            }
            const fly = () => {
                appState.selected = mesh;
                hud.showWarpCaption(mesh.planetName || mesh.objectName);
                warpToMesh(scene, flight, mesh, () => {
                    hud.showWarpCaption(null);
                    appState.visited.add(String(mesh.infoId));
                    playArrivalChime(appState.muted);
                    showObjectCard(mesh, allInfo, cardHandlers(true));
                    if (appState.mode !== 'tour') {
                        appState.pauseOrbits = true;
                    }
                });
            };
            if (theater.isOpen() || theater.mode() === 'leaving') {
                theater.leave(() => {
                    releaseHold(false);
                    fly();
                });
                return;
            }
            fly();
        };

        appState.select = (mesh, options = {}) => {
            const run = () => {
                appState.selected = mesh;
                if (mesh && mesh.celestialKind === 'nebula') {
                    warpTo(mesh);
                    return;
                }
                if (options.look !== false) {
                    lookAt(mesh);
                }
                if (options.openCard && appState.mode !== 'tour') {
                    appState.pauseOrbits = true;
                    showObjectCard(mesh, allInfo, cardHandlers(false));
                }
            };
            if ((theater.isOpen() || theater.mode() === 'leaving') && (!mesh || mesh.celestialKind !== 'nebula')) {
                theater.leave(() => {
                    releaseHold(true);
                    run();
                });
                return;
            }
            run();
        };
        appState.lookAt = lookAt;
        appState.warpTo = warpTo;
        appState.goHome = () => {
            const home = () => {
                goHome(scene, flight, sunMesh);
                appState.selected = sunMesh;
            };
            if (theater.isOpen() || theater.mode() === 'leaving') {
                theater.leave(() => {
                    releaseHold(true);
                    home();
                });
                return;
            }
            home();
        };
        let musicArmed = false;
        let musicUnlockHooked = false;
        const beginMusic = () => {
            music.setVolume(appState.muted ? 0 : appState.musicVolume);
            if (musicArmed) {
                return;
            }
            if (music.isReady() && music.isPlaying) {
                musicArmed = true;
                return;
            }
            if (!music.isReady()) {
                music.metadata.pendingPlay = true;
                musicArmed = true;
                return;
            }
            musicArmed = true;
            music.play();
        };
        const resumeMusic = () => {
            const audioEngine = BABYLON.Engine.audioEngine;
            if (!audioEngine) {
                return;
            }
            if (appState.muted && !musicArmed) {
                music.setVolume(0);
                return;
            }
            audioEngine.useCustomUnlockedButton = true;
            if (audioEngine.unlocked) {
                beginMusic();
                return;
            }
            if (!musicUnlockHooked) {
                musicUnlockHooked = true;
                const observer = audioEngine.onAudioUnlockedObservable.add(() => {
                    audioEngine.onAudioUnlockedObservable.remove(observer);
                    beginMusic();
                });
            }
            audioEngine.unlock();
        };
        appState.toggleMute = () => {
            appState.muted = !appState.muted;
            music.setVolume(appState.muted ? 0 : appState.musicVolume);
            if (!appState.muted) {
                resumeMusic();
            }
        };
        const resumeMusicOnGesture = (event) => {
            if (event.target && event.target.closest && event.target.closest('#mute-button')) {
                return;
            }
            resumeMusic();
            if (musicArmed || (BABYLON.Engine.audioEngine && BABYLON.Engine.audioEngine.unlocked)) {
                window.removeEventListener('pointerdown', resumeMusicOnGesture);
                window.removeEventListener('keydown', resumeMusicOnGesture);
            }
        };
        window.addEventListener('pointerdown', resumeMusicOnGesture);
        window.addEventListener('keydown', resumeMusicOnGesture);
        appState.togglePointerLock = () => {
            if (document.pointerLockElement === canvas) {
                document.exitPointerLock();
            } else {
                canvas.requestPointerLock();
            }
        };
        const dismissWelcome = () => {
            document.body.classList.remove('awaiting-choice');
            const welcome = document.getElementById('welcome-div');
            const shade = document.getElementById('background-div');
            if (welcome) welcome.remove();
            if (shade) shade.remove();
        };
        const goToTourStop = (index) => {
            if (index < 0) {
                return;
            }
            dismissWelcome();
            if (index >= hud.tourIds.length) {
                appState.tourIndex = -1;
                hud.showArrival('Tour complete. The galaxy is yours to roam.');
                appState.enterFreeMode();
                return;
            }
            appState.mode = 'tour';
            appState.pauseOrbits = false;
            appState.moonDetourId = null;
            appState.tourIndex = index;
            const dest = hud.uniqueDestinations.find((item) => item.id === hud.tourIds[index]);
            if (dest) {
                warpTo(dest.mesh);
            }
            hud.refreshNav();
        };
        appState.enterFreeMode = () => {
            dismissWelcome();
            appState.mode = 'free';
            hud.refreshNav();
        };
        appState.startGuidedTour = () => {
            dismissWelcome();
            const index = appState.tourIndex >= 0 ? appState.tourIndex : 0;
            goToTourStop(index);
        };
        appState.goToTourStop = goToTourStop;
        appState.tourBack = () => {
            if (appState.tourIndex > 0) {
                goToTourStop(appState.tourIndex - 1);
            }
        };
        appState.tourNext = () => goToTourStop(appState.tourIndex + 1);
        appState.visitMoon = (mesh) => {
            if (!mesh) return;
            appState.moonDetourId = String(mesh.infoId);
            appState.moonParentId = mesh.parentId || null;
            warpTo(mesh);
        };
        appState.returnToTourStop = () => {
            const parentId = appState.moonParentId;
            appState.moonDetourId = null;
            appState.moonParentId = null;
            if (appState.mode === 'tour' && appState.tourIndex >= 0) {
                const id = hud.tourIds[appState.tourIndex];
                const dest = hud.uniqueDestinations.find((item) => item.id === id);
                if (dest) {
                    warpTo(dest.mesh);
                }
                return;
            }
            if (parentId) {
                const dest = hud.uniqueDestinations.find((item) => item.id === parentId);
                if (dest) {
                    appState.select(dest.mesh, { look: true, openCard: true });
                }
            }
        };
        appState.toggleTour = () => {
            if (appState.mode === 'tour') {
                appState.enterFreeMode();
            } else {
                appState.startGuidedTour();
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
                lookBtn.textContent = appState.pointerLocked ? 'Looking' : 'Look';
                lookBtn.classList.toggle('active', appState.pointerLocked);
            }
        });

        scene.beforeRender = () => {
            try {
                renderPlanets(
                    planets,
                    appState.pauseOrbits,
                    appState.mode === 'tour' && flight.examine ? flight.examine.mesh : null
                );
                updateMoons(moons, appState.pauseOrbits);
                if (!flight.holdView) {
                    const dt = engine.getDeltaTime() / 1000;
                    if (hubbleRig) {
                        hubbleRig.update(dt);
                    }
                    if (jwstRig) {
                        jwstRig.update(dt);
                    }
                }
                galaxy.update(appState.pauseOrbits);
                updateExamineCamera(flight);
                hud.update();
                if (sky && !sky.infiniteDistance) {
                    sky.position.copyFrom(camera.position);
                }
                if (ground) {
                    ground.isVisible = camera.position.lengthSquared() < 500 * 500;
                }
                const plateOpen = theater.isOpen() || theater.mode() === 'leaving';
                glowLayer.intensity = plateOpen ? 0 : 0.55;
                if (flight.warping || plateOpen) {
                    highlightLayer.removeAllMeshes();
                    hud.setHover(null);
                } else {
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
            if (flight.holdView) {
                return;
            }
            if (flight.examine && flight.examine.dragMoved) {
                flight.examine.dragMoved = false;
                return;
            }
            const pick = scene.pick(scene.pointerX, scene.pointerY);
            const picked = pick.pickedMesh && (pick.pickedMesh.examineMesh || pick.pickedMesh);
            if (picked && picked.isCelestial) {
                appState.select(picked, { look: true, openCard: true });
            } else if (!appState.pointerLocked && !flight.examine) {
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
                if (theater.isOpen() || theater.mode() === 'leaving') {
                    closeExhibit();
                    return;
                }
                endExamine(flight);
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
                if (appState.mode === 'tour') {
                    if (key === ']') appState.tourNext();
                    else appState.tourBack();
                } else {
                    const list = hud.uniqueDestinations;
                    const current = list.findIndex((item) => appState.selected && item.id === String(appState.selected.infoId));
                    const next = key === ']'
                        ? (current + 1) % list.length
                        : (current - 1 + list.length) % list.length;
                    if (list[next]) {
                        appState.select(list[next].mesh, { look: true, openCard: true });
                    }
                }
            }
        });

        window.addEventListener('resize', () => engine.resize());
        createWelcomeSection({
            onTour: () => {
                resumeMusic();
                appState.startGuidedTour();
            },
            onFree: () => {
                resumeMusic();
                appState.enterFreeMode();
            }
        });
        return scene;
    };

    const scene = createScene();
    engine.runRenderLoop(() => scene.render());
};

window.addEventListener('DOMContentLoaded', init());
