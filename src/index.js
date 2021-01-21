import { changeVolumeSlider, showPlanetInfo, createWelcomeSection } from './GUIManager.js';
import { createLighting, createGroundMesh, createSkyImage, createPlanets, createCamera, createMusic } from './createOnScreenAssets.js';
import { renderPlanets, renderCamera, highlightLayerLogic, removePlanetLabel } from './renderer.js';
import { readDataClass} from './readData.js';
import { reduceAlpha, fixCameraAlpha } from './alphaAlterer.js';
import { moveCameraTo } from './moveCamera.js'; 
import { initiateSpinToFunction } from './spinTo.js';
import { loadTextures } from './loadAssets.js';

// constants
const ALPHA_DIFFERENCE = 1.5708365686;
const defaultCamPos = new BABYLON.Vector3( 5, 8, -30);
const CAMERA_LOWER_RADIUS_LIMIT = 4;
const CAMERA_UPPER_RADIUS_LIMIT = 150;

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

let iteration = 0;

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
    console.log('reverting camera');
    // set the camera position to the default position
    camera.position = defaultCamPos;

    // set the focus values off
    focusCameraOnPlanet = false;
    focusCameraOnPlanetId = -1;
    zoomingIn = false;
    iteration = 0;

    // allow the camera to pan again
    camera.attachControl(canvas, true);

    console.log(camera.inputs.attached.mousewheel)
    // add the mouse wheel if it has been taken away
    if(!(camera.inputs.attached.mousewheel)){
        console.log(camera.inputs.attached.mousewheel)
        camera.inputs.addMouseWheel();
    }

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

        // load the assets for the scene
        loadTextures(scene)

        // create the camera
        camera = createCamera(scene, canvas, defaultCamPos);

        // set the limits on the camera
        camera.lowerRadiusLimit = CAMERA_LOWER_RADIUS_LIMIT;
        camera.upperRadiusLimit = CAMERA_UPPER_RADIUS_LIMIT;

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

        scene.beforeRender = () => {

            // render the planets
            renderPlanets(planets);

            // check the planet alpha only sits between 0 and 2PI
            fixCameraAlpha(camera);

            /*
            If the user has clicked on a planet the boolean focusCamerOnPlanet will be true. If this is true then we remove all
            the highlights and we set the blockPlanetClick boolean to true to block the user from clicking on other planets. If 
            the boolean zoomingIn, which is the state between when the user has clicked on a planet and the planet is not in full 
            view yet. If this is true then we call the move cameraTo function to handle the movement, and we keep track of the
            number of iterations the loop has done. If the zoomingIn boolean is false then we just track the planet with the renderCamera
            function. If none of these are true then the normal case is we just allow the planets to be highlighted.
            */
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
        }

        return scene;
    }

    const scene = createScene();

    /*
    This event listener handles the ability for the user to click on planets. 
    It determines whether the mesh that the user has clicked on is a planet and if so it
    shows the information about the planet and indirectly activates the camera move in to planet ability.
    */
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
