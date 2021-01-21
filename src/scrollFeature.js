// left: 37, up: 38, right: 39, down: 40,
// spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
var keys = {37: 1, 38: 1, 39: 1, 40: 1};

const STARS_IMAGE_DIAMETER = 300;

let camera = null;

const zoomControl = (event) => {
    const cp = camera.position;
    const cameraDistance = Math.sqrt( (cp.x ** 2) + (cp.y ** 2) + (cp.z ** 2) );
    if(cameraDistance > (STARS_IMAGE_DIAMETER / 2 - 75)){
        if(event.deltaY < 0){
            addMouseWheel(camera);
            console.log('allowing scroll in');
        }else if(event.deltaY > 0){
            camera.inputs.remove(camera.inputs.attached.mousewheel);
            console.log('blocking scrolling out');
        }
    }else if(cameraDistance < 20){
        if(event.deltaY > 0){
            addMouseWheel(camera);
            console.log('allowing scrolling out');
        }else if(event.deltaY < 0){
            camera.inputs.remove(camera.inputs.attached.mousewheel);
            console.log('blocking scrolling in');
        }
    }
}

const addMouseWheel = (camera) => {
    if(camera.inputs.attached.mousewheel){
        camera.inputs.addMouseWheel();
        camera.wheelPrecision = 10;
    }
}

var supportsPassive = false;

var wheelOpt = supportsPassive ? { passive: false } : false;
var wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';

// call this to Disable
export const scrollHandleInitiator= (c) => {
    camera = c;
    window.addEventListener('DOMMouseScroll', zoomControl, false); // older FF
    window.addEventListener(wheelEvent, zoomControl, wheelOpt); // modern desktop
    window.addEventListener('touchmove', zoomControl, wheelOpt); // mobile
    window.addEventListener('keydown', zoomControl, false);
}