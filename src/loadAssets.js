export const loadTextures = (scene, deleteLoadingScreen) => {

    const textures = []
    var assetsManager = new BABYLON.AssetsManager(scene);
    assetsManager.useDefaultLoadingScreen = false;

    assetsManager.addTextureTask("image task", "style/textures/sun.jpg");
    assetsManager.addTextureTask("image task", "style/textures/mercury.jpg");
    assetsManager.addTextureTask("image task", "style/textures/venus.jpg");
    assetsManager.addTextureTask("image task", "style/textures/earth.jpg");
    assetsManager.addTextureTask("image task", "style/textures/mars.jpg");
    assetsManager.addTextureTask("image task", "style/textures/jupiter.jpg");
    assetsManager.addTextureTask("image task", "style/textures/saturn.jpg");
    assetsManager.addTextureTask("image task", "style/textures/uranus.jpg");
    assetsManager.addTextureTask("image task", "style/textures/neptune.jpg");
    assetsManager.addTextureTask("image task", "style/textures/earthMoon.jpg");
    assetsManager.addTextureTask("image task", "style/textures/starpic4/star.jpg");
    assetsManager.addTextureTask("image task", "style/textures/galaxy/milkyway.jpg");
    assetsManager.addTextureTask("image task", "style/textures/galaxy/pluto.jpg");
    assetsManager.addTextureTask("image task", "style/textures/galaxy/orion.jpg");
    assetsManager.addTextureTask("image task", "style/textures/galaxy/crab.jpg");
    assetsManager.addTextureTask("image task", "style/textures/galaxy/pillars.jpg");
    assetsManager.addTextureTask("image task", "style/textures/galaxy/helix.jpg");
    assetsManager.addTextureTask("image task", "style/textures/galaxy/andromeda.jpg");
    assetsManager.addTextureTask("image task", "style/textures/galaxy/horsehead.jpg");
    assetsManager.addTextureTask("image task", "style/textures/galaxy/carina.jpg");
    assetsManager.addTextureTask("image task", "style/textures/galaxy/pleiades.jpg");
    assetsManager.addTextureTask("image task", "style/textures/stars.png");

    let dismissed = false;
    const finish = () => {
        if (dismissed) return;
        dismissed = true;
        deleteLoadingScreen();
    };
    assetsManager.onFinish = finish;
    assetsManager.onTaskError = function(task) {
        console.error('Failed to load asset:', task.url);
    };
    window.setTimeout(finish, 20000);
    assetsManager.load();
}