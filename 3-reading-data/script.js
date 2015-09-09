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
     * Configure your firebase
     * - Edit the firebaseRoot variable to reference your firebase 
     */
    var firebaseRoot = "https://demos-firebase.firebaseio.com/twitterClone/",
        usersRef = new Firebase(firebaseRoot + 'users'),
        userObjectsRef = new Firebase(firebaseRoot + 'userObjects');

    /*
     * Query user data
     * - Create a ref to /twitterClone/users and listen to the that ref's "value" event using the .once function
     * - Call the setUsers function with the resulting data
     */
    usersRef.once('value', function(snap) {
        setUsers(snap.val());
    });


    var timelineRef,
        timelineHandler,
        userRef,
        userHandler,
        tweetsRef,
        tweetAddedHandler,
        stopListeningToTimeline = function() {
            if (typeof timelineRef === 'object' && typeof timelineHandler) {
                timelineRef.off("value", timelineHandler);
            }
        },
        stopListening = function() {
            stopListeningToTimeline();

            if (typeof userRef === 'object' && typeof userHandler) {
                userRef.off("value", userHandler);
            }

            if (typeof tweetsRef === 'object' && typeof tweetAddedHandler) {
                tweetsRef.off("child_added", tweetAddedHandler);
            }

            if (typeof tweetsRef === 'object' && typeof tweetRemovedHandler) {
                tweetsRef.off("child_removed", tweetRemovedHandler);
            }

        },
        flatten = function(tweets) {
            var keys = Object.keys(tweets),
                i = keys.length,
                result = [],
                tweet;
            while (i--) {
                tweet = tweets[keys[i]];
                tweet.key = keys[i];
                result.unshift(tweet);
            }
            return result;
        };

    var handleUserChange = function(e) {
        var userKey = $(e.target).val();

        stopListening();

        if (userKey) {
            /*
             * Query timeline data
             * - Create a ref to /twitterClone/userObjects/timeline/***userKey*** and set to the timelineRef variable
             * - Listen to timelineRef's "value" event using the .on function to listen to all future events and save the result of the .on function as timelineHandler
             * - The "value" event's dataSnapshot value is an object with each timeline's key as an attribute. It's much easier to work with an array of objects that have .key attributes, so pass call flatten(snap.val()) to flatten the object into an array
             * - Reverse the flattened array with .reverse() to achieve reverse chronological order
             * - Call the setTimeline function with the resulting tweets array and userKey as a second argument
             */
            timelineRef = userObjectsRef.child('timeline').child(userKey);
            timelineHandler = timelineRef.on('value', function(snap) {
                setTimeline(flatten(snap.val()).reverse(), userKey);
            });

            /*
             * Query following data
             * - Create a ref to /twitterClone/userObjects/following/***userKey*** and listen to the ref's "value" event using the .once function
             * - Call the setFollows function with the resulting data
             */
            userObjectsRef.child('following').child(userKey).once('value', function(snap) {
                setFollowing(snap.val());
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