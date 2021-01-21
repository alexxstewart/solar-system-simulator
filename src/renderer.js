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

/*
This function moves the camera along with the planet when the planet is in focus.
*/
export const renderCamera = (planets, id, camera) => {

    // get the planet from the array
    const p = planets[id];
    let alphaChange = 0;
    let distanceChange = p.cameraDistance;

    if(id == 9){
        // if the moon is the current planet then you can set the target 
        const earthPos = planets[3].position;
        p.cameraDistance = parseInt(p.cameraDistance);
        const cameraDistance = 2.7;
        camera.position = new BABYLON.Vector3(earthPos.x + cameraDistance * Math.sin(p.alpha), 0, earthPos.z + cameraDistance * Math.cos(p.alpha));
        camera.setTarget(planets[3]);
    }else{
        camera.setTarget(planets[0]);
        camera.position = new BABYLON.Vector3(distanceChange * Math.sin(p.alpha + alphaChange), 0, distanceChange * Math.cos(p.alpha + alphaChange));
    }
}

let rect = null,
    line = null,
    target = null;

/*
This function handles the highlight layer logic for the application. It checks if the mesh that the user is currently
mousing over is a planet and if so it adds a mesh layer to the planet. Otherwise it removes the mesh.
*/
export const highlightLayerLogic = (scene, highlightLayer, planets, advancedTexture) => {
    // this section here is determining whether a planet needs to be highlighted or not
    const pick = scene.pick(scene.pointerX, scene.pointerY);

    if(pick.pickedMesh != null) {
        if(pick.pickedMesh.name == 'sphere'){
            const currentMesh = planets[pick.pickedMesh.idNumber];
            document.getElementById("canvas").style.cursor = "pointer";
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
            // remove the meshes and set the cursor style to normal
            highlightLayer.removeAllMeshes();
            lastMeshHighlighted = null;
            removePlanetLabel(advancedTexture);
            document.getElementById("canvas").style.cursor = "auto";
        }
    }
}

// this function removes the current planet label
export const removePlanetLabel = (advancedTexture) => {
    if(rect != null){
        advancedTexture.removeControl(rect);
        advancedTexture.removeControl(line);
        advancedTexture.removeControl(target);
    }
}

// this function attaches a label above a planet
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