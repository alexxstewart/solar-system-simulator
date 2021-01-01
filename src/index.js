import { changeVolumeSlider, showPlanetInfo } from './GUIManager.js'

// constants
const STARS_IMAGE_DIAMETER = 500;

let planetInfoData = null;
let planetData = null;

let focusCameraOnPlanet = false;
let focusCameraOnPlanetId = -1;

// create an array storing references to planets
let planets = [];

const readData = () => {

    // read planet info data
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "./data/planetInfo.json");
    xhr.addEventListener('load', (event) => {
        planetInfoData = JSON.parse(event.currentTarget.responseText);
    });
    xhr.send();

    // read planet data
    xhr = new XMLHttpRequest();
    xhr.open("GET", "./data/planetData.json");
    xhr.addEventListener('load', (event) => {
        planetData = JSON.parse(event.currentTarget.responseText);

        // after the content has loaded start the application
        startApp();
    });
    xhr.send();
}

readData();

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
                    const scalar = 0.95;
                    camera.position = new BABYLON.Vector3(lastCameraLocation.x * scalar,lastCameraLocation.y * scalar,lastCameraLocation.z * scalar);
                }
            }
        })

        // create the music to play and set the default volume to 0.5
        const music = new BABYLON.Sound("Music", "/style/music/ME - Galaxy Map Theme.mp3", scene, () => music.play(), {
            loop: true,
            autoplay: true
        });
        music.setVolume(0.5);

        // create the base for the gui to be printed on
        const advancedTexture = new BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        //Print GUI elements
        changeVolumeSlider(advancedTexture, music);

        // creat light coming out of the sun
        const light0 = new BABYLON.PointLight("Omni0", new BABYLON.Vector3(0, 0, 0), scene);
        light0.diffuse = new BABYLON.Color3(1, 1, 1);

        // top light to illuminate the grid
        const light1 = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 100, 100), scene);

        // create a mesh ground
    	const ref = BABYLON.Mesh.CreateGround("gnd", 300, 300, 200, scene);
	    ref.material = new BABYLON.StandardMaterial("gmat", scene);
        ref.material.wireframe = true;
        ref.material.alpha = 0.02;

        // create the stars background
        const skySphere = BABYLON.MeshBuilder.CreateSphere("Sphere", {slice: 0, diameter: STARS_IMAGE_DIAMETER}, scene);
        const skySphereMaterial = new BABYLON.StandardMaterial("skySphereMaterial", scene);
        skySphereMaterial.diffuseTexture = new BABYLON.Texture("style/textures/starpic4/star.jpg", scene);
        skySphereMaterial.backFaceCulling = false;
        skySphere.material = skySphereMaterial;

        const saturnRings = BABYLON.Mesh.CreateTorus("sphere", 3.5, 0.8, 40, scene);
        saturnRings.addRotation(0,0,10);
        saturnRings.scaling.y = 0.01;
        saturnRings.material = new BABYLON.StandardMaterial("sunmaterial", scene);
        saturnRings.material.diffuseTexture = new BABYLON.Texture("style/textures/saturn.jpg", scene);

        planets = [];

        // loop over the planet data stored in planetData
        for(let i in planetData){
            const p = planetData[i];
            const planet = BABYLON.Mesh.CreateSphere("sphere", p.planetSegments, p.radius, scene);
            planet.idNumber = i;
            planet.radius = parseInt(p.radius);

            // assign a material to the planets
            planet.material = new BABYLON.StandardMaterial(`${p.planetName}material`, scene);
            planet.material.diffuseTexture = new BABYLON.Texture(p.urlPath, scene);

            // set the alpha and alpha increment of the planet
            planet.alpha = parseFloat(p.alpha);
            planet.alphaIncrement = parseFloat(p.alphaIncrement);
            planet.orbit = parseFloat(p.orbit);

            // set the rotation and the rotation increment of the planet
            planet.rotationIncrement = parseFloat(p.rotationIncrement);

            if(i == 0){
                // the sun has a light source so
                planet.material.emissiveColor = new BABYLON.Color3(1, 1, 0);
            }else if(i == 6){
                planet.addRotation(0,0,10);
            }else if(i == 9){
                // creating the moon
                planet.position.x = planet.orbit;
                planet.bakeCurrentTransformIntoVertices();
            }

            // add the planet to the planets array
            planets.push(planet);

            // create the torus for the orbit path visual
            const orbitVisual = BABYLON.Mesh.CreateTorus("orbitCircle", planet.orbit * 2, 0.01, 80, scene);
            orbitVisual.scaling.y = 0.01;
        }

        scene.beforeRender = () => {

            // loop over the planets in the array
            for(let i in planets){
                const p = planets[i];
                p.position = new BABYLON.Vector3(p.orbit * Math.sin(p.alpha), 0, p.orbit * Math.cos(p.alpha));
                p.alpha += p.alphaIncrement;
                p.rotation.y += p.rotationIncrement;
                if(i == 9){
                    // printing the moon
                    p.position = planets[3].position;
                    //console.log(planets[3].position);
                    //console.log(p.orbit);
                }else if(i == 6){ 
                    p.rotation.y = 0;
                }
            }

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

window.addEventListener('DOMContentLoaded', readData);