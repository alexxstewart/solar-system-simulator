const MOONS = [
    { id: 'io', name: 'Io', parent: '5', group: "Jupiter's moons", orbit: 3.1, radius: 0.2, speed: 0.014, tilt: 0.04, style: 'sulfur', label: '421,700 km from Jupiter', wonder: 'Io is the most volcanic world we know. Jupiter squeezes it so hard that sulfur eruptions repaint the surface.' },
    { id: 'europa', name: 'Europa', parent: '5', group: "Jupiter's moons", orbit: 3.9, radius: 0.17, speed: 0.011, tilt: 0.05, style: 'ice-lines', label: '671,000 km from Jupiter', wonder: 'Under Europa\'s ice is a global ocean, deeper than Earth\'s, kept warm by Jupiter\'s tides.' },
    { id: 'ganymede', name: 'Ganymede', parent: '5', group: "Jupiter's moons", orbit: 4.85, radius: 0.28, speed: 0.008, tilt: 0.03, style: 'grooved', label: '1,070,000 km from Jupiter', wonder: 'Ganymede is the largest moon in the solar system, bigger than Mercury, and the only moon with its own magnetic field.' },
    { id: 'callisto', name: 'Callisto', parent: '5', group: "Jupiter's moons", orbit: 6, radius: 0.24, speed: 0.005, tilt: 0.06, style: 'cratered', label: '1,883,000 km from Jupiter', wonder: 'Callisto\'s surface is the oldest landscape around Jupiter, a fossil of impacts from the solar system\'s first billion years.' },
    { id: 'mimas', name: 'Mimas', parent: '6', group: "Saturn's moons", orbit: 4.15, radius: 0.11, speed: 0.016, tilt: 0.08, style: 'deathstar', label: '185,500 km from Saturn', wonder: 'Mimas wears one enormous crater, Herschel, so deep that the impact nearly broke the moon apart.' },
    { id: 'enceladus', name: 'Enceladus', parent: '6', group: "Saturn's moons", orbit: 4.65, radius: 0.12, speed: 0.013, tilt: 0.02, style: 'snow', label: '238,000 km from Saturn', wonder: 'Enceladus sprays geysers of ice into space from a hidden ocean. Cassini flew through the spray and tasted salt.' },
    { id: 'tethys', name: 'Tethys', parent: '6', group: "Saturn's moons", orbit: 5.15, radius: 0.14, speed: 0.011, tilt: 0.05, style: 'canyon', label: '295,000 km from Saturn', wonder: 'A canyon called Ithaca Chasma wraps most of the way around Tethys, as if the moon cracked while it froze.' },
    { id: 'dione', name: 'Dione', parent: '6', group: "Saturn's moons", orbit: 5.75, radius: 0.14, speed: 0.009, tilt: 0.04, style: 'cliffs', label: '377,400 km from Saturn', wonder: 'Dione\'s ice cliffs are bright wisps on a darker trailing side, fractures where the crust pulled apart.' },
    { id: 'rhea', name: 'Rhea', parent: '6', group: "Saturn's moons", orbit: 6.4, radius: 0.16, speed: 0.007, tilt: 0.03, style: 'cratered-ice', label: '527,000 km from Saturn', wonder: 'Rhea is a quiet ice moon, heavily cratered, and may have a thin ring of debris that no one has quite proved.' },
    { id: 'titan', name: 'Titan', parent: '6', group: "Saturn's moons", orbit: 7.5, radius: 0.32, speed: 0.0045, tilt: 0.02, style: 'titan', label: '1,222,000 km from Saturn', wonder: 'Titan has lakes of liquid methane, a thick orange sky, and a hidden water ocean under the ice. Huygens landed there in 2005.', air: [0.95, 0.55, 0.18] },
    { id: 'iapetus', name: 'Iapetus', parent: '6', group: "Saturn's moons", orbit: 8.85, radius: 0.15, speed: 0.003, tilt: 0.18, style: 'twotone', label: '3,561,000 km from Saturn', wonder: 'Iapetus is black on one face and white on the other, with a mountain ridge running the equator like a seam.' },
    { id: 'miranda', name: 'Miranda', parent: '7', group: "Uranus's moons", orbit: 1.85, radius: 0.1, speed: 0.015, tilt: 0.2, style: 'chaos', label: '129,400 km from Uranus', wonder: 'Miranda looks like it was shattered and poorly glued back together. Verona Rupes may be the tallest cliff in the solar system.' },
    { id: 'ariel', name: 'Ariel', parent: '7', group: "Uranus's moons", orbit: 2.2, radius: 0.12, speed: 0.012, tilt: 0.04, style: 'cliffs', label: '191,000 km from Uranus', wonder: 'Ariel has long valleys and smooth plains, a sign that something flowed across the ice long after it formed.' },
    { id: 'titania', name: 'Titania', parent: '7', group: "Uranus's moons", orbit: 2.7, radius: 0.15, speed: 0.008, tilt: 0.03, style: 'cratered-ice', label: '436,000 km from Uranus', wonder: 'Titania is Uranus\'s largest moon. Faults cut across its craters, so the crust moved after the impacts.' },
    { id: 'oberon', name: 'Oberon', parent: '7', group: "Uranus's moons", orbit: 3.15, radius: 0.14, speed: 0.006, tilt: 0.05, style: 'cratered', label: '583,500 km from Uranus', wonder: 'Oberon is the outermost big moon of Uranus, dark and cratered, with a mountain that may be the peak of a huge impact.' },
    { id: 'triton', name: 'Triton', parent: '8', group: "Neptune's moons", orbit: 2.15, radius: 0.18, speed: -0.01, tilt: 0.22, style: 'triton', label: '354,800 km from Neptune', wonder: 'Triton orbits Neptune backwards. It was probably captured, and nitrogen geysers still dust its pink ice.', air: [0.75, 0.55, 0.7] }
];

export const MOON_WONDERS = Object.fromEntries(MOONS.map((moon) => [moon.id, moon.wonder]));

export const createMoons = (scene, planets) => {
    const parents = {};
    planets.forEach((planet) => {
        if (planet.infoId) {
            parents[String(planet.infoId)] = planet;
        }
    });
    return MOONS.map((spec) => {
        const parent = parents[spec.parent];
        const mesh = BABYLON.MeshBuilder.CreateSphere(spec.id, {
            diameter: spec.radius * 2,
            segments: 64
        }, scene);
        const material = new BABYLON.StandardMaterial(`${spec.id}-mat`, scene);
        const texture = new BABYLON.Texture(`style/textures/moons/${spec.id}.jpg`, scene);
        texture.anisotropicFilteringLevel = 16;
        material.diffuseTexture = texture;
        material.specularColor = new BABYLON.Color3(0.03, 0.03, 0.03);
        material.specularPower = 24;
        material.ambientColor = new BABYLON.Color3(0.34, 0.34, 0.36);
        material.backFaceCulling = true;
        material.alpha = 1;
        material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
        material.forceDepthWrite = true;
        material.useAlphaFromDiffuseTexture = false;
        texture.hasAlpha = false;
        mesh.material = material;
        mesh.parentBody = parent;
        mesh.parentId = spec.parent;
        mesh.navGroup = spec.group;
        mesh.orbit = spec.orbit;
        mesh.alpha = Math.random() * Math.PI * 2;
        mesh.alphaIncrement = spec.speed * 0.22;
        mesh.orbitTilt = spec.tilt;
        mesh.isCelestial = true;
        mesh.infoId = spec.id;
        mesh.planetName = spec.name;
        mesh.celestialKind = 'planet';
        mesh.examineRadius = spec.radius;
        mesh.distanceLabel = spec.label;
        mesh.isPickable = true;
        return mesh;
    });
};

export const updateMoons = (moons, paused) => {
    moons.forEach((moon) => {
        const parent = moon.parentBody;
        if (!parent) {
            return;
        }
        if (!paused) {
            moon.alpha += moon.alphaIncrement || 0;
        }
        const tilt = moon.orbitTilt || 0;
        moon.position.set(
            parent.position.x + Math.sin(moon.alpha) * moon.orbit,
            parent.position.y + Math.sin(moon.alpha * 2) * moon.orbit * tilt,
            parent.position.z + Math.cos(moon.alpha) * moon.orbit
        );
    });
};
