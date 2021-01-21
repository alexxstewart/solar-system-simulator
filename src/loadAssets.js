export const loadTextures = (scene) => {

    const textures = []
    var assetsManager = new BABYLON.AssetsManager(scene);

    var t1 = assetsManager.addTextureTask("image task", "/style/textures/sun.jpg");
    t1.onSuccess = function(task) {
        textures[0] = task.texture;
    }
    var t2 = assetsManager.addTextureTask("image task", "/style/textures/mercury.jpg");
    t2.onSuccess = function(task) {
        textures[1] = task.texture;
    }
    var t3 = assetsManager.addTextureTask("image task", "/style/textures/venus.jpg");
    t3.onSuccess = function(task) {
        textures[2] = task.texture;
    }
    var t4 = assetsManager.addTextureTask("image task", "/style/textures/earth.jpg");
    t4.onSuccess = function(task) {
        textures[3] = task.texture;
    }
    assetsManager.load();
    assetsManager.onFinish = function(tasks) {
        console.log("finished all tasks")
        console.log(tasks);
        console.log(textures);
    };
}