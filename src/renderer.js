const reduceAlpha = (planet) => {
    if(planet.alpha > Math.PI * 2){
        planet.alpha -= Math.PI * 2;
        reduceAlpha(planet);
    }else{
        return;
    }
}

export const renderPlanets = (planets) => {
    // loop over the planets in the array
    for(let i in planets){
        const p = planets[i];
        reduceAlpha(p);
        p.position = new BABYLON.Vector3(p.orbit * Math.sin(p.alpha), 0, p.orbit * Math.cos(p.alpha));
        p.alpha += p.alphaIncrement;
        p.rotation.y += p.rotationIncrement;
        if(i == 9){
            // print earth moon
            p.position = planets[3].position;
            //p.alpha += p.alphaIncrement;
        }else if(i == 6){ 
            // print saturn
            p.rotation.y = 0;
        }else if(i == 10){
            // print saturn rings
            p.position = planets[6].position;
        }
    }
} 

let lastMeshHighlighted = null;

let earthAlpha = Math.PI;

export const renderCamera = (planets, id, camera) => {
    const p = planets[id];
    let alphaChange = 0;
    let distanceChange = 0;
    if(id == 0){
        distanceChange = 3;
    }else if(id == 5){    
        distanceChange = 3;
    }else if( id == 1 || id == 2 || id == 3 || id == 4 ){
        distanceChange = 1;
    }else if(id == 6){
        distanceChange = 4;
    }else if(id == 7 || id == 8){
        distanceChange = 2;       
    }

    if(id == 9){
        // get the earths position
        const earthPos = planets[3].position;
        p.cameraDistance = parseInt(p.cameraDistance);
        //console.log(p.cameraDistance);
        const cameraDistance = 2.7;
        camera.position = new BABYLON.Vector3(earthPos.x + cameraDistance * Math.sin(p.alpha), 0, earthPos.z + cameraDistance * Math.cos(p.alpha));
        camera.setTarget(planets[3]);
        //console.log(p.alpha);
    }else{
        camera.setTarget(planets[0]);
        camera.position = new BABYLON.Vector3((p.orbit + p.radius + distanceChange) * Math.sin(p.alpha + alphaChange), 0, (p.orbit + p.radius +distanceChange) * Math.cos(p.alpha + alphaChange))
    }
}

let rect = null,
    line = null,
    target = null;

export const highlightLayerLogic = (scene, highlightLayer, planets, advancedTexture) => {
    // this section here is determining whether a planet needs to be highlighted or not
    const pick = scene.pick(scene.pointerX, scene.pointerY);

    if(pick.pickedMesh != null) {
        if(pick.pickedMesh.name == 'sphere'){
            const currentMesh = planets[pick.pickedMesh.idNumber];
            if(lastMeshHighlighted != currentMesh){

                // remove previous highlights and labels
                highlightLayer.removeAllMeshes();
                lastMeshHighlighted = null;
                if(rect != null){
                    advancedTexture.removeControl(rect);
                    advancedTexture.removeControl(line);
                    advancedTexture.removeControl(target);
                }

                // create new highlights and labels
                highlightLayer.addMesh(currentMesh, BABYLON.Color3.White());
                highlightLayer.innerGlow = false;
                lastMeshHighlighted = currentMesh;
                const obj = labelPlanet(currentMesh, advancedTexture);
                rect = obj.rect1, line = obj.line, target = obj.target;
            }
        }
    }else{
        if(lastMeshHighlighted != null){
            highlightLayer.removeAllMeshes();
            lastMeshHighlighted = null;
            removePlanetLabel(advancedTexture);
        }
    }
}

export const removePlanetLabel = (advancedTexture) => {
    if(rect != null){
        advancedTexture.removeControl(rect);
        advancedTexture.removeControl(line);
        advancedTexture.removeControl(target);
    }
}

const labelPlanet = (planetMesh, advancedTexture) => {
    const rect1 = new BABYLON.GUI.Rectangle();
    rect1.width = 0.1;
    rect1.height = "40px";
    rect1.cornerRadius = 20;
    rect1.color = "White";
    rect1.thickness = 4;
    rect1.background = "green";
    advancedTexture.addControl(rect1);
    rect1.linkWithMesh(planetMesh);   
    rect1.linkOffsetY = -150;

    const label = new BABYLON.GUI.TextBlock();
    label.text = planetMesh.planetName;
    rect1.addControl(label);

    const target = new BABYLON.GUI.Ellipse();
    target.width = "10px";
    target.height = "10px";
    target.color = "White";
    target.thickness = 4;
    target.background = "green";
    advancedTexture.addControl(target);
    target.linkWithMesh(planetMesh);   

    const line = new BABYLON.GUI.Line();
    line.lineWidth = 4;
    line.color = "White";
    line.y2 = 20;
    advancedTexture.addControl(line);
    line.linkWithMesh(planetMesh); 
    line.connectedControl = rect1;  

    return {rect1, target, line};
}

export const checkCameraPosition = (camera, lastCameraLocation, STARS_IMAGE_DIAMETER) => {
    const cp = camera.position;
    const cameraDistance = Math.sqrt( (cp.x ** 2) + (cp.y ** 2) + (cp.z ** 2) );

    if(cameraDistance > (STARS_IMAGE_DIAMETER / 2 - 50)){
        // we want the camera to keep the same angle that it was previously so we multiply the vector with a scalar value
        //const scalar = 0.98;
        //camera.position = new BABYLON.Vector3(lastCameraLocation.x * scalar,lastCameraLocation.y * scalar,lastCameraLocation.z * scala
    }else if(cameraDistance < 7){
        const scalar = 1.05;
        camera.position = new BABYLON.Vector3(lastCameraLocation.x * scalar,lastCameraLocation.y * scalar,lastCameraLocation.z * scalar);
    }
}