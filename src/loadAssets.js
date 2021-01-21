export const loadTextures = (scene, deleteLoadingScreen) => {

    const textures = []
    var assetsManager = new BABYLON.AssetsManager(scene);
    assetsManager.useDefaultLoadingScreen = false;

    assetsManager.addTextureTask("image task", "/style/textures/sun.jpg");
    assetsManager.addTextureTask("image task", "/style/textures/mercury.jpg");
    assetsManager.addTextureTask("image task", "/style/textures/venus.jpg");
    assetsManager.addTextureTask("image task", "/style/textures/earth.jpg");
    assetsManager.addTextureTask("image task", "/style/textures/mars.jpg");
    assetsManager.addTextureTask("image task", "/style/textures/jupiter.jpg");
    assetsManager.addTextureTask("image task", "/style/textures/saturn.jpg");
    assetsManager.addTextureTask("image task", "/style/textures/uranus.jpg");
    assetsManager.addTextureTask("image task", "/style/textures/neptune.jpg");
    assetsManager.addTextureTask("image task", "/style/textures/earthMoon.jpg");
    assetsManager.addTextureTask("image task", "/style/textures/starpic4/star.jpg");

    assetsManager.load();
    assetsManager.onFinish = function() {
        deleteLoadingScreen();
    };
}