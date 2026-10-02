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
        const direction = event.deltaY > 0 ? 0.86 : 1.16;
        flight.baseSpeed = Math.min(flight.maxSpeed, Math.max(flight.minSpeed, flight.baseSpeed * direction));
    }, { passive: false });

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
        camera.speed = speed;
        const vertical = new BABYLON.Vector3(0, 1, 0).scale(speed * 55 * dt);
        if (flight.up) camera.position.addInPlace(vertical);
        if (flight.down) camera.position.subtractInPlace(vertical);
    });

    return flight;
};

export const turnToward = (scene, flight, mesh) => {
    if (!mesh) {
        return;
    }
    const camera = flight.camera;
    const startYaw = camera.rotation.y;
    const startPitch = camera.rotation.x;
    const lookDir = mesh.getAbsolutePosition().subtract(camera.position);
    const lookLen = Math.max(0.001, lookDir.length());
    const endYaw = Math.atan2(lookDir.x, lookDir.z);
    const endPitch = -Math.asin(Math.max(-1, Math.min(1, lookDir.y / lookLen)));
    const frames = 24;
    let frame = 0;
    const observer = scene.onBeforeRenderObservable.add(() => {
        frame++;
        const t = Math.min(1, frame / frames);
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        camera.rotation.y = startYaw + (endYaw - startYaw) * ease;
        camera.rotation.x = startPitch + (endPitch - startPitch) * ease;
        if (t >= 1) {
            scene.onBeforeRenderObservable.remove(observer);
            lookAtTarget(camera, mesh.getAbsolutePosition());
        }
    });
};

export const lookAtTarget = (camera, target) => {
    const direction = target.subtract(camera.position);
    const length = direction.length();
    if (length < 0.0001) {
        return;
    }
    camera.rotation.y = Math.atan2(direction.x, direction.z);
    camera.rotation.x = -Math.asin(Math.max(-1, Math.min(1, direction.y / length)));
    camera.rotation.z = 0;
};

export const viewingPositionFor = (mesh) => {
    const distance = mesh.cameraDistance || 20;
    const fromOrigin = mesh.getAbsolutePosition();
    let offset = fromOrigin.clone();
    if (offset.length() < 0.5) {
        offset = new BABYLON.Vector3(0.4, 0.25, -1);
    }
    offset.normalize();
    const lifted = offset.add(new BABYLON.Vector3(0, 0.28, 0)).normalize();
    return fromOrigin.add(lifted.scale(distance));
};

export const warpToMesh = (scene, flight, mesh, onDone) => {
    if (!mesh) {
        return;
    }

    const camera = flight.camera;
    const canvas = scene.getEngine().getRenderingCanvas();
    const startPos = camera.position.clone();
    const startYaw = camera.rotation.y;
    const startPitch = camera.rotation.x;
    const endPos = viewingPositionFor(mesh);
    const lookTarget = mesh.getAbsolutePosition();
    const lookDir = lookTarget.subtract(endPos);
    const lookLen = Math.max(0.001, lookDir.length());
    const endYaw = Math.atan2(lookDir.x, lookDir.z);
    const endPitch = -Math.asin(Math.max(-1, Math.min(1, lookDir.y / lookLen)));

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
        if (flight.warpId !== warpId) {
            return;
        }
        if (flight.warpObserver) {
            scene.onBeforeRenderObservable.remove(flight.warpObserver);
            flight.warpObserver = null;
        }
        camera.position.copyFrom(endPos);
        lookAtTarget(camera, lookTarget);
        flight.warping = false;
        try {
            camera.attachControl(canvas, true);
        } catch (error) {
            camera.attachControl(canvas, true);
        }
        if (onDone) onDone();
    };

    const frames = 48;
    let frame = 0;
    flight.warpObserver = scene.onBeforeRenderObservable.add(() => {
        frame++;
        const t = Math.min(1, frame / frames);
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        BABYLON.Vector3.LerpToRef(startPos, endPos, ease, camera.position);
        camera.rotation.y = startYaw + (endYaw - startYaw) * ease;
        camera.rotation.x = startPitch + (endPitch - startPitch) * ease;
        if (t >= 1) {
            finish();
        }
    });

    window.setTimeout(() => {
        if (flight.warping && flight.warpId === warpId) {
            finish();
        }
    }, 1800);
};

export const goHome = (scene, flight, sunMesh) => {
    if (flight.warping) {
        return;
    }
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
