const changeVolumeSlider = (baseContainer, music) => {
    
    // create a rectangle element to hold the slider and the image
    const container = new BABYLON.GUI.Rectangle();
    container.width = "200px";
    container.height = "50px";
    container.background = "white";
    container.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    container.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    
    // create a slider element
    const musicSlider = new BABYLON.GUI.Slider();
    
    // set properties
    musicSlider.width = "80%";
    musicSlider.height = "40%";
    musicSlider.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    musicSlider.background = "grey";
    musicSlider.color = "red";

    musicSlider.onValueChangedObservable.add(function(value) {
        music.setVolume(value/100);
    });

    // create image element
    const speakerImage = new BABYLON.GUI.Image('image', 'style/textures/speaker.png');
    speakerImage.width = "15%";
    speakerImage.height = "60%";
    speakerImage.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    container.addControl(speakerImage);

    container.addControl(musicSlider)
    baseContainer.addControl(container); 
}

const showPlanetInfo = (planetId) => {
    const planetData = getPlanetData()[planetId];
    console.log(planetData);
}