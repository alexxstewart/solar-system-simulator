export const initiateSpinToFunction = () => {
    BABYLON.ArcRotateCamera.prototype.spinTo = function (whichprop, targetval, speed, fps) {
        var ease = new BABYLON.CubicEase();
        ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
        BABYLON.Animation.CreateAndStartAnimation('at4', this, whichprop, speed, fps, this[whichprop], targetval, 0, ease);
    }
}