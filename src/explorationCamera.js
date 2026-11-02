const HOME_POSITION = new BABYLON.Vector3(5, 8, -30);

export const createExplorationCamera = (scene, canvas, startPos) => {
    const camera = new BABYLON.UniversalCamera('explorer', startPos.clone(), scene);
    camera.attachControl(canvas, true);
    camera.minZ = 0.05;
    camera.maxZ = 80000;
    camera.speed = 1.6;
    camera.angularSensibility = 800;
    camera.inertia = 0.6;
    camera.keysUp.push(87);
    camera.keysDown.push(83);
    camera.keysLeft.push(65);
    camera.keysRight.push(68);

    if (camera.inputs.attached.mousewheel) {
        camera.inputs.remove(camera.inputs.attached.mousewheel);
    }

    canvas.tabIndex = 1;
    canvas.focus();

    const flight = {
        camera,
        boost: false,
        up: false,
        down: false,
        warping: false,
        baseSpeed: 1.6,
        minSpeed: 0.12,
        maxSpeed: 220
    };

    window.addEventListener('keydown', (event) => {
        if (event.target && ['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
            return;
        }
        const key = event.key.toLowerCase();
        if (flight.holdView) {
            if ([' ', 'arrowup', 'arrowdown'].includes(key)) {
                event.preventDefault();
            }
            return;
        }
        if (flight.examine && ['w', 'a', 's', 'd'].includes(key)) {
            endExamine(flight);
        }
        if (key === 'shift') flight.boost = true;
        if (key === 'e' || key === ' ') flight.up = true;
        if (key === 'q') flight.down = true;
        if ([' ', 'arrowup', 'arrowdown'].includes(key)) {
            event.preventDefault();
        }
    });

    window.addEventListener('keyup', (event) => {
        const key = event.key.toLowerCase();
        if (key === 'shift') flight.boost = false;
        if (key === 'e' || key === ' ') flight.up = false;
        if (key === 'q') flight.down = false;
    });

    canvas.addEventListener('wheel', (event) => {
        event.preventDefault();
        if (flight.holdView) {
            return;
        }
        if (flight.examine && !flight.warping) {
            const frame = framingDistance(flight.examine.mesh);
            const steps = Math.max(-4, Math.min(4, event.deltaY / 100));
            const factor = Math.pow(1.11, steps === 0 ? Math.sign(event.deltaY) || 1 : steps);
            const lens = flight.examine.mesh.lensRadius || 0;
            const minRadius = lens ? frame * 0.42 : frame * 0.55;
            const maxRadius = lens ? lens * 0.86 : frame * 7;
            flight.examine.radius = Math.min(maxRadius, Math.max(minRadius, flight.examine.radius * factor));
            return;
        }
        const direction = event.deltaY > 0 ? 0.86 : 1.16;
        flight.baseSpeed = Math.min(flight.maxSpeed, Math.max(flight.minSpeed, flight.baseSpeed * direction));
    }, { passive: false });

    canvas.addEventListener('pointerdown', (event) => {
        if (flight.holdView || !flight.examine || flight.warping || event.button !== 0) {
            return;
        }
        if (event.target.closest && event.target.closest('button, a, input, select, label')) {
            return;
        }
        flight.examine.dragging = true;
        flight.examine.dragMoved = false;
        flight.examine.lastX = event.clientX;
        flight.examine.lastY = event.clientY;
    });

    window.addEventListener('pointermove', (event) => {
        const examine = flight.examine;
        if (flight.holdView) {
            if (examine) {
                examine.dragging = false;
            }
            return;
        }
        if (!examine || !examine.dragging) {
            return;
        }
        const dx = event.clientX - examine.lastX;
        const dy = event.clientY - examine.lastY;
        examine.lastX = event.clientX;
        examine.lastY = event.clientY;
        if (Math.abs(dx) + Math.abs(dy) > 2) {
            examine.dragMoved = true;
        }
        examine.alpha -= dx * 0.005;
        examine.beta = Math.max(-1.15, Math.min(1.15, examine.beta - dy * 0.005));
    });

    window.addEventListener('pointerup', () => {
        if (flight.examine) {
            flight.examine.dragging = false;
        }
    });

    scene.onBeforeRenderObservable.add(() => {
        const dt = scene.getEngine().getDeltaTime() / 1000;
        let speed = flight.baseSpeed * (flight.boost ? 5 : 1);
        if (typeof flight.getSlowdownDistance === 'function') {
            const near = flight.getSlowdownDistance();
            if (near < 28) {
                speed *= Math.max(0.12, near / 28);
            }
        }
        flight.effectiveSpeed = speed;
        camera.speed = flight.holdView || flight.examine ? 0 : speed;
        if (flight.holdView) {
            return;
        }
        const vertical = new BABYLON.Vector3(0, 1, 0).scale(speed * 55 * dt);
        if (!flight.examine) {
            if (flight.up) camera.position.addInPlace(vertical);
            if (flight.down) camera.position.subtractInPlace(vertical);
        }
    });

    return flight;
};

export const turnToward = (scene, flight, mesh) => {
    if (!mesh) {
        return;
    }
    endExamine(flight);
    const camera = flight.camera;
    const startYaw = camera.rotation.y;
    const startPitch = camera.rotation.x;
    camera.rotationQuaternion = null;
    const lookDir = focusPoint(mesh).subtract(camera.position);
    const lookLen = Math.max(0.001, lookDir.length());
    const endYaw = Math.atan2(lookDir.x, lookDir.z);
    const endPitch = -Math.asin(Math.max(-1, Math.min(1, lookDir.y / lookLen)));
    const frames = 24;
    let frame = 0;
    const observer = scene.onBeforeRenderObservable.add(() => {
        frame++;
        const t = Math.min(1, frame / frames);
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        camera.rotationQuaternion = null;
        camera.rotation.y = startYaw + angleDelta(startYaw, endYaw) * ease;
        camera.rotation.x = startPitch + (endPitch - startPitch) * ease;
        if (t >= 1) {
            scene.onBeforeRenderObservable.remove(observer);
            lookAtTarget(camera, focusPoint(mesh));
        }
    });
};

const restoreMouse = (flight) => {
    const camera = flight.camera;
    const inputs = camera.inputs;
    if (inputs && !inputs.attached.mouse) {
        if (inputs._mouseInput) {
            inputs.add(inputs._mouseInput);
        } else if (inputs.addMouse) {
            inputs.addMouse();
        }
    }
    flight.mouseRemoved = false;
};

export const endExamine = (flight) => {
    if (!flight) {
        return;
    }
    flight.examine = null;
    restoreMouse(flight);
    document.body.classList.remove('examining');
};

export const beginExamine = (flight, mesh) => {
    if (!flight) {
        return;
    }
    if (!canExamine(mesh)) {
        endExamine(flight);
        return;
    }
    const camera = flight.camera;
    const target = focusPoint(mesh);
    const offset = camera.position.subtract(target);
    const radius = Math.max(offset.length(), framingDistance(mesh) * 0.8);
    const safe = Math.max(radius, 0.001);
    flight.examine = {
        mesh,
        radius,
        alpha: Math.atan2(offset.x, offset.z),
        beta: Math.asin(Math.max(-1, Math.min(1, offset.y / safe))),
        dragging: false,
        dragMoved: false
    };
    if (camera.inputs && camera.inputs.attached.mouse) {
        camera.inputs.remove(camera.inputs.attached.mouse);
        flight.mouseRemoved = true;
    }
    if (document.pointerLockElement) {
        document.exitPointerLock();
    }
    document.body.classList.add('examining');
};

const angleDelta = (from, to) => {
    let delta = to - from;
    while (delta > Math.PI) {
        delta -= Math.PI * 2;
    }
    while (delta < -Math.PI) {
        delta += Math.PI * 2;
    }
    return delta;
};

const holdSunlitView = (examine, mesh, target) => {
    const desired = viewingPositionFor(mesh);
    const offset = desired.subtract(target);
    const span = Math.max(offset.length(), 0.001);
    const sunAlpha = Math.atan2(offset.x, offset.z);
    const sunBeta = Math.asin(Math.max(-1, Math.min(1, offset.y / span)));
    if (examine.azimuthOffset == null) {
        examine.azimuthOffset = angleDelta(sunAlpha, examine.alpha);
        examine.elevationOffset = examine.beta - sunBeta;
    }
    if (examine.dragging) {
        examine.azimuthOffset = angleDelta(sunAlpha, examine.alpha);
        examine.elevationOffset = examine.beta - sunBeta;
        return;
    }
    examine.alpha = sunAlpha + examine.azimuthOffset;
    examine.beta = Math.max(-1.15, Math.min(1.15, sunBeta + examine.elevationOffset));
};

export const updateExamineCamera = (flight) => {
    const examine = flight && flight.examine;
    if (!examine || flight.warping || flight.holdView) {
        return;
    }
    const mesh = examine.mesh;
    if (!mesh || (mesh.isDisposed && mesh.isDisposed())) {
        endExamine(flight);
        return;
    }
    const target = focusPoint(mesh);
    const touring = document.body.classList.contains('mode-tour');
    if (touring && mesh.celestialKind === 'planet') {
        holdSunlitView(examine, mesh, target);
    }
    const cosBeta = Math.cos(examine.beta);
    flight.camera.position.set(
        target.x + examine.radius * cosBeta * Math.sin(examine.alpha),
        target.y + examine.radius * Math.sin(examine.beta),
        target.z + examine.radius * cosBeta * Math.cos(examine.alpha)
    );
    lookAtTarget(flight.camera, target);
    nudgeBlackHoleGaze(flight.camera, mesh, target, examine.radius);
    const dt = flight.camera.getScene().getEngine().getDeltaTime() / 1000;
    if (mesh.spinNode) {
        mesh.spinNode.rotation.y += dt * (touring ? 0.08 : 0.28);
    } else if (mesh.material && mesh.material.diffuseTexture && mesh.celestialKind !== 'star') {
        const spinsOnItsAxis = mesh.rotationIncrement && String(mesh.infoId) !== '6';
        if (!spinsOnItsAxis) {
            const texture = mesh.material.diffuseTexture;
            texture.uOffset = (texture.uOffset + dt * (touring ? 0.012 : 0.04)) % 1;
        }
    }
};

export const lookAtTarget = (camera, target) => {
    setCameraDirection(camera, target.subtract(camera.position));
};

const setCameraDirection = (camera, direction) => {
    const length = direction.length();
    if (length < 0.0001) {
        return;
    }
    camera.rotationQuaternion = null;
    camera.rotation.y = Math.atan2(direction.x, direction.z);
    camera.rotation.x = -Math.asin(Math.max(-1, Math.min(1, direction.y / length)));
    camera.rotation.z = 0;
};

function nudgeBlackHoleGaze(camera, mesh, target, radius) {
    if (!mesh || mesh.celestialKind !== 'blackhole' || !(radius > 0)) {
        return;
    }
    const right = camera.getDirection(new BABYLON.Vector3(1, 0, 0));
    const up = camera.getDirection(new BABYLON.Vector3(0, 1, 0));
    lookAtTarget(camera, target
        .add(right.scale(-radius * 0.12))
        .add(up.scale(-radius * 0.18)));
}

const PHOTO_KINDS = new Set(['nebula', 'galaxy', 'cluster']);

export const canExamine = (mesh) => {
    if (!mesh) {
        return false;
    }
    const kind = mesh.celestialKind;
    if (!kind || PHOTO_KINDS.has(kind) || kind === 'belt' || kind === 'cloud') {
        return false;
    }
    return kind === 'planet' || kind === 'star' || kind === 'blackhole' || kind === 'probe';
};

const worldRadius = (mesh) => {
    if (mesh.examineRadius) {
        return mesh.examineRadius;
    }
    try {
        mesh.computeWorldMatrix(true);
        const radius = mesh.getBoundingInfo().boundingSphere.radiusWorld;
        if (radius > 0.05) {
            return radius;
        }
    } catch (error) {
        // Fall through to a safe standoff.
    }
    return Math.max(mesh.radius || 1, 0.4);
};

const framed = (radius, halfAngle) => Math.max(radius, 0.08) / Math.tan(halfAngle);

export const framingDistance = (mesh) => {
    if (!canExamine(mesh)) {
        return mesh.cameraDistance || 40;
    }
    const radius = worldRadius(mesh);
    if (mesh.celestialKind === 'blackhole') {
        return mesh.cameraDistance || framed(radius, 0.2);
    }
    if (mesh.celestialKind === 'probe') {
        return framed(radius, 0.32);
    }
    const id = String(mesh.infoId);
    if (id === '6') {
        return framed(2.4, 0.27);
    }
    const portrait = {
        '0': 0.28,
        '1': 0.30,
        '2': 0.30,
        '3': 0.28,
        '4': 0.30,
        '5': 0.27,
        '7': 0.26,
        '8': 0.26,
        '9': 0.26,
        pluto: 0.31,
        'proxima-b': 0.29
    };
    if (portrait[id]) {
        return framed(radius, portrait[id]);
    }
    if (mesh.celestialKind === 'star') {
        return framed(radius * 1.55, 0.26);
    }
    if (mesh.distanceLabel) {
        return framed(radius, 0.26);
    }
    return framed(radius, 0.29);
};

export const focusPoint = (mesh) => {
    const origin = mesh.getAbsolutePosition();
    try {
        mesh.computeWorldMatrix(true);
        const center = mesh.getBoundingInfo().boundingSphere.centerWorld;
        if (center && BABYLON.Vector3.Distance(center, origin) > 0.15) {
            return center.clone();
        }
    } catch (error) {
        // Use the mesh origin when bounds are unavailable.
    }
    return origin.clone();
};

export const viewingPositionFor = (mesh) => {
    const distance = framingDistance(mesh);
    const target = focusPoint(mesh);
    if (mesh.celestialKind === 'blackhole' && mesh.diskNormal && mesh.diskTangent) {
        const elevation = 0.58;
        const offset = mesh.diskTangent.scale(Math.cos(elevation)).add(mesh.diskNormal.scale(Math.sin(elevation)));
        return target.add(offset.normalize().scale(distance));
    }
    const origin = mesh.getAbsolutePosition();
    const sunward = mesh.parentStar
        ? mesh.parentStar.getAbsolutePosition().subtract(target)
        : target.scale(-1);
    const towardSun = sunward.length() > 0.5
        ? sunward.normalize()
        : new BABYLON.Vector3(0.2, 0.35, -1).normalize();
    const awayFromHost = target.subtract(origin);
    if (awayFromHost.length() > 0.2) {
        const outward = awayFromHost.normalize();
        const side = BABYLON.Vector3.Cross(outward, BABYLON.Axis.Y);
        if (side.lengthSquared() < 0.0001) {
            side.copyFromFloats(1, 0, 0);
        }
        side.normalize();
        const offset = outward.scale(0.95)
            .add(towardSun.scale(0.42))
            .add(side.scale(0.28))
            .add(new BABYLON.Vector3(0, 0.32, 0))
            .normalize();
        return target.add(offset.scale(distance));
    }
    const side = BABYLON.Vector3.Cross(towardSun, BABYLON.Axis.Y);
    if (side.lengthSquared() < 0.0001) {
        side.copyFromFloats(1, 0, 0);
    }
    side.normalize();
    if (String(mesh.infoId) === '6') {
        const tilt = mesh.rotation.z || (26.7 * Math.PI / 180);
        const ringUp = new BABYLON.Vector3(-Math.sin(tilt), Math.cos(tilt), 0).normalize();
        const glance = BABYLON.Vector3.Cross(ringUp, towardSun);
        if (glance.lengthSquared() < 0.0001) {
            glance.copyFromFloats(1, 0, 0);
        }
        glance.normalize();
        const along = BABYLON.Vector3.Cross(glance, ringUp).normalize();
        const opened = along.scale(0.78)
            .add(glance.scale(0.46))
            .add(ringUp.scale(0.34))
            .add(towardSun.scale(0.18))
            .normalize();
        return target.add(opened.scale(distance));
    }
    if (mesh.celestialKind === 'probe') {
        mesh.computeWorldMatrix(true);
        const dishAxis = mesh.getDirection(BABYLON.Axis.Y).normalize();
        const boomAxis = mesh.getDirection(BABYLON.Axis.X).normalize();
        const scienceAxis = mesh.getDirection(BABYLON.Axis.Z).normalize();
        const opened = scienceAxis.scale(0.82)
            .add(dishAxis.scale(0.48))
            .add(boomAxis.scale(0.18))
            .normalize();
        return target.add(opened.scale(distance));
    }
    const sideWeight = 0.78;
    const towardWeight = 0.58;
    const lifted = towardSun.scale(towardWeight)
        .add(side.scale(sideWeight))
        .add(new BABYLON.Vector3(0, 0.36, 0))
        .normalize();
    return target.add(lifted.scale(distance));
};

export const warpToMesh = (scene, flight, mesh, onDone) => {
    if (!mesh) {
        return;
    }

    const camera = flight.camera;
    const canvas = scene.getEngine().getRenderingCanvas();
    const startPos = camera.position.clone();
    const initialEnd = viewingPositionFor(mesh);
    const travel = initialEnd.subtract(startPos);
    const distance = Math.max(travel.length(), 0.001);

    const warpId = (flight.warpId || 0) + 1;
    flight.warpId = warpId;

    if (flight.warpObserver) {
        scene.onBeforeRenderObservable.remove(flight.warpObserver);
        flight.warpObserver = null;
    }

    flight.warping = true;
    try {
        camera.detachControl(canvas);
    } catch (error) {
        camera.detachControl();
    }

    const overlay = document.getElementById('warp-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        void overlay.offsetWidth;
        overlay.classList.add('active');
    }

    const finish = () => {
        if (flight.warpId !== warpId || flight.warpSettled === warpId) {
            return;
        }
        flight.warpSettled = warpId;
        if (flight.warpObserver) {
            scene.onBeforeRenderObservable.remove(flight.warpObserver);
            flight.warpObserver = null;
        }
        const arrived = viewingPositionFor(mesh);
        const arrivedAt = focusPoint(mesh);
        camera.position.copyFrom(arrived);
        lookAtTarget(camera, arrivedAt);
        nudgeBlackHoleGaze(camera, mesh, arrivedAt, arrived.subtract(arrivedAt).length());
        flight.warping = false;
        try {
            camera.attachControl(canvas, true);
        } catch (error) {
            camera.attachControl(canvas, true);
        }
        beginExamine(flight, mesh);
        if (!flight.examine) {
            restoreMouse(flight);
        }
        if (onDone) onDone();
    };

    const seconds = warpSeconds(distance);
    const blocked = blockingBody(scene, startPos, initialEnd);
    const upAxis = new BABYLON.Vector3(0, 1, 0);
    if (travel.lengthSquared() > 1e-8 && Math.abs(travel.y / distance) > 0.92) {
        upAxis.copyFromFloats(1, 0, 0);
    }
    let controlLift = 0;
    if (blocked) {
        const cap = distance < 10 ? 2.4 : 10;
        const bulge = Math.min(cap, Math.max(blocked.radius * 1.2, distance < 10 ? 0.9 : 1.6));
        controlLift = Math.min(18, bulge * 2);
    }
    const startForward = forwardFromCamera(camera);
    let gaze = startForward.clone();
    let prevEase = 0;
    let elapsed = 0;
    flight.warpObserver = scene.onBeforeRenderObservable.add(() => {
        if (flight.warpId !== warpId || flight.warpSettled === warpId) {
            return;
        }
        const dt = scene.getEngine().getDeltaTime() / 1000;
        elapsed += Math.min(0.08, Math.max(0, dt));
        const t = Math.min(1, elapsed / seconds);
        const ease = smootherstep(t);
        const liveEnd = viewingPositionFor(mesh);
        const liveTarget = focusPoint(mesh);
        const pos = controlLift > 0
            ? arcPoint(startPos, liveEnd, upAxis, controlLift, ease)
            : BABYLON.Vector3.Lerp(startPos, liveEnd, ease);
        camera.position.copyFrom(pos);

        const portrait = unitDirection(liveTarget.subtract(liveEnd)) || gaze;
        const step = ease >= 1 ? 1 : Math.min(1, (ease - prevEase) / Math.max(1e-4, 1 - prevEase));
        gaze = slerpDirection(gaze, portrait, step) || gaze;
        prevEase = ease;
        setCameraDirection(camera, gaze);
        nudgeBlackHoleGaze(camera, mesh, liveTarget, liveEnd.subtract(liveTarget).length());
        if (t >= 1) {
            finish();
        }
    });

    window.setTimeout(() => {
        if (flight.warping && flight.warpId === warpId) {
            finish();
        }
    }, seconds * 1000 + 1200);
};

const warpSeconds = (distance) => {
    const seconds = 1.05 + Math.pow(Math.max(distance, 0), 0.56) * 0.21;
    return Math.min(9.5, Math.max(1.2, seconds));
};

const smootherstep = (t) => t * t * t * (t * (t * 6 - 15) + 10);

const unitDirection = (vector) => {
    if (!vector) {
        return null;
    }
    const length = vector.length();
    if (length < 0.0001) {
        return null;
    }
    return vector.scale(1 / length);
};

const forwardFromCamera = (camera) => {
    if (camera.rotationQuaternion) {
        const fromQuat = unitDirection(camera.getDirection(BABYLON.Vector3.Forward()));
        if (fromQuat) {
            return fromQuat;
        }
    }
    const yaw = camera.rotation.y;
    const pitch = camera.rotation.x;
    const cp = Math.cos(pitch);
    return new BABYLON.Vector3(Math.sin(yaw) * cp, -Math.sin(pitch), Math.cos(yaw) * cp);
};

const slerpDirection = (from, to, t) => {
    const start = unitDirection(from);
    const end = unitDirection(to);
    if (!start) {
        return end;
    }
    if (!end) {
        return start;
    }
    const amount = Math.max(0, Math.min(1, t));
    const dot = Math.max(-1, Math.min(1, BABYLON.Vector3.Dot(start, end)));
    if (dot > 0.9995) {
        const mixed = BABYLON.Vector3.Lerp(start, end, amount);
        return unitDirection(mixed) || end;
    }
    if (dot < -0.9995) {
        let axis = BABYLON.Vector3.Cross(start, BABYLON.Axis.Y);
        if (axis.lengthSquared() < 1e-8) {
            axis = new BABYLON.Vector3(1, 0, 0);
        } else {
            axis.normalize();
        }
        const angle = Math.PI * amount;
        const cosine = Math.cos(angle);
        const sine = Math.sin(angle);
        const swung = start.scale(cosine)
            .add(BABYLON.Vector3.Cross(axis, start).scale(sine))
            .add(axis.scale(BABYLON.Vector3.Dot(axis, start) * (1 - cosine)));
        return unitDirection(swung) || end;
    }
    const theta = Math.acos(dot);
    const sine = Math.sin(theta);
    const mixed = start.scale(Math.sin((1 - amount) * theta) / sine)
        .add(end.scale(Math.sin(amount * theta) / sine));
    return unitDirection(mixed) || end;
};

const arcPoint = (start, end, up, controlLift, t) => {
    const mid = start.add(end).scale(0.5).add(up.scale(controlLift));
    const a = BABYLON.Vector3.Lerp(start, mid, t);
    const b = BABYLON.Vector3.Lerp(mid, end, t);
    return BABYLON.Vector3.Lerp(a, b, t);
};

const segmentHits = (start, end, center, radius) => {
    const span = end.subtract(start);
    const len2 = span.lengthSquared();
    if (len2 < 1e-8) {
        return BABYLON.Vector3.DistanceSquared(start, center) <= radius * radius;
    }
    const t = BABYLON.Vector3.Dot(center.subtract(start), span) / len2;
    if (t < 0.06 || t > 1) {
        return false;
    }
    const closest = start.add(span.scale(t));
    return BABYLON.Vector3.DistanceSquared(closest, center) <= radius * radius;
};

const blockingBody = (scene, start, end) => {
    let worst = null;
    const meshes = scene.meshes;
    for (let i = 0; i < meshes.length; i++) {
        const mesh = meshes[i];
        if (!mesh || !mesh.isCelestial) {
            continue;
        }
        const kind = mesh.celestialKind;
        if (kind !== 'planet' && kind !== 'star') {
            continue;
        }
        let radius = 0;
        try {
            mesh.computeWorldMatrix(true);
            radius = mesh.getBoundingInfo().boundingSphere.radiusWorld;
        } catch (error) {
            radius = 0;
        }
        if (!(radius > 0.12)) {
            continue;
        }
        const center = focusPoint(mesh);
        const pad = radius * 1.15 + 0.25;
        if (segmentHits(start, end, center, pad) && (!worst || pad > worst.radius)) {
            worst = { radius: pad, center };
        }
    }
    return worst;
};

export const goHome = (scene, flight, sunMesh) => {
    if (flight.warping) {
        return;
    }
    endExamine(flight);
    flight.camera.position.copyFrom(HOME_POSITION);
    if (sunMesh) {
        lookAtTarget(flight.camera, sunMesh.getAbsolutePosition());
    } else {
        flight.camera.rotation.x = 0.25;
        flight.camera.rotation.y = 0;
    }
};

export const findNearestCelestial = (position, pickables) => {
    let nearest = null;
    let best = Infinity;
    pickables.forEach((mesh) => {
        if (!mesh || !mesh.position) {
            return;
        }
        const distance = BABYLON.Vector3.Distance(position, mesh.getAbsolutePosition());
        if (distance < best) {
            best = distance;
            nearest = mesh;
        }
    });
    return { mesh: nearest, distance: best };
};

export { HOME_POSITION };
