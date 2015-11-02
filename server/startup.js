Meteor.startup(function () {
    Cities._ensureIndex({
        name: 1
    });

    Routes._ensureIndex({
        source: 1,
        target: 1,
        distance: 1
    });
})