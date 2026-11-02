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

const paintBlanket = (ctx, width, height, base) => {
    const image = ctx.createImageData(width, height);
    const data = image.data;
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const weave = noise(x / 18, y / 14);
            const crumple = noise(x / 7, y / 5);
            const slow = noise(x / 60, y / 40);
            let shade = base + weave * 28 + slow * 16 - crumple * 22;
            const seam = y % 42;
            if (seam < 2) {
                shade -= 38;
            } else if (seam < 5) {
                shade -= 12;
            }
            if (x % 86 < 2) {
                shade -= 26;
            }
            const i = (y * width + x) * 4;
            data[i] = shade;
            data[i + 1] = shade + 1;
            data[i + 2] = shade + 3;
            data[i + 3] = 255;
        }
    }
    ctx.putImageData(image, 0, 0);
    ctx.strokeStyle = 'rgba(70, 74, 80, 0.55)';
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 42) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
        ctx.stroke();
        ctx.fillStyle = 'rgba(40, 42, 48, 0.45)';
        for (let x = 8; x < width; x += 14) {
            ctx.fillRect(x, y - 1, 2, 3);
        }
    }
    ctx.fillStyle = 'rgba(196, 154, 74, 0.85)';
    for (let i = 0; i < 14; i += 1) {
        const x = (hash(i, 3) * (width - 30)) | 0;
        const y = (hash(i, 9) * (height - 8)) | 0;
        ctx.fillRect(x, y, 18 + (hash(i, 4) * 16), 3);
    }
};

const paintGold = (ctx, width, height) => {
    const image = ctx.createImageData(width, height);
    const data = image.data;
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const crumple = noise(x / 5.5, y / 4.5);
            const ridge = noise(x / 16, y / 11);
            const spark = noise(x / 2.2, y / 2.2);
            const fold = Math.pow(crumple, 1.4);
            const r = 150 + ridge * 70 - fold * 80 + spark * 18;
            const g = 96 + ridge * 40 - fold * 55;
            const b = 32 + ridge * 16 - fold * 20;
            const i = (y * width + x) * 4;
            data[i] = Math.max(0, Math.min(255, r));
            data[i + 1] = Math.max(0, Math.min(255, g));
            data[i + 2] = Math.max(0, Math.min(255, b));
            data[i + 3] = 255;
        }
    }
    ctx.putImageData(image, 0, 0);
};

const paintSolar = (ctx, width, height) => {
    ctx.fillStyle = '#6a5330';
    ctx.fillRect(0, 0, width, height);
    const margin = 18;
    const cols = 34;
    const rows = 12;
    const cellW = (width - margin * 2) / cols;
    const cellH = (height - margin * 2) / rows;
    for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
            const n = hash(col, row);
            const blue = 18 + n * 16;
            ctx.fillStyle = `rgb(${8 + n * 8}, ${22 + n * 14}, ${blue + 28})`;
            const x = margin + col * cellW + 1.2;
            const y = margin + row * cellH + 1.2;
            ctx.fillRect(x, y, cellW - 2.4, cellH - 2.4);
            if (n > 0.92) {
                ctx.fillStyle = 'rgba(180, 210, 255, 0.18)';
                ctx.fillRect(x, y, cellW - 2.4, 3);
            }
        }
        if (row % 3 === 2) {
            ctx.fillStyle = '#b7bcc4';
            ctx.fillRect(margin, margin + (row + 1) * cellH - 1.5, width - margin * 2, 2);
        }
    }
    ctx.strokeStyle = '#d5dbe3';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, width - 10, height - 10);
    ctx.strokeStyle = '#8d7344';
    ctx.lineWidth = 3;
    ctx.strokeRect(14, 14, width - 28, height - 28);
};

const paintMirror = (ctx, width, height) => {
    const image = ctx.createImageData(width, height);
    const data = image.data;
    const cx = width / 2;
    const cy = height / 2;
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const dx = (x - cx) / cx;
            const dy = (y - cy) / cy;
            const r = Math.sqrt(dx * dx + dy * dy);
            const grain = noise(x / 3, y / 3) * 8;
            const ring = Math.sin(r * 48) * 3;
            const shade = Math.max(0, 18 - r * 14) + grain * 0.25 + ring;
            const i = (y * width + x) * 4;
            data[i] = shade * 0.7;
            data[i + 1] = shade * 0.85;
            data[i + 2] = shade + 6;
            data[i + 3] = 255;
        }
    }
    ctx.putImageData(image, 0, 0);
};

const paintBrushed = (ctx, width, height) => {
    const image = ctx.createImageData(width, height);
    const data = image.data;
    for (let y = 0; y < height; y += 1) {
        const band = 168 + noise(0, y / 2) * 28;
        for (let x = 0; x < width; x += 1) {
            const grain = hash(x, y) * 18;
            const shade = band - 8 + grain;
            const i = (y * width + x) * 4;
            data[i] = shade;
            data[i + 1] = shade + 2;
            data[i + 2] = shade + 6;
            data[i + 3] = 255;
        }
    }
    ctx.putImageData(image, 0, 0);
};

const material = (scene, name, color, specular, power, emissive) => {
    const mat = new BABYLON.StandardMaterial(name, scene);
    mat.diffuseColor = new BABYLON.Color3(color[0], color[1], color[2]);
    mat.specularColor = new BABYLON.Color3(specular, specular, specular);
    mat.specularPower = power;
    mat.emissiveColor = new BABYLON.Color3(emissive[0], emissive[1], emissive[2]);
    mat.ambientColor = new BABYLON.Color3(0.55, 0.55, 0.58);
    return mat;
};

const withTexture = (mat, texture, emissiveAmount) => {
    mat.diffuseTexture = texture;
    mat.emissiveTexture = texture;
    mat.emissiveColor = new BABYLON.Color3(emissiveAmount, emissiveAmount, emissiveAmount);
    return mat;
};

export const createHubble = (scene, earth) => {
    if (!earth) {
        return null;
    }
    const root = new BABYLON.Mesh('hubble', scene);

    const shellTex = makeTexture(scene, 'hubble-shell', 512, 256, (ctx, w, h) => paintBlanket(ctx, w, h, 188));
    const goldTex = makeTexture(scene, 'hubble-gold-foil', 256, 256, paintGold);
    const solarTex = makeTexture(scene, 'hubble-solar', 1024, 420, paintSolar);
    const mirrorTex = makeTexture(scene, 'hubble-mirror', 256, 256, paintMirror);
    const metalTex = makeTexture(scene, 'hubble-metal', 256, 64, paintBrushed);

    const shell = withTexture(material(scene, 'hubble-shell', [1, 1, 1], 0.22, 40, [0, 0, 0]), shellTex, 0.16);
    const gold = withTexture(material(scene, 'hubble-gold', [1, 1, 1], 0.42, 28, [0, 0, 0]), goldTex, 0.2);
    const solar = withTexture(material(scene, 'hubble-solar', [1, 1, 1], 0.55, 80, [0, 0, 0]), solarTex, 0.08);
    solar.specularColor = new BABYLON.Color3(0.45, 0.5, 0.6);
    const metal = withTexture(material(scene, 'hubble-metal', [1, 1, 1], 0.62, 56, [0, 0, 0]), metalTex, 0.12);
    const white = material(scene, 'hubble-white', [0.9, 0.91, 0.93], 0.38, 48, [0.05, 0.05, 0.055]);
    const black = material(scene, 'hubble-black', [0.012, 0.013, 0.016], 0.08, 20, [0.004, 0.004, 0.006]);
    const kapton = material(scene, 'hubble-kapton', [0.72, 0.48, 0.12], 0.35, 24, [0.08, 0.04, 0.01]);
    const mirror = withTexture(material(scene, 'hubble-glass', [0.55, 0.62, 0.75], 0.95, 96, [0, 0, 0]), mirrorTex, 0.72);
    mirror.specularColor = new BABYLON.Color3(0.85, 0.9, 1);
    mirror.emissiveColor = new BABYLON.Color3(0.16, 0.2, 0.28);

    const add = (mesh, mat) => {
        mesh.parent = root;
        mesh.material = mat;
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

    const alongTube = (mesh) => {
        mesh.rotation.x = Math.PI / 2;
        return mesh;
    };

    const tubeRadius = 0.155;
    const shellRear = 0.02;
    const shellFront = 0.5;

    alongTube(add(BABYLON.MeshBuilder.CreateCylinder('hubble-shell', {
        diameter: tubeRadius * 2,
        height: shellFront - shellRear,
        tessellation: 48,
        cap: BABYLON.Mesh.NO_CAP
    }, scene), shell)).position.z = (shellFront + shellRear) / 2;

    const liner = alongTube(add(BABYLON.MeshBuilder.CreateCylinder('hubble-liner', {
        diameter: tubeRadius * 2 - 0.02,
        height: 0.38,
        tessellation: 48,
        cap: BABYLON.Mesh.NO_CAP,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, scene), black));
    liner.position.z = 0.3;

    const cell = alongTube(add(BABYLON.MeshBuilder.CreateCylinder('hubble-cell', {
        diameter: tubeRadius * 2 - 0.018,
        height: 0.028,
        tessellation: 48
    }, scene), black));
    cell.position.z = 0.095;

    const aft = alongTube(add(BABYLON.MeshBuilder.CreateCylinder('hubble-aft', {
        diameter: 0.39,
        height: 0.28,
        tessellation: 48
    }, scene), shell));
    aft.position.z = -0.1;

    const equipment = alongTube(add(BABYLON.MeshBuilder.CreateCylinder('hubble-equipment', {
        diameterTop: 0.34,
        diameterBottom: 0.3,
        height: 0.2,
        tessellation: 40
    }, scene), shell));
    equipment.position.z = -0.32;

    [0.08, 0.2, 0.33, 0.45].forEach((z, index) => {
        const band = add(BABYLON.MeshBuilder.CreateTorus(`hubble-band-${index}`, {
            diameter: tubeRadius * 2 + 0.012,
            thickness: 0.0045,
            tessellation: 40
        }, scene), metal);
        band.rotation.x = Math.PI / 2;
        band.position.z = z;
    });

    const lip = add(BABYLON.MeshBuilder.CreateTorus('hubble-lip', {
        diameter: 0.345,
        thickness: 0.014,
        tessellation: 48
    }, scene), metal);
    lip.rotation.x = Math.PI / 2;
    lip.position.z = shellFront;

    const hinge = new BABYLON.Mesh('hubble-hinge', scene);
    hinge.parent = root;
    hinge.position.set(tubeRadius + 0.014, 0, shellFront + 0.006);
    hinge.isPickable = false;
    hinge.rotation.y = Math.PI * 0.96;

    const door = add(BABYLON.MeshBuilder.CreateCylinder('hubble-door', {
        diameter: 0.33,
        height: 0.014,
        tessellation: 40
    }, scene), white);
    door.parent = hinge;
    door.rotation.x = Math.PI / 2;
    door.position.set(-0.162, 0, 0.012);

    const doorLiner = add(BABYLON.MeshBuilder.CreateCylinder('hubble-door-liner', {
        diameter: 0.29,
        height: 0.004,
        tessellation: 36
    }, scene), black);
    doorLiner.parent = door;
    doorLiner.position.y = 0.009;

    for (let i = -1; i <= 1; i += 1) {
        const knuckle = add(BABYLON.MeshBuilder.CreateCylinder(`hubble-knuckle-${i}`, {
            diameter: 0.02,
            height: 0.045,
            tessellation: 10
        }, scene), metal);
        knuckle.parent = hinge;
        knuckle.position.y = i * 0.055;
    }

        rod(
        'hubble-actuator',
        new BABYLON.Vector3(tubeRadius + 0.01, 0.05, 0.34),
        new BABYLON.Vector3(0.3, 0.04, 0.5),
        0.008,
        metal
    );

    const primary = alongTube(add(BABYLON.MeshBuilder.CreateCylinder('hubble-primary', {
        diameter: 0.256,
        height: 0.016,
        tessellation: 48
    }, scene), mirror));
    primary.position.z = 0.12;

    const mirrorRing = add(BABYLON.MeshBuilder.CreateTorus('hubble-mirror-ring', {
        diameter: 0.268,
        thickness: 0.012,
        tessellation: 40
    }, scene), black);
    mirrorRing.rotation.x = Math.PI / 2;
    mirrorRing.position.z = 0.118;

    const secondary = add(BABYLON.MeshBuilder.CreateCylinder('hubble-secondary', {
        diameter: 0.048,
        height: 0.01,
        tessellation: 20
    }, scene), mirror);
    alongTube(secondary);
    secondary.position.z = 0.4;

    const secondaryHub = add(BABYLON.MeshBuilder.CreateCylinder('hubble-secondary-hub', {
        diameter: 0.016,
        height: 0.03,
        tessellation: 10
    }, scene), black);
    alongTube(secondaryHub);
    secondaryHub.position.z = 0.385;

    for (let i = 0; i < 4; i += 1) {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 8;
        rod(
            `hubble-vane-${i}`,
            new BABYLON.Vector3(Math.cos(angle) * 0.02, Math.sin(angle) * 0.02, 0.4),
            new BABYLON.Vector3(Math.cos(angle) * (tubeRadius - 0.012), Math.sin(angle) * (tubeRadius - 0.012), 0.4),
            0.004,
            metal,
            6
        );
    }

    const ringBaffle = (name, z, inner, outer) => {
        const shape = [
            new BABYLON.Vector3(inner, 0, 0),
            new BABYLON.Vector3(outer, 0, 0),
            new BABYLON.Vector3(outer, 0.014, 0),
            new BABYLON.Vector3(inner, 0.014, 0)
        ];
        const mesh = add(BABYLON.MeshBuilder.CreateLathe(name, {
            shape,
            tessellation: 40,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE
        }, scene), black);
        mesh.rotation.x = Math.PI / 2;
        mesh.position.z = z;
        return mesh;
    };
    ringBaffle('hubble-baffle-0', 0.24, 0.078, 0.14);
    ringBaffle('hubble-baffle-1', 0.34, 0.062, 0.14);

    const baffleTube = alongTube(add(BABYLON.MeshBuilder.CreateCylinder('hubble-baffle-tube', {
        diameter: 0.028,
        height: 0.3,
        tessellation: 12
    }, scene), black));
    baffleTube.position.z = 0.24;

    const foilSpots = [
        [0.12, 0.08, -0.08, 0.14, 0.1, 0.16],
        [-0.13, 0.05, -0.14, 0.12, 0.11, 0.14],
        [0.0, -0.16, -0.1, 0.18, 0.08, 0.18],
        [-0.02, 0.15, -0.26, 0.16, 0.07, 0.14],
        [0.14, -0.04, -0.28, 0.1, 0.1, 0.12],
        [-0.14, -0.06, -0.02, 0.1, 0.09, 0.12]
    ];
    foilSpots.forEach((spot, index) => {
        const patch = add(BABYLON.MeshBuilder.CreateBox(`hubble-foil-${index}`, {
            width: spot[3],
            height: spot[4],
            depth: spot[5]
        }, scene), gold);
        patch.position.set(spot[0], spot[1], spot[2]);
    });

    for (let i = 0; i < 8; i += 1) {
        const angle = (i / 8) * Math.PI * 2 + 0.2;
        const bay = add(BABYLON.MeshBuilder.CreateBox(`hubble-bay-${i}`, {
            width: 0.07,
            height: 0.045,
            depth: 0.03
        }, scene), i % 3 === 0 ? black : white);
        const radius = 0.2;
        bay.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, -0.12 + (i % 2) * 0.06);
        bay.lookAt(bay.position.add(new BABYLON.Vector3(Math.cos(angle), Math.sin(angle), 0)));
    }

    [[0.55, 0.2], [2.6, -0.05], [4.4, 0.12]].forEach((pin, index) => {
        const angle = pin[0];
        const mount = new BABYLON.Vector3(Math.cos(angle) * 0.19, Math.sin(angle) * 0.19, pin[1]);
        const tip = new BABYLON.Vector3(Math.cos(angle) * 0.25, Math.sin(angle) * 0.25, pin[1]);
        rod(`hubble-trunnion-${index}`, mount, tip, 0.016, kapton, 10);
        const collar = add(BABYLON.MeshBuilder.CreateCylinder(`hubble-trunnion-collar-${index}`, {
            diameter: 0.028,
            height: 0.012,
            tessellation: 10
        }, scene), metal);
        collar.position = mount;
        const aim = new BABYLON.Quaternion();
        const out = tip.subtract(mount).normalize();
        BABYLON.Quaternion.FromUnitVectorsToRef(BABYLON.Axis.Y, out, aim);
        collar.rotationQuaternion = aim;
    });

    const grapple = add(BABYLON.MeshBuilder.CreateCylinder('hubble-grapple', {
        diameterTop: 0.02,
        diameterBottom: 0.034,
        height: 0.04,
        tessellation: 12
    }, scene), kapton);
    grapple.position.set(0, 0.22, -0.18);

    [-0.2, 0.15].forEach((z, index) => {
        rod(
            `hubble-rail-top-${index}`,
            new BABYLON.Vector3(0.09, tubeRadius + 0.018, z),
            new BABYLON.Vector3(0.09, tubeRadius + 0.018, z + 0.16),
            0.009,
            metal,
            6
        );
        [0, 0.08, 0.16].forEach((step, stepIndex) => {
            rod(
                `hubble-rail-post-${index}-${stepIndex}`,
                new BABYLON.Vector3(0.09, tubeRadius - 0.002, z + step),
                new BABYLON.Vector3(0.09, tubeRadius + 0.018, z + step),
                0.004,
                metal,
                5
            );
        });
    });

    rod(
        'hubble-rail-side',
        new BABYLON.Vector3(tubeRadius + 0.016, 0.02, 0.08),
        new BABYLON.Vector3(tubeRadius + 0.016, 0.02, 0.4),
        0.008,
        metal,
        6
    );

    const makeDish = (name, at, aimAt) => {
        const rig = new BABYLON.Mesh(`${name}-rig`, scene);
        rig.parent = root;
        rig.position = at;
        rig.lookAt(aimAt, 0, 0, 0, BABYLON.Space.WORLD);
        rig.isPickable = false;
        const shape = [];
        for (let i = 0; i <= 14; i += 1) {
            const radius = (i / 14) * 0.07;
            shape.push(new BABYLON.Vector3(radius, radius * radius * 1.35, 0));
        }
        const dish = add(BABYLON.MeshBuilder.CreateLathe(`${name}-dish`, {
            shape,
            tessellation: 28,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE
        }, scene), white);
        dish.parent = rig;
        const rim = add(BABYLON.MeshBuilder.CreateTorus(`${name}-rim`, {
            diameter: 0.14,
            thickness: 0.006,
            tessellation: 28
        }, scene), metal);
        rim.parent = dish;
        rim.position.y = 0.07 * 0.07 * 1.35;
        const feed = add(BABYLON.MeshBuilder.CreateCylinder(`${name}-feed`, {
            diameterTop: 0.01,
            diameterBottom: 0.022,
            height: 0.045,
            tessellation: 10
        }, scene), black);
        feed.parent = dish;
        feed.position.y = 0.04;
        dish.rotation.x = Math.PI / 2;
        return rig;
    };

    [-1, 1].forEach((side) => {
        const rootPoint = new BABYLON.Vector3(side * 0.19, 0.02, 0.14);
        const elbow = new BABYLON.Vector3(side * 0.34, 0.1, 0.2);
        const head = new BABYLON.Vector3(side * 0.46, 0.16, 0.28);
        rod(`hubble-hga-arm-a-${side}`, rootPoint, elbow, 0.012, white, 8);
        rod(`hubble-hga-arm-b-${side}`, elbow, head, 0.01, white, 8);
        const gimbal = add(BABYLON.MeshBuilder.CreateSphere(`hubble-hga-gimbal-${side}`, {
            diameter: 0.03,
            segments: 10
        }, scene), metal);
        gimbal.position = elbow;
        makeDish(`hubble-hga-${side}`, head, head.add(new BABYLON.Vector3(side * 0.4, 0.15, 0.55)));
    });

    [-1, 1].forEach((side) => {
        const drive = add(BABYLON.MeshBuilder.CreateCylinder(`hubble-drive-${side}`, {
            diameter: 0.07,
            height: 0.08,
            tessellation: 16
        }, scene), white);
        drive.rotation.z = Math.PI / 2;
        drive.position.set(side * 0.23, 0, -0.04);

        const yokeNear = new BABYLON.Vector3(side * 0.28, 0, -0.04);
        const yokeFar = new BABYLON.Vector3(side * 0.4, 0, -0.04);
        rod(`hubble-yoke-${side}`, yokeNear, yokeFar, 0.018, metal, 8);

        const wing = add(BABYLON.MeshBuilder.CreateBox(`hubble-wing-${side}`, {
            width: 0.62,
            height: 0.008,
            depth: 0.24
        }, scene), solar);
        wing.position.set(side * 0.72, 0.012, -0.04);

        const frame = add(BABYLON.MeshBuilder.CreateBox(`hubble-wing-frame-${side}`, {
            width: 0.64,
            height: 0.004,
            depth: 0.26
        }, scene), metal);
        frame.position.set(side * 0.72, -0.002, -0.04);

        [-0.1, 0.1].forEach((z, index) => {
            rod(
                `hubble-wing-spar-${side}-${index}`,
                new BABYLON.Vector3(side * 0.4, 0, -0.04),
                new BABYLON.Vector3(side * 0.42, 0, z - 0.04),
                0.007,
                metal,
                6
            );
        });
    });

    const lowGainSpots = [
        new BABYLON.Vector3(0.08, 0.12, -0.4),
        new BABYLON.Vector3(-0.1, -0.08, -0.4)
    ];
    lowGainSpots.forEach((at, index) => {
        const cone = add(BABYLON.MeshBuilder.CreateCylinder(`hubble-lga-${index}`, {
            diameterTop: 0.01,
            diameterBottom: 0.028,
            height: 0.05,
            tessellation: 10
        }, scene), white);
        cone.position = at.add(new BABYLON.Vector3(0, 0, -0.02));
        alongTube(cone);
    });

    const bulkhead = alongTube(add(BABYLON.MeshBuilder.CreateCylinder('hubble-bulkhead', {
        diameter: 0.28,
        height: 0.012,
        tessellation: 28
    }, scene), metal));
    bulkhead.position.z = -0.42;

    [-0.06, 0.05].forEach((y, index) => {
        const tracker = add(BABYLON.MeshBuilder.CreateCylinder(`hubble-tracker-${index}`, {
            diameter: 0.03,
            height: 0.05,
            tessellation: 12
        }, scene), black);
        tracker.rotation.z = Math.PI / 2;
        tracker.position.set(0.16, y, 0.22);
        const shade = add(BABYLON.MeshBuilder.CreateCylinder(`hubble-tracker-hood-${index}`, {
            diameterTop: 0.04,
            diameterBottom: 0.03,
            height: 0.02,
            tessellation: 12
        }, scene), white);
        shade.position.set(0.19, y, 0.22);
        shade.rotation.z = Math.PI / 2;
    });

    root.isPickable = true;
    root.examineMesh = root;
    root.canLookThrough = true;
    root.distanceLabel = '535 km above Earth';
    root.isCelestial = true;
    root.infoId = 'hubble';
    root.planetName = 'Hubble';
    root.objectName = root.planetName;
    root.celestialKind = 'probe';
    root.cameraDistance = 2.6;

    root.craftParts = root.getChildMeshes();
    root.scaling.setAll(0.2);
    root.computeWorldMatrix(true);
    const bounds = root.getHierarchyBoundingVectors(true);
    const span = BABYLON.Vector3.Distance(bounds.min, bounds.max);
    root.examineRadius = (span > 0.05 ? span : 1.4) * 0.48;

    let angle = 0.8;
    const update = (dt) => {
        angle += dt * 0.04;
        const earthPos = earth.getAbsolutePosition();
        const offset = new BABYLON.Vector3(Math.cos(angle) * 5.4, 1.05, Math.sin(angle) * 5.4);
        root.position.copyFrom(earthPos).addInPlace(offset);
        const outward = offset.normalizeToNew();
        root.lookAt(root.position.add(outward), 0, 0, 0, BABYLON.Space.WORLD, BABYLON.Vector3.Up());
    };
    update(0);
    return { mesh: root, update };
};
