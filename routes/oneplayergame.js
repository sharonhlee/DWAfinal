var express = require('express');
var router = express.Router();

var Search=require('../models/searchterms');

router.get('/',function(req,res){
	res.render('oneplayer');
});

router.post('/data', function(req, res, next){
    var s = new Search({
    	searchterm: req.body.searchterm,
    	hitcount:req.body.hitcount
    });

    console.log(s);

    s.save(function(err, data) {
    	if (err) {
        	console.log(err);
        	res.status(500);
        	return res.json({
            	status: 'error',
            	message: 'could not save searchterms',
            	error: err
        	});
    	}
    	return res.json({
        	status: 'ok',
        	message: 'added searchterms',
        	s: data
    	});
	});
});

router.get('/data', function(req, res, next) {
  Search.find({}, function(err, data) {
    if (err) {
      res.status(500);
      return res.json({
        status: 'error',
        message: 'could not get searchs'
      });
    }
    return res.json(data);
  });
});

module.exports=router;