// constants
const STARS_IMAGE_DIAMETER = 18000;

// this function creates the camera element to be attached to the canvas
export const createCamera = (scene, canvas, defaultPos) => {

    // create the camera and attach the control to the canvas
    let camera = new BABYLON.ArcRotateCamera("Camera", 0, Math.PI / 2 - 0.5, 20, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);

    // set the position to the default position
    camera.position = defaultPos;

    // set the wheel precision (how large are the increments that the wheel scrolls at)
    camera.wheelPrecision = 10;
    return camera;
}

// this function creates the lighting for the scene
export const createLighting = (scene, camera) => {
    // creat light coming out of the sun
    const light = new BABYLON.PointLight("Omni0", new BABYLON.Vector3(0, 0, 0), scene);
    light.diffuse = new BABYLON.Color3(1, 1, 1);
    light.intensity = 3;
    light.range = 220;

    // create the light attached to the camera
    const cameraLight = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 0, 0), scene);
    cameraLight.groundColor = new BABYLON.Color3(0, 0, 0);
    cameraLight.specular = new BABYLON.Color3(0, 0, 0);
    cameraLight.intensity = 1.15;

    // attach this light to the camera
    cameraLight.parent = camera;
}

// this function creates the grid mesh plane which all the planets sit on
export const createGroundMesh = (scene) => {

    // create a mesh ground
    const ref = BABYLON.MeshBuilder.CreateGround("gnd", { width: 420, height: 420, subdivisions: 80 }, scene);
	ref.material = new BABYLON.StandardMaterial("gmat", scene);
    ref.material.wireframe = true;
    ref.material.alpha = 0.02;
    ref.isPickable = false;
    ref.freezeWorldMatrix();
    return ref;
}

// this function creates the image background to be displayed as a sphere
export const createSkyImage = (scene) => {
    // create the stars background
    const skySphere = BABYLON.MeshBuilder.CreateSphere("Sphere", {diameter: STARS_IMAGE_DIAMETER}, scene);
    const skySphereMaterial = new BABYLON.StandardMaterial("skySphereMaterial", scene);
    skySphereMaterial.diffuseTexture = new BABYLON.Texture("style/textures/galaxy/milkyway.jpg", scene);
    skySphereMaterial.emissiveTexture = skySphereMaterial.diffuseTexture;
    skySphereMaterial.emissiveColor = new BABYLON.Color3(0.35, 0.35, 0.4);
    skySphereMaterial.backFaceCulling = false;
    skySphereMaterial.disableLighting = true;
    skySphere.material = skySphereMaterial;
    skySphere.isPickable = false;
    skySphere.infiniteDistance = true;
    return skySphere;
}


/* 
This function creates the planet meshes and adds then to an array to be returned.
it translates the planetData into objects to be shown on screen.
*/
export const createPlanets = (scene, planetData) => {

    const planets = [];

    // loop over the planet data stored in planetData
    for(let i in planetData){

        // get the planetdata from the array
        const p = planetData[i];

        // create the planet mesh
        const planet = BABYLON.MeshBuilder.CreateSphere("sphere", {
            segments: parseInt(p.planetSegments, 10) || 32,
            diameter: parseFloat(p.radius)
        }, scene);
        
        // translate all the properties to the planet mesh object
        planet.planetName = p.planetName;
        planet.idNumber = i;
        planet.radius = parseInt(p.radius);
        planet.alpha = parseFloat(p.alpha);
        planet.alphaIncrement = parseFloat(p.alphaIncrement);
        planet.orbit = parseFloat(p.orbit);
        planet.rotationIncrement = parseFloat(p.rotationIncrement);
        planet.cameraDistance = parseFloat(p.cameraDistance);
        planet.isCelestial = true;
        planet.infoId = String(i);

        // assign a material to the planets
        planet.material = new BABYLON.StandardMaterial(`${p.planetName}material`, scene);
        planet.material.diffuseTexture = new BABYLON.Texture(p.urlPath, scene);

        // add planet specfic values
        if(i == 0){
            // add a light to the sun
            planet.material.emissiveColor = new BABYLON.Color3(1, 1, 0);
        }else if(i == 6){
            // add a rotation to the saturn 
            planet.addRotation(0,0,10);
        }else if(i == 9){
            // creating the moon
            planet.position.x = planet.orbit;
            planet.bakeCurrentTransformIntoVertices();
            planet.alpha = Math.PI / 2;
        }else if(i == 10){
            planet.dispose();
            break;
        }

        // add the planet to the planets array
        planets.push(planet);

        // create the torus for the orbit path visual
        const orbitVisual = BABYLON.MeshBuilder.CreateTorus("orbitCircle", {
            diameter: planet.orbit * 2,
            thickness: 0.01,
            tessellation: 80
        }, scene);
        orbitVisual.scaling.y = 0.01;
        orbitVisual.isPickable = false;
        orbitVisual.freezeWorldMatrix();
    }

    // create the saturn rings and append them onto the array
    const saturnRings = BABYLON.MeshBuilder.CreateTorus("torus", {
        diameter: 3.5,
        thickness: 0.8,
        tessellation: 40
    }, scene);
    saturnRings.addRotation(0,0,10);
    saturnRings.scaling.y = 0.01;
    saturnRings.material = new BABYLON.StandardMaterial("saturnMaterial", scene);
    saturnRings.material.diffuseTexture = new BABYLON.Texture("style/textures/saturn.jpg", scene);
    saturnRings.idNumber = 10;
    saturnRings.infoId = '6';
    saturnRings.planetName = 'Saturn';
    saturnRings.isCelestial = true;
    saturnRings.cameraDistance = 8;
    saturnRings.orbit = planets[6] ? planets[6].orbit : 0;
    saturnRings.alpha = planets[6] ? planets[6].alpha : 0;
    saturnRings.alphaIncrement = planets[6] ? planets[6].alphaIncrement : 0;
    saturnRings.rotationIncrement = 0;

    planets.push(saturnRings);

    return planets;
}

// this function creates the music asset for the application
export const createMusic = (scene) => {
    // create the music to play and set the default volume to 0.5
    const music = new BABYLON.Sound("Music", "style/music/ME - Galaxy Map Theme.mp3", scene, () => music.play(), {
        loop: true,
        autoplay: true
    });
    music.setVolume(0.5);
    return music;
}