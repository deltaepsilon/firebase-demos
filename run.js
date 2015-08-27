var _ = require('underscore'),
    moment = require('moment'),
    firebase = require('firebase'),
    faker = require('faker'),
    Q = require('q'),
    fs = require('fs-extra');

// Environment
var environment = require('./environment'),
    root = environment.firebaseRoot,
    rootRef = new firebase(root),
    promises = [];

// Endpoint data
var createEndpointData = function() {
    var i = 10,
        fakes = [],
        endpointsRef = rootRef.child('endpoints'),
        usersRef = endpointsRef.child('users'),
        promises = [],
        deferred = Q.defer();

    usersRef.remove(function() {
        while (i--) {
            fakes.push(faker.helpers.createCard());
        }

        _.each(fakes, function(fake) {
            var fakeRef = usersRef.push(),
                maxUnix = moment().unix(),
                fakeDeferred = Q.defer();

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

                fakeRef.child('tweets').push({
                    text: post.sentence,
                    created: moment(_.random(0, maxUnix)).format()
                }, function(err) {
                    return err ? postDeferred.reject(err) : postDeferred.resolve();
                });
            });

        });

        console.log('promises length', promises.length);

        Q.all(promises).then(function() {
            endpointsRef.on('value', function(snap) {
                fs.writeJSON('./1-endpoints/data.json', snap.val(), function(err) {
                    return err ? deferred.reject(err) : deferred.resolve();
                });

            });
        });

    });

    return deferred.promise;
};

var endpointPromise = createEndpointData();
promises.push(endpointPromise);

endpointPromise.then(function() {
    console.log('Endpoints data created');
});

var createDataDesignData = function() {
    var i = 10,
        fakes = [],
        dataDesignRef = rootRef.child('dataDesign'),
        deepNestingRef = dataDesignRef.child('deepNesting'),
        deepNestingUsersRef = deepNestingRef.child('users'),
        shallowNestingRef = dataDesignRef.child('shallowNesting'),
        shallowNestingUsersRef = shallowNestingRef.child('users'),
        duplicateDataRef = dataDesignRef.child('duplicateData'),
        duplicateDataUsersRef = duplicateDataRef.child('users'),
        promises = [],
        deferred = Q.defer();

    dataDesignRef.remove(function() {
        while (i--) {
            fakes.push(faker.helpers.createCard());
        }

        // Deep nesting
        _.each(fakes, function(fake) {
            var fakeRef = deepNestingUsersRef.push(),
                maxUnix = moment().unix(),
                fakeDeferred = Q.defer();

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
        _.each(fakes, function(fake) {
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
        _.each(fakes, function(fake) {
            var fakeRef = duplicateDataUsersRef.push(),
                maxUnix = moment().unix(),
                fakeDeferred = Q.defer(),
                userKey = fakeRef.key(),
                userObjectsRef = duplicateDataRef.child('userObjects');

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
                var postDeferred = Q.defer(),
                    user = _.pick(faker.helpers.createCard(), 'email', 'name', 'username', 'website');

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

        console.log('promises length', promises.length);

        Q.all(promises).then(function() {
            dataDesignRef.on('value', function(snap) {
                fs.writeJSON('./3-data-design/data.json', snap.val(), function(err) {
                    return err ? deferred.reject(err) : deferred.resolve();
                });

            });
        });

    });

    return deferred.promise;
};

var dataDesignPromise = createDataDesignData();
promises.push(dataDesignPromise);

dataDesignPromise.then(function() {
    console.log('Data Design data created');
});

var createReadingData = function() {
    var i = 10,
        fakes = [],
        readingDataRef = rootRef.child('twitterClone'),
        promises = [],
        deferred = Q.defer();

    readingDataRef.remove(function() {
        while (i--) {
            fakes.push(faker.helpers.createCard());
        }

        // Duplicate data
        _.each(fakes, function(fake) {
            var fakeRef = readingDataRef.child('users').push(),
                maxUnix = moment().unix(),
                fakeDeferred = Q.defer(),
                userKey = fakeRef.key(),
                userObjectsRef = readingDataRef.child('userObjects');

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
                var postDeferred = Q.defer(),
                    user = _.pick(faker.helpers.createCard(), 'email', 'name', 'username', 'website');

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

        console.log('promises length', promises.length);

        Q.all(promises).then(function() {
            readingDataRef.on('value', function(snap) {
                fs.writeJSON('./4-reading-data/data.json', snap.val(), function(err) {
                    return err ? deferred.reject(err) : deferred.resolve();
                });

            });
        });

    });

    return deferred.promise;
};

var readingDataPromise = createReadingData();
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