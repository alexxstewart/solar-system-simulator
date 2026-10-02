const reduceAlpha = (planet) => {
    if(planet.alpha > Math.PI * 2){
        planet.alpha -= Math.PI * 2;
        reduceAlpha(planet);
    }else{
        return;
    }
}

export const renderPlanets = (planets, paused) => {
    for(let i in planets){
        const p = planets[i];
        if(i == 10){
            p.position = planets[6].position;
            continue;
        }
        if (p.orbit == null || p.alpha == null) {
            continue;
        }
        reduceAlpha(p);
        if (!paused) {
            p.alpha += p.alphaIncrement || 0;
            if (p.rotationIncrement) {
                p.rotation.y += p.rotationIncrement;
            }
        }
        p.position = new BABYLON.Vector3(p.orbit * Math.sin(p.alpha), 0, p.orbit * Math.cos(p.alpha));
        if(i == 9){
            p.position = planets[3].position;
        }else if(i == 6){ 
            p.rotation.y = 0;
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
        console.log(distanceChange);
        // if the moon is the current planet then you can set the target 
        const earthPos = planets[3].position;
        camera.position = new BABYLON.Vector3(earthPos.x + distanceChange * Math.sin(p.alpha), 0, earthPos.z + distanceChange * Math.cos(p.alpha));
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
export const highlightLayerLogic = (scene, highlightLayer, pickables, setHover) => {
    const pick = scene.pick(scene.pointerX, scene.pointerY);

    if(pick.pickedMesh != null && pick.pickedMesh.isCelestial){
        const currentMesh = pick.pickedMesh;
        document.getElementById("canvas").style.cursor = "pointer";
        if (setHover) {
            setHover(currentMesh.planetName || currentMesh.objectName, scene.pointerX, scene.pointerY);
        }
        if(lastMeshHighlighted != currentMesh){
            highlightLayer.removeAllMeshes();
            highlightLayer.addMesh(currentMesh, new BABYLON.Color3(1, 1, 1));
            highlightLayer.innerGlow = false;
            lastMeshHighlighted = currentMesh;
        }
    }else{
        if (setHover) {
            setHover(null);
        }
        if(lastMeshHighlighted != null){
            highlightLayer.removeAllMeshes();
            lastMeshHighlighted = null;
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
    label.text = planetMesh.planetName || planetMesh.objectName || 'Object';
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