import { formatRealDistance } from './distance.js';

const TUNNEL_TINT = {
    orion: [232, 150, 186],
    horsehead: [214, 86, 92],
    helix: [120, 176, 232],
    crab: [150, 214, 186],
    eagle: [110, 176, 220],
    carina: [232, 164, 110],
    rosette: [220, 112, 124],
    ring: [240, 148, 86],
    catseye: [230, 72, 96],
    lagoon: [120, 186, 210],
    butterfly: [220, 150, 190]
};

const textureUrl = (path) => String(path || '').replace(/^\//, '');

const smooth = (edge0, edge1, value) => {
    const span = edge1 - edge0;
    if (!span) {
        return 0;
    }
    const t = Math.max(0, Math.min(1, (value - edge0) / span));
    return t * t * (3 - 2 * t);
};

const paintTunnel = (ctx, width, height, time, tint) => {
    const cx = width * 0.5;
    const cy = height * 0.5;
    const maxR = Math.hypot(cx, cy);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#02040a';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 16; i += 1) {
        const z = (time * 0.42 + i / 16) % 1;
        const radius = Math.pow(z, 1.55) * maxR;
        const alpha = Math.pow(1 - z, 1.4) * 0.55;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(radius, 0.5), Math.max(radius * 0.96, 0.5), 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${tint[0]}, ${tint[1]}, ${tint[2]}, ${alpha})`;
        ctx.lineWidth = 1 + (1 - z) * 4;
        ctx.stroke();
    }

    for (let i = 0; i < 80; i += 1) {
        const seed = (i * 47.17) % 1;
        const angle = seed * Math.PI * 2 + i * 0.17;
        const speed = 0.35 + ((i * 13) % 10) / 18;
        const z = (seed * 0.7 + time * speed) % 1;
        const near = Math.pow(1 - z, 1.25);
        const start = Math.pow(z, 1.35) * maxR;
        const end = Math.pow(Math.min(0.98, z + 0.045 + near * 0.12), 1.35) * maxR;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(cx + cos * start, cy + sin * start);
        ctx.lineTo(cx + cos * end, cy + sin * end);
        const hot = i % 4 === 0;
        const color = hot ? '244, 248, 255' : `${tint[0]}, ${tint[1]}, ${tint[2]}`;
        ctx.strokeStyle = `rgba(${color}, ${0.15 + near * 0.8})`;
        ctx.lineWidth = 0.6 + near * 2.4;
        ctx.stroke();
    }

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.42);
    glow.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
    glow.addColorStop(0.18, `rgba(${tint[0]}, ${tint[1]}, ${tint[2]}, 0.45)`);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
};

export const createNebulaTheater = (scene) => {
    const images = new Map();
    let token = 0;
    let frame = 0;
    let mode = null;
    let currentMesh = null;
    let catalog = {};
    let onPick = null;
    const chrome = {};

    const root = document.createElement('div');
    root.id = 'exhibit';
    root.hidden = true;
    root.innerHTML = `
        <div id="exhibit-stage">
            <img id="exhibit-photo" alt="">
            <div id="exhibit-future" hidden>
                <div class="future-card">
                    <p class="future-kicker"></p>
                    <h3 class="future-title"></h3>
                    <p class="future-body"></p>
                </div>
            </div>
            <canvas id="exhibit-tunnel"></canvas>
        </div>
        <div id="exhibit-bar">
            <div class="exhibit-copy">
                <p class="exhibit-kicker">Observatory</p>
                <p class="exhibit-title"></p>
                <p class="exhibit-note"></p>
            </div>
            <div class="exhibit-targets"></div>
            <button type="button" id="exhibit-close">Close shutter</button>
        </div>
    `;

    const photo = root.querySelector('#exhibit-photo');
    const future = root.querySelector('#exhibit-future');
    const tunnel = root.querySelector('#exhibit-tunnel');
    const ctx = tunnel.getContext('2d');
    const kicker = root.querySelector('.exhibit-kicker');
    const title = root.querySelector('.exhibit-title');
    const note = root.querySelector('.exhibit-note');
    const list = root.querySelector('.exhibit-targets');

    const slideId = (item) => String((item && (item.id || item.infoId)) || '');
    const slideImage = (item) => textureUrl(item && (item.image || item.posterTexture));

    const stop = () => {
        if (frame) {
            cancelAnimationFrame(frame);
            frame = 0;
        }
    };

    const resize = () => {
        const stage = root.querySelector('#exhibit-stage');
        const rect = stage.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(1, Math.round(rect.width * ratio));
        const height = Math.max(1, Math.round(rect.height * ratio));
        if (tunnel.width !== width || tunnel.height !== height) {
            tunnel.width = width;
            tunnel.height = height;
        }
        return { width, height };
    };

    const tintFor = (item) => (item && item.tint) || TUNNEL_TINT[item && (item.id || item.infoId)] || [170, 200, 255];

    const applyCopy = (item) => {
        const record = catalog[item && item.infoId] || {};
        const name = item.title || record.title || item.planetName || 'Target';
        kicker.textContent = item.kicker || 'Observatory';
        title.textContent = name;
        note.textContent = item.note || formatRealDistance(item);
        photo.alt = name;
        const ahead = root.querySelector('.future-kicker');
        const aheadTitle = root.querySelector('.future-title');
        const aheadBody = root.querySelector('.future-body');
        if (item.future) {
            ahead.textContent = item.kicker || 'Still ahead';
            aheadTitle.textContent = name;
            aheadBody.textContent = item.body || item.note || '';
        }
    };

    const applyPhoto = (item) => {
        currentMesh = item;
        const path = slideImage(item);
        const ahead = !!(item && item.future);
        future.hidden = !ahead;
        photo.hidden = ahead;
        if (ahead || !path) {
            photo.removeAttribute('src');
        } else {
            photo.src = path;
        }
        applyCopy(item);
        if (!list) {
            return;
        }
        list.querySelectorAll('button').forEach((button) => {
            button.classList.toggle('current', button.dataset.id === slideId(item));
        });
    };

    const fillTargets = (items) => {
        list.innerHTML = '';
        (items || []).forEach((item) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.id = slideId(item);
            button.textContent = item.label || item.dockLabel || item.planetName || item.title;
            button.classList.toggle('is-future', !!item.future);
            button.classList.toggle('current', currentMesh && slideId(item) === slideId(currentMesh));
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                if (onPick) {
                    onPick(item);
                }
            });
            list.appendChild(button);
        });
    };

    const run = ({ duration, mesh, revealAtEnd, onMid, onDone }) => {
        stop();
        const runId = ++token;
        const tint = tintFor(mesh);
        const started = performance.now();
        let swapped = false;
        const step = (now) => {
            if (runId !== token) {
                return;
            }
            const t = Math.min(1, (now - started) / duration);
            const { width, height } = resize();
            const clock = 0.2 + t * 2.8;
            paintTunnel(ctx, width, height, clock, tint);
            const reveal = revealAtEnd ? smooth(0.58, 1, t) : (1 - smooth(0.08, 0.42, t));
            tunnel.style.opacity = String(1 - reveal);
            if (!swapped && t >= (revealAtEnd ? 0.34 : 0.2)) {
                swapped = true;
                if (onMid) {
                    onMid();
                }
            }
            if (t < 1) {
                frame = requestAnimationFrame(step);
                return;
            }
            frame = 0;
            if (revealAtEnd) {
                tunnel.style.opacity = '0';
            }
            if (onDone && runId === token) {
                onDone();
            }
        };
        frame = requestAnimationFrame(step);
    };

    const show = (mesh, options = {}) => {
        if (!mesh) {
            return;
        }
        onPick = options.onPick || null;
        mode = 'exhibit';
        root.hidden = false;
        root.style.opacity = '1';
        root.classList.remove('is-ready');
        fillTargets(options.items || options.nebulae);
        tunnel.style.opacity = '1';
        resize();
        run({
            duration: (options.duration || 1.7) * 1000,
            mesh,
            revealAtEnd: true,
            onMid: () => applyPhoto(mesh),
            onDone: () => {
                root.classList.add('is-ready');
                applyCopy(mesh);
                if (options.onArrive) {
                    options.onArrive(mesh);
                }
            }
        });
    };

    const leave = (onDone) => {
        if (!mode) {
            if (onDone) {
                onDone();
            }
            return;
        }
        const runId = ++token;
        stop();
        mode = 'leaving';
        root.classList.remove('is-ready');
        const tint = tintFor(currentMesh);
        const started = performance.now();
        const duration = 1200;
        let covered = false;
        const step = (now) => {
            if (runId !== token) {
                return;
            }
            const t = Math.min(1, (now - started) / duration);
            const { width, height } = resize();
            paintTunnel(ctx, width, height, 0.4 + t * 2.2, tint);
            if (t < 0.55) {
                tunnel.style.opacity = String(smooth(0.05, 0.5, t));
                root.style.opacity = '1';
            } else {
                if (!covered) {
                    covered = true;
                    photo.removeAttribute('src');
                }
                tunnel.style.opacity = '1';
                root.style.opacity = String(1 - smooth(0.55, 1, t));
            }
            if (t < 1) {
                frame = requestAnimationFrame(step);
                return;
            }
            frame = 0;
            root.hidden = true;
            root.style.opacity = '1';
            tunnel.style.opacity = '0';
            mode = null;
            if (onDone && runId === token) {
                onDone();
            }
        };
        frame = requestAnimationFrame(step);
    };

    const mountChrome = (onLeave) => {
        document.getElementById('body').appendChild(root);
        root.querySelector('#exhibit-close').addEventListener('click', (event) => {
            event.stopPropagation();
            onLeave();
        });
        window.addEventListener('keydown', (event) => {
            if (mode !== 'exhibit' || !onPick || !chrome.order) {
                return;
            }
            if (event.target && ['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
                return;
            }
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
                return;
            }
            event.preventDefault();
            const index = chrome.order.findIndex((item) => currentMesh && slideId(item) === slideId(currentMesh));
            if (index < 0) {
                return;
            }
            const next = event.key === 'ArrowRight'
                ? chrome.order[(index + 1) % chrome.order.length]
                : chrome.order[(index - 1 + chrome.order.length) % chrome.order.length];
            onPick(next);
        });
        chrome.mounted = true;
    };

    return {
        show(mesh, options = {}) {
            chrome.order = options.items || options.nebulae || chrome.order || [];
            show(mesh, options);
        },
        leave,
        mountChrome,
        preload(meshes) {
            (meshes || []).forEach((mesh) => {
                const path = textureUrl(mesh && (mesh.image || mesh.posterTexture));
                if (!path || images.has(path)) {
                    return;
                }
                const image = new Image();
                image.src = path;
                images.set(path, image);
            });
        },
        isOpen: () => mode === 'exhibit',
        mode: () => mode,
        current: () => currentMesh,
        setCatalog(info) {
            catalog = info || {};
        },
        setSky() {}
    };
};
