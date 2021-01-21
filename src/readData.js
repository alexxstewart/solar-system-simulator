function loadJSON(callback) {
    let planetsInfo = null;
    let planets = null;
    // read planet info data
    const req1 = new XMLHttpRequest();
    req1.open("GET", "/data/planetInfo.json");
    console.log(req1)
    req1.addEventListener('load', (event) => {
        console.log('data loaded');
        console.log(event.currentTarget);
        planetsInfo = JSON.parse(event.currentTarget.responseText);
    });
    req1.send();

    // read planet data
    const req2 = new XMLHttpRequest();
    req2.open("GET", "/data/planetData.json");
    req2.addEventListener('load', (event) => {
        planets = JSON.parse(event.currentTarget.responseText);

        // after the content has loaded start the application
        callback({planets, planetsInfo});
    });
    req2.send();
}

export default loadJSON;