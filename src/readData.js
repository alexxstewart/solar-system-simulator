function loadJSON(callback) {
    let planetsInfo = null;
    let planets = null;
    // read planet info data
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "./data/planetInfo.json");
    xhr.addEventListener('load', (event) => {
        planetsInfo = JSON.parse(event.currentTarget.responseText);
    });
    xhr.send();

    // read planet data
    xhr = new XMLHttpRequest();
    xhr.open("GET", "./data/planetData.json");
    xhr.addEventListener('load', (event) => {
        planets = JSON.parse(event.currentTarget.responseText);

        // after the content has loaded start the application
        console.log('loaded');
        callback({planets, planetsInfo});
    });
    xhr.send();
}

export default loadJSON;