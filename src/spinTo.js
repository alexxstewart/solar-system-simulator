
/*
This prototype function is added to the arcRotateCamera class.
When this function is called it allows the camera to rotate to a certain position over a speed and dimension.
Movement can be added to the alpha and beta dimensions
*/
export const initiateSpinToFunction = () => {
    BABYLON.ArcRotateCamera.prototype.spinTo = function (whichprop, targetval, speed, fps) {
        var ease = new BABYLON.CubicEase();
        ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
        BABYLON.Animation.CreateAndStartAnimation('at4', this, whichprop, speed, fps, this[whichprop], targetval, 0, ease);
    }
}