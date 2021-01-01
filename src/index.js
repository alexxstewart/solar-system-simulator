import { changeVolumeSlider, showPlanetInfo } from './GUIManager.js'
import { createLighting, createGroundMesh, createSkyImage, createPlanets } from './createOnScreenAssets.js'
import { renderPlanets } from './planetRenderer.js'
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

        const saturnRings = BABYLON.Mesh.CreateTorus("sphere", 3.5, 0.8, 40, scene);
        saturnRings.addRotation(0,0,10);
        saturnRings.scaling.y = 0.01;
        saturnRings.material = new BABYLON.StandardMaterial("sunmaterial", scene);
        saturnRings.material.diffuseTexture = new BABYLON.Texture("style/textures/saturn.jpg", scene);

        planets = createPlanets(scene, planetData);
        console.log(planetData);
        scene.beforeRender = () => {

            renderPlanets(planets);

            saturnRings.position = new BABYLON.Vector3(planets[6].orbit * Math.sin(planets[6].alpha), 0, planets[6].orbit * Math.cos(planets[6].alpha));

            if(focusCameraOnPlanet){
                //console.log(focusCameraOnPlanetId);
                const p = planets[focusCameraOnPlanetId];
                const alphaChange = 0.01 / p.radius;
                camera.position = new BABYLON.Vector3((p.orbit + p.radius + 1) * Math.sin(p.alpha + alphaChange), 0, (p.orbit + p.radius + 1) * Math.cos(p.alpha + alphaChange))
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