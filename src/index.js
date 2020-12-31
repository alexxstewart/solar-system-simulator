import { changeVolumeSlider, showPlanetInfo } from './GUIManager.js'

// constants
const MERCURY_ORBIT = 6;
const VENUS_ORBIT = 10;
const EARTH_ORBIT = 15;
const MARS_ORBIT = 20;
const JUPITER_ORBIT = 30;
const SATURN_ORBIT = 40;
const URANUS_ORBIT = 50;
const NEPTUNE_ORBIT = 60;
const EARTH_MOON_ORBIT = 1.5;
const ASTEROID_BELT_ORBIT_MIN = 23;
const ASTEROID_BELT_ORBIT_MAX = 27;
const STARS_IMAGE_DIAMETER = 500;

let planetInfoData = null;
let planetData = null;

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

        // create the music to play 
        const music = new BABYLON.Sound("Music", "/style/music/ME - Galaxy Map Theme.mp3", scene, () => music.play(), {
            loop: true,
            autoplay: true
        });
        music.setVolume(0.5);

        // create the base for the gui to be printed on
        const advancedTexture = new BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        //Print GUI elements
        changeVolumeSlider(advancedTexture, music);

        // sun light
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

        // create the planets
        const sun = BABYLON.Mesh.CreateSphere("sphere", 32, 0.5, scene);
        const earthMoon = BABYLON.Mesh.CreateSphere("sphere", 32, 0.5, scene);


        // make the moon orbit earth
        earthMoon.position.x = EARTH_MOON_ORBIT;
        earthMoon.bakeCurrentTransformIntoVertices();

        // add color to the planets
        sun.material = new BABYLON.StandardMaterial("sunmaterial", scene);
        sun.material.diffuseTexture = new BABYLON.Texture("style/textures/sun.jpg", scene);
        sun.material.emissiveColor = new BABYLON.Color3(1, 1, 0);

        const saturnRings = BABYLON.Mesh.CreateTorus("sphere", 3.5, 0.8, 40, scene);
        saturnRings.scaling.y = 0.01;
        saturnRings.material = new BABYLON.StandardMaterial("sunmaterial", scene);
        saturnRings.material.diffuseTexture = new BABYLON.Texture("style/textures/saturn.jpg", scene);

        // create asteroid belt
        //const asteroidsList = createAsteroidBelt(scene);

        // create an array storing references to planets
        const planets = [];

        // loop over the planet data stored in planetData
        for(let i in planetData){
            const p = planetData[i];
            const planet = BABYLON.Mesh.CreateSphere("sphere", p.planetSegments, p.radius, scene);
            planet.idNumber = i;

            // assign a material to the planets
            planet.material = new BABYLON.StandardMaterial(`${p.planetName}material`, scene);
            planet.material.diffuseTexture = new BABYLON.Texture(p.urlPath, scene);

            // set the alpha and alpha increment of the planet
            planet.alpha = parseFloat(p.alpha);
            planet.alphaIncrement = parseFloat(p.alphaIncrement);
            planet.orbit = parseFloat(p.orbit);

            // set the rotation and the rotation increment of the planet
            planet.rotationIncrement = parseFloat(p.rotationIncrement);

            // add the planet to the planet array
            planets.push(planet);

            // create the torus for the orbit path visual
            const orbitVisual = BABYLON.Mesh.CreateTorus("sphere", planet.orbit * 2, 0.01, 80, scene);
            orbitVisual.scaling.y = 0.01;
        }

        scene.beforeRender = () => {

            // loop over the planets in the array
            for(let i in planets){
                const p = planets[i];
                p.position = new BABYLON.Vector3(p.orbit * Math.sin(p.alpha), sun.position.y, p.orbit * Math.cos(p.alpha));
                p.alpha += p.alphaIncrement;
                p.rotation.y += p.rotationIncrement;
            }

            saturnRings.position = new BABYLON.Vector3(planets[5].orbit * Math.sin(planets[5].alpha), sun.position.y, planets[5].orbit * Math.cos(planets[5].alpha));
            earthMoon.position = planets[2].position;
        
            earthMoon.rotation.y += 0.02;
            saturnRings.rotation.y += 3;
            earthMoon.rotation.y -= 0.01
            sun.rotation.y += 0.003;

            lastCameraLocation = camera.position;
        }

        return scene;
    }

    const scene = createScene();

    window.addEventListener('click', () => {
        const pick = scene.pick(scene.pointerX, scene.pointerY);
        if(pick.pickedMesh != null) {
            if(pick.pickedMesh.name == 'sphere'){
                showPlanetInfo(pick.pickedMesh.idNumber);
            }
        }
    })

    engine.runRenderLoop(() => {
        scene.render();
    });

}

window.addEventListener('DOMContentLoaded', readData);


/*
const createAsteroidBelt = (scene, asteroidBeltDistance) => {
    let asteroids = [];

    for(let i = 0; i < 100; i++){
        
        // generate asteroid values
        const asteroidSize = (Math.random() * (0.1 - 0.01) + 0.01) * 10;
        const asteroidOrbitDistance = Math.random() * (ASTEROID_BELT_ORBIT_MAX - ASTEROID_BELT_ORBIT_MIN) + ASTEROID_BELT_ORBIT_MIN;
        // generate random asteroid starting position between 0 and 2*PI
        const asteroidAlpha = Math.random() * 2 * Math.PI;

        const asteroid = BABYLON.Mesh.CreateSphere("sphere", 16, asteroidSize, scene);
        //asteroid.material = new BABYLON.StandardMaterial("asteroid", scene);
        //asteroid.material.diffuseTexture = new BABYLON.Texture("style/textures/earthMoon.jpg", scene);
        
        // set properties
        asteroid.orbitDistance = asteroidOrbitDistance;
        asteroid.alpha = asteroidAlpha;

        // add asteroid to array
        asteroids.push(asteroid);
    }

    return asteroids;
}

const printAsteroids = (asteroidsList) => {
    for(let i = 0; i < asteroidsList.length; i++){
        const asteroid = asteroidsList[i];
        //console.log(asteroid);
        asteroid.position = new BABYLON.Vector3(asteroid.orbitDistance * Math.sin(asteroid.asteroidAlpha), asteroid.position.y, asteroid.orbitDistance * Math.cos(asteroid.asteroidAlpha));
        asteroid.asteroidAlpha = asteroid.asteroidAlpha + 0.001
    }
}
*/