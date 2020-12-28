
// constants
const MERCURY_ORBIT = 6;
const VENUS_ORBIT = 10;
const EARTH_ORBIT = 15;
const MARS_ORBIT = 20;
const JUPITER_ORBIT = 30;
const SATURN_ORBIT = 40;
const NEPTUNE_ORBIT = 6;
const URANUS_ORBIT = 6;
const EARTH_MOON_ORBIT = 1.5;


const startApp = () => {
    const canvas = document.getElementById('canvas');

    const engine = new BABYLON.Engine(canvas, true);

    const createScene = () => {
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3.Black();

        // create the camera
        const camera = new BABYLON.ArcRotateCamera("Camera", 0, Math.PI / 2, 12, BABYLON.Vector3.Zero(), scene);
        camera.attachControl(canvas, true);

        // sun light
        const light0 = new BABYLON.PointLight("Omni0", new BABYLON.Vector3(0, 0, 0), scene);
        light0.diffuse = new BABYLON.Color3(1, 1, 1);

        // top light to illuminate the grid
        const light1 = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 100, 100), scene);

        // create a mesh ground
    	const ref = BABYLON.Mesh.CreateGround("gnd", 100, 100, 100, scene);
	    ref.material = new BABYLON.StandardMaterial("gmat", scene);
        ref.material.wireframe = true;
        ref.material.alpha = 0.05;

        // create the planets
        const sun = BABYLON.Mesh.CreateSphere("sphere", 32, 5, scene);
        const earth = BABYLON.Mesh.CreateSphere("sphere", 32, 1, scene);
        const earthMoon = BABYLON.Mesh.CreateSphere("sphere", 32, 0.5, scene);
        const mercury = BABYLON.Mesh.CreateSphere("sphere", 32, 1, scene);
        const venus = BABYLON.Mesh.CreateSphere("sphere", 32, 1, scene);
        const mars = BABYLON.Mesh.CreateSphere("sphere", 32, 1, scene);
        const jupiter = BABYLON.Mesh.CreateSphere("sphere", 32, 2.5, scene);
        const saturn = BABYLON.Mesh.CreateSphere("sphere", 32, 2, scene);

        // make the moon orbit earth
        earthMoon.position.x = EARTH_MOON_ORBIT;
        earthMoon.bakeCurrentTransformIntoVertices();

        // add color to the planets
        sun.material = new BABYLON.StandardMaterial("sunmaterial", scene);
        sun.material.diffuseTexture = new BABYLON.Texture("style/textures/sun.jpg", scene);
        sun.material.emissiveColor = new BABYLON.Color3(1, 1, 0);

        mercury.material = new BABYLON.StandardMaterial("sunmaterial", scene);
        mercury.material.diffuseTexture = new BABYLON.Texture("style/textures/mercury.jpg", scene);

        venus.material = new BABYLON.StandardMaterial("sunmaterial", scene);
        venus.material.diffuseTexture = new BABYLON.Texture("style/textures/venus.jpg", scene);

        earth.material = new BABYLON.StandardMaterial("earthMat", scene);
        earth.material.diffuseTexture = new BABYLON.Texture("style/textures/earth.jpg", scene);

        earthMoon.material = new BABYLON.StandardMaterial("earthMat", scene);
        earthMoon.material.diffuseTexture = new BABYLON.Texture("style/textures/earthMoon.jpg", scene);

        mars.material = new BABYLON.StandardMaterial("sunmaterial", scene);
        mars.material.diffuseTexture = new BABYLON.Texture("style/textures/mars.jpg", scene);

        jupiter.material = new BABYLON.StandardMaterial("sunmaterial", scene);
        jupiter.material.diffuseTexture = new BABYLON.Texture("style/textures/jupiter.jpg", scene);

        saturn.material = new BABYLON.StandardMaterial("sunmaterial", scene);
        saturn.material.diffuseTexture = new BABYLON.Texture("style/textures/saturn.jpg", scene);

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
        
        // set alphas
        let earthAlpha = Math.PI;
        let mercuryAlpha = Math.PI;
        let venusAlpha = Math.PI;
        let marsAlpha = Math.PI;
        let JupiterAlpha = Math.PI;
        let saturnAlpha = Math.PI;
        let earthMoonAlpha = Math.PI;

        scene.beforeRender = () => {

            // calculate the orbits of the planets
            mercury.position = new BABYLON.Vector3(MERCURY_ORBIT * Math.sin(mercuryAlpha), sun.position.y, MERCURY_ORBIT * Math.cos(mercuryAlpha));
            venus.position = new BABYLON.Vector3(VENUS_ORBIT * Math.sin(venusAlpha), sun.position.y, VENUS_ORBIT * Math.cos(venusAlpha));
            earth.position = new BABYLON.Vector3(EARTH_ORBIT * Math.sin(earthAlpha), sun.position.y, EARTH_ORBIT * Math.cos(earthAlpha));
            mars.position = new BABYLON.Vector3(MARS_ORBIT * Math.sin(marsAlpha), sun.position.y, MARS_ORBIT * Math.cos(marsAlpha));
            jupiter.position = new BABYLON.Vector3(JUPITER_ORBIT * Math.sin(JupiterAlpha), sun.position.y, JUPITER_ORBIT * Math.cos(JupiterAlpha));
            saturn.position = new BABYLON.Vector3(SATURN_ORBIT * Math.sin(saturnAlpha), sun.position.y, SATURN_ORBIT * Math.cos(saturnAlpha));
            saturnRings.position = new BABYLON.Vector3(SATURN_ORBIT * Math.sin(saturnAlpha), sun.position.y, SATURN_ORBIT * Math.cos(saturnAlpha));
            earthMoon.position = earth.position;
        
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
        }

        return scene;
    }

    const scene = createScene();

    engine.runRenderLoop(() => {
        scene.render();
    });

}

window.addEventListener('DOMContentLoaded', startApp);