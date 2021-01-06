let _baseContainer = null;

// constants
const INFO_SECTION_BACKGROUND_COLOR = "#1f1f1f";
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

    const planet = planetDataArray[planetId];

    // get the parent div
    const parentDiv = document.getElementById('body');

    // create the parent divs
    const leftParentDiv = document.createElement('div');
    const rightParentDiv = document.createElement('div');

    // set the ids of the parent elements
    leftParentDiv.setAttribute('id', 'left-canvas-ui');
    rightParentDiv.setAttribute('id', 'right-canvas-ui');
    
    // create the content for the left div
    const leftTitle = document.createElement('h2');
    leftTitle.innerHTML = `${planet.title}`;

    const leftText = document.createElement('p');
    leftText.innerHTML = `${planet.info}`

    // append content to leftDiv
    leftParentDiv.appendChild(leftTitle);
    leftParentDiv.appendChild(leftText);

    // create the exit button for the right container
    const exitButton = document.createElement('button');
    exitButton.setAttribute('class', 'close');

    exitButton.addEventListener('click', () => {
        // remove the content inside of the containers
        leftParentDiv.parentNode.removeChild(leftParentDiv);
        rightParentDiv.parentNode.removeChild(rightParentDiv);

        revertCamera();
    });

    // create the content for the right content div

    // parse the facts into an array
    const planetFactsArray = planet.facts.split('|');
    
    // create a title
    const rightTitle = document.createElement('h3');
    rightTitle.innerHTML = 'Facts';

    const list = document.createElement('ul');
    list.setAttribute('id', 'right-list-section');

    planetFactsArray.forEach((item, index) => {
        const listElement = document.createElement('li');
        console.log(planetFactsArray[index]);
        listElement.innerHTML = `<b>${item}</b>`;
        listElement.setAttribute('id', 'list-text');
        list.appendChild(listElement);
    });

    // add content to the right container
    rightParentDiv.appendChild(exitButton);
    rightParentDiv.appendChild(rightTitle);
    rightParentDiv.appendChild(list);
    
    // add the left and right containers to the parent div
    parentDiv.appendChild(rightParentDiv);
    parentDiv.appendChild(leftParentDiv);
}