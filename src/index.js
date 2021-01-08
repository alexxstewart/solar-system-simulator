import { changeVolumeSlider, showPlanetInfo } from './GUIManager.js';
import { createLighting, createGroundMesh, createSkyImage, createPlanets } from './createOnScreenAssets.js';
import { renderPlanets, renderCamera, highlightLayerLogic, checkCameraPosition } from './renderer.js';
import loadJSON from './readData.js';

// constants
const STARS_IMAGE_DIAMETER = 300;

let focusCameraOnPlanet = false;
let focusCameraOnPlanetId = -1;
let blockPlanetClick = false;
let zoomingIn = false;

let planetData = null;
let planetInfoData = null;
let planets = [];

let camera = null;

BABYLON.ArcRotateCamera.prototype.spinTo = function (whichprop, targetval, speed) {
    var ease = new BABYLON.CubicEase();
    ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
	BABYLON.Animation.CreateAndStartAnimation('at4', this, whichprop, speed, 120, this[whichprop], targetval, 0, ease);
}

function init() {
    loadJSON(function(response) {
        let {planets, planetsInfo} = response;
        planetData = planets;
        planetInfoData = planetsInfo;
        planetInfoData;

        // after loading the data we start the app
        startApp();
    });
}

const revertCamera = () => {
    camera.position = new BABYLON.Vector3( 5, 8, -30);
    focusCameraOnPlanet = false;
    focusCameraOnPlanetId = -1;
    camera.attachControl(canvas, true);
}

const startApp = () => {

    const canvas = document.getElementById('canvas');
    const engine = new BABYLON.Engine(canvas, true, {stencil: true});

    const createScene = () => {
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3.Black();

        // create the camera
        camera = new BABYLON.ArcRotateCamera("Camera", 0, Math.PI / 2, 12, BABYLON.Vector3(100,100,100), scene);
        camera.attachControl(canvas, true);
        camera.position = new BABYLON.Vector3( 5, 8, -30);
        let lastCameraLocation = null;

        // create the highlighting layer
        const hightlightLayer = new BABYLON.HighlightLayer("hl1", scene);

        // create the base for the gui to be printed on and then call the music GUI function
        const advancedTexture = new BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        
        // create the music to play and set the default volume to 0.5
        const music = new BABYLON.Sound("Music", "style/music/ME - Galaxy Map Theme.mp3", scene, () => music.play(), {
            loop: true,
            autoplay: true
        });
        music.setVolume(0.5);

        changeVolumeSlider(advancedTexture, music);

        // populate the universe
        createLighting();
        createSkyImage();
        createGroundMesh();

        planets = createPlanets(scene, planetData);
        let count = 0;
        scene.beforeRender = () => {

            renderPlanets(planets);

            checkCameraPosition(camera, lastCameraLocation, STARS_IMAGE_DIAMETER);

            if(focusCameraOnPlanet){
                // remove the highlight
                hightlightLayer.removeAllMeshes();

                // block the user from clicking on any other planets while in focused mode
                blockPlanetClick = true;

                if(zoomingIn){

                    const p = planets[focusCameraOnPlanetId];
                    const planetToPos = new BABYLON.Vector3((p.position.x), 0, (p.position.z));
                    camera.position = BABYLON.Vector3.Lerp(camera.position, planetToPos,0.02);
                    console.log(count);
                    if(count == 100){
                        zoomingIn = false;
                        console.log('movement done');
                        console.log(p.position);
                        console.log(camera.position);
                        count = 0;
                    }
                    count++;
                }else{
                    //console.log(camera.position);
                    renderCamera(planets, focusCameraOnPlanetId, camera);
                }
            }else{
                // allow for highlighting of planets
                highlightLayerLogic(scene, hightlightLayer, planets);
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
                showPlanetInfo(pick.pickedMesh.idNumber, planetInfoData, revertCamera);

                // we want to focus the camera on the planet and not allow the user to move the camera
                focusCameraOnPlanet = true;
                focusCameraOnPlanetId = pick.pickedMesh.idNumber;
                zoomingIn = true;
                camera.detachControl(canvas);
            }
        }
    })


    engine.runRenderLoop(() => {
        scene.render();
    });
}

window.addEventListener('DOMContentLoaded', init());