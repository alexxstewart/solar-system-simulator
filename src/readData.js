export class readDataClass {
    
    constructor(callbackFunction, path1, path2){
        this.callbackFunction = callbackFunction;
        this.path1 = path1;
        this.path2 = path2;
        this.planetInfo = null;
        this.planetData = null;
    }

    readPlanetInfo(){
        this.readData(this.path1, this.readPlanetData.bind(this));
    }

    readPlanetData(data) {
        this.planetInfo = data;
        this.readData(this.path2, this.lastCallBackFunction.bind(this));
    }

    lastCallBackFunction(data) {
        this.planetData = data;
        this.callbackFunction(this.planetInfo, this.planetData);
    }

    readData = (path, callback) => {
        const req = new XMLHttpRequest();
        req.open("GET", path);
        req.addEventListener('load', (event) => {
            callback(JSON.parse(event.currentTarget.responseText));
        });
        req.send();
    }
}