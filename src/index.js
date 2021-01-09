import { changeVolumeSlider, showPlanetInfo } from './GUIManager.js';
import { createLighting, createGroundMesh, createSkyImage, createPlanets } from './createOnScreenAssets.js';
import { renderPlanets, renderCamera, highlightLayerLogic, checkCameraPosition } from './renderer.js';
import loadJSON from './readData.js';

// constants
const STARS_IMAGE_DIAMETER = 300;
const ALPHA_DIFFERENCE = 1.5708365686;

let focusCameraOnPlanet = false;
let focusCameraOnPlanetId = -1;
let blockPlanetClick = false;
let zoomingIn = false;

let planetData = null;
let planetInfoData = null;
let planets = [];

let camera = null;

BABYLON.ArcRotateCamera.prototype.spinTo = function (whichprop, targetval, speed, fps) {
    var ease = new BABYLON.CubicEase();
    ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
	BABYLON.Animation.CreateAndStartAnimation('at4', this, whichprop, speed, fps, this[whichprop], targetval, 0, ease);
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
        camera = new BABYLON.ArcRotateCamera("Camera", 0, Math.PI / 2 - 0.5, 20, BABYLON.Vector3(0,0,0), scene);
        camera.attachControl(canvas, true);
        //camera.position = new BABYLON.Vector3( 5, 8, -30);
        camera.alpha = 1.58;
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

        const reduceAlpha = (planet) => {
            if(planet.alpha > Math.PI * 2){
                planet.alpha -= Math.PI * 2;
                reduceAlpha(planet);
            }else{
                return;
            }
        }

        const fixCameraAlpha = (camera) => {
            // if the camera alpha is less than 0 than we need to convert it to a number between 0 and 2PI
            if(camera.alpha < 0){
                // increase the alpha by 2PI and recursively call the function till alpha is between 0 and 2 PI
                camera.alpha += Math.PI * 2;
                fixCameraAlpha(camera);
            }
            // if the camera alpha is greater than 2PI than we need to convert it to a number between 0 and 2PI
            else if(camera.alpha > Math.PI * 2){
                camera.alpha -= Math.PI * 2;
                fixCameraAlpha(camera);
            }else{
                return;
            }
        }

        let fps = 120;

        scene.beforeRender = () => {
            //console.log(camera.position.x, camera.position.y, camera.position.z);
            renderPlanets(planets);
            fixCameraAlpha(camera);
            checkCameraPosition(camera, lastCameraLocation, STARS_IMAGE_DIAMETER);

            if(focusCameraOnPlanet){
                // remove the highlight
                hightlightLayer.removeAllMeshes();

                // block the user from clicking on any other planets while in focused mode
                blockPlanetClick = true;

                if(zoomingIn){
                    // get the alpha, radius and beta positions of the planet
                    if(count == 0){

                        const p = planets[focusCameraOnPlanetId];
                        const id = focusCameraOnPlanetId;
                        let distanceChange = 0;
                        if(id == 0 || id == 5){    
                            distanceChange = 3;
                        }else if( id == 1 || id == 2 || id == 3 || id == 4 ){
                            distanceChange = 1;
                        }else if(id == 6){
                            distanceChange = 4;       
                        }else if(id == 7 || id == 8){
                            distanceChange = 2;       
                        }

                        if(p.alpha > Math.PI * 2){
                            reduceAlpha(p);
                        }

                        let planetAlphaInCameraAlpha = Math.PI * 2 - (p.alpha + (p.alphaIncrement * fps) - ALPHA_DIFFERENCE);

                        if(planetAlphaInCameraAlpha > 2 * Math.PI){
                            planetAlphaInCameraAlpha -= 2 * Math.PI;
                        }

                        if(id == 0){
                            fps = 50;
                            planetAlphaInCameraAlpha = p.alpha;
                        }

                        const speed = fps;
                        
                        setTimeout(()=>camera.spinTo("beta", Math.PI / 2, speed, fps), 0);
                        setTimeout(()=>camera.spinTo("radius", p.orbit + p.radius + distanceChange, speed, fps), 0);
                        setTimeout(()=>camera.spinTo("alpha", planetAlphaInCameraAlpha, speed, fps), 0);
                        
                    }else if(count == fps){
                        zoomingIn = false;
                        count = -1;
                    }
                    count++;
                }else{
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