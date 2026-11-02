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

export const matteSurface = (material) => {
    material.specularColor = new BABYLON.Color3(0.02, 0.02, 0.02);
    material.specularPower = 16;
    material.ambientColor = new BABYLON.Color3(0.55, 0.55, 0.58);
    material.backFaceCulling = true;
    material.alpha = 1;
    material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
    material.disableDepthWrite = false;
    material.forceDepthWrite = true;
    material.useAlphaFromDiffuseTexture = false;
    if (material.diffuseTexture) {
        material.diffuseTexture.hasAlpha = false;
    }
};

// The sun's glow is drawn on top of the scene. Planets have to be in that
// pass too, as solid black, or the glow paints the sun across their night side.
export const attachGlowOccluders = (glowLayer, meshes) => {
    if (!glowLayer || !meshes || !meshes.length) {
        return;
    }
    const scene = meshes[0].getScene();
    const occluder = new BABYLON.StandardMaterial('glow-occluder', scene);
    occluder.emissiveColor = new BABYLON.Color3(0, 0, 0);
    occluder.diffuseColor = new BABYLON.Color3(0, 0, 0);
    occluder.specularColor = new BABYLON.Color3(0, 0, 0);
    occluder.disableLighting = true;
    occluder.backFaceCulling = true;
    occluder.alpha = 1;
    occluder.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
    occluder.forceDepthWrite = true;
    meshes.forEach((mesh) => {
        if (!mesh || mesh.celestialKind !== 'planet') {
            return;
        }
        const verts = mesh.getTotalVertices ? mesh.getTotalVertices() : 0;
        if (verts <= 0) {
            return;
        }
        glowLayer.addIncludedOnlyMesh(mesh);
        glowLayer.setMaterialForRendering(mesh, occluder);
    });
};

// Sunlight plus a faint starlight fill. The old camera light lit every
// facing side, which made planets look glassy and see-through.
export const createLighting = (scene) => {
    scene.ambientColor = new BABYLON.Color3(0.08, 0.085, 0.1);

    const sunLight = new BABYLON.PointLight('SunLight', new BABYLON.Vector3(0, 0, 0), scene);
    sunLight.diffuse = new BABYLON.Color3(1, 0.97, 0.9);
    sunLight.specular = new BABYLON.Color3(0.04, 0.04, 0.04);
    sunLight.intensity = 2.6;
    sunLight.range = 280;
    sunLight.falloffType = BABYLON.Light.FALLOFF_STANDARD;
    sunLight.shadowMinZ = 0.15;
    sunLight.shadowMaxZ = 260;

    const starlight = new BABYLON.HemisphericLight('starlight', new BABYLON.Vector3(0.1, 1, 0.2), scene);
    starlight.intensity = 0.12;
    starlight.diffuse = new BABYLON.Color3(0.55, 0.62, 0.78);
    starlight.groundColor = new BABYLON.Color3(0, 0, 0);
    starlight.specular = new BABYLON.Color3(0, 0, 0);

    try {
        const shadows = new BABYLON.ShadowGenerator(1024, sunLight);
        shadows.usePercentageCloserFiltering = true;
        shadows.bias = 0.0006;
        shadows.normalBias = 0.008;
        shadows.darkness = 0.08;
        shadows.transparencyShadow = true;
        return shadows;
    } catch (error) {
        console.warn('Sun shadows are unavailable', error);
        return null;
    }
};

export const addShadowCaster = (shadows, mesh) => {
    if (!shadows || !mesh) {
        return;
    }
    const consider = [mesh].concat(mesh.getChildMeshes ? mesh.getChildMeshes() : []);
    consider.forEach((part) => {
        const verts = part.getTotalVertices ? part.getTotalVertices() : 0;
        if (part.excludeFromShadows) {
            part.receiveShadows = false;
            return;
        }
        if (part.shadowReceiveOnly) {
            part.receiveShadows = true;
            return;
        }
        part.receiveShadows = false;
        if (verts > 0) {
            shadows.addShadowCaster(part, false);
        }
    });
};

BABYLON.Effect.ShadersStore.saturnRingVertexShader = `
precision highp float;
attribute vec3 position;
uniform mat4 world;
uniform mat4 worldViewProjection;
varying vec3 vWorld;
varying vec2 vDisk;
void main(void) {
    vDisk = position.xy;
    vWorld = (world * vec4(position, 1.0)).xyz;
    gl_Position = worldViewProjection * vec4(position, 1.0);
}
`;

BABYLON.Effect.ShadersStore.saturnRingFragmentShader = `
precision highp float;
varying vec3 vWorld;
varying vec2 vDisk;
uniform sampler2D ringTex;
uniform vec3 planetCenter;
uniform float planetRadius;
uniform float outerRadius;
void main(void) {
    float r = length(vDisk) / max(outerRadius, 0.001);
    if (r < 0.478 || r > 0.988) discard;
    float u = clamp((r - 0.478) / 0.52, 0.0, 0.93);
    vec4 band = texture2D(ringTex, vec2(u, 0.5));
    float lum = dot(band.rgb, vec3(0.299, 0.587, 0.114));
    if (lum < 0.07) discard;
    float edge = smoothstep(0.478, 0.51, r) * (1.0 - smoothstep(0.95, 0.988, r));
    vec3 col = band.rgb * vec3(1.08, 1.0, 0.9) * (0.92 + lum * 0.45);
    float innerHot = (1.0 - smoothstep(0.478, 0.58, r)) * smoothstep(0.55, 0.92, lum);
    col *= mix(1.0, 0.42, innerHot);

    float dist = length(vWorld);
    vec3 dir = vWorld / max(dist, 0.0001);
    float along = dot(planetCenter, dir);
    float radius = max(planetRadius, 0.2);
    float shade = 1.0;
    if (along > 0.15 && along < dist - 0.02) {
        float impact = length(planetCenter - dir * along);
        float umbra = 1.0 - smoothstep(radius * 0.78, radius * 1.16, impact);
        float penumbra = 1.0 - smoothstep(radius * 0.9, radius * 1.9, impact);
        shade = mix(1.0, 0.55, penumbra);
        shade = mix(shade, 0.08, umbra);
    }
    col *= shade;
    gl_FragColor = vec4(col, edge);
}
`;

const createSaturnRingMaterial = (scene) => {
    const material = new BABYLON.ShaderMaterial('saturnRingMat', scene, {
        vertex: 'saturnRing',
        fragment: 'saturnRing'
    }, {
        attributes: ['position'],
        uniforms: ['world', 'worldViewProjection', 'planetCenter', 'planetRadius', 'outerRadius'],
        samplers: ['ringTex'],
        needAlphaBlending: true
    });
    material.backFaceCulling = false;
    const ringTex = new BABYLON.Texture('style/textures/saturnRing.png', scene, false, true);
    ringTex.anisotropicFilteringLevel = 16;
    material.setTexture('ringTex', ringTex);
    material.setVector3('planetCenter', new BABYLON.Vector3(0, 0, 0));
    material.setFloat('planetRadius', 1.0);
    material.setFloat('outerRadius', 2.35);
    material.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
    return material;
};

const addPlanetAir = (scene, planets) => {
    const earth = planets[3];
    if (earth) {
        bakeEarthClouds(earth);
    }
};

const bakeEarthClouds = (earth) => {
    const surface = new Image();
    const clouds = new Image();
    let ready = 0;
    const compose = () => {
        if (ready < 2 || !earth.material) {
            return;
        }
        const width = surface.naturalWidth || surface.width;
        const height = surface.naturalHeight || surface.height;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(surface, 0, 0, width, height);
        const base = ctx.getImageData(0, 0, width, height);
        const cloudCanvas = document.createElement('canvas');
        cloudCanvas.width = width;
        cloudCanvas.height = height;
        const cloudCtx = cloudCanvas.getContext('2d', { willReadFrequently: true });
        cloudCtx.drawImage(clouds, 0, 0, width, height);
        const cloud = cloudCtx.getImageData(0, 0, width, height);
        const bd = base.data;
        const cd = cloud.data;
        for (let i = 0; i < bd.length; i += 4) {
            const lum = (cd[i] + cd[i + 1] + cd[i + 2]) / 3;
            const cover = lum < 42 ? 0 : Math.min(0.88, (lum - 42) / 145);
            if (cover <= 0) {
                continue;
            }
            bd[i] += (232 - bd[i]) * cover;
            bd[i + 1] += (238 - bd[i + 1]) * cover;
            bd[i + 2] += (244 - bd[i + 2]) * cover;
        }
        ctx.putImageData(base, 0, 0);
        const texture = new BABYLON.DynamicTexture('earth-with-clouds', {
            width,
            height
        }, earth.getScene(), false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, undefined, true);
        texture.getContext().drawImage(canvas, 0, 0);
        texture.update(false);
        texture.hasAlpha = false;
        earth.material.diffuseTexture = texture;
        earth.material.useAlphaFromDiffuseTexture = false;
        earth.material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
        earth.material.forceDepthWrite = true;
    };
    surface.onload = () => { ready += 1; compose(); };
    clouds.onload = () => { ready += 1; compose(); };
    surface.src = 'style/textures/earth.jpg';
    clouds.src = 'style/textures/earthClouds.jpg';
};

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
        const detail = i == 0 ? 64 : (i == 5 || i == 6 ? 128 : 96);
        const planet = BABYLON.MeshBuilder.CreateSphere("sphere", {
            segments: detail,
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
        planet.examineRadius = parseFloat(p.radius) * 0.5;
        planet.isCelestial = true;
        planet.infoId = String(i);
        planet.celestialKind = i == 0 ? 'star' : 'planet';

        // assign a material to the planets
        planet.material = new BABYLON.StandardMaterial(`${p.planetName}material`, scene);
        planet.material.diffuseTexture = new BABYLON.Texture(p.urlPath, scene);

        // add planet specfic values
        if(i == 0){
            planet.material.emissiveColor = new BABYLON.Color3(1, 0.95, 0.65);
            planet.material.specularColor = new BABYLON.Color3(0, 0, 0);
            planet.material.disableLighting = true;
        }else{
            matteSurface(planet.material);
        }

        if(i == 6){
            planet.rotation.z = 26.7 * Math.PI / 180;
        }else if(i == 9){
            // creating the moon
            planet.position.x = planet.orbit;
            planet.bakeCurrentTransformIntoVertices();
            planet.alpha = Math.PI / 2;
            planet.examineRadius = parseFloat(p.radius) * 0.5;
        }else if(i == 10){
            planet.dispose();
            break;
        }

        planets.push(planet);
    }

    addPlanetAir(scene, planets);
    // Saturn's rings: a real ring profile, lit with a smooth analytic shadow
    // instead of the blocky point-light shadow map.
    const saturnRings = new BABYLON.Mesh('saturn-rings', scene);
    saturnRings.rotation.z = 26.7 * Math.PI / 180;
    const ringRadius = 2.35;
    const ringMat = createSaturnRingMaterial(scene);
    const ringDisc = BABYLON.MeshBuilder.CreateDisc('saturn-ring-disc', {
        radius: ringRadius,
        tessellation: 320,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, scene);
    ringDisc.rotation.x = Math.PI / 2;
    ringDisc.material = ringMat;
    ringDisc.parent = saturnRings;
    ringDisc.isPickable = false;
    ringDisc.receiveShadows = false;
    ringDisc.excludeFromShadows = true;
    saturnRings.ringMaterial = ringMat;
    saturnRings.ringRadius = ringRadius;
    saturnRings.idNumber = 10;
    saturnRings.infoId = '6';
    saturnRings.planetName = 'Saturn';
    saturnRings.isCelestial = true;
    saturnRings.celestialKind = 'planet';
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
    // load the galaxy map theme and set the default volume to 0.5
    // browsers block autoplay, so playback waits for a user gesture
    const music = new BABYLON.Sound("Music", "style/music/ME - Galaxy Map Theme.mp3", scene, () => {
        if (music.metadata && music.metadata.pendingPlay && !music.isPlaying) {
            music.metadata.pendingPlay = false;
            music.play();
        }
    }, {
        loop: true,
        autoplay: false
    });
    music.setVolume(0.5);
    music.metadata = { pendingPlay: false };
    return music;
}