Cities = new Mongo.Collection('cities');
Routes = new Mongo.Collection('routes');

Routes.helpers({
    neighbors: function () {
        return Routes.find({
            target: this.target.name
        }).fetch();
    },

    sourceCity: function () {
        return Cities.findOne({
            name: this.source
        })
    },

    targetCity: function () {
        return Cities.findOne({
            name: this.target
        })
    }
});