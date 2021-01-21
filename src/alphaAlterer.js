/*
This function takes in a planet object and it reduces its alpha value to sit between 0 and 2PI
*/
export const reduceAlpha = (planet) => {
    // if the alpha is greater than 2PI then subtract 2PI and recursively call the function again
    if(planet.alpha > Math.PI * 2){
        planet.alpha -= Math.PI * 2;
        reduceAlpha(planet);
    }else{
        return;
    }
}

/*
This function is to handle the scenario where the cameras alpha is not in the 0 - 2PI range.
*/
export const fixCameraAlpha = (camera) => {
    // if the camera alpha is less than 0 than we need to convert it to a number between 0 and 2PI
    if(camera.alpha < 0){
        // increase the alpha by 2PI and recursively call the function till alpha is between 0 and 2 PI
        camera.alpha += Math.PI * 2;
        fixCameraAlpha(camera);
    }
    // if the camera alpha is greater than 2PI than we need to convert it to a number between 0 and 2PI
    else if(camera.alpha > Math.PI * 2){
        camera.alpha -= Math.PI * 2;
        fixCameraAlpha(camera);
    }else{
        return;
    }
}