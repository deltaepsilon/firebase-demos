(function() {
    // Config
    var timelinePageCount = 3;

    // Templating functions
    var setUsers = function(users) {
            console.info('called setUsers with these users:', users);
            $('#user-select').html(_.template($('#user-select-template').html())({
                users: users
            })).find('select').on('change', handleUserChange).val(Object.keys(users)[0]).trigger('change');

        },
        setTimeline = function(timeline, userKey, buttons, callback) {
            console.info('called setTimeline with this timeline:', timeline);
            $('#user-timeline').html(_.template($('#user-timeline-template').html())({
                timeline: timeline,
                userKey: userKey,
                loadMore: buttons ? buttons.loadMore || false : false,
                orderByText: buttons ? buttons.orderByText || false : false,
                reset: buttons ? buttons.reset || false : false
            }));

            if (typeof callback === 'function') {
                callback();
            }
        },
        setFollowing = function(following) {
            console.info('called setFollowing with this following:', following);
            
            // this is required if users are a separate key
            var followedUsers = []
            for(var userKey in following) {
                followedUsers.push(users[userKey])
            }
            // what happens if we have 3 billion users?
            // so we select each one separately   
            var followedUsers = []
            for(var userId in following) {
                usersRef.child(userKey).once('value', function(snap) {
                    followedUsers.push(users[userId])    

                    // oh crap, how do we hold off until ALL users are gathered?
                    $('#user-following').html(_.template($('#user-following-template').html())({
                        following: following
                    }));
                })
            }         

            $('#user-following').html(_.template($('#user-following-template').html())({
                following: following
            }));

        },
        setTweetBox = function(user) {
            console.info('called setTweetBox with this user:', user);
            $('#user-tweet-box').html(_.template($('#user-tweet-box-template').html())({
                user: user
            })).find('textarea').on('keyup', function(e) {
                var characterCount = $(e.target).val().length,
                    tweetLength = $('#tweet-length'),
                    tweetButton = $('#tweet-button');

                tweetLength.text(140 - characterCount);

                if (characterCount <= 140) {
                    tweetLength.css('color', 'gray');

                    if (characterCount > 0) {
                        tweetButton.removeAttr('disabled');
                    }
                } else {
                    tweetLength.css('color', 'red');
                    tweetButton.attr('disabled', 'disabled');
                }
            });
        };

    /*
     * STEP 1
     * Configure your firebase
     * - Edit the firebaseRoot variable to reference your firebase 
     */
    var firebaseRoot = "https://je-twitter-clone.firebaseio.com/twitterClone/",
        usersRef = new Firebase(firebaseRoot + 'users')

    /*
     * STEP 2
     * Query user data
     * - Create a ref to /twitterClone/users and listen to the that ref's "value" event using the .once function
     * - Call the setUsers function with the resulting data
     */
    var users; // this is only added when trying to get users
    usersRef.once('value', function(snap) {
        users = snap.val(); // only added when trying to keep one single data structure
        setUsers(snap.val());
    });


    // var timelineRef,
    //     timelineHandler,
    //     userRef,
    //     userHandler,

    //     flatten = function(tweets) {
    //         var keys = Object.keys(tweets),
    //             i = keys.length,
    //             result = [],
    //             tweet;
    //         while (i--) {
    //             tweet = tweets[keys[i]];
    //             tweet.key = keys[i];
    //             result.unshift(tweet);
    //         }
    //         return result;
    //     };

    var handleUserChange = function(e) {
        var userKey = $(e.target).val();

        if (userKey) {

            /*
             * STEP 3
             * Query following data
             * - Create a ref to /twitterClone/userObjects/following/***userKey*** and listen to the ref's "value" event using the .once function
             * - Call the setFollows function with the resulting data
             *
             * DATA DESIGN PROBLEM - in order to display info about users who are being followed, we will have to write a nuts algorithm
             */
            usersRef.child(userKey).child('following').once('value', function(snap) {
                setFollowing(snap.val(), users);
            });

            /*
             * Query user profile
             * - Create a ref to /twitterClone/users/***userKey*** and listen to the ref's "value" event using the .once function
             * - Call the setTweetBox function with the resulting data
             */
            userRef = usersRef.child(userKey);

            userHandler = userRef.on('value', function(snap) {
                setTweetBox(snap.val());
            });

        } else {
            setTweetBox({});
            setTimeline({});
            setFollowing({});
        }

    };

})();