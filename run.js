var _ = require('underscore'),
    moment = require('moment'),
    firebase = require('firebase'),
    faker = require('faker'),
    Q = require('q'),
    fs = require('fs-extra');

// Environment
var environment = require('./environment'),
    root = environment.firebaseRoot,
    rootRef = new firebase(root);

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
                fs.writeJSON('./1-endpoints/data.json', snap.val(), function (err) {
                    return err ? deferred.reject(err) : deferred.resolve();
                });

            });
        });

    });

    return deferred.promise;
};

createEndpointData().then(function() {
    console.log('Endpoints data created');
    process.exit();
});