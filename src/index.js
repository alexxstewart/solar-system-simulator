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

const printInformationTab = (id) => {
    console.log(id);
}

const readData = () => {
    let data = null;
    fetch("./data/data.json")
  .then(response => response.json())
  .then(json => {
      data = JSON.parse(json)});
  console.log(data);
}

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


const startApp = () => {
    const canvas = document.getElementById('canvas');

    const engine = new BABYLON.Engine(canvas, true);

    const createScene = () => {
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3.Black();

        // create the camera
        const camera = new BABYLON.ArcRotateCamera("Camera", 0, Math.PI / 2, 12, BABYLON.Vector3(100,100,100), scene);
        camera.attachControl(canvas, true);
        camera.position = new BABYLON.Vector3(15,15,15)

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
        
        //const starbox = BABYLON.MeshBuilder.CreateBox("starSphere", {size: 300}, scene);
        
        /*var starboxMaterial = new BABYLON.StandardMaterial("starSphere", scene);
        starboxMaterial.reflectionTexture = new BABYLON.SphereTexture("style/textures/stars.jpg", scene);
        starboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        starboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        starbox.material = starboxMaterial;

        */

        /*
        const backgroundMaterial = new BABYLON.StandardMaterial("starSphere", scene);
        backgroundMaterial.backFaceCulling = false;
        backgroundMaterial.reflectionTexture = new BABYLON.CubeTexture("style/textures/starpic4/stars8k.jpg", scene);
        backgroundMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        backgroundMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        backgroundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        starbox.material = backgroundMaterial;
        //const button = BABYLON.GUI.Button.CreateSimpleButton("but", "Click Me")
        */

        const skySphere = BABYLON.MeshBuilder.CreateSphere("Dome", {slice: 0, diameter: 500}, scene);
        const skySphereMaterial = new BABYLON.StandardMaterial("skySphereMaterial", scene);
        skySphereMaterial.diffuseTexture = new BABYLON.Texture("style/textures/starpic4/star.jpg", scene);
        skySphereMaterial.backFaceCulling = false;
        skySphere.material = skySphereMaterial;

        // create the planets
        const sun = BABYLON.Mesh.CreateSphere("sphere", 32, 5, scene);
        const earth = BABYLON.Mesh.CreateSphere("sphere", 32, 1, scene);
        const earthMoon = BABYLON.Mesh.CreateSphere("sphere", 32, 0.5, scene);
        const mercury = BABYLON.Mesh.CreateSphere("sphere", 32, 1, scene);
        const venus = BABYLON.Mesh.CreateSphere("sphere", 32, 1, scene);
        const mars = BABYLON.Mesh.CreateSphere("sphere", 32, 1, scene);
        const jupiter = BABYLON.Mesh.CreateSphere("sphere", 32, 2.5, scene);
        const saturn = BABYLON.Mesh.CreateSphere("sphere", 32, 2, scene);
        const uranus = BABYLON.Mesh.CreateSphere("sphere", 32, 1.5, scene);
        const neptune = BABYLON.Mesh.CreateSphere("sphere", 32, 1.5, scene);

        // set mesh ids for each planet
        sun.idNumber = 0;
        mercury.idNumber = 1;
        venus.idNumber = 2;
        earth.idNumber = 3; 
        mars.idNumber = 4; 
        jupiter.idNumber = 5; 
        saturn.idNumber = 6;
        uranus.idNumber = 7;
        neptune.idNumber = 8;
        earthMoon.idNumber = 9;  

        // make the moon orbit earth
        earthMoon.position.x = EARTH_MOON_ORBIT;
        earthMoon.bakeCurrentTransformIntoVertices();

        // add color to the planets
        sun.material = new BABYLON.StandardMaterial("sunmaterial", scene);
        sun.material.diffuseTexture = new BABYLON.Texture("style/textures/sun.jpg", scene);
        sun.material.emissiveColor = new BABYLON.Color3(1, 1, 0);

        mercury.material = new BABYLON.StandardMaterial("mercurymaterial", scene);
        mercury.material.diffuseTexture = new BABYLON.Texture("style/textures/mercury.jpg", scene);

        venus.material = new BABYLON.StandardMaterial("venusmaterial", scene);
        venus.material.diffuseTexture = new BABYLON.Texture("style/textures/venus.jpg", scene);

        earth.material = new BABYLON.StandardMaterial("earthMat", scene);
        earth.material.diffuseTexture = new BABYLON.Texture("style/textures/earth.jpg", scene);

        earthMoon.material = new BABYLON.StandardMaterial("earthMoonMat", scene);
        earthMoon.material.diffuseTexture = new BABYLON.Texture("style/textures/earthMoon.jpg", scene);

        mars.material = new BABYLON.StandardMaterial("marsmaterial", scene);
        mars.material.diffuseTexture = new BABYLON.Texture("style/textures/mars.jpg", scene);

        jupiter.material = new BABYLON.StandardMaterial("jupitermaterial", scene);
        jupiter.material.diffuseTexture = new BABYLON.Texture("style/textures/jupiter.jpg", scene);

        saturn.material = new BABYLON.StandardMaterial("saturnmaterial", scene);
        saturn.material.diffuseTexture = new BABYLON.Texture("style/textures/saturn.jpg", scene);

        uranus.material = new BABYLON.StandardMaterial("uranusmaterial", scene);
        uranus.material.diffuseTexture = new BABYLON.Texture("style/textures/uranus.jpg", scene);

        neptune.material = new BABYLON.StandardMaterial("neptunematerial", scene);
        neptune.material.diffuseTexture = new BABYLON.Texture("style/textures/neptune.jpg", scene);

        const saturnRings = BABYLON.Mesh.CreateTorus("sphere", 3.5, 0.8, 40, scene);
        saturnRings.scaling.y = 0.01;
        saturnRings.material = new BABYLON.StandardMaterial("sunmaterial", scene);
        saturnRings.material.diffuseTexture = new BABYLON.Texture("style/textures/saturn.jpg", scene);

        // show orbital lines
        const mercuryOrbit = BABYLON.Mesh.CreateTorus("sphere", MERCURY_ORBIT * 2, 0.01, 80, scene);
        mercuryOrbit.scaling.y = 0.01;
        const venusOrbit = BABYLON.Mesh.CreateTorus("sphere", VENUS_ORBIT * 2, 0.01, 80, scene);
        venusOrbit.scaling.y = 0.01;
        const earthOrbit = BABYLON.Mesh.CreateTorus("sphere", EARTH_ORBIT * 2, 0.01, 80, scene);
        earthOrbit.scaling.y = 0.01;
        const marsOrbit = BABYLON.Mesh.CreateTorus("sphere", MARS_ORBIT * 2, 0.01, 80, scene);
        marsOrbit.scaling.y = 0.01;
        const jupiterOrbit = BABYLON.Mesh.CreateTorus("sphere", JUPITER_ORBIT * 2, 0.01, 80, scene);
        jupiterOrbit.scaling.y = 0.01;
        const saturnOrbit = BABYLON.Mesh.CreateTorus("sphere", SATURN_ORBIT * 2, 0.01, 80, scene);
        saturnOrbit.scaling.y = 0.01;
        const uranusOrbit = BABYLON.Mesh.CreateTorus("sphere", URANUS_ORBIT * 2, 0.01, 80, scene);
        uranusOrbit.scaling.y = 0.01;
        const neptuneOrbit = BABYLON.Mesh.CreateTorus("sphere", NEPTUNE_ORBIT * 2, 0.01, 80, scene);
        neptuneOrbit.scaling.y = 0.01;

        // create asteroid belt
        const asteroidsList = createAsteroidBelt(scene);

        // set alphas
        let earthAlpha = Math.PI;
        let mercuryAlpha = Math.PI;
        let venusAlpha = Math.PI;
        let marsAlpha = Math.PI;
        let JupiterAlpha = Math.PI;
        let saturnAlpha = Math.PI;
        let earthMoonAlpha = Math.PI;
        let uranusAlpha = Math.PI;
        let neptuneAlpha = Math.PI;

        scene.beforeRender = () => {

            // calculate the orbits of the planets
            mercury.position = new BABYLON.Vector3(MERCURY_ORBIT * Math.sin(mercuryAlpha), sun.position.y, MERCURY_ORBIT * Math.cos(mercuryAlpha));
            venus.position = new BABYLON.Vector3(VENUS_ORBIT * Math.sin(venusAlpha), sun.position.y, VENUS_ORBIT * Math.cos(venusAlpha));
            earth.position = new BABYLON.Vector3(EARTH_ORBIT * Math.sin(earthAlpha), sun.position.y, EARTH_ORBIT * Math.cos(earthAlpha));
            mars.position = new BABYLON.Vector3(MARS_ORBIT * Math.sin(marsAlpha), sun.position.y, MARS_ORBIT * Math.cos(marsAlpha));
            jupiter.position = new BABYLON.Vector3(JUPITER_ORBIT * Math.sin(JupiterAlpha), sun.position.y, JUPITER_ORBIT * Math.cos(JupiterAlpha));
            saturn.position = new BABYLON.Vector3(SATURN_ORBIT * Math.sin(saturnAlpha), sun.position.y, SATURN_ORBIT * Math.cos(saturnAlpha));
            uranus.position = new BABYLON.Vector3(URANUS_ORBIT * Math.sin(uranusAlpha), sun.position.y, URANUS_ORBIT * Math.cos(uranusAlpha));
            neptune.position = new BABYLON.Vector3(NEPTUNE_ORBIT * Math.sin(neptuneAlpha), sun.position.y, NEPTUNE_ORBIT * Math.cos(neptuneAlpha));
            saturnRings.position = new BABYLON.Vector3(SATURN_ORBIT * Math.sin(saturnAlpha), sun.position.y, SATURN_ORBIT * Math.cos(saturnAlpha));
            earthMoon.position = earth.position;

            //print the asteroids
            printAsteroids(asteroidsList)
        
            //rotate the planets
            earth.rotation.y += 0.01;
            earthMoon.rotation.y += 0.02;
            saturnRings.rotation.y += 3;
            earthMoon.rotation.y -= 0.01
            sun.rotation.y += 0.003;

            // increment the alpha
            mercuryAlpha += 0.005;
            venusAlpha += 0.004;
            earthAlpha += 0.003;
            marsAlpha += 0.002;
            JupiterAlpha += 0.0009;
            saturnAlpha += 0.0005;
            uranusAlpha += 0.0002;
            neptuneAlpha += 0.0001;
        }

        return scene;
    }

    const scene = createScene();

    window.addEventListener('click', () => {
        const pick = scene.pick(scene.pointerX, scene.pointerY);
        if(pick.pickedMesh != null) {
            if(pick.pickedMesh.name == 'sphere'){
                printInformationTab(pick.pickedMesh.idNumber);
            }
        }
    })

    engine.runRenderLoop(() => {
        scene.render();
    });

}

readData();

window.addEventListener('DOMContentLoaded', startApp);