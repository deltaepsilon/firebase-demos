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
     * STEP 1
     * Configure your firebase
     * - Edit the firebaseRoot variable to reference your firebase 
     */
    var firebaseRoot = "https://je-twitter-clone.firebaseio.com/twitterClone/",
        usersRef = new Firebase(firebaseRoot + 'users')
        followingRef = new Firebase(firebaseRoot + 'following')
        tweetsRef = new Firebase(firebaseRoot + 'userTweets')

    /*
     * STEP 2
     * Query user data
     * - Create a ref to /twitterClone/users and listen to the that ref's "value" event using the .once function
     * - Call the setUsers function with the resulting data
     */
    usersRef.once('value', function(snap) {
        setUsers(snap.val());
    });


    // var timelineRef,
    //     timelineHandler,
    //     userRef,
    //     userHandler,
    //     tweetsRef,
    //     tweetAddedHandler,
    
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
             * STEP 4
             * Query timeline data
             * - Create a ref to /twitterClone/userObjects/timeline/***userKey*** and set to the timelineRef variable
             * - Listen to timelineRef's "value" event using the .on function to listen to all future events and save the result of the .on function as timelineHandler
             * - The "value" event's dataSnapshot value is an object with each timeline's key as an attribute. It's much easier to work with an array of objects that have .key attributes, so pass call flatten(snap.val()) to flatten the object into an array
             * - Reverse the flattened array with .reverse() to achieve reverse chronological order
             * - Call the setTimeline function with the resulting tweets array and userKey as a second argument
             */

            // FIRST Algorithm - BAD Data Design!
            tweetsRef.child(userKey).child('tweets') 
            // hmm, we need not just this user's tweets, but we need ALL tweets from all people they're following
            // for each user in following
            //      get that users tweets
            //      add those tweets to an array
            // take the entire list of tweets, order by date
            // take the top X (25 or so)
            // display them
            // SHOOT ME NOW

            // we've already seen that grabbing just a few users is a pain. so will grabbing just a few users tweets.
            // let's redesign data so that getting a user's timeline is easy
            // we'll create a timeline node, that is broken down by user, 
            // then we can just select a single user's timeline and it will have all the data we need
            // then we can take the top X of those tweets.
            // should we put it under following? no.  the data needs to be interleaved.
            // we need a new root node.  let's do that, and we'll also group following, tweets, and timeline 
            // all under a userObjects node so that if we have other data we create later that isn't associated with a user, 
            // it won't be confusing.
            // UPDATE DEMO TO SCRIPT-3.JS


            // timelineRef = userObjectsRef.child('timeline').child(userKey);
            // timelineHandler = timelineRef.on('value', function(snap) {
            //     setTimeline(flatten(snap.val()).reverse(), userKey);
            // });

            /*
             * STEP 3 - simplify after data change
             * Query following data
             * - Create a ref to /twitterClone/userObjects/following/***userKey*** and listen to the ref's "value" event using the .once function
             * - Call the setFollows function with the resulting data
             */
            followingRef.child(userKey).once('value', function(snap) {
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