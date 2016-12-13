var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var URLSlugs=require('mongoose-url-slugs');

var publicroomSchema = new Schema({
    gameId: Number,
    dateCreated: {type: Date, default: Date.now}
});

publicroomSchema.plugin(URLSlugs('name', {field: 'slug'}));

var Openroom = mongoose.model('Openroom', publicroomSchema);

// when we require this file, we get Pet model
module.exports = Openroom;