import { changeVolumeSlider, showPlanetInfo, createWelcomeSection } from './GUIManager.js';
import { createLighting, createGroundMesh, createSkyImage, createPlanets, createCamera, createMusic } from './createOnScreenAssets.js';
import { renderPlanets, renderCamera, highlightLayerLogic, checkCameraPosition, removePlanetLabel } from './renderer.js';
import { readDataClass} from './readData.js';
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

/*
This Function reads the data for the planets and then once it has loaded it starts the application.
*/
const init = () => {
    // read the data through the object and when the data is loaded it will call the startApp function
    const readData = new readDataClass(startApp, '/data/planetInfo.json', '/data/planetData.json');
    readData.readPlanetInfo();
}

/*
This function reverts the camera back to the origin position after the user has exited out of a planet
information section.
*/
const revertCamera = () => {

    // set the camera position to the default position
    camera.position = new BABYLON.Vector3( 5, 8, -30);

    // set the focus values off
    focusCameraOnPlanet = false;
    focusCameraOnPlanetId = -1;

    // allow the camera to pan again
    camera.attachControl(canvas, true);

    // set the target to the sun
    camera.setTarget(planets[0]);
}

/*
This function starts the application. It is called when the json data has been read into the application. There is
also a before render function which handles the highlighting logic and the logic for focusing on planets
*/
const startApp = (infoData, data) => {

    // set the data
    planetInfoData = infoData;
    planetData = data;

    // create the canvas and engine
    const canvas = document.getElementById('canvas');
    const engine = new BABYLON.Engine(canvas, true, {stencil: true});

    const createScene = () => {

        // create the scene and set the background color to black
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

        // create the planet meshes and store them into an array
        planets = createPlanets(scene, planetData);

        // set the iteration count to 0
        let iteration = 0;

        scene.beforeRender = () => {

            // render the planets
            renderPlanets(planets);

            // check the planet alpha only sits between 0 and 2PI
            fixCameraAlpha(camera);

            // make sure the
            //checkCameraPosition(camera, lastCameraLocation, STARS_IMAGE_DIAMETER);

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
