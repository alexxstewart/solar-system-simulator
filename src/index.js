
const startApp = () => {
    const canvas = document.getElementById('canvas');

    const engine = new BABYLON.Engine(canvas, true);

    const createScene = () => {
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3.Green();

        // create the camera
        const camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0,0,1), scene);
        camera.setTarget(BABYLON.Vector3.Zero());

        const box = BABYLON.Mesh.CreateBox('Box', 4.0, scene);
        return scene;
    }

    const scene = createScene();

    engine.runRenderLoop(() => {
        scene.render();
    });

}

window.addEventListener('DOMContentLoaded', startApp);