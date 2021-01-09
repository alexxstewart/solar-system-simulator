import { changeVolumeSlider, showPlanetInfo } from './GUIManager.js';
import { createLighting, createGroundMesh, createSkyImage, createPlanets } from './createOnScreenAssets.js';
import { renderPlanets, renderCamera, highlightLayerLogic, checkCameraPosition } from './renderer.js';
import loadJSON from './readData.js';

// constants
const STARS_IMAGE_DIAMETER = 300;
const ALPHA_DIFFERENCE = 1.58;

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
        camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, BABYLON.Vector3(0,0,0), scene);
        camera.attachControl(canvas, true);
        //camera.position = new BABYLON.Vector3( 5, 8, -30);
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

        scene.beforeRender = () => {

            renderPlanets(planets);
            fixCameraAlpha(camera);
            //console.log('alpha of camera',camera.alpha);
            ////console.log('alpha of saturn',planets[6].alpha + ALPHA_DIFFERENCE);
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

                        console.log(p.alpha);
                        console.log('spinning');
                        if(p.alpha > Math.PI * 2){
                            console.log(p.alpha);
                            console.log('alpha bigger than one circle');
                            reduceAlpha(p);
                            console.log(p.alpha);
                        }

                        let planetAlphaInCameraAlpha = Math.PI * 2 - (p.alpha + (p.alphaIncrement * 100) - ALPHA_DIFFERENCE);
                        if(planetAlphaInCameraAlpha > 2 * Math.PI){
                            planetAlphaInCameraAlpha -= 2 * Math.PI;
                        }
                        console.log('matched alpha', planetAlphaInCameraAlpha);
                        
                        setTimeout(()=>camera.spinTo("beta", Math.PI / 2, 100), 0);
                        setTimeout(()=>camera.spinTo("radius", p.orbit + p.radius + distanceChange, 100), 0);
                        setTimeout(()=>camera.spinTo("alpha", planetAlphaInCameraAlpha, 100), 0);
                        console.log(p.alpha + (p.alphaIncrement * 100));
                        console.log('camera alpha', camera.alpha);
                        console.log('spun');
                    }else if(count == 100){
                        zoomingIn = false;
                        count = -1;
                        //console.log(planets[focusCameraOnPlanetId].alpha);
                    }
                    //console.log(planets[focusCameraOnPlanetId].alpha);
                    count++;
                    
                    /*
                    const id = focusCameraOnPlanetId;
                    const p = planets[focusCameraOnPlanetId];

                    let alphaChange = 0.1;
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

                    const planetToPos = new BABYLON.Vector3((p.orbit + p.radius + distanceChange) * Math.sin(p.alpha + alphaChange), 0, (p.orbit + p.radius +distanceChange) * Math.cos(p.alpha + alphaChange));

                    //const planetToPos = new BABYLON.Vector3((p.position.x) * 1.2, 0, (p.position.z) * 1.2);
                    camera.position = BABYLON.Vector3.Lerp(camera.position, planetToPos, 0.02);
                    if(camera.position == planetData.position){
                        console.log('camera at planet location');
                    }




                    console.log(camera.position, planetToPos);
                    console.log(count);
                    if(count == 200){
                        zoomingIn = false;
                        console.log('movement done');
                        console.log(p.position);
                        console.log(camera.position);
                        count = 0;
                    }
                    count++;
                    */
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