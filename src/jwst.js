const hash = (x, y) => {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
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

const makeTexture = (scene, name, width, height, draw) => {
    const texture = new BABYLON.DynamicTexture(name, { width, height }, scene, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, undefined, true);
    draw(texture.getContext(), width, height);
    texture.update(false);
    texture.anisotropicFilteringLevel = 16;
    return texture;
};

const paintMirror = (ctx, width, height) => {
    const image = ctx.createImageData(width, height);
    const data = image.data;
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const nx = x / width - 0.5;
            const ny = y / height - 0.5;
            const falloff = 1 - Math.min(1, Math.hypot(nx, ny) * 1.15);
            const sheen = noise(x / 40, y / 40);
            const fine = noise(x / 6, y / 6);
            const r = 168 + falloff * 55 + sheen * 18 + fine * 6;
            const g = 118 + falloff * 36 + sheen * 10;
            const b = 42 + falloff * 14 + sheen * 4;
            const i = (y * width + x) * 4;
            data[i] = Math.max(0, Math.min(255, r));
            data[i + 1] = Math.max(0, Math.min(255, g));
            data[i + 2] = Math.max(0, Math.min(255, b));
            data[i + 3] = 255;
        }
    }
    ctx.putImageData(image, 0, 0);
};

const paintFoil = (ctx, width, height) => {
    const image = ctx.createImageData(width, height);
    const data = image.data;
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const crumple = noise(x / 5, y / 4);
            const ridge = noise(x / 14, y / 10);
            const fold = Math.pow(crumple, 1.35);
            const r = 156 + ridge * 60 - fold * 70;
            const g = 102 + ridge * 34 - fold * 48;
            const b = 36 + ridge * 12 - fold * 18;
            const i = (y * width + x) * 4;
            data[i] = Math.max(0, Math.min(255, r));
            data[i + 1] = Math.max(0, Math.min(255, g));
            data[i + 2] = Math.max(0, Math.min(255, b));
            data[i + 3] = 255;
        }
    }
    ctx.putImageData(image, 0, 0);
};

const paintMembrane = (ctx, width, height, tint) => {
    const image = ctx.createImageData(width, height);
    const data = image.data;
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const wrinkle = noise(x / 8, y / 6);
            const slow = noise(x / 42, y / 30);
            const shade = 0.78 + wrinkle * 0.18 + slow * 0.08;
            const i = (y * width + x) * 4;
            data[i] = Math.max(0, Math.min(255, tint[0] * shade));
            data[i + 1] = Math.max(0, Math.min(255, tint[1] * shade));
            data[i + 2] = Math.max(0, Math.min(255, tint[2] * shade));
            data[i + 3] = 255;
        }
    }
    ctx.putImageData(image, 0, 0);
    ctx.strokeStyle = 'rgba(24, 26, 32, 0.8)';
    ctx.lineWidth = 2;
    const cx = width * 0.5;
    const cy = height * 0.5;
    const spokes = 16;
    for (let i = 0; i < spokes; i += 1) {
        const angle = (i / spokes) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * width, cy + Math.sin(angle) * height);
        ctx.stroke();
    }
};

const paintRadiator = (ctx, width, height) => {
    ctx.fillStyle = '#e7ebf0';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#b7c0cc';
    ctx.lineWidth = 2;
    for (let x = 12; x < width; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x, 8);
        ctx.lineTo(x, height - 8);
        ctx.stroke();
    }
    ctx.strokeStyle = '#9aa6b5';
    ctx.strokeRect(6, 6, width - 12, height - 12);
};

const SUNSHIELD = [
    [-0.9, 0.5],
    [-0.38, 0.8],
    [0.38, 0.8],
    [0.9, 0.5],
    [1.16, 0.02],
    [0.74, -0.58],
    [0.2, -1.02],
    [-0.2, -1.02],
    [-0.74, -0.58],
    [-1.16, 0.02]
];

const paintSolar = (ctx, width, height) => {
    ctx.fillStyle = '#243044';
    ctx.fillRect(0, 0, width, height);
    const cols = 18;
    const rows = 8;
    const margin = 10;
    const cellW = (width - margin * 2) / cols;
    const cellH = (height - margin * 2) / rows;
    for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
            const n = hash(col + 2, row + 5);
            ctx.fillStyle = `rgb(${12 + n * 10}, ${28 + n * 16}, ${48 + n * 20})`;
            ctx.fillRect(margin + col * cellW + 1, margin + row * cellH + 1, cellW - 2, cellH - 2);
        }
    }
};

const makeKite = (scene, name, parent, material, z, scale) => {
    const outline = SUNSHIELD;
    const thickness = 0.016;
    const positions = [];
    const uvs = [];
    const indices = [];
    const push = (x, y, zz) => {
        const index = positions.length / 3;
        positions.push(x * scale, y * scale, zz);
        uvs.push(0.5 + x * 0.42, 0.5 + y * 0.42);
        return index;
    };
    const centerTop = push(0, 0, z);
    const centerBottom = push(0, 0, z - thickness);
    const top = outline.map(([x, y]) => push(x, y, z));
    const bottom = outline.map(([x, y]) => push(x, y, z - thickness));
    const count = outline.length;
    for (let i = 0; i < count; i += 1) {
        const next = (i + 1) % count;
        indices.push(centerTop, top[i], top[next]);
        indices.push(centerBottom, bottom[next], bottom[i]);
        indices.push(top[i], bottom[i], top[next]);
        indices.push(top[next], bottom[i], bottom[next]);
    }
    const mesh = new BABYLON.Mesh(name, scene);
    const data = new BABYLON.VertexData();
    data.positions = positions;
    data.indices = indices;
    data.uvs = uvs;
    const normals = [];
    BABYLON.VertexData.ComputeNormals(positions, indices, normals);
    data.normals = normals;
    data.applyToMesh(mesh);
    mesh.material = material;
    mesh.parent = parent;
    mesh.isPickable = true;
    mesh.examineMesh = parent;
    return mesh;
};

export const createJwst = (scene, earth) => {
    const root = new BABYLON.Mesh('jwst', scene);

    const mirrorTex = makeTexture(scene, 'jwst-mirror-tex', 256, 256, paintMirror);
    const foilTex = makeTexture(scene, 'jwst-foil-tex', 256, 256, paintFoil);
    const solarTex = makeTexture(scene, 'jwst-solar-tex', 512, 256, paintSolar);
    const radiatorTex = makeTexture(scene, 'jwst-radiator-tex', 256, 256, paintRadiator);
    const membranes = [
        [232, 236, 242],
        [168, 112, 168],
        [214, 126, 138],
        [196, 154, 112],
        [214, 218, 224]
    ].map((tint, index) => makeTexture(scene, `jwst-membrane-${index}`, 512, 512, (ctx, w, h) => paintMembrane(ctx, w, h, tint)));

    const material = (name, color, options = {}) => {
        const mat = new BABYLON.StandardMaterial(name, scene);
        mat.diffuseColor = color;
        mat.specularColor = options.specular || new BABYLON.Color3(0.25, 0.25, 0.28);
        mat.emissiveColor = options.emissive || color.scale(0.18);
        mat.ambientColor = new BABYLON.Color3(0.5, 0.5, 0.52);
        if (options.texture) {
            mat.diffuseTexture = options.texture;
            mat.emissiveTexture = options.texture;
            mat.emissiveColor = options.textureEmissive || new BABYLON.Color3(0.28, 0.24, 0.16);
        }
        mat.backFaceCulling = options.cull !== false;
        mat.specularPower = options.power || 48;
        return mat;
    };

    const gold = material('jwst-gold', new BABYLON.Color3(1, 1, 1), {
        texture: mirrorTex,
        textureEmissive: new BABYLON.Color3(0.55, 0.42, 0.18),
        specular: new BABYLON.Color3(0.85, 0.75, 0.4),
        power: 80
    });
    const foil = material('jwst-foil', new BABYLON.Color3(1, 1, 1), {
        texture: foilTex,
        textureEmissive: new BABYLON.Color3(0.4, 0.28, 0.1),
        specular: new BABYLON.Color3(0.6, 0.45, 0.2)
    });
    const black = material('jwst-black', new BABYLON.Color3(0.02, 0.02, 0.025), {
        emissive: new BABYLON.Color3(0.01, 0.01, 0.015),
        specular: new BABYLON.Color3(0.08, 0.08, 0.08)
    });
    const white = material('jwst-white', new BABYLON.Color3(0.78, 0.8, 0.82), {
        emissive: new BABYLON.Color3(0.16, 0.17, 0.18),
        specular: new BABYLON.Color3(0.35, 0.35, 0.38)
    });
    const metal = material('jwst-metal', new BABYLON.Color3(0.55, 0.58, 0.62), {
        emissive: new BABYLON.Color3(0.1, 0.11, 0.12),
        specular: new BABYLON.Color3(0.55, 0.55, 0.58)
    });
    const solar = material('jwst-solar', new BABYLON.Color3(1, 1, 1), {
        texture: solarTex,
        textureEmissive: new BABYLON.Color3(0.08, 0.12, 0.2),
        specular: new BABYLON.Color3(0.2, 0.24, 0.3)
    });

    const graphite = material('jwst-graphite', new BABYLON.Color3(0.08, 0.085, 0.09), {
        emissive: new BABYLON.Color3(0.03, 0.032, 0.036),
        specular: new BABYLON.Color3(0.2, 0.2, 0.22)
    });
    const radiatorMat = material('jwst-radiator', new BABYLON.Color3(1, 1, 1), {
        texture: radiatorTex,
        textureEmissive: new BABYLON.Color3(0.35, 0.36, 0.38),
        specular: new BABYLON.Color3(0.25, 0.25, 0.28)
    });
    const layerMats = membranes.map((texture, index) => material(`jwst-layer-${index}`, new BABYLON.Color3(1, 1, 1), {
        texture,
        textureEmissive: new BABYLON.Color3(0.34, 0.32, 0.3),
        cull: false
    }));

    const add = (mesh, mat) => {
        mesh.material = mat;
        mesh.parent = root;
        mesh.isPickable = true;
        mesh.examineMesh = root;
        return mesh;
    };

    const rod = (name, from, to, diameter, mat, tessellation = 8) => {
        const delta = to.subtract(from);
        const length = Math.max(0.001, delta.length());
        const mesh = add(BABYLON.MeshBuilder.CreateCylinder(name, {
            diameter,
            height: 1,
            tessellation
        }, scene), mat);
        mesh.scaling.y = length;
        mesh.position = from.add(to).scale(0.5);
        const aim = new BABYLON.Quaternion();
        BABYLON.Quaternion.FromUnitVectorsToRef(BABYLON.Axis.Y, delta.scale(1 / length), aim);
        mesh.rotationQuaternion = aim;
        return mesh;
    };

    const beam = (name, from, to, width, depth, mat) => {
        const delta = to.subtract(from);
        const length = Math.max(0.001, delta.length());
        const mesh = add(BABYLON.MeshBuilder.CreateBox(name, {
            width,
            height: 1,
            depth
        }, scene), mat);
        mesh.scaling.y = length;
        mesh.position = from.add(to).scale(0.5);
        const aim = new BABYLON.Quaternion();
        BABYLON.Quaternion.FromUnitVectorsToRef(BABYLON.Axis.Y, delta.scale(1 / length), aim);
        mesh.rotationQuaternion = aim;
        return mesh;
    };

    const faceZ = BABYLON.Quaternion.Identity();
    BABYLON.Quaternion.FromUnitVectorsToRef(BABYLON.Axis.Y, BABYLON.Axis.Z, faceZ);

    const segment = (name, x, y, z, diameter) => {
        const backing = add(BABYLON.MeshBuilder.CreateCylinder(`${name}-rim`, {
            diameter: diameter * 1.045,
            height: 0.008,
            tessellation: 6
        }, scene), black);
        backing.position.set(x, y, z - 0.01);
        backing.rotationQuaternion = faceZ.clone();

        const mirror = add(BABYLON.MeshBuilder.CreateCylinder(name, {
            diameter,
            height: 0.012,
            tessellation: 6
        }, scene), gold);
        mirror.position.set(x, y, z);
        mirror.rotationQuaternion = faceZ.clone();

        const post = add(BABYLON.MeshBuilder.CreateCylinder(`${name}-post`, {
            diameter: 0.012,
            height: 0.04,
            tessellation: 6
        }, scene), black);
        post.rotation.x = Math.PI / 2;
        post.position.set(x, y, z - 0.03);
        return mirror;
    };

    const mirrorZ = 0.34;
    const mirrorY = 0.4;
    const diameter = 0.162;
    const spacing = diameter * Math.sqrt(3) / 2 * 1.07;
    const places = [];
    for (let i = 0; i < 6; i += 1) {
        const angle = (i * Math.PI) / 3 + Math.PI / 6;
        places.push([Math.cos(angle) * spacing, Math.sin(angle) * spacing]);
    }
    for (let i = 0; i < 6; i += 1) {
        const angle = (i * Math.PI) / 3 + Math.PI / 6;
        places.push([Math.cos(angle) * spacing * 2, Math.sin(angle) * spacing * 2]);
    }
    for (let i = 0; i < 6; i += 1) {
        const angle = (i * Math.PI) / 3;
        places.push([Math.cos(angle) * spacing * Math.sqrt(3), Math.sin(angle) * spacing * Math.sqrt(3)]);
    }
    places.forEach(([x, y], index) => {
        segment(`jwst-seg-${index}`, x, y + mirrorY, mirrorZ, diameter);
    });

    const hole = add(BABYLON.MeshBuilder.CreateCylinder('jwst-hole', {
        diameter: spacing * 0.62,
        height: 0.04,
        tessellation: 24
    }, scene), black);
    hole.rotation.x = Math.PI / 2;
    hole.position.set(0, mirrorY, mirrorZ - 0.03);

    const backplane = add(BABYLON.MeshBuilder.CreateCylinder('jwst-backplane', {
        diameter: spacing * 3.7,
        height: 0.025,
        tessellation: 6
    }, scene), graphite);
    backplane.rotationQuaternion = faceZ.clone();
    backplane.position.set(0, mirrorY, mirrorZ - 0.07);

    places.forEach(([x, y], index) => {
        if (index % 2 !== 0) {
            return;
        }
        beam(
            `jwst-rib-${index}`,
            new BABYLON.Vector3(x * 0.15, y * 0.15 + mirrorY, mirrorZ - 0.08),
            new BABYLON.Vector3(x, y + mirrorY, mirrorZ - 0.045),
            0.012,
            0.012,
            graphite
        );
    });
    for (let i = 0; i < 6; i += 1) {
        const angle = (i * Math.PI) / 3;
        const next = angle + Math.PI / 3;
        const radius = spacing * 2.05;
        beam(
            `jwst-ring-${i}`,
            new BABYLON.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius + mirrorY, mirrorZ - 0.06),
            new BABYLON.Vector3(Math.cos(next) * radius, Math.sin(next) * radius + mirrorY, mirrorZ - 0.06),
            0.014,
            0.014,
            graphite
        );
    }

    const isim = add(BABYLON.MeshBuilder.CreateBox('jwst-isim', {
        width: 0.36,
        height: 0.28,
        depth: 0.22
    }, scene), metal);
    isim.position.set(0, mirrorY - 0.02, mirrorZ - 0.22);

    const isimFoil = add(BABYLON.MeshBuilder.CreateBox('jwst-isim-foil', {
        width: 0.28,
        height: 0.18,
        depth: 0.03
    }, scene), foil);
    isimFoil.position.set(0, mirrorY - 0.02, mirrorZ - 0.1);

    [-1, 1].forEach((side) => {
        const radiator = add(BABYLON.MeshBuilder.CreateBox(`jwst-radiator-${side}`, {
            width: 0.46,
            height: 0.5,
            depth: 0.018
        }, scene), radiatorMat);
        radiator.position.set(side * 0.58, mirrorY + 0.02, mirrorZ - 0.12);
        radiator.rotation.y = side * 0.42;
        radiator.rotation.z = side * -0.08;
        const hinge = add(BABYLON.MeshBuilder.CreateBox(`jwst-rad-hinge-${side}`, {
            width: 0.08,
            height: 0.22,
            depth: 0.04
        }, scene), metal);
        hinge.position.set(side * 0.32, mirrorY, mirrorZ - 0.16);
    });

    const aft = add(BABYLON.MeshBuilder.CreateCylinder('jwst-aft', {
        diameterTop: 0.07,
        diameterBottom: 0.045,
        height: 0.2,
        tessellation: 16
    }, scene), black);
    aft.rotation.x = Math.PI / 2;
    aft.position.set(0, mirrorY, mirrorZ - 0.1);

    const secondaryZ = mirrorZ + 0.92;
    const secondary = add(BABYLON.MeshBuilder.CreateCylinder('jwst-secondary', {
        diameter: 0.15,
        height: 0.014,
        tessellation: 6
    }, scene), gold);
    secondary.position.set(0, mirrorY, secondaryZ);
    secondary.rotationQuaternion = faceZ.clone();

    const secondaryHub = add(BABYLON.MeshBuilder.CreateCylinder('jwst-secondary-hub', {
        diameter: 0.04,
        height: 0.05,
        tessellation: 12
    }, scene), black);
    secondaryHub.rotation.x = Math.PI / 2;
    secondaryHub.position.set(0, mirrorY, secondaryZ - 0.03);

    for (let i = 0; i < 3; i += 1) {
        const angle = (i * Math.PI * 2) / 3 + 0.4;
        const radius = spacing * 2.15;
        const from = new BABYLON.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius + mirrorY, mirrorZ - 0.02);
        const to = new BABYLON.Vector3(0, mirrorY, secondaryZ - 0.02);
        beam(`jwst-strut-${i}`, from, to, 0.014, 0.028, graphite);
    }

    [-0.11, 0.11].forEach((x, index) => {
        const tracker = add(BABYLON.MeshBuilder.CreateBox(`jwst-tracker-${index}`, {
            width: 0.04,
            height: 0.035,
            depth: 0.05
        }, scene), white);
        tracker.position.set(x, mirrorY + 0.16, mirrorZ - 0.12);
        const hood = add(BABYLON.MeshBuilder.CreateCylinder(`jwst-tracker-hood-${index}`, {
            diameterTop: 0.028,
            diameterBottom: 0.02,
            height: 0.03,
            tessellation: 10
        }, scene), black);
        hood.rotation.x = Math.PI / 2;
        hood.position.set(x, mirrorY + 0.16, mirrorZ - 0.07);
    });

    const layers = [0.88, 0.96, 1.04, 1.12, 1.2];
    const layerGap = 0.07;
    layers.forEach((scale, index) => {
        makeKite(scene, `jwst-layer-${index}`, root, layerMats[index], 0.14 - index * layerGap, scale);
    });
    SUNSHIELD.forEach(([x, y], index) => {
        if (index % 2 !== 0) {
            return;
        }
        rod(
            `jwst-spreader-${index}`,
            new BABYLON.Vector3(x * 0.9, y * 0.9, 0.14),
            new BABYLON.Vector3(x * 1.16, y * 1.16, 0.14 - 4 * layerGap),
            0.014,
            graphite,
            6
        );
    });
    const cordScale = layers[layers.length - 1];
    const cordZ = 0.14 - 4 * layerGap - 0.01;
    SUNSHIELD.forEach(([x, y], index) => {
        const next = SUNSHIELD[(index + 1) % SUNSHIELD.length];
        rod(
            `jwst-cord-${index}`,
            new BABYLON.Vector3(x * cordScale, y * cordScale, cordZ),
            new BABYLON.Vector3(next[0] * cordScale, next[1] * cordScale, cordZ),
            0.012,
            graphite,
            6
        );
    });

    const towerBase = new BABYLON.Vector3(0, 0.22, 0.08);
    const towerTop = new BABYLON.Vector3(0, mirrorY, mirrorZ - 0.16);
    beam('jwst-tower', towerBase, towerTop, 0.06, 0.06, metal);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy], index) => {
        beam(
            `jwst-tower-leg-${index}`,
            new BABYLON.Vector3(sx * 0.16, 0.08 + sy * 0.1, 0.02),
            new BABYLON.Vector3(sx * 0.1, mirrorY + sy * 0.08, mirrorZ - 0.14),
            0.016,
            0.016,
            graphite
        );
    });

    const rearZ = -0.16;
    [-0.62, -0.1, 0.42].forEach((y, index) => {
        beam(
            `jwst-boom-${index}`,
            new BABYLON.Vector3(-1.15, y, rearZ),
            new BABYLON.Vector3(1.15, y, rearZ),
            0.018,
            0.012,
            metal
        );
    });
    beam(
        'jwst-spine',
        new BABYLON.Vector3(0, 0.9, rearZ),
        new BABYLON.Vector3(0, -1.15, rearZ),
        0.02,
        0.014,
        metal
    );

    [-1, 1].forEach((side) => {
        const pallet = add(BABYLON.MeshBuilder.CreateBox(`jwst-pallet-${side}`, {
            width: 0.1,
            height: 0.28,
            depth: 0.08
        }, scene), metal);
        pallet.position.set(side * 1.12, 0.12, -0.08);
        const palletFoil = add(BABYLON.MeshBuilder.CreateBox(`jwst-pallet-foil-${side}`, {
            width: 0.07,
            height: 0.16,
            depth: 0.02
        }, scene), foil);
        palletFoil.position.set(side * 1.12, 0.12, -0.03);
    });

    const flap = add(BABYLON.MeshBuilder.CreateBox('jwst-flap', {
        width: 0.22,
        height: 0.12,
        depth: 0.012
    }, scene), white);
    flap.position.set(0.02, -1.28, -0.08);
    flap.rotation.x = 0.55;

    const trim = add(BABYLON.MeshBuilder.CreateBox('jwst-trim', {
        width: 0.14,
        height: 0.07,
        depth: 0.01
    }, scene), metal);
    trim.position.set(1.28, -0.15, -0.02);
    trim.rotation.z = 0.6;

    const bus = add(BABYLON.MeshBuilder.CreateBox('jwst-bus', {
        width: 0.42,
        height: 0.22,
        depth: 0.26
    }, scene), metal);
    bus.position.set(0, -0.72, -0.28);

    [[0.16, 0.06], [-0.14, 0.04], [0.02, -0.06]].forEach((spot, index) => {
        const blanket = add(BABYLON.MeshBuilder.CreateBox(`jwst-bus-foil-${index}`, {
            width: 0.16,
            height: 0.1,
            depth: 0.02
        }, scene), foil);
        blanket.position.set(spot[0], -0.72 + spot[1], -0.14);
    });

    [[-0.16, -0.08], [0.16, -0.08], [-0.16, 0.08], [0.16, 0.08]].forEach(([x, y], index) => {
        const nozzle = add(BABYLON.MeshBuilder.CreateCylinder(`jwst-thruster-${index}`, {
            diameterTop: 0.012,
            diameterBottom: 0.028,
            height: 0.04,
            tessellation: 10
        }, scene), graphite);
        nozzle.rotation.x = Math.PI / 2;
        nozzle.position.set(x, -0.72 + y, -0.44);
    });

    const wing = add(BABYLON.MeshBuilder.CreateBox('jwst-wing', {
        width: 0.78,
        height: 0.34,
        depth: 0.016
    }, scene), solar);
    wing.position.set(1.55, -0.42, -0.18);

    const wingFrame = add(BABYLON.MeshBuilder.CreateBox('jwst-wing-frame', {
        width: 0.82,
        height: 0.38,
        depth: 0.008
    }, scene), metal);
    wingFrame.position.set(1.55, -0.42, -0.19);

    beam(
        'jwst-wing-boom',
        new BABYLON.Vector3(0.24, -0.62, -0.24),
        new BABYLON.Vector3(1.14, -0.46, -0.18),
        0.03,
        0.02,
        metal
    );
    const knuckle = add(BABYLON.MeshBuilder.CreateCylinder('jwst-wing-knuckle', {
        diameter: 0.05,
        height: 0.06,
        tessellation: 12
    }, scene), white);
    knuckle.rotation.z = Math.PI / 2;
    knuckle.position.set(1.12, -0.48, -0.18);

    const dish = add(BABYLON.MeshBuilder.CreateLathe('jwst-dish', {
        shape: [
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(0.09, 0.01, 0),
            new BABYLON.Vector3(0.12, 0.045, 0),
            new BABYLON.Vector3(0.04, 0.06, 0)
        ],
        tessellation: 28,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, scene), white);
    dish.rotation.x = Math.PI / 2;
    dish.rotation.z = 0.4;
    dish.position.set(-1.22, -0.62, -0.12);

    beam(
        'jwst-dish-arm',
        new BABYLON.Vector3(-0.18, -0.7, -0.22),
        new BABYLON.Vector3(-1.05, -0.64, -0.12),
        0.02,
        0.02,
        metal
    );

    const feed = add(BABYLON.MeshBuilder.CreateCylinder('jwst-feed', {
        diameter: 0.016,
        height: 0.07,
        tessellation: 8
    }, scene), metal);
    feed.rotation.x = 0.6;
    feed.position.set(-1.16, -0.56, -0.06);

    root.isPickable = true;
    root.examineMesh = root;
    root.canLookThrough = true;
    root.distanceLabel = '1.5 million km from Earth, at L2';
    root.isCelestial = true;
    root.infoId = 'jwst';
    root.planetName = 'James Webb';
    root.objectName = root.planetName;
    root.celestialKind = 'probe';
    root.cameraDistance = 4.2;

    root.craftParts = root.getChildMeshes();
    root.scaling.setAll(0.2);
    root.computeWorldMatrix(true);
    const bounds = root.getHierarchyBoundingVectors(true);
    const span = BABYLON.Vector3.Distance(bounds.min, bounds.max);
    root.examineRadius = (span > 0.05 ? span : 2.4) * 0.42;

    const update = () => {
        const earthPos = earth.getAbsolutePosition();
        const away = earthPos.lengthSquared() > 0.01
            ? earthPos.normalizeToNew()
            : new BABYLON.Vector3(1, 0, 0);
        const side = BABYLON.Vector3.Cross(BABYLON.Axis.Y, away);
        if (side.lengthSquared() < 0.0001) {
            side.copyFromFloats(0, 0, 1);
        }
        side.normalize();
        root.position.copyFrom(earthPos)
            .addInPlace(away.scale(16))
            .addInPlace(new BABYLON.Vector3(0, 3.4, 0))
            .addInPlace(side.scale(2.2));
        root.lookAt(root.position.add(away), 0, 0, 0, BABYLON.Space.WORLD, BABYLON.Vector3.Up());
    };
    update();
    return { mesh: root, update };
};
