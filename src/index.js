import { changeVolumeSlider, showPlanetInfo } from './GUIManager.js'
import { createLighting, createGroundMesh, createSkyImage, createPlanets } from './createOnScreenAssets.js'
import { renderPlanets, renderCamera } from './renderer.js'
import loadJSON from './readData.js'

// constants
const STARS_IMAGE_DIAMETER = 300;

let focusCameraOnPlanet = false;
let focusCameraOnPlanetId = -1;

let planetData = null;
let planetInfoData = null;
let planets = [];

function init() {
    loadJSON(function(response) {
        let {planets, planetsInfo} = response;
        planetData = planets;
        planetInfoData = planetsInfo;

        // after loading the data we start the app
        startApp();
    });
}

const startApp = () => {

    const canvas = document.getElementById('canvas');
    const engine = new BABYLON.Engine(canvas, true);

    const createScene = () => {
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3.Black();

        // create the camera
        const camera = new BABYLON.ArcRotateCamera("Camera", 0, Math.PI / 2, 12, BABYLON.Vector3(100,100,100), scene);
        camera.attachControl(canvas, true);
        camera.position = new BABYLON.Vector3( 5, 8, -30)
        let lastCameraLocation = null;

        window.addEventListener('mousewheel', (event) => {
            // get the cameras distance from the center
            const cp = camera.position;
            const cameraDistance = Math.sqrt( (cp.x ** 2) + (cp.y ** 2) + (cp.z ** 2) );

            if(cameraDistance > (STARS_IMAGE_DIAMETER / 2 - 50)){
                // if the scroll wheel direction is out then keep changing the camera position to 244 otherwise allow the scroll
                if(event.wheelDelta < 0){
                    // we want the camera to keep the same angle that it was previously so we multiply the vector with a scalar value
                    const scalar = 0.90;
                    camera.position = new BABYLON.Vector3(lastCameraLocation.x * scalar,lastCameraLocation.y * scalar,lastCameraLocation.z * scalar);
                }
            }
        })

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

        scene.beforeRender = () => {

            renderPlanets(planets);

            if(focusCameraOnPlanet){
                renderCamera(planets, focusCameraOnPlanetId, camera);
            }
            lastCameraLocation = camera.position;
        }

        return scene;
    }

    const scene = createScene();

    window.addEventListener('click', () => {
        const pick = scene.pick(scene.pointerX, scene.pointerY);
        if(pick.pickedMesh != null) {
            if(pick.pickedMesh.name == 'sphere'){
                showPlanetInfo(pick.pickedMesh.idNumber, planetInfoData);

                // we want to focus the camera on the planet
                focusCameraOnPlanet = true;
                focusCameraOnPlanetId = pick.pickedMesh.idNumber;
            }
        }
    })

    engine.runRenderLoop(() => {
        scene.render();
    });
}

window.addEventListener('DOMContentLoaded', init());