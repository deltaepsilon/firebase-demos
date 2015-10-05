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

    var firebaseRoot = "https://demos-firebase.firebaseio.com/twitterClone/",
        usersRef = new Firebase(firebaseRoot + 'users'),
        userObjectsRef = new Firebase(firebaseRoot + 'userObjects');

    usersRef.once('value', function(snap) {
        setUsers(snap.val());
    });

    var timelineRef,
        timelineHandler,
        userRef,
        userHandler,
        tweetsRef,
        tweetAddedHandler,
        tweetRemovedHandler,
        tweetBoxClickHandler,
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
            
            timelineRef = userObjectsRef.child('timeline').child(userKey);
            timelineHandler = timelineRef.on('value', function(snap) {
                setTimeline(flatten(snap.val()).reverse(), userKey);
            });

            userObjectsRef.child('following').child(userKey).once('value', function(snap) {
                setFollowing(snap.val());
            });

            userRef = usersRef.child(userKey);

            userHandler = userRef.on('value', function(snap) {
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
                 * Create new tweet
                 * - If the tweet is successfully pushed, create a ref to /twitterClone/users/###userKey###/tweetCount and use .transaction() to increment the tweetCount value
                 */
                userObjectsRef.child('tweets').child(userKey).push(tweet, function(err) {
                    if (err) {
                        console.warn('error!', err);
                    } else {
                        usersRef.child(userKey).child('tweetCount').transaction(function(i) {
                            return (i || 0) + 1;
                        });
                    }
                });
            };

            userTweetBox.on('click', 'button', tweetBoxClickHandler);

            tweetsRef = userObjectsRef.child('tweets').child(userKey);

            tweetAddedHandler = tweetsRef.on('child_added', function(snap) {
                console.log('child_added fired with ', userKey);
                var tweet = snap.val(),
                    tweetRef = snap.ref();

                if (!tweet.fannedOut) {
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
                                        tweetRef.child('fannedOut').set(true);
                                    }
                                });
                            });
                        });

                    });

                }
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
             * Remove tweet
             * - If the remove is successful, use .transaction() to decrement /twitterClone/users/###userKey###/tweetCount
             */
            userObjectsRef.child('tweets').child(userKey).child(tweetKey).remove(function(err) {
                if (err) {
                    console.warn('Tweet deletion error', err);
                } else {
                    usersRef.child(userKey).child('tweetCount').transaction(function(i) {
                        return Math.max(0, (i || 0) - 1);
                    });
                }
            });

        });

    };

})();