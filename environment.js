(function() {
    var firebaseRoot = "https://demos-firebase.firebaseio.com/";
    if (typeof window === 'object') {
        window.firebaseRoot = firebaseRoot;
    } else if (module && module.exports) {
        module.exports = {
            firebaseRoot: firebaseRoot
        };
    }
})();