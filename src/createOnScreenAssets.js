// constants
const STARS_IMAGE_DIAMETER = 300;

export const createLighting = (scene) => {
    // creat light coming out of the sun
    const light0 = new BABYLON.PointLight("Omni0", new BABYLON.Vector3(0, 0, 0), scene);
    light0.diffuse = new BABYLON.Color3(1, 1, 1);

    new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 100, 100), scene);
}

export const createGroundMesh = (scene) => {
    // create a mesh ground
    const ref = BABYLON.Mesh.CreateGround("gnd", 200, 200, 200, scene);
	ref.material = new BABYLON.StandardMaterial("gmat", scene);
    ref.material.wireframe = true;
    ref.material.alpha = 0.02;
}

export const createSkyImage = (scene) => {
    // create the stars background
    const skySphere = BABYLON.MeshBuilder.CreateSphere("Sphere", {slice: 0, diameter: STARS_IMAGE_DIAMETER}, scene);
    const skySphereMaterial = new BABYLON.StandardMaterial("skySphereMaterial", scene);
    skySphereMaterial.diffuseTexture = new BABYLON.Texture("style/textures/starpic4/star.jpg", scene);
    skySphereMaterial.backFaceCulling = false;
    skySphere.material = skySphereMaterial;
}

export const createPlanets = (scene, planetData) => {

    const planets = [];

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

    return planets;
}