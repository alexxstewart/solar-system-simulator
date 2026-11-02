import { matteSurface } from './createOnScreenAssets.js';

const LY_SCALE = 72;
const STAR_TEXTURE = 'style/textures/sun.jpg';
const ROCK_TEXTURE = 'style/textures/mercury.jpg';

export const travelDistance = (distanceLy, scaleMode) => {
    if (scaleMode === 'ly') {
        return distanceLy * LY_SCALE;
    }
    return 2800 + Math.log10(Math.max(distanceLy, 40) / 40) * 800;
};

export const raDecToVec = (raHours, decDeg, dist) => {
    const ra = (raHours * 15) * Math.PI / 180;
    const dec = decDeg * Math.PI / 180;
    return new BABYLON.Vector3(
        dist * Math.cos(dec) * Math.cos(ra),
        dist * Math.sin(dec),
        dist * Math.cos(dec) * Math.sin(ra)
    );
};

const markCelestial = (mesh, id, name, cameraDistance, kind, extra = {}) => {
    mesh.isCelestial = true;
    mesh.infoId = id;
    mesh.planetName = name;
    mesh.objectName = name;
    mesh.cameraDistance = cameraDistance;
    mesh.celestialKind = kind;
    mesh.isPickable = true;
    if (extra.distanceLy != null) {
        mesh.distanceLy = extra.distanceLy;
    }
    if (extra.distanceAu != null) {
        mesh.distanceAu = extra.distanceAu;
    }
};

const STAR_PERSONA = {
    proxima: 'red-dwarf',
    barnard: 'red-dwarf',
    'alpha-cen-a': 'sunlike',
    'alpha-cen-b': 'orange',
    sirius: 'spark',
    'sirius-b': 'white-dwarf',
    'eps-eri': 'orange',
    'tau-ceti': 'sunlike',
    altair: 'oblate',
    vega: 'spark-blue',
    polaris: 'pulse',
    betelgeuse: 'red-giant',
    antares: 'red-giant',
    rigel: 'blue-giant'
};

const emissiveStarMaterial = (scene, name, color, texture) => {
    const material = new BABYLON.StandardMaterial(name, scene);
    const map = texture || new BABYLON.Texture(STAR_TEXTURE, scene);
    material.emissiveTexture = map;
    material.diffuseTexture = map;
    material.emissiveColor = new BABYLON.Color3(color[0], color[1], color[2]);
    material.diffuseColor = new BABYLON.Color3(color[0] * 0.35, color[1] * 0.35, color[2] * 0.35);
    material.specularColor = new BABYLON.Color3(0, 0, 0);
    material.disableLighting = true;
    return material;
};

let tightHaloTex = null;
let wideHaloTex = null;
let spikeTex = null;
const granuleTextures = new Map();

const radialTexture = (scene, key, stops) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const fade = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    stops.forEach(([t, color]) => fade.addColorStop(t, color));
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, 256, 256);
    const texture = new BABYLON.DynamicTexture(key, { width: 256, height: 256 }, scene, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, undefined, true);
    texture.hasAlpha = true;
    texture.getContext().drawImage(canvas, 0, 0);
    texture.update(false);
    return texture;
};

const starHaloTextures = (scene) => {
    if (!tightHaloTex) {
        tightHaloTex = radialTexture(scene, 'star-halo-tight', [
            [0, 'rgba(255,255,255,1)'],
            [0.08, 'rgba(255,255,255,0.85)'],
            [0.2, 'rgba(255,255,255,0.28)'],
            [0.45, 'rgba(255,255,255,0.06)'],
            [1, 'rgba(255,255,255,0)']
        ]);
        wideHaloTex = radialTexture(scene, 'star-halo-wide', [
            [0, 'rgba(255,255,255,0.45)'],
            [0.18, 'rgba(255,255,255,0.16)'],
            [0.46, 'rgba(255,255,255,0.05)'],
            [1, 'rgba(255,255,255,0)']
        ]);
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 256, 256);
        const arm = (angle) => {
            ctx.save();
            ctx.translate(128, 128);
            ctx.rotate(angle);
            const grad = ctx.createLinearGradient(-120, 0, 120, 0);
            grad.addColorStop(0, 'rgba(255,255,255,0)');
            grad.addColorStop(0.42, 'rgba(255,255,255,0.05)');
            grad.addColorStop(0.5, 'rgba(255,255,255,0.9)');
            grad.addColorStop(0.58, 'rgba(255,255,255,0.05)');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(-120, -1.6, 240, 3.2);
            ctx.restore();
        };
        arm(0);
        arm(Math.PI / 2);
        arm(Math.PI / 5.2);
        spikeTex = new BABYLON.DynamicTexture('star-spikes', { width: 256, height: 256 }, scene, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, undefined, true);
        spikeTex.hasAlpha = true;
        spikeTex.getContext().drawImage(canvas, 0, 0);
        spikeTex.update(false);
    }
    return { tightHaloTex, wideHaloTex, spikeTex };
};

const granuleTexture = (scene, persona, color) => {
    const key = persona + color.join(',');
    if (granuleTextures.has(key)) {
        return granuleTextures.get(key);
    }
    if (persona === 'sunlike') {
        const texture = new BABYLON.Texture(STAR_TEXTURE, scene);
        granuleTextures.set(key, texture);
        return texture;
    }
    const width = persona === 'red-giant' ? 1024 : 512;
    const height = persona === 'red-giant' ? 512 : 256;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const image = ctx.createImageData(width, height);
    const scale = persona === 'red-giant' ? 48 : persona === 'red-dwarf' ? 10 : persona === 'blue-giant' ? 6 : persona === 'white-dwarf' ? 64 : persona === 'pulse' ? 18 : 9;
    const contrast = persona === 'white-dwarf' ? 0.04 : persona === 'red-giant' ? 0.28 : 0.12;
    const hash = (ix, iy) => {
        const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453;
        return n - Math.floor(n);
    };
    const noise = (x, y) => {
        const xi = Math.floor(x);
        const yi = Math.floor(y);
        const xf = x - xi;
        const yf = y - yi;
        const u = xf * xf * (3 - 2 * xf);
        const v = yf * yf * (3 - 2 * yf);
        const a = hash(xi, yi);
        const b = hash(xi + 1, yi);
        const c = hash(xi, yi + 1);
        const d = hash(xi + 1, yi + 1);
        return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
    const fbm = (x, y) => noise(x, y) * 0.62 + noise(x * 2.05 + 4.2, y * 2.05) * 0.28 + noise(x * 4.1, y * 4.1 + 1.7) * 0.1;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let shade = 1 + (fbm(x / scale, y / scale) - 0.5) * contrast;
            if (persona === 'red-giant') {
                const spot = fbm(x / 90, y / 90);
                const dent = Math.max(0, Math.min(1, (spot - 0.58) / 0.22));
                const soft = dent * dent * (3 - 2 * dent);
                shade *= 1 - soft * 0.42;
            }
            shade = Math.max(0.35, Math.min(1.15, shade));
            const index = (y * width + x) * 4;
            image.data[index] = Math.max(0, Math.min(255, color[0] * 255 * shade));
            image.data[index + 1] = Math.max(0, Math.min(255, color[1] * 255 * shade));
            image.data[index + 2] = Math.max(0, Math.min(255, color[2] * 255 * shade));
            image.data[index + 3] = 255;
        }
    }
    ctx.putImageData(image, 0, 0);
    const texture = new BABYLON.DynamicTexture(`${persona}-granules`, { width, height }, scene, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, undefined, true);
    texture.hasAlpha = false;
    texture.getContext().drawImage(canvas, 0, 0);
    texture.update(false);
    granuleTextures.set(key, texture);
    return texture;
};

const addStarHalo = (scene, parent, name, size, texture, color, alpha) => {
    const plane = BABYLON.MeshBuilder.CreatePlane(name, { width: size, height: size }, scene);
    plane.parent = parent;
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    plane.isPickable = false;
    plane.renderingGroupId = 1;
    const material = new BABYLON.StandardMaterial(`${name}-mat`, scene);
    material.diffuseTexture = texture;
    material.emissiveTexture = texture;
    material.emissiveColor = new BABYLON.Color3(color[0], color[1], color[2]);
    material.diffuseColor = new BABYLON.Color3(0, 0, 0);
    material.specularColor = new BABYLON.Color3(0, 0, 0);
    material.disableLighting = true;
    material.backFaceCulling = false;
    material.useAlphaFromDiffuseTexture = true;
    material.alpha = alpha;
    material.alphaMode = BABYLON.Engine.ALPHA_ADD;
    material.disableDepthWrite = true;
    plane.material = material;
    return plane;
};

const createStarMesh = (scene, spec, position) => {
    const persona = spec.persona || STAR_PERSONA[spec.id] || 'sunlike';
    const star = BABYLON.MeshBuilder.CreateSphere(spec.id, {
        diameter: spec.radius * 2,
        segments: persona === 'white-dwarf' ? 16 : 36
    }, scene);
    star.position = position.clone();
    star.material = emissiveStarMaterial(scene, `${spec.id}-mat`, persona === 'sunlike' ? spec.color : [1, 1, 1], granuleTexture(scene, persona, spec.color));
    star.rotationIncrement = persona === 'red-giant' ? 0.0006 : 0.0015;
    if (persona === 'oblate') {
        star.scaling.y = 0.78;
        star.scaling.x = 1.18;
        star.scaling.z = 1.18;
    }
    markCelestial(star, spec.id, spec.name, spec.cameraDistance, 'star', {
        distanceLy: spec.distanceLy,
        distanceAu: spec.distanceAu
    });

    const halos = new BABYLON.Mesh(`${spec.id}-halos`, scene);
    halos.parent = star;
    halos.isPickable = false;
    if (persona === 'oblate') {
        halos.scaling.set(1 / 1.18, 1 / 0.78, 1 / 1.18);
    }
    const textures = starHaloTextures(scene);
    const diameter = spec.radius * 2;
    const outerScale = persona === 'red-giant' ? 5.4 : persona === 'white-dwarf' ? 2.2 : persona === 'red-dwarf' ? 3.1 : 3.8;
    const tight = addStarHalo(scene, halos, `${spec.id}-tight`, diameter * 1.35, textures.tightHaloTex, spec.color, persona === 'white-dwarf' ? 0.7 : 0.22);
    const wide = addStarHalo(scene, halos, `${spec.id}-wide`, diameter * outerScale, textures.wideHaloTex, spec.color, persona === 'red-giant' ? 0.28 : 0.2);
    if (persona === 'spark' || persona === 'spark-blue' || persona === 'blue-giant') {
        addStarHalo(scene, halos, `${spec.id}-spikes`, diameter * (persona === 'blue-giant' ? 6.4 : 4.8), textures.spikeTex, spec.color, 0.72);
    }

    if (spec.lightIntensity) {
        const light = new BABYLON.PointLight(`${spec.id}-light`, new BABYLON.Vector3(0, 0, 0), scene);
        light.parent = star;
        light.diffuse = new BABYLON.Color3(spec.color[0], spec.color[1], spec.color[2]);
        light.intensity = spec.lightIntensity;
        light.range = spec.radius * 40;
    }

    if (persona === 'pulse' || persona === 'red-giant') {
        star.pulseHalo = wide;
        star.pulseRate = persona === 'pulse' ? 0.7 : 0.22;
        star.pulseAmount = persona === 'pulse' ? 0.08 : 0.05;
    }
    star.haloTight = tight;
    return star;
};

const imaginedRockyTexture = (scene, id) => {
    const width = 512;
    const height = 256;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const image = ctx.createImageData(width, height);
    const hash = (x, y) => {
        const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
        return n - Math.floor(n);
    };
    const noise = (x, y, scale) => {
        const x0 = Math.floor(x / scale);
        const y0 = Math.floor(y / scale);
        const fx = x / scale - x0;
        const fy = y / scale - y0;
        const sx = fx * fx * (3 - 2 * fx);
        const sy = fy * fy * (3 - 2 * fy);
        const a = hash(x0, y0);
        const b = hash(x0 + 1, y0);
        const c = hash(x0, y0 + 1);
        const d = hash(x0 + 1, y0 + 1);
        return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const shade = noise(x, y, 40) * 0.55 + noise(x, y, 14) * 0.3 + noise(x, y, 5) * 0.15;
            const pole = Math.abs(y / height - 0.5) * 2;
            const frost = pole > 0.84 ? (pole - 0.84) / 0.16 : 0;
            const index = (y * width + x) * 4;
            image.data[index] = (46 + shade * 42) * (1 - frost) + 214 * frost;
            image.data[index + 1] = (58 + shade * 46) * (1 - frost) + 224 * frost;
            image.data[index + 2] = (74 + shade * 48) * (1 - frost) + 236 * frost;
            image.data[index + 3] = 255;
        }
    }
    ctx.putImageData(image, 0, 0);
    const texture = new BABYLON.DynamicTexture(`${id}-surface`, { width, height }, scene, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, undefined, true);
    texture.hasAlpha = false;
    texture.getContext().drawImage(canvas, 0, 0);
    texture.update(false);
    return texture;
};

const createOrbitingPlanet = (scene, spec, parentStar) => {
    const planet = BABYLON.MeshBuilder.CreateSphere(spec.id, {
        diameter: spec.radius * 2,
        segments: 24
    }, scene);
    const material = new BABYLON.StandardMaterial(`${spec.id}-mat`, scene);
    if (!spec.texture || spec.texture === 'imagined') {
        material.diffuseTexture = imaginedRockyTexture(scene, spec.id);
        material.emissiveColor = new BABYLON.Color3(0.02, 0.025, 0.03);
        planet.surfaceImagined = true;
    } else {
        material.diffuseTexture = new BABYLON.Texture(spec.texture, scene);
    }
    matteSurface(material);
    planet.material = material;
    planet.orbit = spec.orbit;
    planet.alpha = Math.random() * Math.PI * 2;
    planet.alphaIncrement = spec.alphaIncrement || 0.003;
    planet.rotationIncrement = 0.01;
    planet.examineRadius = spec.radius;
    planet.parentStar = parentStar;
    planet.position = parentStar.getAbsolutePosition().add(new BABYLON.Vector3(
        spec.orbit * Math.sin(planet.alpha),
        0,
        spec.orbit * Math.cos(planet.alpha)
    ));
    markCelestial(planet, spec.id, spec.name, spec.cameraDistance, 'planet', {
        distanceLy: spec.distanceLy,
        distanceAu: spec.distanceAu
    });
    return planet;
};

const createBelt = (scene, spec) => {
    const template = BABYLON.MeshBuilder.CreateSphere(`${spec.id}-rock`, { diameter: 1, segments: 6 }, scene);
    const sps = new BABYLON.SolidParticleSystem(spec.id, scene, { isPickable: false });
    sps.addShape(template, spec.count);
    const mesh = sps.buildMesh();
    template.dispose();

    const material = new BABYLON.StandardMaterial(`${spec.id}-mat`, scene);
    material.diffuseTexture = new BABYLON.Texture(ROCK_TEXTURE, scene);
    material.specularColor = new BABYLON.Color3(0, 0, 0);
    mesh.material = material;
    mesh.isPickable = false;

    sps.initParticles = function () {
        for (let i = 0; i < sps.nbParticles; i++) {
            const particle = sps.particles[i];
            const angle = Math.random() * Math.PI * 2;
            const radius = spec.inner + Math.random() * (spec.outer - spec.inner);
            particle.position.x = Math.sin(angle) * radius;
            particle.position.z = Math.cos(angle) * radius;
            particle.position.y = (Math.random() - 0.5) * spec.ySpread;
            const scale = spec.scaleMin + Math.random() * (spec.scaleMax - spec.scaleMin);
            particle.scaling.x = scale;
            particle.scaling.y = scale * (0.6 + Math.random() * 0.8);
            particle.scaling.z = scale;
            particle.rotation.x = Math.random() * Math.PI;
            particle.rotation.y = Math.random() * Math.PI;
        }
    };
    sps.initParticles();
    sps.setParticles();

    const marker = BABYLON.MeshBuilder.CreateSphere(`${spec.id}-marker`, { diameter: 2.4, segments: 12 }, scene);
    marker.position = new BABYLON.Vector3(spec.markerOrbit, 0, 0);
    const markerMat = new BABYLON.StandardMaterial(`${spec.id}-marker-mat`, scene);
    markerMat.diffuseTexture = new BABYLON.Texture(ROCK_TEXTURE, scene);
    markerMat.alpha = 0.15;
    marker.material = markerMat;
    marker.orbit = spec.markerOrbit;
    marker.alpha = 0.4;
    marker.alphaIncrement = 0.0004;
    marker.rotationIncrement = 0;
    markCelestial(marker, spec.id, spec.name, spec.cameraDistance, 'belt', { distanceLy: spec.distanceLy, distanceAu: spec.distanceAu });
    return { mesh, marker, sps };
};

const createOortCloud = (scene, spec) => {
    const template = BABYLON.MeshBuilder.CreateSphere('oort-ice', { diameter: 0.5, segments: 5 }, scene);
    const sps = new BABYLON.SolidParticleSystem(spec.id, scene, { isPickable: false });
    sps.addShape(template, spec.count);
    const mesh = sps.buildMesh();
    template.dispose();
    const material = new BABYLON.StandardMaterial('oort-mat', scene);
    material.emissiveColor = new BABYLON.Color3(0.55, 0.7, 0.9);
    material.alpha = 0.7;
    material.disableLighting = true;
    mesh.material = material;
    mesh.isPickable = false;

    sps.initParticles = function () {
        for (let i = 0; i < sps.nbParticles; i++) {
            const particle = sps.particles[i];
            const radius = spec.inner + Math.random() * (spec.outer - spec.inner);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            particle.position.x = radius * Math.sin(phi) * Math.cos(theta);
            particle.position.y = radius * Math.cos(phi);
            particle.position.z = radius * Math.sin(phi) * Math.sin(theta);
            const scale = 0.15 + Math.random() * 0.45;
            particle.scaling = new BABYLON.Vector3(scale, scale, scale);
        }
    };
    sps.initParticles();
    sps.setParticles();

    const marker = BABYLON.MeshBuilder.CreateSphere('oort-marker', { diameter: 3, segments: 8 }, scene);
    marker.position = new BABYLON.Vector3(0, 0, (spec.inner + spec.outer) / 2);
    marker.material = material.clone('oort-marker-mat');
    marker.material.alpha = 0.12;
    markCelestial(marker, spec.id, spec.name, spec.cameraDistance, 'cloud', { distanceLy: spec.distanceLy, distanceAu: spec.distanceAu });
    return { mesh, marker };
};

const craftMaterial = (scene, name, color, specular) => {
    const material = new BABYLON.StandardMaterial(name, scene);
    material.diffuseColor = new BABYLON.Color3(color[0], color[1], color[2]);
    material.specularColor = new BABYLON.Color3(specular, specular, specular);
    material.specularPower = 28;
    material.ambientColor = new BABYLON.Color3(0.45, 0.45, 0.48);
    return material;
};

const createProbe = (scene, spec) => {
    const root = new BABYLON.Mesh(spec.id, scene);
    root.position = BABYLON.Vector3.FromArray(spec.position);
    const spinner = new BABYLON.Mesh(`${spec.id}-spin`, scene);
    spinner.parent = root;
    spinner.isPickable = false;

    const dishWhite = craftMaterial(scene, 'voyager-dish', [0.78, 0.8, 0.83], 0.28);
    dishWhite.specularPower = 56;
    const gold = craftMaterial(scene, 'voyager-gold', [0.74, 0.46, 0.14], 0.16);
    gold.specularPower = 22;
    gold.emissiveColor = new BABYLON.Color3(0.07, 0.035, 0.01);
    const recordGold = craftMaterial(scene, 'voyager-record', [0.92, 0.68, 0.22], 0.32);
    recordGold.specularPower = 40;
    recordGold.emissiveColor = new BABYLON.Color3(0.06, 0.03, 0.005);
    const dark = craftMaterial(scene, 'voyager-dark', [0.07, 0.07, 0.08], 0.1);
    const strut = craftMaterial(scene, 'voyager-strut', [0.82, 0.84, 0.88], 0.4);
    strut.specularPower = 48;
    const blanket = craftMaterial(scene, 'voyager-blanket', [0.16, 0.13, 0.1], 0.05);
    const glass = craftMaterial(scene, 'voyager-glass', [0.04, 0.07, 0.12], 0.9);
    glass.specularPower = 20;
    glass.emissiveColor = new BABYLON.Color3(0.015, 0.03, 0.06);
    const white = craftMaterial(scene, 'voyager-white', [0.9, 0.91, 0.93], 0.2);

    const parts = [];
    const add = (mesh, material) => {
        mesh.material = material;
        mesh.parent = spinner;
        mesh.isPickable = true;
        mesh.examineMesh = root;
        parts.push(mesh);
        return mesh;
    };
    const rod = (name, from, to, diameter, material) => {
        const mesh = add(BABYLON.MeshBuilder.CreateCylinder(name, {
            diameter,
            height: 1,
            tessellation: 8
        }, scene), material);
        const delta = to.subtract(from);
        const length = Math.max(0.04, delta.length());
        mesh.scaling.y = length;
        mesh.position = from.add(to).scale(0.5);
        const aim = new BABYLON.Quaternion();
        BABYLON.Quaternion.FromUnitVectorsToRef(BABYLON.Axis.Y, delta.scale(1 / length), aim);
        mesh.rotationQuaternion = aim;
        return mesh;
    };

    const dishRadius = 1.05;
    const dishCurve = 0.36;
    const dishShape = [];
    for (let i = 0; i <= 28; i++) {
        const radius = (i / 28) * dishRadius;
        dishShape.push(new BABYLON.Vector3(radius, radius * radius * dishCurve, 0));
    }
    const dish = add(BABYLON.MeshBuilder.CreateLathe(`${spec.id}-dish`, {
        shape: dishShape,
        tessellation: 72,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, scene), dishWhite);
    dish.receiveShadows = false;
    const rimY = dishRadius * dishRadius * dishCurve;
    const rim = add(BABYLON.MeshBuilder.CreateTorus(`${spec.id}-rim`, {
        diameter: dishRadius * 2,
        thickness: 0.028,
        tessellation: 64
    }, scene), strut);
    rim.position.y = rimY;
    const adapter = add(BABYLON.MeshBuilder.CreateCylinder(`${spec.id}-adapter`, {
        diameterTop: 0.16,
        diameterBottom: 0.4,
        height: 0.14,
        tessellation: 10
    }, scene), strut);
    adapter.position.y = -0.06;

    const busY = -0.5;
    const busRadius = 0.3;
    const bus = add(BABYLON.MeshBuilder.CreateCylinder(`${spec.id}-bus`, {
        diameter: busRadius * 2,
        height: 0.32,
        tessellation: 10
    }, scene), gold);
    bus.position.y = busY;
    const band = add(BABYLON.MeshBuilder.CreateCylinder(`${spec.id}-band`, {
        diameter: busRadius * 2 + 0.02,
        height: 0.07,
        tessellation: 10
    }, scene), blanket);
    band.position.y = busY;
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 + 0.2;
        const bay = add(BABYLON.MeshBuilder.CreateBox(`${spec.id}-bay-${i}`, {
            width: 0.11,
            height: 0.16,
            depth: 0.045
        }, scene), i % 2 === 0 ? dark : blanket);
        bay.position = new BABYLON.Vector3(Math.cos(angle) * (busRadius + 0.02), busY + (i % 2 ? 0.05 : -0.04), Math.sin(angle) * (busRadius + 0.02));
        bay.rotation.y = -angle + Math.PI / 2;
    }
    const tank = add(BABYLON.MeshBuilder.CreateSphere(`${spec.id}-tank`, {
        diameter: 0.24,
        segments: 16
    }, scene), gold);
    tank.position.y = busY - 0.2;
    const sensor = add(BABYLON.MeshBuilder.CreateBox(`${spec.id}-sun-sensor`, {
        width: 0.08,
        height: 0.04,
        depth: 0.08
    }, scene), white);
    sensor.position = new BABYLON.Vector3(0.16, busY + 0.18, 0.12);

    rod(`${spec.id}-neck`, new BABYLON.Vector3(0, 0.02, 0), new BABYLON.Vector3(0, busY + 0.2, 0), 0.1, strut);
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + 0.4;
        rod(
            `${spec.id}-dish-leg-${i}`,
            new BABYLON.Vector3(Math.cos(angle) * 0.16, busY + 0.16, Math.sin(angle) * 0.16),
            new BABYLON.Vector3(Math.cos(angle) * 0.55, 0.02, Math.sin(angle) * 0.55),
            0.018,
            strut
        );
    }

    const feed = add(BABYLON.MeshBuilder.CreateCylinder(`${spec.id}-feed`, {
        diameterTop: 0.045,
        diameterBottom: 0.11,
        height: 0.2,
        tessellation: 12
    }, scene), dark);
    feed.position.y = 0.5;
    const subreflector = add(BABYLON.MeshBuilder.CreateCylinder(`${spec.id}-sub`, {
        diameter: 0.16,
        height: 0.02,
        tessellation: 16
    }, scene), strut);
    subreflector.position.y = 0.64;
    rod(`${spec.id}-feed-spike`, new BABYLON.Vector3(0, 0.6, 0), new BABYLON.Vector3(0, 0.78, 0), 0.02, strut);
    for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 + 0.5;
        const rimRadius = 0.92;
        const rimPoint = new BABYLON.Vector3(
            Math.cos(angle) * rimRadius,
            rimRadius * rimRadius * dishCurve,
            Math.sin(angle) * rimRadius
        );
        rod(`${spec.id}-strut-${i}`, rimPoint, new BABYLON.Vector3(0, 0.48, 0), 0.018, strut);
    }
    const lowGain = add(BABYLON.MeshBuilder.CreateCylinder(`${spec.id}-low-gain`, {
        diameterTop: 0.02,
        diameterBottom: 0.06,
        height: 0.14,
        tessellation: 10
    }, scene), white);
    lowGain.position = new BABYLON.Vector3(0.72, rimY + 0.08, 0.15);

    const recordZ = -(busRadius + 0.02);
    const record = add(BABYLON.MeshBuilder.CreateCylinder(`${spec.id}-record`, {
        diameter: 0.36,
        height: 0.02,
        tessellation: 32
    }, scene), recordGold);
    record.rotation.x = Math.PI / 2;
    record.position = new BABYLON.Vector3(0, busY, recordZ);
    [0.08, 0.14, 0.2, 0.25].forEach((diameter, index) => {
        const groove = add(BABYLON.MeshBuilder.CreateTorus(`${spec.id}-groove-${index}`, {
            diameter,
            thickness: 0.006,
            tessellation: 28
        }, scene), dark);
        groove.rotation.x = Math.PI / 2;
        groove.position = new BABYLON.Vector3(0, busY, recordZ - 0.012);
    });
    const recordHub = add(BABYLON.MeshBuilder.CreateCylinder(`${spec.id}-record-hub`, {
        diameter: 0.06,
        height: 0.016,
        tessellation: 12
    }, scene), dark);
    recordHub.rotation.x = Math.PI / 2;
    recordHub.position = new BABYLON.Vector3(0, busY, recordZ - 0.016);
    const cartridge = add(BABYLON.MeshBuilder.CreateBox(`${spec.id}-cartridge`, {
        width: 0.08,
        height: 0.1,
        depth: 0.04
    }, scene), dark);
    cartridge.position = new BABYLON.Vector3(0.18, busY + 0.08, recordZ - 0.02);

    const magStart = new BABYLON.Vector3(busRadius + 0.02, busY, 0);
    const magTip = new BABYLON.Vector3(2.25, busY + 0.06, 0);
    const magOffsets = [
        new BABYLON.Vector3(0, 0.055, 0.045),
        new BABYLON.Vector3(0, 0.055, -0.045),
        new BABYLON.Vector3(0, -0.05, 0)
    ];
    const magMount = add(BABYLON.MeshBuilder.CreateBox(`${spec.id}-mag-mount`, {
        width: 0.1,
        height: 0.16,
        depth: 0.14
    }, scene), dark);
    magMount.position = magStart.add(new BABYLON.Vector3(0.04, 0, 0));
    magOffsets.forEach((offset, index) => {
        const endScale = 0.28;
        rod(
            `${spec.id}-mag-${index}`,
            magStart.add(offset),
            magTip.add(offset.scale(endScale)),
            0.016,
            strut
        );
    });
    [0.34, 0.62].forEach((t, index) => {
        const point = BABYLON.Vector3.Lerp(magStart, magTip, t);
        rod(`${spec.id}-mag-cross-a-${index}`, point.add(magOffsets[0].scale(0.75)), point.add(magOffsets[1].scale(0.75)), 0.01, strut);
        rod(`${spec.id}-mag-cross-b-${index}`, point.add(magOffsets[1].scale(0.75)), point.add(magOffsets[2].scale(0.75)), 0.01, strut);
        rod(`${spec.id}-mag-cross-c-${index}`, point.add(magOffsets[2].scale(0.75)), point.add(magOffsets[0].scale(0.75)), 0.01, strut);
    });
    const magNear = add(BABYLON.MeshBuilder.CreateCylinder(`${spec.id}-mag-near`, {
        diameter: 0.09,
        height: 0.16,
        tessellation: 10
    }, scene), dark);
    magNear.rotation.z = Math.PI / 2;
    magNear.position = new BABYLON.Vector3(1.72, busY + 0.04, 0);
    const magCan = add(BABYLON.MeshBuilder.CreateBox(`${spec.id}-mag-can`, {
        width: 0.16,
        height: 0.1,
        depth: 0.1
    }, scene), white);
    magCan.position = magTip.clone();

    const rtgY = busY - 0.02;
    const rtgMount = add(BABYLON.MeshBuilder.CreateBox(`${spec.id}-rtg-mount`, {
        width: 0.1,
        height: 0.14,
        depth: 0.12
    }, scene), dark);
    rtgMount.position = new BABYLON.Vector3(-(busRadius + 0.06), rtgY, 0);
    const rtgOffsets = [
        new BABYLON.Vector3(0, 0.04, 0.035),
        new BABYLON.Vector3(0, 0.04, -0.035),
        new BABYLON.Vector3(0, -0.04, 0)
    ];
    const rtgEnd = new BABYLON.Vector3(-1.55, rtgY, 0);
    rtgOffsets.forEach((offset, index) => {
        rod(`${spec.id}-rtg-long-${index}`, new BABYLON.Vector3(-(busRadius), rtgY, 0).add(offset), rtgEnd.add(offset.scale(0.4)), 0.014, strut);
    });
    for (let i = 0; i < 3; i++) {
        const center = new BABYLON.Vector3(-0.62 - i * 0.32, rtgY, 0);
        const rtg = add(BABYLON.MeshBuilder.CreateCylinder(`${spec.id}-rtg-${i}`, {
            diameter: 0.18,
            height: 0.34,
            tessellation: 12
        }, scene), dark);
        rtg.rotation.z = Math.PI / 2;
        rtg.position = center.clone();
        for (let finIndex = 0; finIndex < 6; finIndex++) {
            const fin = add(BABYLON.MeshBuilder.CreateBox(`${spec.id}-fin-${i}-${finIndex}`, {
                width: 0.34,
                height: 0.014,
                depth: 0.14
            }, scene), gold);
            fin.position = center.clone();
            fin.rotation.x = (finIndex / 6) * Math.PI;
        }
    }

    const scanMount = add(BABYLON.MeshBuilder.CreateBox(`${spec.id}-scan-mount`, {
        width: 0.12,
        height: 0.12,
        depth: 0.1
    }, scene), dark);
    scanMount.position = new BABYLON.Vector3(0, busY, busRadius + 0.04);
    const scanEnd = new BABYLON.Vector3(0.12, busY - 0.02, 1.02);
    rod(`${spec.id}-scan-a`, new BABYLON.Vector3(0.04, busY + 0.04, busRadius), scanEnd.add(new BABYLON.Vector3(0.04, 0.04, 0)), 0.016, strut);
    rod(`${spec.id}-scan-b`, new BABYLON.Vector3(-0.04, busY - 0.02, busRadius), scanEnd.add(new BABYLON.Vector3(-0.03, -0.03, 0)), 0.016, strut);
    const platform = add(BABYLON.MeshBuilder.CreateBox(`${spec.id}-platform`, {
        width: 0.28,
        height: 0.08,
        depth: 0.18
    }, scene), dark);
    platform.position = scanEnd.clone();
    const nac = add(BABYLON.MeshBuilder.CreateCylinder(`${spec.id}-nac`, {
        diameter: 0.07,
        height: 0.36,
        tessellation: 12
    }, scene), dark);
    nac.rotation.x = Math.PI / 2;
    nac.position = scanEnd.add(new BABYLON.Vector3(-0.07, 0.08, 0.16));
    const nacLens = add(BABYLON.MeshBuilder.CreateCylinder(`${spec.id}-nac-lens`, {
        diameter: 0.05,
        height: 0.03,
        tessellation: 12
    }, scene), glass);
    nacLens.rotation.x = Math.PI / 2;
    nacLens.position = scanEnd.add(new BABYLON.Vector3(-0.07, 0.08, 0.35));
    const wac = add(BABYLON.MeshBuilder.CreateCylinder(`${spec.id}-wac`, {
        diameter: 0.1,
        height: 0.16,
        tessellation: 12
    }, scene), dark);
    wac.rotation.x = Math.PI / 2;
    wac.position = scanEnd.add(new BABYLON.Vector3(0.08, 0.07, 0.08));
    const wacLens = add(BABYLON.MeshBuilder.CreateCylinder(`${spec.id}-wac-lens`, {
        diameter: 0.07,
        height: 0.025,
        tessellation: 12
    }, scene), glass);
    wacLens.rotation.x = Math.PI / 2;
    wacLens.position = scanEnd.add(new BABYLON.Vector3(0.08, 0.07, 0.17));
    const iris = add(BABYLON.MeshBuilder.CreateBox(`${spec.id}-iris`, {
        width: 0.1,
        height: 0.08,
        depth: 0.12
    }, scene), blanket);
    iris.position = scanEnd.add(new BABYLON.Vector3(0.02, -0.08, 0.04));

    rod(
        `${spec.id}-plasma-a`,
        new BABYLON.Vector3(0.12, busY - 0.08, 0.08),
        new BABYLON.Vector3(1.15, busY - 0.85, 0.95),
        0.01,
        strut
    );
    rod(
        `${spec.id}-plasma-b`,
        new BABYLON.Vector3(-0.1, busY - 0.08, -0.06),
        new BABYLON.Vector3(-1.05, busY - 0.75, -0.9),
        0.01,
        strut
    );
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach((sign, index) => {
        const thruster = add(BABYLON.MeshBuilder.CreateCylinder(`${spec.id}-thruster-${index}`, {
            diameterTop: 0.012,
            diameterBottom: 0.04,
            height: 0.07,
            tessellation: 8
        }, scene), dark);
        thruster.rotation.z = sign[0] > 0 ? -Math.PI / 2 : Math.PI / 2;
        thruster.position = new BABYLON.Vector3(sign[0] * (busRadius + 0.05), busY + sign[1] * 0.1, sign[1] * 0.08);
    });

    const toSun = root.position.scale(-1);
    if (toSun.length() > 0.001) {
        const aim = new BABYLON.Quaternion();
        BABYLON.Quaternion.FromUnitVectorsToRef(BABYLON.Axis.Y, toSun.normalize(), aim);
        root.rotationQuaternion = aim;
    }

    root.computeWorldMatrix(true);
    const bounds = root.getHierarchyBoundingVectors(true);
    root.examineRadius = BABYLON.Vector3.Distance(bounds.min, bounds.max) * 0.5;
    root.spinNode = spinner;
    root.craftParts = parts;
    markCelestial(root, spec.id, spec.name, spec.cameraDistance, 'probe', {
        distanceLy: spec.distanceLy,
        distanceAu: spec.distanceAu
    });
    root.isVisible = false;
    return root;
};

const assignPlutoSurface = (scene, material, mesh) => {
    const width = 768;
    const height = 384;
    const texture = new BABYLON.DynamicTexture('pluto-albedo', { width, height }, scene, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
    texture.hasAlpha = false;
    const boot = texture.getContext();
    boot.fillStyle = '#b08972';
    boot.fillRect(0, 0, width, height);
    texture.update(false);
    material.diffuseTexture = texture;
    const image = new Image();
    image.onload = () => {
        const source = document.createElement('canvas');
        source.width = image.width;
        source.height = image.height;
        const sourceCtx = source.getContext('2d');
        sourceCtx.drawImage(image, 0, 0);
        const sourceData = sourceCtx.getImageData(0, 0, source.width, source.height).data;
        let minX = source.width;
        let minY = source.height;
        let maxX = 0;
        let maxY = 0;
        for (let y = 0; y < source.height; y += 2) {
            for (let x = 0; x < source.width; x += 2) {
                const index = (y * source.width + x) * 4;
                if (sourceData[index] + sourceData[index + 1] + sourceData[index + 2] > 40) {
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                }
            }
        }
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const discRadius = Math.min(maxX - minX, maxY - minY) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const output = ctx.createImageData(width, height);
        const samplePhoto = (nx, ny, nz) => {
            if (Math.hypot(nx, ny) > 0.8) {
                return null;
            }
            const px = Math.round(centerX + nx * discRadius);
            const py = Math.round(centerY - ny * discRadius);
            if (px < 1 || py < 1 || px >= source.width - 1 || py >= source.height - 1) {
                return null;
            }
            const index = (py * source.width + px) * 4;
            const red = sourceData[index];
            const green = sourceData[index + 1];
            const blue = sourceData[index + 2];
            if (red + green + blue < 90) {
                return null;
            }
            const light = Math.max(0.5, nx * -0.55 + ny * 0.12 + nz * 0.7);
            return [
                Math.min(255, red / light),
                Math.min(255, green / light),
                Math.min(255, blue / light)
            ];
        };
        for (let y = 0; y < height; y++) {
            const lat = Math.PI / 2 - (y / (height - 1)) * Math.PI;
            const cosLat = Math.cos(lat);
            const sinLat = Math.sin(lat);
            for (let x = 0; x < width; x++) {
                const lon = (x / width) * Math.PI * 2 - Math.PI;
                const nx = Math.sin(lon) * cosLat;
                const ny = sinLat;
                const nz = Math.cos(lon) * cosLat;
                const photo = samplePhoto(nx * 0.78, ny * 0.78, Math.max(0.35, nz));
                const mirrored = samplePhoto(-nx * 0.78, ny * 0.78, 0.55);
                const fill = [214, 196, 176];
                const back = mirrored
                    ? [mirrored[0] * 0.9, mirrored[1] * 0.9, mirrored[2] * 0.9]
                    : fill;
                const front = photo || back;
                const frontWeight = Math.max(0, Math.min(1, nz * 1.1 + 0.5));
                const color = [
                    front[0] * frontWeight + back[0] * (1 - frontWeight),
                    front[1] * frontWeight + back[1] * (1 - frontWeight),
                    front[2] * frontWeight + back[2] * (1 - frontWeight)
                ];
                const index = (y * width + x) * 4;
                output.data[index] = color[0];
                output.data[index + 1] = color[1];
                output.data[index + 2] = color[2];
                output.data[index + 3] = 255;
            }
        }
        ctx.putImageData(output, 0, 0);
        texture.getContext().drawImage(canvas, 0, 0);
        texture.update(false);
        material.markAsDirty(BABYLON.Material.TextureDirtyFlag);
    };
    image.src = 'style/textures/galaxy/pluto.jpg';
    mesh.surfacePartial = true;
};

const HAZE_COLOR = {
    orion: [0.95, 0.55, 0.62],
    horsehead: [0.72, 0.28, 0.32],
    helix: [0.45, 0.72, 0.95],
    crab: [0.55, 0.9, 0.7],
    eagle: [0.4, 0.7, 0.85],
    carina: [0.9, 0.62, 0.4],
    pleiades: [0.5, 0.7, 1],
    andromeda: [0.75, 0.7, 0.9],
    ring: [0.95, 0.55, 0.25],
    catseye: [0.95, 0.25, 0.3],
    lagoon: [0.95, 0.45, 0.35],
    rosette: [0.85, 0.35, 0.4],
    butterfly: [0.85, 0.55, 0.75]
};

const featheredTextures = new Map();
const uprightPhotos = [];
let puffTexture = null;
let glowTexture = null;

const textureUrl = (path) => String(path || '').replace(/^\//, '');

const smooth01 = (edge0, edge1, value) => {
    const span = edge1 - edge0;
    if (!span) {
        return 0;
    }
    const t = Math.max(0, Math.min(1, (value - edge0) / span));
    return t * t * (3 - 2 * t);
};

const veilNoise = (x, y) => {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
};

const sampleBorder = (data, width, height) => {
    const x0 = Math.floor(width * 0.07);
    const y0 = Math.floor(height * 0.07);
    let count = 0;
    let dark = 0;
    const step = 6;
    for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
            if (x > x0 && x < width - x0 && y > y0 && y < height - y0) {
                continue;
            }
            const i = (y * width + x) * 4;
            const lum = data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
            count += 1;
            if (lum < 14) {
                dark += 1;
            }
        }
    }
    return count ? dark / count : 0;
};

const knockoutSky = (data, keepStars) => {
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = r * 0.2126 + g * 0.7152 + b * 0.0722;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const sat = max === 0 ? 0 : (max - min) / max;
        const gas = sat >= 0.28 && lum >= 14;
        const star = keepStars && lum >= 64 && sat < 0.45;
        let keep = 0;
        if (gas) {
            keep = Math.min(1, Math.max((lum - 8) / 8, (sat - 0.22) / 0.2));
        } else if (star) {
            keep = Math.min(1, (lum - 50) / 60);
        }
        data[i + 3] = Math.round(data[i + 3] * keep);
    }
};

const applyEllipse = (data, width, height, solid, fade, noiseAmt) => {
    const hx = width * 0.5;
    const hy = height * 0.5;
    for (let y = 0; y < height; y += 1) {
        const ny = (y + 0.5 - hy) / hy;
        for (let x = 0; x < width; x += 1) {
            const nx = (x + 0.5 - hx) / hx;
            const rad = Math.hypot(nx, ny);
            let cover = 1 - smooth01(solid, fade, rad);
            if (noiseAmt > 0 && cover > 0 && cover < 1) {
                const grain = veilNoise(x * 0.33, y * 0.33) * 0.6
                    + veilNoise(x * 0.09 + 2.2, y * 0.09 - 4.1) * 0.4;
                cover *= 0.25 + 0.75 * smooth01(0.18, 0.72, grain);
            }
            if (cover >= 0.995) {
                continue;
            }
            const i = (y * width + x) * 4;
            data[i + 3] = Math.round(data[i + 3] * cover);
        }
    }
};

const requestFeatheredTexture = (scene, path, apply, mode) => {
    const key = mode ? `${path}|${mode}` : path;
    const cached = featheredTextures.get(key);
    if (cached && cached.texture) {
        apply(cached.texture);
        return;
    }
    if (cached) {
        cached.waiters.push(apply);
        return;
    }
    const entry = { texture: null, waiters: [apply] };
    featheredTextures.set(key, entry);
    const image = new Image();
    image.onload = () => {
        const halo = mode === 'halo' || mode === 'field-halo';
        const plate = mode === 'plate' || mode === 'halo';
        const maxEdge = halo ? 640 : 1400;
        const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(2, Math.round(image.width * scale));
        canvas.height = Math.max(2, Math.round(image.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const borderDark = sampleBorder(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
        const openSky = plate && borderDark > 0.22;
        if (openSky) {
            const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
            knockoutSky(pixels.data, !halo);
            ctx.putImageData(pixels, 0, 0);
        }
        if (halo) {
            const sharp = document.createElement('canvas');
            sharp.width = canvas.width;
            sharp.height = canvas.height;
            sharp.getContext('2d').drawImage(canvas, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const blur = Math.max(8, Math.round(Math.max(canvas.width, canvas.height) * (openSky ? 0.07 : 0.06)));
            ctx.filter = `blur(${blur}px)`;
            ctx.drawImage(sharp, 0, 0);
            ctx.filter = 'none';
        }
        if (plate) {
            const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
            if (openSky) {
                applyEllipse(pixels.data, canvas.width, canvas.height, halo ? 0.12 : 0.96, halo ? 0.9 : 1.08, 0);
            } else {
                applyEllipse(pixels.data, canvas.width, canvas.height, halo ? 0.16 : 0.94, halo ? 0.88 : 1.02, halo ? 0 : 0.28);
            }
            ctx.putImageData(pixels, 0, 0);
        } else {
            ctx.globalCompositeOperation = 'destination-in';
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(canvas.width / 2, canvas.height / 2);
            const fade = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
            fade.addColorStop(0, 'rgba(0,0,0,1)');
            fade.addColorStop(0.46, 'rgba(0,0,0,1)');
            fade.addColorStop(0.78, 'rgba(0,0,0,0.35)');
            fade.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = fade;
            ctx.fillRect(-1, -1, 2, 2);
            ctx.restore();
            ctx.globalCompositeOperation = 'source-over';
        }
        const texture = new BABYLON.DynamicTexture(key, { width: canvas.width, height: canvas.height }, scene, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, undefined, true);
        texture.hasAlpha = true;
        const gpu = texture.getContext();
        gpu.drawImage(canvas, 0, 0);
        texture.update(false);
        texture.vScale = -1;
        texture.vOffset = 1;
        entry.texture = texture;
        entry.waiters.forEach((fn) => fn(texture));
        entry.waiters = [];
    };
    image.src = textureUrl(path);
};

const softPuffTexture = (scene) => {
    if (puffTexture) {
        return puffTexture;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const fade = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    fade.addColorStop(0, 'rgba(255,255,255,0.85)');
    fade.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, 64, 64);
    puffTexture = new BABYLON.DynamicTexture('soft-puff', { width: 64, height: 64 }, scene, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, undefined, true);
    puffTexture.hasAlpha = true;
    puffTexture.getContext().drawImage(canvas, 0, 0);
    puffTexture.update(false);
    return puffTexture;
};

const faceOutward = (root, position) => {
    const outward = position.lengthSquared() < 1
        ? new BABYLON.Vector3(0, 0.2, 1)
        : position.clone().normalize();
    root.lookAt(position.add(outward));
};

const softGlowTexture = (scene) => {
    if (glowTexture) {
        return glowTexture;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const fade = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    fade.addColorStop(0, 'rgba(255,255,255,0.95)');
    fade.addColorStop(0.42, 'rgba(255,255,255,0.28)');
    fade.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, 256, 256);
    glowTexture = new BABYLON.DynamicTexture('soft-glow', { width: 256, height: 256 }, scene, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, undefined, true);
    glowTexture.hasAlpha = true;
    glowTexture.getContext().drawImage(canvas, 0, 0);
    glowTexture.update(false);
    return glowTexture;
};

const addHaze = (scene, spec, emitter, options = {}) => {
    const tint = HAZE_COLOR[spec.id] || [0.7, 0.75, 0.9];
    const reach = Math.max(spec.width || 40, spec.height || 40, spec.spread || 0);
    const flat = Boolean(options.flat);
    const count = flat ? 36 : 64;
    const haze = new BABYLON.ParticleSystem(`${spec.id}-haze`, count, scene);
    haze.particleTexture = softPuffTexture(scene);
    haze.emitter = emitter;
    const y = flat ? reach * 0.03 : reach * 0.18;
    const z = flat ? reach * 0.06 : reach * 0.14;
    haze.minEmitBox = new BABYLON.Vector3(-reach * 0.36, -y, -z);
    haze.maxEmitBox = new BABYLON.Vector3(reach * 0.36, y, z);
    haze.minSize = reach * 0.03;
    haze.maxSize = reach * (flat ? 0.07 : 0.09);
    haze.minLifeTime = 1000000;
    haze.maxLifeTime = 1000000;
    haze.emitRate = 0;
    haze.manualEmitCount = count;
    haze.minEmitPower = 0;
    haze.maxEmitPower = 0;
    haze.updateSpeed = 0;
    haze.gravity = new BABYLON.Vector3(0, 0, 0);
    haze.direction1 = new BABYLON.Vector3(0, 0, 0);
    haze.direction2 = new BABYLON.Vector3(0, 0, 0);
    haze.color1 = new BABYLON.Color4(tint[0], tint[1], tint[2], flat ? 0.1 : 0.16);
    haze.color2 = new BABYLON.Color4(tint[0], tint[1], tint[2], 0.03);
    haze.colorDead = new BABYLON.Color4(0, 0, 0, 0);
    haze.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    haze.start();
    return haze;
};

const createPhotoCloud = (scene, spec, position, options = {}) => {
    const root = new BABYLON.Mesh(spec.id, scene);
    root.position = position.clone();
    faceOutward(root, position);
    if (options.tilt) {
        root.rotate(BABYLON.Axis.X, options.tilt, BABYLON.Space.LOCAL);
    }

    const width = spec.width;
    const height = spec.height;
    const span = Math.max(width, height);
    const faceCamera = options.billboard !== false;
    const tint = HAZE_COLOR[spec.id] || [0.75, 0.78, 0.9];
    const alphaAdd = (BABYLON.Constants && BABYLON.Constants.ALPHA_ADD) || BABYLON.Engine.ALPHA_ADD;
    const viewDistance = Math.max(spec.cameraDistance || 0, span * (options.framing || 2.15));
    const glowScale = options.glowScale || 1.42;

    const plane = BABYLON.MeshBuilder.CreatePlane(`${spec.id}-photo`, {
        width,
        height
    }, scene);
    plane.parent = root;
    plane.billboardMode = 0;
    plane.isPickable = false;
    if (faceCamera) {
        uprightPhotos.push(plane);
    }
    const material = new BABYLON.StandardMaterial(`${spec.id}-photo-mat`, scene);
    material.emissiveColor = new BABYLON.Color3(1, 1, 1);
    material.diffuseColor = new BABYLON.Color3(0, 0, 0);
    material.ambientColor = new BABYLON.Color3(0, 0, 0);
    material.specularColor = new BABYLON.Color3(0, 0, 0);
    material.disableLighting = true;
    material.backFaceCulling = false;
    material.useAlphaFromDiffuseTexture = true;
    plane.material = material;
    plane.setEnabled(false);
    requestFeatheredTexture(scene, spec.texture, (texture) => {
        material.diffuseTexture = texture;
        material.emissiveTexture = texture;
        if (material.markAsDirty && BABYLON.Material) {
            material.markAsDirty(BABYLON.Material.TextureDirtyFlag);
        }
        plane.setEnabled(true);
    }, options.feather);

    if (options.halo) {
        const halo = BABYLON.MeshBuilder.CreatePlane(`${spec.id}-halo`, {
            width: width * 1.62,
            height: height * 1.62
        }, scene);
        halo.parent = plane;
        halo.position.z = -6;
        halo.isPickable = false;
        const haloMat = new BABYLON.StandardMaterial(`${spec.id}-halo-mat`, scene);
        haloMat.emissiveColor = new BABYLON.Color3(0, 0, 0);
        haloMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        haloMat.specularColor = new BABYLON.Color3(0, 0, 0);
        haloMat.disableLighting = true;
        haloMat.backFaceCulling = false;
        haloMat.useAlphaFromDiffuseTexture = true;
        halo.material = haloMat;
        requestFeatheredTexture(scene, spec.texture, (texture) => {
            haloMat.diffuseTexture = texture;
            haloMat.emissiveTexture = texture;
            haloMat.opacityTexture = texture;
            if (haloMat.markAsDirty && BABYLON.Material) {
                haloMat.markAsDirty(BABYLON.Material.TextureDirtyFlag);
            }
        }, options.feather === 'field' ? 'field-halo' : 'halo');
    } else if (options.glow !== false) {
        const glow = BABYLON.MeshBuilder.CreatePlane(`${spec.id}-glow`, {
            width: width * glowScale,
            height: height * glowScale
        }, scene);
        glow.parent = root;
        glow.position.z = -2;
        glow.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        glow.isPickable = false;
        const glowMat = new BABYLON.StandardMaterial(`${spec.id}-glow-mat`, scene);
        glowMat.emissiveColor = new BABYLON.Color3(tint[0], tint[1], tint[2]);
        glowMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
        glowMat.specularColor = new BABYLON.Color3(0, 0, 0);
        glowMat.disableLighting = true;
        glowMat.backFaceCulling = false;
        glowMat.useAlphaFromDiffuseTexture = true;
        glowMat.alpha = options.glowAlpha == null ? 0.55 : options.glowAlpha;
        if (alphaAdd != null) {
            glowMat.alphaMode = alphaAdd;
        }
        const glowTex = softGlowTexture(scene);
        glowMat.diffuseTexture = glowTex;
        glowMat.emissiveTexture = glowTex;
        glow.material = glowMat;
    }

    if (options.haze !== false) {
        root.haze = addHaze(scene, spec, root, { flat: Boolean(options.tilt || options.flat) });
    }
    root.posterTexture = spec.texture;
    root.posterWidth = width;
    root.posterHeight = height;
    markCelestial(root, spec.id, spec.name, viewDistance, options.kind || 'nebula', {
        distanceLy: spec.distanceLy,
        distanceAu: spec.distanceAu
    });
    root.isPickable = false;

    const hit = BABYLON.MeshBuilder.CreateSphere(`${spec.id}-hit`, {
        diameter: span * 0.62,
        segments: 10
    }, scene);
    hit.parent = root;
    hit.visibility = 0;
    markCelestial(hit, spec.id, spec.name, viewDistance, options.kind || 'nebula', {
        distanceLy: spec.distanceLy,
        distanceAu: spec.distanceAu
    });
    hit.posterTexture = spec.texture;
    return root;
};

const createNebula = (scene, spec, position) => {
    const root = new BABYLON.Mesh(spec.id, scene);
    root.position = position.clone();
    faceOutward(root, position);
    root.posterTexture = spec.texture;
    root.posterWidth = spec.width;
    root.posterHeight = spec.height;
    markCelestial(root, spec.id, spec.name, 30, 'nebula', {
        distanceLy: spec.distanceLy,
        distanceAu: spec.distanceAu
    });
    root.isPickable = false;

    const hit = BABYLON.MeshBuilder.CreateSphere(`${spec.id}-hit`, {
        diameter: Math.max(spec.width, spec.height) * 0.35,
        segments: 8
    }, scene);
    hit.parent = root;
    hit.visibility = 0;
    markCelestial(hit, spec.id, spec.name, 30, 'nebula', {
        distanceLy: spec.distanceLy,
        distanceAu: spec.distanceAu
    });
    hit.posterTexture = spec.texture;
    hit.posterWidth = spec.width;
    hit.posterHeight = spec.height;
    return root;
};

const createCluster = (scene, spec, position, glowLayer) => {
    const root = new BABYLON.Mesh(spec.id, scene);
    root.position = position.clone();
    faceOutward(root, position);
    const backdrop = BABYLON.MeshBuilder.CreatePlane(`${spec.id}-bg`, { width: 70, height: 48 }, scene);
    backdrop.parent = root;
    backdrop.position.z = -8;
    backdrop.billboardMode = 0;
    uprightPhotos.push(backdrop);
    backdrop.isPickable = false;
    const bgMat = new BABYLON.StandardMaterial(`${spec.id}-bg-mat`, scene);
    bgMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    bgMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
    bgMat.ambientColor = new BABYLON.Color3(0, 0, 0);
    bgMat.disableLighting = true;
    bgMat.backFaceCulling = false;
    bgMat.useAlphaFromDiffuseTexture = true;
    bgMat.alpha = 1;
    backdrop.material = bgMat;
    backdrop.setEnabled(false);
    requestFeatheredTexture(scene, spec.texture, (texture) => {
        bgMat.diffuseTexture = texture;
        bgMat.emissiveTexture = texture;
        if (bgMat.markAsDirty && BABYLON.Material) {
            bgMat.markAsDirty(BABYLON.Material.TextureDirtyFlag);
        }
        backdrop.setEnabled(true);
    });
    root.haze = addHaze(scene, spec, root);

    root.posterTexture = spec.texture;
    root.posterWidth = Math.max(spec.spread * 2.4, 56);
    root.posterHeight = Math.max(spec.spread * 1.6, 40);
    markCelestial(root, spec.id, spec.name, spec.cameraDistance, 'cluster', { distanceLy: spec.distanceLy, distanceAu: spec.distanceAu });
    root.isPickable = false;
    const hit = BABYLON.MeshBuilder.CreateSphere(`${spec.id}-hit`, { diameter: 18 }, scene);
    hit.parent = root;
    hit.visibility = 0;
    markCelestial(hit, spec.id, spec.name, spec.cameraDistance, 'cluster', { distanceLy: spec.distanceLy, distanceAu: spec.distanceAu });
    hit.posterTexture = spec.texture;
    return root;
};

BABYLON.Effect.ShadersStore.accretionVertexShader = `
precision highp float;
attribute vec3 position;
uniform mat4 world;
uniform mat4 worldViewProjection;
varying vec3 vWorld;
void main(void) {
    vWorld = (world * vec4(position, 1.0)).xyz;
    gl_Position = worldViewProjection * vec4(position, 1.0);
}
`;

BABYLON.Effect.ShadersStore.accretionFragmentShader = `
precision highp float;
varying vec3 vWorld;
uniform vec3 cameraPosition;
uniform vec3 holeCenter;
uniform vec3 diskNormal;
uniform vec3 diskTangent;
uniform float time;

float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
}

vec3 starfield(vec3 dir) {
    vec3 d = normalize(dir);
    float band = pow(max(0.0, 1.0 - abs(d.y) * 2.4), 6.0);
    vec3 col = vec3(0.04, 0.045, 0.08) * band;
    vec3 cell = floor(d * 120.0);
    vec3 f = fract(d * 120.0) - 0.5;
    float n = hash13(cell);
    float star = smoothstep(0.2, 0.0, length(f)) * step(0.97, n);
    vec3 tint = mix(vec3(0.7, 0.82, 1.0), vec3(1.0, 0.88, 0.65), hash13(cell + 2.0));
    col += tint * star;
    return col;
}

vec4 shadeDisk(vec3 hit, vec3 viewDir, float gain) {
    float rad = length(hit.xz);
    float u = clamp((rad - 13.2) / 22.0, 0.0, 1.0);
    float ang = atan(hit.z, hit.x);
    float filaments = 0.86 + 0.14 * sin(ang * 2.0 - time * 0.35);
    vec3 hot = vec3(1.0, 0.98, 0.94);
    vec3 gold = vec3(1.0, 0.52, 0.07);
    vec3 red = vec3(0.42, 0.035, 0.008);
    vec3 col = mix(hot, gold, smoothstep(0.0, 0.32, u));
    col = mix(col, red, smoothstep(0.25, 0.95, u));
    col += hot * exp(-u * 8.0) * 0.65;
    vec3 vel = normalize(vec3(-hit.z, 0.0, hit.x));
    float beta = clamp(0.58 * sqrt(13.0 / max(rad, 11.5)), 0.0, 0.8);
    float approach = dot(vel, normalize(viewDir));
    float doppler = sqrt(max(1.0 - beta * beta, 0.04)) / max(1.0 - beta * approach, 0.1);
    col *= pow(clamp(doppler, 0.1, 5.5), 2.7);
    col *= filaments * gain;
    float orbitAng = time * 1.35;
    float orbitR = 15.2;
    vec2 knot = vec2(cos(orbitAng), sin(orbitAng)) * orbitR;
    col += hot * exp(-length(hit.xz - knot) * 1.2) * 1.6;
    float shear = exp(-abs(rad - orbitR) * 0.32) * pow(max(cos(ang - orbitAng), 0.0), 6.0);
    col += vec3(1.0, 0.62, 0.22) * shear * 0.35;
    float fade = smoothstep(0.0, 0.045, u) * (1.0 - smoothstep(0.58, 1.0, u));
    return vec4(col, fade);
}

void main(void) {
    vec3 normal = normalize(diskNormal);
    vec3 tangent = normalize(diskTangent);
    vec3 bitangent = normalize(cross(normal, tangent));
    vec3 roW = cameraPosition - holeCenter;
    vec3 rdW = normalize(vWorld - cameraPosition);
    vec3 ro = vec3(dot(roW, tangent), dot(roW, normal), dot(roW, bitangent));
    vec3 dir = normalize(vec3(dot(rdW, tangent), dot(rdW, normal), dot(rdW, bitangent)));
    float dist = length(ro);
    vec3 toHole = -ro / max(dist, 0.001);
    float facing = smoothstep(-0.05, 0.28, dot(dir, toHole));
    float b = length(cross(dir, ro));
    float bc = 10.6;
    float tClosest = dot(-ro, dir);

    vec3 color = vec3(0.0);
    float alpha = 0.0;

    vec3 escaped = tangent * dir.x + normal * dir.y + bitangent * dir.z;
    float deflect = 7.5 / max(b, bc * 0.8);
    vec3 bentW = normalize(escaped + normalize(holeCenter - cameraPosition) * deflect);
    float starMask = smoothstep(28.0, 11.5, b) * facing;
    color += starfield(bentW) * starMask * 1.45;
    alpha = starMask * 0.28;

    float shadow = smoothstep(bc + 0.18, bc - 0.28, b) * facing;
    color = mix(color, vec3(0.0), shadow);
    alpha = max(alpha, shadow);

    if (abs(dir.y) > 0.0008) {
        float t = -ro.y / dir.y;
        if (t > 0.0) {
            vec3 hit = ro + dir * t;
            float rad = length(hit.xz);
            if (rad > 13.0 && rad < 36.0) {
                float blocked = step(tClosest, t) * step(b, bc - 0.05);
                if (blocked < 0.5) {
                    float camLen = length(ro.xz);
                    float alignFar = camLen > 0.001 ? dot(hit.xz / rad, -ro.xz / camLen) : -1.0;
                    float show = smoothstep(0.28, -0.25, alignFar);
                    vec4 disk = shadeDisk(hit, dir, 1.0);
                    float a = disk.a * show;
                    color = mix(color, disk.rgb, a);
                    alpha = max(alpha, a);
                }
            }
        }
    }

    float camLen = length(ro.xz);
    if (camLen > 0.001 && facing > 0.02 && b > bc - 0.15 && b < bc + 6.5) {
        vec2 farDir = -ro.xz / camLen;
        vec2 rayFlat = dir.xz;
        float rayLen = length(rayFlat);
        float topness = rayLen > 0.02 ? dot(rayFlat / rayLen, farDir) : 0.0;
        if (topness > -0.05) {
            float echoU = clamp((b - bc) / 5.8, 0.0, 1.0);
            float emitR = mix(22.0, 13.4, pow(echoU, 0.75));
            float az = atan(dir.z, dir.x);
            vec2 side = vec2(-farDir.y, farDir.x);
            vec2 sampleFlat = farDir * emitR + side * sin(az) * emitR * 0.45;
            vec3 echoHit = vec3(sampleFlat.x, 0.0, sampleFlat.y);
            vec4 echo = shadeDisk(echoHit, dir, 1.7);
            float arc = smoothstep(-0.05, 0.42, topness);
            float echoA = echo.a * arc * (1.0 - smoothstep(0.5, 1.0, echoU));
            echoA *= smoothstep(bc - 0.4, bc + 0.35, b);
            color = mix(color, echo.rgb, echoA);
            alpha = max(alpha, echoA);
        }
    }

    float azRing = atan(dir.z, dir.x);
    float ringDop = 0.82 + 0.5 * pow(max(sin(azRing + 0.6), 0.0), 1.2);
    float ring = exp(-pow((b - bc) / 0.34, 2.0)) * facing;
    color += vec3(1.0, 0.97, 0.92) * ring * 2.8 * ringDop;
    alpha = max(alpha, clamp(ring * 1.4, 0.0, 1.0));

    vec3 closest = ro + dir * max(tClosest, 0.0);
    float jet = exp(-length(closest.xz) * 0.28) * exp(-abs(closest.y) * 0.045);
    jet *= smoothstep(6.0, 18.0, abs(closest.y));
    color += vec3(0.55, 0.78, 1.0) * jet * 0.16 * (1.0 - shadow);

    color = 1.0 - exp(-color * 1.15);
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}
`;

const createBlackHole = (scene, spec, position) => {
    const root = new BABYLON.Mesh(spec.id, scene);
    root.position = position.clone();
    root.diskNormal = new BABYLON.Vector3(0.24, 0.90, 0.36).normalize();
    const tangent = BABYLON.Vector3.Cross(BABYLON.Axis.Y, root.diskNormal);
    if (tangent.lengthSquared() < 0.0001) {
        tangent.copyFromFloats(1, 0, 0);
    }
    root.diskTangent = tangent.normalize();
    root.lensRadius = 170;

    const lens = BABYLON.MeshBuilder.CreateSphere(`${spec.id}-lens`, {
        diameter: root.lensRadius * 2,
        segments: 48,
        sideOrientation: BABYLON.Mesh.BACKSIDE
    }, scene);
    lens.parent = root;
    lens.isPickable = false;
    lens.excludeFromShadows = true;
    const diskMat = new BABYLON.ShaderMaterial('accretion', scene, {
        vertex: 'accretion',
        fragment: 'accretion'
    }, {
        attributes: ['position'],
        uniforms: ['world', 'worldViewProjection', 'cameraPosition', 'holeCenter', 'diskNormal', 'diskTangent', 'time'],
        needAlphaBlending: true
    });
    diskMat.backFaceCulling = false;
    diskMat.disableDepthWrite = true;
    diskMat.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
    diskMat.setFloat('time', 0);
    diskMat.setVector3('cameraPosition', new BABYLON.Vector3(0, 0, -10));
    diskMat.setVector3('holeCenter', root.position.clone());
    diskMat.setVector3('diskNormal', root.diskNormal);
    diskMat.setVector3('diskTangent', root.diskTangent);
    lens.material = diskMat;

    const hole = BABYLON.MeshBuilder.CreateSphere(`${spec.id}-core`, {
        diameter: spec.radius * 1.2,
        segments: 24
    }, scene);
    hole.parent = root;
    const holeMat = new BABYLON.StandardMaterial('bh-mat', scene);
    holeMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
    holeMat.emissiveColor = new BABYLON.Color3(0, 0, 0);
    holeMat.specularColor = new BABYLON.Color3(0, 0, 0);
    holeMat.disableLighting = true;
    holeMat.alpha = 0;
    hole.material = holeMat;
    hole.visibility = 0;

    markCelestial(hole, spec.id, spec.name, spec.cameraDistance, 'blackhole', { distanceLy: spec.distanceLy, distanceAu: spec.distanceAu });
    markCelestial(root, spec.id, spec.name, spec.cameraDistance, 'blackhole', { distanceLy: spec.distanceLy, distanceAu: spec.distanceAu });
    if (spec.texture) {
        root.posterTexture = spec.texture;
        root.posterFit = 'contain';
        root.posterCredit = 'Event Horizon Telescope';
        hole.posterTexture = spec.texture;
        hole.posterFit = 'contain';
        hole.posterCredit = root.posterCredit;
    }
    root.isVisible = false;
    root.diskMaterial = diskMat;
    return root;
};

const createGalaxy = (scene, spec, position) => createPhotoCloud(scene, spec, position, {
    kind: 'galaxy',
    feather: 'galaxy',
    flat: true,
    glowScale: 1.15,
    glowAlpha: 0.35
});

const createAmbientStarfield = (scene) => {
    const stars = new BABYLON.ParticleSystem('starfield', 2500, scene);
    stars.particleTexture = new BABYLON.Texture('style/textures/stars.png', scene);
    stars.emitter = new BABYLON.Vector3(0, 0, 0);
    stars.minEmitBox = new BABYLON.Vector3(-3500, -1800, -3500);
    stars.maxEmitBox = new BABYLON.Vector3(3500, 1800, 3500);
    stars.minSize = 0.6;
    stars.maxSize = 2.8;
    stars.minLifeTime = 1000000;
    stars.maxLifeTime = 1000000;
    stars.emitRate = 0;
    stars.manualEmitCount = 2500;
    stars.gravity = new BABYLON.Vector3(0, 0, 0);
    stars.direction1 = new BABYLON.Vector3(0, 0, 0);
    stars.direction2 = new BABYLON.Vector3(0, 0, 0);
    stars.minEmitPower = 0;
    stars.maxEmitPower = 0;
    stars.updateSpeed = 0;
    stars.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
    stars.start();
    return stars;
};

export const createGalaxyContent = (scene, catalog, glowLayer) => {
    const pickables = [];
    const orbiters = [];
    const extras = [];
    const destinations = [];

    createAmbientStarfield(scene);

    catalog.objects.forEach((spec) => {
        try {
        let mesh = null;
        let position = spec.position
            ? BABYLON.Vector3.FromArray(spec.position)
            : null;

        if (spec.raHours !== undefined) {
            const dist = travelDistance(spec.distanceLy, spec.scaleMode);
            position = raDecToVec(spec.raHours, spec.decDeg, dist);
            if (spec.binaryOffset) {
                position.addInPlace(BABYLON.Vector3.FromArray(spec.binaryOffset));
            }
        }

        if (spec.type === 'planet') {
            mesh = BABYLON.MeshBuilder.CreateSphere(spec.id, {
                diameter: spec.radius * 2,
                segments: spec.id === 'pluto' ? 64 : 32
            }, scene);
            const material = new BABYLON.StandardMaterial(`${spec.id}-mat`, scene);
            if (spec.id === 'pluto') {
                material.diffuseColor = new BABYLON.Color3(0.62, 0.52, 0.46);
                assignPlutoSurface(scene, material, mesh);
            } else {
                material.diffuseTexture = new BABYLON.Texture(spec.texture, scene);
            }
            matteSurface(material);
            mesh.material = material;
            mesh.orbit = spec.orbit;
            mesh.alpha = spec.alpha;
            mesh.alphaIncrement = spec.alphaIncrement;
            mesh.rotationIncrement = spec.rotationIncrement;
            mesh.examineRadius = spec.radius;
            if (spec.texture && spec.texture.includes('/galaxy/')) {
                mesh.posterTexture = spec.texture;
                mesh.posterWidth = 16;
                mesh.posterHeight = 11;
            }
            markCelestial(mesh, spec.id, spec.name, spec.cameraDistance, 'planet', { distanceLy: spec.distanceLy, distanceAu: spec.distanceAu });
            if (spec.id === 'pluto') {
                mesh.position = new BABYLON.Vector3(
                    spec.orbit * Math.sin(spec.alpha),
                    0,
                    spec.orbit * Math.cos(spec.alpha)
                );
                mesh.lookAt(BABYLON.Vector3.Zero());
            }
            orbiters.push(mesh);
        } else if (spec.type === 'star') {
            mesh = createStarMesh(scene, spec, position, glowLayer);
            extras.push(mesh);
            if (spec.planets) {
                spec.planets.forEach((planetSpec) => {
                    const planet = createOrbitingPlanet(scene, {
                        ...planetSpec,
                        distanceLy: planetSpec.distanceLy != null ? planetSpec.distanceLy : spec.distanceLy
                    }, mesh);
                    extras.push(planet);
                    pickables.push(planet);
                    destinations.push({
                        id: planetSpec.id,
                        name: planetSpec.name,
                        group: spec.group,
                        mesh: planet
                    });
                });
            }
            if (spec.companion) {
                const companionPos = position.add(BABYLON.Vector3.FromArray(spec.companion.offset));
                const companion = createStarMesh(scene, {
                    ...spec.companion,
                    distanceLy: spec.companion.distanceLy != null ? spec.companion.distanceLy : spec.distanceLy,
                    color: spec.companion.color,
                    radius: spec.companion.radius,
                    cameraDistance: spec.companion.cameraDistance
                }, companionPos, glowLayer);
                extras.push(companion);
                pickables.push(companion);
                destinations.push({
                    id: spec.companion.id,
                    name: spec.companion.name,
                    group: spec.group,
                    mesh: companion
                });
            }
        } else if (spec.type === 'belt') {
            const belt = createBelt(scene, spec);
            mesh = belt.marker;
            extras.push(belt.mesh);
            orbiters.push(belt.marker);
        } else if (spec.type === 'cloud') {
            const cloud = createOortCloud(scene, spec);
            mesh = cloud.marker;
            extras.push(cloud.mesh);
        } else if (spec.type === 'probe') {
            mesh = createProbe(scene, spec);
            extras.push(mesh);
        } else if (spec.type === 'nebula') {
            mesh = createNebula(scene, spec, position);
            if (spec.id !== 'orion') {
                const label = spec.dockLabel;
                const stamp = (node) => {
                    node.parentId = 'orion';
                    if (label) {
                        node.dockLabel = label;
                    }
                };
                stamp(mesh);
                mesh.getChildMeshes().forEach((child) => {
                    if (child.infoId === spec.id) {
                        stamp(child);
                    }
                });
            }
            extras.push(mesh);
        } else if (spec.type === 'cluster') {
            mesh = createCluster(scene, spec, position, glowLayer);
            extras.push(mesh);
        } else if (spec.type === 'blackhole') {
            mesh = createBlackHole(scene, spec, position, glowLayer);
            extras.push(mesh);
        } else if (spec.type === 'galaxy') {
            mesh = createGalaxy(scene, spec, position);
            extras.push(mesh);
        }

        if (mesh) {
            pickables.push(mesh);
            destinations.push({
                id: spec.id,
                name: spec.name,
                group: spec.group,
                mesh
            });
        }
        } catch (error) {
            console.error('Failed to create galaxy object', spec && spec.id, error);
        }
    });

    const update = (paused) => {
        const dt = scene.getEngine().getDeltaTime() / 1000;
        const camera = scene.activeCamera;
        if (camera) {
            uprightPhotos.forEach((plane) => {
                if (!plane.isEnabled() || (plane.isDisposed && plane.isDisposed())) {
                    return;
                }
                plane.lookAt(camera.position, 0, 0, 0, BABYLON.Space.WORLD, BABYLON.Vector3.Up());
            });
        }
        extras.forEach((mesh) => {
            if (mesh.rotationIncrement && !paused) {
                mesh.rotation.y += mesh.rotationIncrement;
            }
            if (mesh.pulseHalo) {
                mesh._pulse = (mesh._pulse || 0) + dt * mesh.pulseRate;
                const s = 1 + Math.sin(mesh._pulse) * mesh.pulseAmount;
                mesh.pulseHalo.scaling.set(s, s, s);
            }
            if (mesh.diskMaterial) {
                mesh._diskTime = (mesh._diskTime || 0) + dt;
                mesh.diskMaterial.setFloat('time', mesh._diskTime);
                if (camera && mesh.diskNormal && mesh.diskTangent) {
                    mesh.diskMaterial.setVector3('cameraPosition', camera.position);
                    mesh.diskMaterial.setVector3('holeCenter', mesh.getAbsolutePosition());
                    mesh.diskMaterial.setVector3('diskNormal', mesh.diskNormal);
                    mesh.diskMaterial.setVector3('diskTangent', mesh.diskTangent);
                }
            }
            if (mesh.emberSpin) {
                mesh.emberSpin.rotation.y += dt * 0.18;
            }
            if (mesh.parentStar) {
                if (!paused) {
                    mesh.alpha += (mesh.alphaIncrement || 0) * 0.55;
                }
                const starPos = mesh.parentStar.getAbsolutePosition();
                mesh.position = starPos.add(new BABYLON.Vector3(
                    mesh.orbit * Math.sin(mesh.alpha),
                    0,
                    mesh.orbit * Math.cos(mesh.alpha)
                ));
            }
        });
    };

    return { pickables, orbiters, extras, destinations, update };
};
