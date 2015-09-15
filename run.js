var _ = require('underscore'),
    moment = require('moment'),
    firebase = require('firebase'),
    faker = require('faker'),
    Q = require('q'),
    fs = require('fs-extra'),
    axios = require('axios'),
    slug = require('slug');

// Environment
var environment = require('./environment'),
    root = environment.firebaseRoot,
    rootRef = new firebase(root),
    promises = [],
    fakeUsers,
    getFakeUsers = function() {
        return _.clone(fakeUsers);
    },
    getUniqueFakeUsers = function(i) {
        var fakes = getFakeUsers(),
            length = fakes.length,
            result = [];

        while (i--) {
            result.push(fakes[_.random(0, length - 1)]);
        }

        return result;
    };

// Create fake Star Wars data
var createFakeStarWarsData = function() {
    var characters = [],
        promises = [],
        i = 10,
        swapiRoot = "http://swapi.co/api/",
        getCharacterData = function(i) {
            i += 1;
            return axios.get(swapiRoot + 'people/' + i + '/').then(function(res) {
                var character = res.data;
                character.username = slug(character.name).toLowerCase();
                character.email = slug(character.name) + '@hotmail.com';
                characters.push(character);
                return Q();
            });
        },
        getHomeworldData = function(i) {
            return axios.get(characters[i].homeworld).then(function(res) {
                var character = characters[i];
                character.homeworld = res.data;
                character.posts = [{
                    sentence: "Hello! My name is " + character.name + ". I hail from " + character.homeworld.name + "."
                }, {
                    sentence: "I have a mass of  " + character.mass + ". My homeworld's climate is " + character.homeworld.climate + "."
                }, {
                    sentence: "Please email me at " + character.email + ". You'll know me by my " + character.skin_color + " skin color."
                }];
                return Q();
            });
        };

    while (i--) {
        promises.push(getCharacterData(i));
    }

    return Q.all(promises).then(function() {
        var promises = [],
            i = 10;

        while (i--) {
            promises.push(getHomeworldData(i));
        }

        return Q.all(promises);
    }).then(function() {
        var deferred = Q.defer(),
            payload = {
                users: characters
            };

        fs.writeJSON('./data/swapi.json', payload, function(err) {
            return err ? deferred.reject(err) : deferred.resolve(payload);
        });

        return deferred.promise;
    }).then(function(payload) {
        var deferred = Q.defer(),
            payloadRoot = rootRef.child('swapi').set(payload, function(err) {
                return err ? deferred.reject(err) : deferred.resolve(payload);
            });
        return deferred.promise;
    });
};

// var starWarsPromise = createFakeStarWarsData()
// promises.push(starWarsPromise);

// starWarsPromise.then(function(payload) {
//     console.log(payload)
//     fakeUsers = payload.users;
//     console.log('Star Wars data created');
// });

var starWarsPromise = (function() {
    var deferred = Q.defer();

    fs.readJSON('./data/swapi.json', function(err, starWarsData) {
        if (err) {
            deferred.reject(err);
        } else {
            fakeUsers = starWarsData.users;
            deferred.resolve(fakeUsers);
        }
    });

    return deferred.promise;
})();



// Endpoint data
var createEndpointData = function() {
    var endpointsRef = rootRef.child('endpoints'),
        usersRef = endpointsRef.child('users'),
        promises = [],
        deferred = Q.defer();

    usersRef.remove(function() {
        _.each(getFakeUsers(), function(fake) {
            var fakeRef = usersRef.push(),
                maxUnix = moment().unix(),
                fakeDeferred = Q.defer();

            promises.push(fakeDeferred.promise);

            fake = _.pick(fake, 'posts', 'birth_year', 'email', 'eye_color', 'gender', 'hair_color', 'height', 'mass', 'name', 'skin_color');

            fakeRef.set(fake, function(err) {
                return err ? fakeDeferred.reject(err) : fakeDeferred.resolve();
            });

            _.each(fake.posts, function(post) {
                var postDeferred = Q.defer();

                promises.push(postDeferred.promise);

                fakeRef.child('tweets').push({
                    text: post.sentence,
                    created: moment(_.random(0, maxUnix)).format()
                }, function(err) {
                    return err ? postDeferred.reject(err) : postDeferred.resolve();
                });
            });

        });

        Q.all(promises).then(function() {
            endpointsRef.on('value', function(snap) {
                fs.writeJSON('./2.1-endpoints/data.json', snap.val(), function(err) {
                    return err ? deferred.reject(err) : deferred.resolve();
                });

            });
        });

    });

    return deferred.promise;
};

var endpointPromise = starWarsPromise.then(createEndpointData);
promises.push(endpointPromise);

endpointPromise.then(function() {
    console.log('Endpoints data created');
});

var createDataDesignData = function() {
    var dataDesignRef = rootRef.child('dataDesign'),
        deepNestingRef = dataDesignRef.child('deepNesting'),
        deepNestingUsersRef = deepNestingRef.child('users'),
        shallowNestingRef = dataDesignRef.child('shallowNesting'),
        shallowNestingUsersRef = shallowNestingRef.child('users'),
        duplicateDataRef = dataDesignRef.child('duplicateData'),
        duplicateDataUsersRef = duplicateDataRef.child('users'),
        promises = [],
        deferred = Q.defer();

    dataDesignRef.remove(function() {

        // Deep nesting
        _.each(getFakeUsers(), function(fake) {
            var fakeRef = deepNestingUsersRef.push(),
                maxUnix = moment().unix(),
                fakeDeferred = Q.defer();

            promises.push(fakeDeferred.promise);

            fakeRef.set(_.pick(fake, 'birth_year', 'email', 'eye_color', 'gender', 'hair_color', 'height', 'mass', 'name', 'skin_color'), function(err) {
                return err ? fakeDeferred.reject(err) : fakeDeferred.resolve();
            });

            _.each(fake.posts, function(post) {
                var postDeferred = Q.defer();

                promises.push(postDeferred.promise);

                fakeRef.child('tweets').push({
                    text: post.sentence,
                    created: moment(_.random(0, maxUnix)).format()
                }, function(err) {
                    return err ? postDeferred.reject(err) : postDeferred.resolve();
                });
            });

            _.each(fake.posts, function(post) {
                var postDeferred = Q.defer();

                promises.push(postDeferred.promise);

                fakeRef.child('timeline').push({
                    text: post.sentence,
                    created: moment(_.random(0, maxUnix)).format()
                }, function(err) {
                    return err ? postDeferred.reject(err) : postDeferred.resolve();
                });
            });

        });

        // Shallow nesting
        _.each(getFakeUsers(), function(fake) {
            var fakeRef = shallowNestingUsersRef.push(),
                maxUnix = moment().unix(),
                fakeDeferred = Q.defer(),
                userKey = fakeRef.key(),
                userObjectsRef = shallowNestingRef.child('userObjects');

            promises.push(fakeDeferred.promise);

            fakeRef.set({
                name: fake.name,
                email: fake.email
            }, function(err) {
                return err ? fakeDeferred.reject(err) : fakeDeferred.resolve();
            });

            _.each(fake.posts, function(post) {
                var postDeferred = Q.defer();

                promises.push(postDeferred.promise);

                userObjectsRef.child('tweets').child(userKey).push({
                    text: post.sentence,
                    created: moment(_.random(0, maxUnix)).format()
                }, function(err) {
                    return err ? postDeferred.reject(err) : postDeferred.resolve();
                });
            });

            _.each(fake.posts, function(post) {
                var postDeferred = Q.defer();

                promises.push(postDeferred.promise);

                userObjectsRef.child('timeline').child(userKey).push({
                    text: post.sentence,
                    created: moment(_.random(0, maxUnix)).format()
                }, function(err) {
                    return err ? postDeferred.reject(err) : postDeferred.resolve();
                });
            });

        });

        // Duplicate data
        _.each(getFakeUsers(), function(fake) {
            var fakeRef = duplicateDataUsersRef.push(),
                maxUnix = moment().unix(),
                fakeDeferred = Q.defer(),
                userKey = fakeRef.key(),
                userObjectsRef = duplicateDataRef.child('userObjects'),
                follows = getUniqueFakeUsers(5);

            follows.push(fake);
            follows = _.uniq(follows);

            promises.push(fakeDeferred.promise);

            fakeRef.set({
                name: fake.name,
                email: fake.email
            }, function(err) {
                return err ? fakeDeferred.reject(err) : fakeDeferred.resolve();
            });

            _.each(fake.posts, function(post) {
                var postDeferred = Q.defer();

                promises.push(postDeferred.promise);

                userObjectsRef.child('tweets').child(userKey).push({
                    text: post.sentence,
                    created: moment(_.random(0, maxUnix)).format()
                }, function(err) {
                    return err ? postDeferred.reject(err) : postDeferred.resolve();
                });
            });

            _.each(follows, function(followed) {
                _.each(followed.posts, function(post) {
                    var postDeferred = Q.defer(),
                        user = _.pick(followed, 'email', 'name');

                    user.key = userObjectsRef.push().key();

                    promises.push(postDeferred.promise);

                    userObjectsRef.child('timeline').child(userKey).push({
                        text: post.sentence,
                        created: moment(_.random(0, maxUnix)).format(),
                        user: user
                    }, function(err) {
                        return err ? postDeferred.reject(err) : postDeferred.resolve();
                    });
                });
            });


        });

        Q.all(promises).then(function() {
            dataDesignRef.on('value', function(snap) {
                fs.writeJSON('./2.3-data-design/data.json', snap.val(), function(err) {
                    return err ? deferred.reject(err) : deferred.resolve();
                });

            });
        });

    });

    return deferred.promise;
};

var dataDesignPromise = starWarsPromise.then(createDataDesignData);
promises.push(dataDesignPromise);

dataDesignPromise.then(function() {
    console.log('Data Design data created');
});

var createReadingData = function() {
    var readingDataRef = rootRef.child('twitterClone'),
        usersRef = readingDataRef.child('users'),
        userObjectsRef = readingDataRef.child('userObjects'),
        promises = [],
        deferred = Q.defer();

    readingDataRef.remove(function() {
        // Reading data
        _.each(getFakeUsers(), function(fake) {
            var fakeRef = readingDataRef.child('users').push(),
                maxUnix = moment().unix(),
                fakeDeferred = Q.defer(),
                userKey = fakeRef.key(),
                follows = getUniqueFakeUsers(5);

            follows.push(fake);
            follows = _.uniq(follows);

            promises.push(fakeDeferred.promise);

            fakeRef.set(_.pick(fake, 'birth_year', 'email', 'eye_color', 'gender', 'hair_color', 'height', 'mass', 'name', 'skin_color', 'username'), function(err) {
                return err ? fakeDeferred.reject(err) : fakeDeferred.resolve();
            });

            _.each(fake.posts, function(post) {
                var postDeferred = Q.defer(),
                    tweetCountDeferred = Q.defer();

                promises.push(postDeferred.promise);
                promises.push(tweetCountDeferred.promise);

                userObjectsRef.child('tweets').child(userKey).push({
                    text: post.sentence,
                    fannedOut: true,
                    created: moment(_.random(0, maxUnix)).format()
                }, function(err) {
                    return err ? postDeferred.reject(err) : postDeferred.resolve();
                });

                usersRef.child(userKey).child('tweetCount').transaction(function(i) {
                    return (i || 0) + 1;
                }, function(err) {
                    return err ? tweetCountDeferred.reject(err) : tweetCountDeferred.resolve();
                });
            });

            _.each(follows, function(followed) {
                var followingDeferred = Q.defer(),
                    followersDeferred = Q.defer();

                promises.push(followingDeferred.promise);
                promises.push(followersDeferred.promise);

                usersRef.orderByChild('name').equalTo(followed.name).once('value', function(snap) {
                    if (snap.numChildren() === 1) {
                        snap.forEach(function(childSnap) {
                            var user = childSnap.val();

                            userObjectsRef.child('following').child(userKey).push({
                                key: childSnap.key(),
                                name: user.name,
                                username: user.username,
                                email: user.email
                            }, function(err) {
                                return err ? followingDeferred.reject(err) : followingDeferred.resolve(childSnap.key());
                            });

                            var followersRef = userObjectsRef.child('followers').child(childSnap.key());

                            followersRef.child('count').transaction(function(val) {
                                return (val || 0) + 1;
                            }, function() {
                                followersRef.child('list').push({
                                    key: userKey,
                                    name: fake.name,
                                    username: fake.username,
                                    email: fake.email
                                }, function(err) {
                                    return err ? followersDeferred.reject(err) : followersDeferred.resolve();
                                });
                            });


                        });
                    } else {
                        console.warn('Number of children is wack:', snap.numChildren());
                    }

                });


                followingDeferred.promise.then(function(followedKey) {
                    _.each(followed.posts, function(post) {
                        var postDeferred = Q.defer(),
                            user = _.pick(followed, 'email', 'name', 'username');

                        user.key = followedKey;

                        promises.push(postDeferred.promise);

                        userObjectsRef.child('tweets').child(followedKey).orderByChild('text').equalTo(post.sentence).once('value', function(snap) {
                            if (snap.numChildren() === 1) {
                                snap.forEach(function(childSnap) {
                                    userObjectsRef.child('timeline').child(userKey).push({
                                        text: post.sentence,
                                        created: moment(_.random(0, maxUnix)).format(),
                                        tweetKey: childSnap.key(),
                                        userKey: user.key,
                                        user: user
                                    }, function(err) {
                                        return err ? postDeferred.reject(err) : postDeferred.resolve();
                                    });
                                });
                            } else {
                                console.log('Too many children!', snap.numChildren());
                            }

                        });

                    });
                });

            });



        });

        Q.all(promises).then(function() {
            readingDataRef.on('value', function(snap) {
                fs.writeJSON('./3-reading-data/data.json', snap.val(), function(err) {
                    return err ? deferred.reject(err) : deferred.resolve();
                });

            });
        });

    });

    return deferred.promise;
};

var readingDataPromise = starWarsPromise.then(createReadingData);
promises.push(readingDataPromise);

readingDataPromise.then(function() {
    console.log('Reading Data data created');
});

console.log('promises', promises.length);
Q.all(promises).then(function() {
    console.log('success!');
}, function(err) {
    console.log('error!', err);
}).finally(function() {
    process.exit();
});