let _baseContainer = null;

/*===============================================================
    GUI volume control slider
  ===============================================================
  */
export const changeVolumeSlider = (baseContainer, music) => {
    
    _baseContainer = baseContainer;
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

/*===============================================================
    GUI planet information tab
  ===============================================================*/
export const showPlanetInfo = (planetId, planetDataArray, revertCamera) => {
    console.log(planetId);
    console.log(planetDataArray);
    const planetData = planetDataArray[planetId];
    const container = new BABYLON.GUI.Rectangle('planetInfoContainer');
    container.width = "50%";
    container.heigth = "100%";
    container.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    container.background = "grey";
    _baseContainer.addControl(container);

    // create stack panel to store text elements
    const stackPanel = new BABYLON.GUI.StackPanel('stackPanel');  
    container.addControl(stackPanel);

    // add the title element
    const titleText = new BABYLON.GUI.TextBlock('titletext');
    titleText.text = planetData.title;
    titleText.color = "black";
    titleText.size = "30px";
    titleText.background = "white";
    titleText.width = "100px";
    titleText.height = "200px";
    titleText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    stackPanel.addControl(titleText);

    // create the exit button
    const exitButton = new BABYLON.GUI.Button.CreateImageOnlyButton('exitbutton', 'style/textures/exit.png');
    exitButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    exitButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    exitButton.height = "30px";
    exitButton.width = "30px";
    exitButton.background = "orangered";
    
    // on exit button click remove planetInfoContainer from base container
    exitButton.onPointerDownObservable.add(() => {
        _baseContainer.removeControl(container);
        revertCamera();
    });
    container.addControl(exitButton);

    // add the planet info section
    const text = new BABYLON.GUI.TextBlock();
    text.text = planetData.info;
    text.color = "black";
    text.size = "30px";
    text.width = "500px";
    text.height = "100px";
    stackPanel.addControl(text);
}