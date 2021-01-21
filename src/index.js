import { changeVolumeSlider, showPlanetInfo, createWelcomeSection } from './GUIManager.js';
import { createLighting, createGroundMesh, createSkyImage, createPlanets, createCamera, createMusic } from './createOnScreenAssets.js';
import { renderPlanets, renderCamera, highlightLayerLogic, checkCameraPosition, removePlanetLabel } from './renderer.js';
import { loadJSON, readDataClass} from './readData.js';
import { scrollHandleInitiator } from './scrollFeature.js';
import { reduceAlpha, fixCameraAlpha } from './alphaAlterer.js';
import { moveCameraTo } from './moveCamera.js'; 
import { initiateSpinToFunction } from './spinTo.js';

// constants
const STARS_IMAGE_DIAMETER = 300;
const ALPHA_DIFFERENCE = 1.5708365686;

// global variables
let focusCameraOnPlanet = false;
let focusCameraOnPlanetId = -1;
let blockPlanetClick = false;
let zoomingIn = false;

let advancedTexture = null;
let planetData = null;
let planetInfoData = null;
let planets = [];

let camera = null;
let lastCameraLocation = null;

// create the spinTo function used for the camera
initiateSpinToFunction()

const init = () => {
    // read the data through the object and when the data is loaded it will call the startApp function
    const readData = new readDataClass(startApp, '/data/planetInfo.json', '/data/planetData.json');
    readData.readPlanetInfo();
}

const revertCamera = () => {
    camera.position = new BABYLON.Vector3( 5, 8, -30);
    focusCameraOnPlanet = false;
    focusCameraOnPlanetId = -1;
    camera.attachControl(canvas, true);
    camera.setTarget(planets[0]);
}

const startApp = (infoData, data) => {
    planetInfoData = infoData;
    planetData = data;
    console.log(planetInfoData, planetData);

    const canvas = document.getElementById('canvas');
    const engine = new BABYLON.Engine(canvas, true, {stencil: true});

    const createScene = () => {
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3.Black();

        // create the camera
        const cameraAndPositionObject = createCamera(scene, canvas);
        camera = cameraAndPositionObject.camera, lastCameraLocation = cameraAndPositionObject.lastCameraLocation;

        // initiate the scroll handlers
        scrollHandleInitiator(camera);

        // create the highlighting layer
        const hightlightLayer = new BABYLON.HighlightLayer("hl1", scene);

        // create the base for the gui to be printed on and then call the music GUI function
        advancedTexture = new BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        
        // create the music and create the slider element to change the music volume
        const music = createMusic(scene);
        changeVolumeSlider(advancedTexture, music);

        // populate the universe
        createLighting(scene, camera);
        createSkyImage();
        createGroundMesh();

        planets = createPlanets(scene, planetData);
        let iteration = 0;

        scene.beforeRender = () => {
            renderPlanets(planets);
            fixCameraAlpha(camera);
            checkCameraPosition(camera, lastCameraLocation, STARS_IMAGE_DIAMETER);

            if(focusCameraOnPlanet){
                // remove the highlight
                hightlightLayer.removeAllMeshes();

                // block the user from clicking on any other planets while in focused mode
                blockPlanetClick = true;
                if(zoomingIn){
                    const returnObj = moveCameraTo(iteration, planets, focusCameraOnPlanetId, reduceAlpha, camera, ALPHA_DIFFERENCE);
                    iteration = returnObj.iteration, zoomingIn = returnObj.zoomingIn;
                    iteration++;
                }else{
                    renderCamera(planets, focusCameraOnPlanetId, camera);
                }
            }else{
                // allow for highlighting of planets
                highlightLayerLogic(scene, hightlightLayer, planets, advancedTexture);
                blockPlanetClick = false;
            }

            lastCameraLocation = camera.position;
        }

        return scene;
    }

    const scene = createScene();

    window.addEventListener('click', () => {
        const pick = scene.pick(scene.pointerX, scene.pointerY);
        if(pick.pickedMesh != null) {
            if(pick.pickedMesh.name == 'sphere' && !blockPlanetClick){
                //show the info about the planet and remove the label above the planet
                showPlanetInfo(pick.pickedMesh.idNumber, planetInfoData, revertCamera);
                removePlanetLabel(advancedTexture);

                // we want to focus the camera on the planet and not allow the user to move the camera
                focusCameraOnPlanet = true, focusCameraOnPlanetId = pick.pickedMesh.idNumber, zoomingIn = true;
                camera.detachControl(canvas);
            }
        }
    })

    // on window resize, resize the engine
    window.addEventListener('resize', () => engine.resize());

    // render the scene
    engine.runRenderLoop(() => {
        scene.render();
    });
}

// call the function to create the UI to introduce the user to the simulation
createWelcomeSection();

// when the DOM content has been loaded initiate the application
window.addEventListener('DOMContentLoaded', init());
