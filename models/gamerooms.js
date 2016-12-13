var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var URLSlugs=require('mongoose-url-slugs');

var publicroomSchema = new Schema({
    gameId: Number,
    dateCreated: {type: Date, default: Date.now}
});


var Openroom = mongoose.model('Openroom', publicroomSchema);


module.exports = Openroom;