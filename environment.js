(function() {
    var firebaseRoot = "https://demos-firebase.firebaseio.com/",
        firebaseSecret = "AAABBBCCCDDD";
    if (typeof window === 'object') {
        window.firebaseRoot = firebaseRoot;
    } else if (module && module.exports) {
        module.exports = {
            firebaseRoot: firebaseRoot,
            firebaseSecret: firebaseSecret
        };
    }
})();