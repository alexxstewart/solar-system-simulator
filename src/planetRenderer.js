export const renderPlanets = (planets) => {
    // loop over the planets in the array
    for(let i in planets){
        const p = planets[i];
        p.position = new BABYLON.Vector3(p.orbit * Math.sin(p.alpha), 0, p.orbit * Math.cos(p.alpha));
        p.alpha += p.alphaIncrement;
        p.rotation.y += p.rotationIncrement;
        if(i == 9){
            // printing the moon
            p.position = planets[3].position;
            //console.log(planets[3].position);
            //console.log(p.orbit);
        }else if(i == 6){ 
            p.rotation.y = 0;
        }
    }
} 