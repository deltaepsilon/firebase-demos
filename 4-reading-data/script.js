(function() {
    // Templating functions
    var setUsers = function(users) {
            console.info('called setUsers with these users:', users);
            $('#user-select').html(_.template($('#user-select-template').html())({
                users: users
            })).find('select').on('change', handleUserChange).val(Object.keys(users)[0]).trigger('change');

        },
        setTimeline = function(timeline, userKey) {
            console.info('called setTimeline with this timeline:', timeline);
            $('#user-timeline').html(_.template($('#user-timeline-template').html())({
                timeline: timeline,
                userKey: userKey
            }));

        },
        setFollowing = function(following) {
            console.info('called setTimeline with this following:', following);
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

    var timelineRef,
        timelineHandler,
        tweetsRef,
        tweetAddedHandler,
        tweetRemovedHandler,
        tweetBoxClickHandler,
        stopListening = function() {
            if (typeof timelineRef === 'object' && typeof timelineHandler) {
                timelineRef.off("value", timelineHandler);
            }

            if (typeof tweetsRef === 'object' && typeof tweetAddedHandler) {
                tweetsRef.off("child_added", tweetAddedHandler);
            }

            if (typeof tweetsRef === 'object' && typeof tweetRemovedHandler) {
                tweetsRef.off("child_removed", tweetRemovedHandler);
            }

        };

    var handleUserChange = function(e) {
        var userKey = $(e.target).val();

        stopListening();

        if (userKey) {
            /*
             * 3. Query timeline data
             * - Create a ref to /twitterClone/userObjects/timeline/***userKey*** and set to the timelineRef variable
             * - Listen to timelineRef's "value" event using the .on function to listen to all future events and save the result of the .on function as timelineHandler
             * - Call the setTimeline function with the data resulting from each "value" event and userKey as a second argument
             */

            timelineRef = userObjectsRef.child('timeline').child(userKey);

            timelineHandler = timelineRef.on('value', function(snap) {
                setTimeline(snap.val(), userKey);
            });

            /*
             * 4. Query following data
             * - Create a ref to /twitterClone/userObjects/following/***userKey*** and listen to the ref's "value" event using the .once function
             * - Call the setFollows function with the resulting data
             */
            userObjectsRef.child('following').child(userKey).once('value', function(snap) {
                setFollowing(snap.val());
            });

            /*
             * 5. Query user profile
             * - Create a ref to /twitterClone/users/***userKey*** and listen to the ref's "value" event using the .once function
             * - Call the setTweetBox function with the resulting data
             */
            usersRef.child(userKey).once('value', function(snap) {
                setTweetBox(snap.val());
            });



            var userTweetBox = $('#user-tweet-box');

            if (typeof tweetBoxClickHandler === 'function') {
                userTweetBox.off('click', 'button', tweetBoxClickHandler);
            }

            tweetBoxClickHandler = function(e) {
                e.preventDefault();

                var tweet = {
                    text: userTweetBox.find('textarea').val(),
                    created: (new Date()).toString()
                };

                userTweetBox.find('textarea').val('').focus();

                /*
                 * 6. Create new tweet
                 * - Create a ref to /twitterClone/userObjects/tweets/***userKey***
                 * - Push the new tweet to this ref.
                 * - Nothing will happen at this point... so go to step 7 to listen for the change.
                 */
                userObjectsRef.child('tweets').child(userKey).push(tweet);
            };

            userTweetBox.on('click', 'button', tweetBoxClickHandler);

            /*
             * 7. Fan out new tweets
             * - Create a ref to /twitterClone/userObjects/tweets/***userKey*** and assign to tweetsRef variable
             * - Listen to tweetsRef's "child_added" event using the .on function and save the result to the tweetAddedHandler variable
             * - Save snap.val() and snap.ref() to variables... preferrably "tweet" and "tweetRef"
             * - "child_added" is fired for every tweet in existence, not just new children, so check to see if the tweet's "fannedOut" attribute is true
             * - If the tweet has not been fanned out, create a reference to /twitterClone/userObjects/followers/###userKey###/list and listen to it's "value" event using .once
             * - The resulting dataSnapshot will contain a list of all users that are following the current user. Save snap.numChildren() a counter variable and use snap.forEach to loop through all followers
             * - Add a user attribute to the original tweet. The user will need to inherit the follower's email, key, name and username attributes
             * - Add a tweetKey attribute to the original tweet. This can be accessed using tweetRef.key()
             * - Create a ref to /twitterClone/userObjects/timeline/***follower.key*** and push the new tweet to it
             * - Create a callback function for the .push function and decrement the numChildren counter variable first thing
             * - If the decremented numChildren counter is zero, create a new node under the "tweetRef" and set it to true
             */
            tweetsRef = userObjectsRef.child('tweets').child(userKey);

            tweetAddedHandler = tweetsRef.on('child_added', function(snap) {
                console.log('child_added fired with ', userKey);
                var tweet = snap.val(),
                    tweetRef = snap.ref();

                if (!tweet.processed) {
                    usersRef.child(userKey).once('value', function(snap) {
                        var user = snap.val(),
                            tweetUser = {
                                email: user.email,
                                key: snap.key(),
                                name: user.name,
                                username: user.username,
                            };

                        userObjectsRef.child('followers').child(userKey).child('list').once('value', function(snap) {
                            var i = snap.numChildren();
                            snap.forEach(function(childSnap) {
                                var follower = childSnap.val();

                                tweet.tweetKey = tweetRef.key();

                                tweet.user = tweetUser;

                                userObjectsRef.child('timeline').child(follower.key).push(tweet, function(err) {
                                    i -= 1;
                                    if (!i) {
                                        tweetRef.child('processed').set(true);
                                    }
                                });
                            });
                        });

                    });

                }
            });

            /*
             * 9. Fan out tweet deletions
             * - You assigned a ref to the tweetsRef variable in step 8. Now listen to tweetsRef's "child_removed" event using the .on function and save the result to the tweetRemovedHandler variable
             */
            tweetRemovedHandler = tweetsRef.on('child_removed', function(snap) {
                var tweetKey = snap.key();

                userObjectsRef.child('followers').child(userKey).child('list').once('value', function(snap) {
                    var i = snap.numChildren();
                    snap.forEach(function(childSnap) {
                        var follower = childSnap.val();
                        console.log('remove from follower', follower);
                        userObjectsRef.child('timeline').child(follower.key).orderByChild('tweetKey').equalTo(tweetKey).on('value', function(snap) {
                            snap.forEach(function(childSnap) {
                                childSnap.ref().remove();
                            });
                        });
                    });
                });
            });



        } else {
            setTweetBox({});
            setTimeline({});
            setFollowing({});
        }

        $('#user-timeline').on('click', 'button.remove-tweet', function(e) {
            var target = $(e.target),
                userKey = target.attr('user-key'),
                tweetKey = target.attr('tweet-key');

            console.log("Deleting with this userKey and tweetKey", userKey, tweetKey);
            
            /*
             * 8. Remove tweet
             * - Create a ref to /twitterClone/userObjects/tweets/###userKey###/###tweetKey###
             * - Call .remove() on that ref
             */
            userObjectsRef.child('tweets').child(userKey).child(tweetKey).remove();

        });

    };

})();