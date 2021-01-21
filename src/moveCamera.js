
export const moveCameraTo = (iteration, planets, id, reduceAlpha, camera, ALPHA_DIFFERENCE) => {
    
    // set the value for zooming in
    let zoomingIn = true;

    // the fps by deafult is 120 however for the sun it is 50 fps
    let fps = 120;
    if(id == 0){
        fps = 50;
    }

    if(iteration == 0){
        const p = planets[id];
        let distanceChange = 0;

        if(id == 0 || id == 5){    
            distanceChange = 3;
        }else if( id == 1 || id == 2 || id == 3 || id == 4 ){
            distanceChange = 1;
        }else if(id == 6){
            distanceChange = 5;       
        }else if(id == 7 || id == 8){
            distanceChange = 2;       
        }

        if(p.alpha > Math.PI * 2){
            reduceAlpha(p);
        }

        let planetAlphaInCameraAlpha = Math.PI * 2 - (p.alpha + (p.alphaIncrement * fps) - ALPHA_DIFFERENCE);

        if(planetAlphaInCameraAlpha > 2 * Math.PI){
            planetAlphaInCameraAlpha -= 2 * Math.PI;
        }

        if(id == 0){
            fps = 50;
            planetAlphaInCameraAlpha = p.alpha;
        }

        const speed = fps;
        let cameraOrbitDistance = p.orbit + p.radius + distanceChange;
        
        if(id == 9){
            cameraOrbitDistance = 2.7;
            camera.setTarget(p);
        }
        
        setTimeout(()=>camera.spinTo("beta", Math.PI / 2, speed, fps), 0);
        setTimeout(()=>camera.spinTo("radius", cameraOrbitDistance, speed, fps), 0);
        setTimeout(()=>camera.spinTo("alpha", planetAlphaInCameraAlpha, speed, fps), 0);
    }else if(iteration == fps){
        zoomingIn = false;
        iteration = -1;
    }
    return {iteration, zoomingIn};
}