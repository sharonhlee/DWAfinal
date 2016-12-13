var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var URLSlugs=require('mongoose-url-slugs');

var searchSchema = new Schema({
    searchterm: String, 
    hitcount: Number
});


var Search = mongoose.model('Search', searchSchema);

module.exports = Search;