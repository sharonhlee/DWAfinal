var express = require('express');
var router = express.Router();

var Openroom= require('../models/gamerooms.js')

router.get('/',function(req,res){
	res.render('twoplayer');
});

router.post('/openrooms', function(req, res, next){
    var r = new Openroom({
    	gameId: req.body.gameid
    });

    console.log(r);

    r.save(function(err, data) {
    	if (err) {
        	console.log(err);
        	res.status(500);
        	return res.json({
            	status: 'error',
            	message: 'could not publish your game room',
            	error: err
        	});
    	}
    	return res.json({
        	status: 'ok',
        	message: 'room open to public',
        	r: data
    	});
	});
});

router.get('/openrooms', function(req, res, next) {
  Openroom.find({}, function(err, data) {
    if (err) {
      res.status(500);
      return res.json({
        status: 'error',
        message: 'could not get open rooms'
      });
    }
    return res.json(data);
  });
});

module.exports=router;