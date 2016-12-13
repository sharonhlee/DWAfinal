var express = require('express');
var router = express.Router();

var Openroom= require('../models/gamerooms.js')

router.get('/',function(req,res){
	res.render('twoplayer');
});

module.exports=router;