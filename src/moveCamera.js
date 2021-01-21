
/*
This function moves the camera to a planet when the user clicks on it.
It calculates the alpha the camera must travel to since the camera and planet alpha values increase in
opposite directions.
*/
export const moveCameraTo = (iteration, planets, id, reduceAlpha, camera, ALPHA_DIFFERENCE) => {
    
    // set the value for zooming in
    let zoomingIn = true;

    // the fps by deafult is 120 however for the sun it is 50 fps
    let fps = 120;
    if(id == 0){
        fps = 50;
    }

    // set the speed for the camera
    const speed = fps;

    if(iteration == 0){
        const p = planets[id];

        console.log(p);
        // check if the alpha is bigger than 2PI that means the camera will spin more than a full rotation to get to the planet
        if(p.alpha > Math.PI * 2){
            reduceAlpha(p);
        }

        // determine the alpha for the camera to match the rotation of the planets
        let planetAlphaInCameraAlpha = Math.PI * 2 - (p.alpha + (p.alphaIncrement * fps) - ALPHA_DIFFERENCE);
        
        // the alpha calculation can be ober 2PI so we reduce it
        if(planetAlphaInCameraAlpha > 2 * Math.PI){
            planetAlphaInCameraAlpha -= 2 * Math.PI;
        }
        // the camera alpha when focusing on the sun just needs to be the suns alpha
        if(id == 0){
            planetAlphaInCameraAlpha = p.alpha;
        }
        
        // if the planet is the moon then we set the target of the camera to the moon mesh
        if(id == 9){
            camera.setTarget(p);
        }
        
        // spin the camera in the 3 dimensions to the specified location.
        setTimeout(()=>camera.spinTo("beta", Math.PI / 2, speed, fps), 0);
        setTimeout(()=>camera.spinTo("radius", p.cameraDistance, speed, fps), 0);
        setTimeout(()=>camera.spinTo("alpha", planetAlphaInCameraAlpha, speed, fps), 0);
    }else if(iteration == fps){
        // if the interation and fps number is the same then we have ended the animationa and we track the planet with the camera
        zoomingIn = false;
        iteration = -1;
    }
    
    return {iteration, zoomingIn};
}