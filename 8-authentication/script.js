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
            if (user) {
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
            } else {
                var EMAIL_REGEX = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;

                $('#user-tweet-box').html(_.template($('#user-tweet-box-template').html())({
                    user: user || false
                })).find('[required]').on('keyup', function() {
                    var disabled = false;
                    $('#login-form [required]').each(function(index, el) {
                        if (!el.value.length) {
                            disabled = true;
                        }
                    });
                    $('#login-form [type="email"]').each(function(index, el) {
                        if (!EMAIL_REGEX.test($(el).val())) {
                            disabled = true;
                        }
                    });
                    if (disabled) {
                        $('.required-button').attr('disabled', 'disabled');
                    } else {
                        $('.required-button').removeAttr('disabled');
                    }
                });
            }

        },
        setUserDetails = function(userKey, user) {
            console.info('called setUserDetails with this user:', user);
            usersRef.once('value', function(snap) {
                var users = snap.val();
                delete users[userKey];

                userObjectsRef.child('following').child(userKey).once('value', function(snap) {
                    _.each(snap.val(), function(following) {
                        if (users[following.key]) {
                            users[following.key].initiallyFollowed = true;
                        }
                    });

                    $('#user-details').html(_.template($('#user-details-template').html())({
                        user: user,
                        users: users
                    })).find('form').on('submit', function(e) {
                        e.preventDefault();

                        var userDetailsForm = $(e.target),
                            clickedButton = userDetailsForm.find('button:focus'),
                            target = clickedButton.attr('target'),
                            username = userDetailsForm.find('#user-username').val(),
                            name = userDetailsForm.find('#user-name').val();

                        if (target === 'save') {
                            if (username && username.length) {
                                usersRef.child(userKey).child('username').set(username);
                            }
                            if (name && name.length) {
                                usersRef.child(userKey).child('name').set(name);
                            }
                            handleUserChange(userKey);
                        } else if (target === 'logout') {
                            logOut();
                        }
                    }).parent().find('.follow-checkbox').on('change', function(e) {
                        var target = $(e.target);
                        handleFollowChange(userKey, target.attr('user-key'), target.is(':checked'));
                    });
                });
            });
        };

    var firebaseRoot = "https://demos-firebase.firebaseio.com/twitterClone/",
        usersRef = new Firebase(firebaseRoot + 'users'),
        userObjectsRef = new Firebase(firebaseRoot + 'userObjects');

    var timelineRef,
        timelineHandler,
        userRef,
        userHandler,
        tweetsRef,
        tweetAddedHandler,
        tweetRemovedHandler,
        followingRef,
        followingHandler,
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

            if (typeof followingRef === 'object' && typeof followingHandler) {
                followingRef.off("value", followingHandler);
            }

        },
        flatten = function(tweets) {
            var keys = Object.keys(tweets || []),
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
        var userKey = e.target ? $(e.target).val() : e;

        stopListening();

        if (userKey) {
            var lastKey = false,
                page = 0,
                setQueryHandlers = function() {
                    $('#load-more').on('click', queryTimeline)
                    $('#reset').on('click', resetTimeline);
                    $('#order-by-text').on('click', orderByText);
                },
                resetTimeline = function() {
                    lastKey = false;
                    page = 0;
                    queryTimeline();
                },
                orderByText = function(text) {
                    var timeline = [];
                    stopListeningToTimeline();

                    timelineRef = userObjectsRef.child('timeline').child(userKey).orderByChild('text');
                    timelineHandler = timelineRef.on('child_added', function(snap) {
                        timeline.push(snap.val());
                        setTimeline(timeline, userKey, {
                            reset: true
                        }, setQueryHandlers);
                    });
                },
                queryTimeline = function() {
                    stopListeningToTimeline();
                    page += 1;

                    var showLimit = timelinePageCount * page,
                        queryLimit = showLimit + 1,
                        reset = false;

                    timelineRef = userObjectsRef.child('timeline').child(userKey).orderByKey().limitToLast(queryLimit);

                    timelineHandler = timelineRef.on('value', function(snap) {
                        var loadMore = false,
                            tweets = flatten(snap.val());

                        if (tweets.length >= queryLimit) {
                            loadMore = true;
                            tweets.shift();
                        }

                        if (tweets.length > timelinePageCount) {
                            reset = true;
                        }

                        setTimeline(tweets.reverse(), userKey, {
                            loadMore: loadMore,
                            reset: reset,
                            orderByText: true
                        }, setQueryHandlers);
                    });
                };



            queryTimeline();

            followingRef = userObjectsRef.child('following').child(userKey);
            followingHandler = followingRef.on('value', function(snap) {
                setFollowing(snap.val());
            });

            userRef = usersRef.child(userKey);

            userHandler = userRef.on('value', function(snap) {
                setTweetBox(snap.val());
                setUserDetails(userKey, snap.val());
                handleFollowChange(userKey, userKey, true);
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

                if (tweet.text) {
                    userTweetBox.find('textarea').val('').focus();

                    userObjectsRef.child('tweets').child(userKey).push(tweet, function(err) {
                        if (err) {
                            console.warn('error!', err);
                        } else {
                            usersRef.child(userKey).child('tweetCount').transaction(function(i) {
                                return (i || 0) + 1;
                            });
                        }
                    });
                }


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
                                tweet.userKey = tweetUser.key;
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

            tweetRemovedHandler = tweetsRef.on('child_removed', function(snap) {
                var tweetKey = snap.key();

                userObjectsRef.child('followers').child(userKey).child('list').once('value', function(snap) {
                    snap.forEach(function(childSnap) {
                        var follower = childSnap.val();
                        console.log('remove from follower', follower);
                        userObjectsRef.child('timeline').child(follower.key).orderByChild('tweetKey').equalTo(tweetKey).once('value', function(snap) {
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

    /*
     * Set up ref to firebaseRoot
     * - Save a new ref named "ref" that references firebaseRoot
     */
    var ref = new Firebase(firebaseRoot);

    $(document.body).on('submit', function(e) {
        e.preventDefault();
    });
    $(document.body).on('click', '#login-form', function(e) {
        var loginForm = $('#login-form'),
            email = loginForm.find('#login-email').val(),
            password = loginForm.find('#login-password').val(),
            clickedButton = loginForm.find('button:focus'),
            target = clickedButton.attr('target'),
            login = function() {
                /*
                 * Auth with password
                 * - Use ref.authWithPassword() to log in the user
                 */
                ref.authWithPassword({
                    email: email,
                    password: password
                }, function(err, authData) {
                    if (err) {
                        console.warn(err);
                    }
                });
            },
            register = function() {
                /*
                 * Create user
                 * - Use ref.createUser() to create a user. If user creation succeeds, call login() to manually log the user in. Login is not automatic
                 */
                ref.createUser({
                    email: email,
                    password: password
                }, function(err, userData) {
                    if (err) {
                        console.warn(err);
                    } else {
                        login();
                    }
                });
            };

        return target === 'login' ? login() : register();
    });

    var logOut = function() {
        /*
         * Log out
         * - Use ref.unauth() to log the user out.
         */
        ref.unauth();
    };

    /*
     * Listen to auth changes
     * - Use ref.onAuth() to listen to auth changes.
     * - The ref.onAuth() callback receives an object that we'll call authData. If authData is missing, call setTweetBox(), setUserDetails(), setTimeline(), setFollowing() and stopListening(), all with no arguments
     * - If authData exists, save authData.uid as a variable named "uid" and continue with the following steps
     * - Save (new Date()).toString() as "dateString" for use in timestamps
     * - Save authData.password.email as "email"
     * - Use .once() and the "value" event to listen to /twitterClone/accessControlList/***uid***
     * - If a matching entry in the ACL exists, set /twitterClone/accessControlList/###uid###/lastLogin to "dateString"
     * - If no matching ACL entry exists, create one with these keys: { email: email || false, lastLogin: dateString, isAdmin: false }
     * - Create a callback handler that we'll use for both of the last two cases. This callback handler takes and error argument. If an error is returned, log it out, otherwise, continue
     * - Handle a successful callback by first checking if an ACL entry exists from the earlier step. If it does, call handleUserChange(entry.userKey)
     * - If the ACL entry does not exist, create a new user ref using usersRef.push() and saving it as "userRef"
     * - By creating and saving the new ref, we can save it's key before we set the ref, so save the new ref's key as "userKey"
     * - Set the new userRef with the keys {email: email, username: email, name: 'Anonymous'}
     * - Now set the ACL entry's userKey attribute to "userKey". Hint, the userKey attribute can be found at /twitterClone/accessControlList/###uid###/userKey
     * - Once the ACL entry's userKey attribute is set, call handleUserChange(userKey)
     */
    ref.onAuth(function(authData) {
        if (!authData) {
            setTweetBox();
            setUserDetails();
            setTimeline();
            setFollowing();
            stopListening();
        } else {
            var uid = authData.uid,
                aclRef = new Firebase(firebaseRoot + 'accessControlList'),
                dateString = (new Date()).toString(),
                email;

            if (authData.password) {
                email = authData.password.email;
            }

            aclRef.child(uid).once('value', function(snap) {
                var entry = snap.val(),
                    callback = function(err) {
                        if (err) {
                            console.warn(err);
                        } else {
                            var userKey = entry ? entry.userKey : false;

                            if (userKey) {
                                handleUserChange(userKey);
                            } else {
                                var userRef = usersRef.push();

                                userRef.set({
                                    email: email,
                                    username: email,
                                    name: 'Anonymous'
                                }, function(err) {
                                    if (err) {
                                        console.warn(err);
                                    } else {
                                        snap.ref().child('userKey').set(userRef.key(), function(err) {
                                            return err ? console.warn(err) : handleUserChange(userRef.key());
                                        });
                                    }

                                });
                            }
                        }

                    };

                if (entry && entry.lastLogin) {
                    snap.ref().child('lastLogin').set(dateString, callback);
                } else {
                    snap.ref().set({
                        email: email || false,
                        lastLogin: dateString,
                        isAdmin: false
                    }, callback);
                }
            });

        }

    });

    var handleFollowChange = function(userKey, targetKey, isFollowed) {
        // Check logged-in user's following list for the target user
        userObjectsRef.child('following').child(userKey).orderByChild('key').equalTo(targetKey).once('value', function(snap) {
            // If isFollowed and the target user does not exist in the list, add him/her
            if (isFollowed && snap.numChildren() === 0) {
                usersRef.child(targetKey).once('value', function(snap) {
                    var targetUser = snap.val();
                    userObjectsRef.child('following').child(userKey).push({
                        email: targetUser.email,
                        key: snap.key(),
                        name: targetUser.name,
                        username: targetUser.username
                    });
                });

            } else { // Otherwise, remove all matching child refs.
                snap.forEach(function(childSnap) {
                    childSnap.ref().remove();
                });
            }
        });

        // Get target user's followers list
        userObjectsRef.child('followers').child(targetKey).child('list').orderByChild('key').equalTo(userKey).once('value', function(snap) {
            // If isFollowed and the logged-in user does not exist in the list, add him/her
            if (isFollowed && snap.numChildren() === 0) {
                usersRef.child(userKey).once('value', function(snap) {
                    var loggedInUser = snap.val();
                    userObjectsRef.child('followers').child(targetKey).push({
                        email: loggedInUser.email,
                        key: snap.key(),
                        name: loggedInUser.name,
                        username: loggedInUser.username
                    }, function(err) {
                        if (err) {
                            console.warn(err);
                        } else {
                            userObjectsRef.child('followers').child(targetKey).child('count').transaction(function(i) {
                                return Math.max(i - 1, 0);
                            });
                        }
                    });
                });
            } else { // Otherwise, remove all matching child refs
                snap.forEach(function(childSnap) {
                    childSnap.ref().remove(function(err) {
                        if (err) {
                            console.warn(err);
                        } else {
                            userObjectsRef.child('followers').child(targetKey).child('count').transaction(function(i) {
                                return Math.min(i + 1, 0);
                            });
                        }
                    });
                });
            }
        });

        // Get logged-in user's timeline
        userObjectsRef.child('timeline').child(userKey).orderByChild('userKey').equalTo(targetKey).once('value', function(snap) {
            // If isFollowed and the target's tweets do not exist, add them, careful to preserve the tweets' "timestamped" keys for ordering purposes
            if (isFollowed && snap.numChildren() === 0) {
                usersRef.child(targetKey).once('value', function(snap) {
                    var targetUser = snap.val(),
                        userTimelineRef = userObjectsRef.child('timeline').child(userKey);

                    userObjectsRef.child('tweets').child(targetKey).once('value', function(snap) {
                        snap.forEach(function(childSnap) {
                            var tweet = childSnap.val(),
                                tweetKey = childSnap.key();

                            userTimelineRef.child(tweetKey).set({
                                created: tweet.created,
                                text: tweet.text,
                                tweetKey: tweetKey,
                                userKey: targetKey,
                                user: {
                                    email: targetUser.email,
                                    key: targetKey,
                                    name: targetUser.name,
                                    username: targetUser.username
                                }
                            });
                        });
                    });
                });

            } else {
                snap.forEach(function(childSnap) {
                    childSnap.ref().remove();
                });
            }
        });
    };

})();