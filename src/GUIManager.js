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
    
    // get the planet from the array
    const planet = planetDataArray[planetId];

    // parse the facts and info into an array
    const planetFactsArray = planet.facts.split('|');
    const planetInfoArray = planet.info.split('|');

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
    leftParentDiv.appendChild(leftTitle);

    // iterate through all the items in the info array and place them into separate p elements
    planetInfoArray.forEach((item) => {
        const leftText = document.createElement('p');
        leftText.innerHTML = item;
        leftParentDiv.appendChild(leftText);
    });

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
    
    // create a title
    const rightTitle = document.createElement('h3');
    rightTitle.innerHTML = 'Facts';

    const list = document.createElement('ul');
    list.setAttribute('id', 'right-list-section');

    planetFactsArray.forEach((item) => {
        const listElement = document.createElement('li');
        listElement.innerHTML = `${item}`;
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

export const createWelcomeSection = () => {

    // get the parent div 
    const parentDiv = document.getElementById('body');

    // create a background div to block out the solar system
    const backgroundDiv = document.createElement('div');
    backgroundDiv.setAttribute('id', 'background-div');

    // create a div to store content
    const contentDiv = document.createElement('div');
    contentDiv.setAttribute('id', 'welcome-div');

    // add a title to the contentDiv
    const title = document.createElement('h1');
    title.innerHTML = 'Tour Our Solar System';
    contentDiv.appendChild(title);

    // create an exit button
    // create the exit button for the right container
    const exitButton = document.createElement('button');
    exitButton.setAttribute('class', 'close');
    exitButton.setAttribute('id', 'welcome-exit-button');

    exitButton.addEventListener('click', () => {
        parentDiv.removeChild(contentDiv);
        parentDiv.removeChild(backgroundDiv);
    });

    contentDiv.appendChild(exitButton);

    // create the info section
    const infoDiv = document.createElement('div');
    infoDiv.setAttribute('id', 'info-section-div');
    
    infoDiv.innerHTML = `<p class="info-p-text">Navigate the System with your arrow keys and mouse!</p>
                        <img src="style/textures/introduction/click&drag.png" class="intro-img">
                        <p class="info-p-text">Hover Over a Planet to see its name!</p>
                        <img src="style/textures/introduction/hover.png" class="intro-img">
                        <p class="info-p-text">Click on a planet to get more information about it!</p>
                        <img src="style/textures/introduction/infosection.png" class="intro-img">
                        <p class="info-p-text"></p>`

    // create the start button
    const startButton = document.createElement('button');
    startButton.setAttribute('id', 'welcome-start-button');
    startButton.textContent = 'Start';

    startButton.addEventListener('click', () => {
        parentDiv.removeChild(contentDiv);
        parentDiv.removeChild(backgroundDiv);
    });

    infoDiv.appendChild(startButton);

    contentDiv.appendChild(infoDiv);

    // add the content div to the parent div
    parentDiv.appendChild(contentDiv);
    parentDiv.appendChild(backgroundDiv);
}