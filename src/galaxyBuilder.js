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

const emissiveStarMaterial = (scene, name, color, texturePath) => {
    const material = new BABYLON.StandardMaterial(name, scene);
    material.diffuseTexture = new BABYLON.Texture(texturePath || STAR_TEXTURE, scene);
    material.emissiveColor = new BABYLON.Color3(color[0], color[1], color[2]);
    material.diffuseColor = new BABYLON.Color3(color[0], color[1], color[2]);
    material.specularColor = new BABYLON.Color3(0, 0, 0);
    material.disableLighting = true;
    return material;
};

const createStarMesh = (scene, spec, position, glowLayer) => {
    const star = BABYLON.MeshBuilder.CreateSphere(spec.id, {
        diameter: spec.radius * 2,
        segments: 32
    }, scene);
    star.position = position.clone();
    star.material = emissiveStarMaterial(scene, `${spec.id}-mat`, spec.color);
    star.rotationIncrement = 0.0015;
    markCelestial(star, spec.id, spec.name, spec.cameraDistance, 'star', {
        distanceLy: spec.distanceLy,
        distanceAu: spec.distanceAu
    });

    const corona = BABYLON.MeshBuilder.CreateSphere(`${spec.id}-corona`, {
        diameter: spec.radius * 2.8,
        segments: 16
    }, scene);
    corona.parent = star;
    const coronaMat = new BABYLON.StandardMaterial(`${spec.id}-corona-mat`, scene);
    coronaMat.emissiveColor = new BABYLON.Color3(spec.color[0], spec.color[1], spec.color[2]);
    coronaMat.alpha = 0.18;
    coronaMat.disableLighting = true;
    coronaMat.backFaceCulling = false;
    corona.material = coronaMat;
    corona.isPickable = false;

    if (spec.lightIntensity) {
        const light = new BABYLON.PointLight(`${spec.id}-light`, new BABYLON.Vector3(0, 0, 0), scene);
        light.parent = star;
        light.diffuse = new BABYLON.Color3(spec.color[0], spec.color[1], spec.color[2]);
        light.intensity = spec.lightIntensity;
        light.range = spec.radius * 40;
    }

    if (glowLayer) {
        glowLayer.addIncludedOnlyMesh(star);
        glowLayer.addIncludedOnlyMesh(corona);
    }

    return star;
};

const createOrbitingPlanet = (scene, spec, parentStar) => {
    const planet = BABYLON.MeshBuilder.CreateSphere(spec.id, {
        diameter: spec.radius * 2,
        segments: 24
    }, scene);
    const material = new BABYLON.StandardMaterial(`${spec.id}-mat`, scene);
    material.diffuseTexture = new BABYLON.Texture(spec.texture || ROCK_TEXTURE, scene);
    planet.material = material;
    planet.orbit = spec.orbit;
    planet.alpha = Math.random() * Math.PI * 2;
    planet.alphaIncrement = spec.alphaIncrement || 0.003;
    planet.rotationIncrement = 0.01;
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

const createProbe = (scene, spec) => {
    const root = new BABYLON.Mesh(spec.id, scene);
    root.position = BABYLON.Vector3.FromArray(spec.position);

    const body = BABYLON.MeshBuilder.CreateBox(`${spec.id}-body`, { width: 0.35, height: 0.5, depth: 0.25 }, scene);
    body.parent = root;
    const gold = new BABYLON.StandardMaterial('voyager-gold', scene);
    gold.diffuseColor = new BABYLON.Color3(0.86, 0.7, 0.28);
    gold.emissiveColor = new BABYLON.Color3(0.2, 0.14, 0.04);
    body.material = gold;

    const dish = BABYLON.MeshBuilder.CreateCylinder(`${spec.id}-dish`, { diameter: 1.1, height: 0.08, tessellation: 20 }, scene);
    dish.parent = root;
    dish.position.y = 0.45;
    const white = new BABYLON.StandardMaterial('voyager-dish', scene);
    white.diffuseColor = new BABYLON.Color3(0.85, 0.85, 0.9);
    dish.material = white;

    const boom = BABYLON.MeshBuilder.CreateCylinder(`${spec.id}-boom`, { diameter: 0.05, height: 1.6 }, scene);
    boom.parent = root;
    boom.rotation.z = Math.PI / 2;
    boom.position.x = 0.9;
    boom.material = white;

    [body, dish, boom].forEach((part) => {
        markCelestial(part, spec.id, spec.name, spec.cameraDistance, 'probe', { distanceLy: spec.distanceLy, distanceAu: spec.distanceAu });
        part.parent = root;
    });
    markCelestial(root, spec.id, spec.name, spec.cameraDistance, 'probe', { distanceLy: spec.distanceLy, distanceAu: spec.distanceAu });
    root.isVisible = false;
    return root;
};

const HAZE_COLOR = {
    orion: [0.95, 0.55, 0.62],
    horsehead: [0.72, 0.28, 0.32],
    helix: [0.45, 0.72, 0.95],
    crab: [0.55, 0.9, 0.7],
    eagle: [0.4, 0.7, 0.85],
    carina: [0.9, 0.62, 0.4],
    pleiades: [0.5, 0.7, 1],
    andromeda: [0.75, 0.7, 0.9]
};

const featheredTextures = new Map();
let puffTexture = null;
let glowTexture = null;

const textureUrl = (path) => String(path || '').replace(/^\//, '');

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
        const maxEdge = 768;
        const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(2, Math.round(image.width * scale));
        canvas.height = Math.max(2, Math.round(image.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(canvas.width / 2, canvas.height / 2);
        const fade = ctx.createRadialGradient(0, 0, 0.15, 0, 0, 1);
        fade.addColorStop(0, 'rgba(0,0,0,1)');
        fade.addColorStop(0.46, 'rgba(0,0,0,1)');
        fade.addColorStop(0.78, 'rgba(0,0,0,0.35)');
        fade.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = fade;
        ctx.fillRect(-1, -1, 2, 2);
        ctx.restore();
        const texture = new BABYLON.DynamicTexture(key, { width: canvas.width, height: canvas.height }, scene, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, undefined, true);
        texture.hasAlpha = true;
        const gpu = texture.getContext();
        gpu.drawImage(canvas, 0, 0);
        texture.update(false);
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
    const billboard = faceCamera ? BABYLON.Mesh.BILLBOARDMODE_ALL : 0;
    const tint = HAZE_COLOR[spec.id] || [0.75, 0.78, 0.9];
    const alphaAdd = (BABYLON.Constants && BABYLON.Constants.ALPHA_ADD) || BABYLON.Engine.ALPHA_ADD;
    const viewDistance = Math.max(spec.cameraDistance || 0, span * 2.15);
    const glowScale = options.glowScale || 1.42;

    const glow = BABYLON.MeshBuilder.CreatePlane(`${spec.id}-glow`, {
        width: width * glowScale,
        height: height * glowScale
    }, scene);
    glow.parent = root;
    glow.position.z = -2;
    glow.billboardMode = billboard;
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

    const plane = BABYLON.MeshBuilder.CreatePlane(`${spec.id}-photo`, {
        width,
        height
    }, scene);
    plane.parent = root;
    plane.billboardMode = billboard;
    plane.isPickable = false;
    const material = new BABYLON.StandardMaterial(`${spec.id}-photo-mat`, scene);
    material.emissiveColor = new BABYLON.Color3(1, 1, 1);
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

    root.haze = addHaze(scene, spec, root, { flat: Boolean(options.tilt || options.flat) });
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

const createNebula = (scene, spec, position) => createPhotoCloud(scene, spec, position);

const createCluster = (scene, spec, position, glowLayer) => {
    const root = new BABYLON.Mesh(spec.id, scene);
    root.position = position.clone();
    const colors = [
        [0.7, 0.82, 1.0],
        [0.85, 0.9, 1.0],
        [0.6, 0.75, 1.0]
    ];
    for (let i = 0; i < spec.count; i++) {
        const star = BABYLON.MeshBuilder.CreateSphere(`${spec.id}-${i}`, {
            diameter: 1.2 + Math.random() * 2.4,
            segments: 12
        }, scene);
        star.parent = root;
        star.position = new BABYLON.Vector3(
            (Math.random() - 0.5) * spec.spread,
            (Math.random() - 0.5) * spec.spread * 0.5,
            (Math.random() - 0.5) * spec.spread
        );
        const color = colors[i % colors.length];
        star.material = emissiveStarMaterial(scene, `${spec.id}-${i}-mat`, color);
        star.isPickable = false;
        if (glowLayer) glowLayer.addIncludedOnlyMesh(star);
    }

    faceOutward(root, position);
    const backdrop = BABYLON.MeshBuilder.CreatePlane(`${spec.id}-bg`, { width: 70, height: 48 }, scene);
    backdrop.parent = root;
    backdrop.position.z = -8;
    backdrop.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    backdrop.isPickable = false;
    const bgMat = new BABYLON.StandardMaterial(`${spec.id}-bg-mat`, scene);
    bgMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    bgMat.disableLighting = true;
    bgMat.backFaceCulling = false;
    bgMat.useAlphaFromDiffuseTexture = true;
    bgMat.alpha = 0.72;
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

const createBlackHole = (scene, spec, position, glowLayer) => {
    const root = new BABYLON.Mesh(spec.id, scene);
    root.position = position.clone();

    const hole = BABYLON.MeshBuilder.CreateSphere(`${spec.id}-core`, {
        diameter: spec.radius * 2,
        segments: 32
    }, scene);
    hole.parent = root;
    const holeMat = new BABYLON.StandardMaterial('bh-mat', scene);
    holeMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
    holeMat.emissiveColor = new BABYLON.Color3(0, 0, 0);
    holeMat.specularColor = new BABYLON.Color3(0, 0, 0);
    holeMat.disableLighting = true;
    hole.material = holeMat;

    const disk = BABYLON.MeshBuilder.CreateTorus(`${spec.id}-disk`, {
        diameter: spec.diskRadius * 2,
        thickness: spec.diskRadius * 0.55,
        tessellation: 48
    }, scene);
    disk.parent = root;
    disk.scaling.y = 0.08;
    disk.rotation.x = 0.35;
    const diskMat = new BABYLON.StandardMaterial('disk-mat', scene);
    diskMat.diffuseTexture = new BABYLON.Texture(STAR_TEXTURE, scene);
    diskMat.emissiveColor = new BABYLON.Color3(1.0, 0.55, 0.15);
    diskMat.diffuseColor = new BABYLON.Color3(1.0, 0.6, 0.2);
    diskMat.disableLighting = true;
    disk.material = diskMat;
    disk.isPickable = false;

    const photon = BABYLON.MeshBuilder.CreateTorus(`${spec.id}-photon`, {
        diameter: spec.radius * 2.6,
        thickness: 0.7,
        tessellation: 32
    }, scene);
    photon.parent = root;
    photon.scaling.y = 0.2;
    photon.rotation.x = 0.35;
    const photonMat = new BABYLON.StandardMaterial('photon-mat', scene);
    photonMat.emissiveColor = new BABYLON.Color3(1, 0.85, 0.55);
    photonMat.disableLighting = true;
    photonMat.alpha = 0.7;
    photon.material = photonMat;
    photon.isPickable = false;

    const jetMat = new BABYLON.StandardMaterial('jet-mat', scene);
    jetMat.emissiveColor = new BABYLON.Color3(0.45, 0.7, 1.0);
    jetMat.disableLighting = true;
    jetMat.alpha = 0.45;
    [-1, 1].forEach((sign, index) => {
        const jet = BABYLON.MeshBuilder.CreateCylinder(`${spec.id}-jet-${index}`, {
            diameterTop: 0.4,
            diameterBottom: 3.2,
            height: 90,
            tessellation: 12
        }, scene);
        jet.parent = root;
        jet.position.y = sign * 50;
        jet.material = jetMat;
        jet.isPickable = false;
        if (glowLayer) glowLayer.addIncludedOnlyMesh(jet);
    });

    if (glowLayer) {
        glowLayer.addIncludedOnlyMesh(disk);
        glowLayer.addIncludedOnlyMesh(photon);
    }

    markCelestial(hole, spec.id, spec.name, spec.cameraDistance, 'blackhole', { distanceLy: spec.distanceLy, distanceAu: spec.distanceAu });
    markCelestial(root, spec.id, spec.name, spec.cameraDistance, 'blackhole', { distanceLy: spec.distanceLy, distanceAu: spec.distanceAu });
    root.isVisible = false;

    const clusterTemplate = BABYLON.MeshBuilder.CreateSphere('gc-star', { diameter: 1.2, segments: 6 }, scene);
    const sps = new BABYLON.SolidParticleSystem('galactic-core-stars', scene, { isPickable: false });
    sps.addShape(clusterTemplate, 160);
    const clusterMesh = sps.buildMesh();
    clusterTemplate.dispose();
    clusterMesh.parent = root;
    const clusterMat = new BABYLON.StandardMaterial('gc-stars', scene);
    clusterMat.emissiveColor = new BABYLON.Color3(1.0, 0.85, 0.55);
    clusterMat.disableLighting = true;
    clusterMesh.material = clusterMat;
    sps.initParticles = function () {
        for (let i = 0; i < sps.nbParticles; i++) {
            const particle = sps.particles[i];
            const radius = 40 + Math.random() * 90;
            const angle = Math.random() * Math.PI * 2;
            particle.position.x = Math.cos(angle) * radius;
            particle.position.z = Math.sin(angle) * radius;
            particle.position.y = (Math.random() - 0.5) * 18;
            const scale = 0.4 + Math.random() * 1.4;
            particle.scaling = new BABYLON.Vector3(scale, scale, scale);
        }
    };
    sps.initParticles();
    sps.setParticles();

    root.disk = disk;
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
                segments: 32
            }, scene);
            const material = new BABYLON.StandardMaterial(`${spec.id}-mat`, scene);
            material.diffuseTexture = new BABYLON.Texture(spec.texture, scene);
            mesh.material = material;
            mesh.orbit = spec.orbit;
            mesh.alpha = spec.alpha;
            mesh.alphaIncrement = spec.alphaIncrement;
            mesh.rotationIncrement = spec.rotationIncrement;
            if (spec.texture && spec.texture.includes('/galaxy/')) {
                mesh.posterTexture = spec.texture;
                mesh.posterWidth = 16;
                mesh.posterHeight = 11;
            }
            markCelestial(mesh, spec.id, spec.name, spec.cameraDistance, 'planet', { distanceLy: spec.distanceLy, distanceAu: spec.distanceAu });
            orbiters.push(mesh);
            const path = BABYLON.MeshBuilder.CreateTorus(`${spec.id}-orbit`, {
                diameter: spec.orbit * 2,
                thickness: 0.03,
                tessellation: 80
            }, scene);
            path.scaling.y = 0.01;
            path.isPickable = false;
            path.freezeWorldMatrix();
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
        extras.forEach((mesh) => {
            if (mesh.rotationIncrement && !paused) {
                mesh.rotation.y += mesh.rotationIncrement;
            }
            if (mesh.parentStar) {
                if (!paused) {
                    mesh.alpha += mesh.alphaIncrement;
                }
                const starPos = mesh.parentStar.getAbsolutePosition();
                mesh.position = starPos.add(new BABYLON.Vector3(
                    mesh.orbit * Math.sin(mesh.alpha),
                    0,
                    mesh.orbit * Math.cos(mesh.alpha)
                ));
            }
            if (mesh.disk && !paused) {
                mesh.disk.rotation.z += 0.01;
            }
        });
    };

    return { pickables, orbiters, extras, destinations, update };
};
