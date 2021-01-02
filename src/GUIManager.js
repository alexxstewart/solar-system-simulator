let _baseContainer = null;

// constants
const INFO_SECTION_BACKGROUND_COLOR = "#3d3d3d";
const INFO_CONTAINER_WIDTH = "30%";

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

    const titleStyle = _baseContainer.createStyle();
    titleStyle.fontSize = 40;
    titleStyle.fontFamily = "Verdana";

    const textStyle = _baseContainer.createStyle();
    textStyle.fontSize = 20;
    textStyle.fontFamily = "Verdana"

    console.log(planetDataArray);
    const planetData = planetDataArray[planetId];

    const leftContainer = new BABYLON.GUI.Rectangle('leftPlanetInfoContainer');
    leftContainer.width = INFO_CONTAINER_WIDTH;
    leftContainer.heigth = "110%";
    leftContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    leftContainer.background = INFO_SECTION_BACKGROUND_COLOR;
    _baseContainer.addControl(leftContainer);

    const rightContainer = new BABYLON.GUI.Rectangle('rightPlanetInfoContainer');
    rightContainer.width = INFO_CONTAINER_WIDTH;
    rightContainer.heigth = "100%";
    rightContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    rightContainer.background = INFO_SECTION_BACKGROUND_COLOR;
    rightContainer.border = null;
    _baseContainer.addControl(rightContainer);

    // create stack panel to store text elements
    const stackPanel = new BABYLON.GUI.StackPanel('stackPanel');  
    leftContainer.addControl(stackPanel);

    // add the title element
    const titleText = new BABYLON.GUI.TextBlock('titletext');
    titleText.text = planetData.title;
    titleText.color = "white";
    titleText.size = "100%";
    titleText.style = titleStyle;
    titleText.background = "white";
    titleText.width = "100%";
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
        _baseContainer.removeControl(leftContainer);
        _baseContainer.removeControl(rightContainer);
        revertCamera();
    });
    leftContainer.addControl(exitButton);

    // add the planet info section
    const text = new BABYLON.GUI.TextBlock();
    text.text = planetData.info;
    text.color = "white";
    //text.size = "100%";
    text.style = textStyle;
    text.width = "100%";
    text.height = "600px";
    text.background = "blue";
    stackPanel.addControl(text);
}