(function() {
    // Templating functions
    var setUsers = function(users) {
            console.info('called setUsers with these users:', users);
            $('#user-select').html(_.template($('#user-select-template').html())({
                users: users
            })).find('select').on('change', handleUserChange).val(Object.keys(users)[0]).trigger('change');

        },
        setTimeline = function(timeline) {
            console.info('called setTimeline with this timeline:', timeline);
            $('#user-timeline').html(_.template($('#user-timeline-template').html())({
                timeline: timeline
            }));

        },
        setFollowing = function(following) {
            console.info('called setTimeline with this following:', following);
            $('#user-following').html(_.template($('#user-following-template').html())({
                following: following
            }));

        };

    /*
     * 1. Configure your firebase
     * - Edit the firebaseRoot variable to reference your firebase 
     */
    var firebaseRoot = "https://demos-firebase.firebaseio.com/twitterClone/",
        usersRef = new Firebase(firebaseRoot + 'users'),
        userObjectsRef = new Firebase(firebaseRoot + 'userObjects');

    /*
     * 2. Query user data
     * - Create a ref to /twitterClone/users and listen to the that ref's "value" event using the .once function
     * - Call the setUsers function with the resulting data
     */
    usersRef.once('value', function(snap) {
        setUsers(snap.val());
    });

    var handleUserChange = function(e) {
        var userKey = $(e.target).val();
        if (userKey) {

            /*
             * 3. Query timeline data
             * - Create a ref to /twitterClone/userObjects/timeline/***userKey*** and listen to the that ref's "value" event using the .once function
             * - Call the setTimeline function with the resulting data
             */
            userObjectsRef.child('timeline').child(userKey).once('value', function(snap) {
                setTimeline(snap.val());
            });

            /*
             * 4. Query following data
             * - Create a ref to /twitterClone/userObjects/following/***userKey*** and listen to the that ref's "value" event using the .once function
             * - Call the setFollows function with the resulting data
             */
            userObjectsRef.child('following').child(userKey).once('value', function(snap) {
                setFollowing(snap.val());
            });

        } else {
            setTimeline({});
            setFollowing({});
        }

    };

})();