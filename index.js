
var express = require('express');
var hbs = require('express-handlebars');
var bodyParser = require('body-parser');
var Mongoose = require('mongoose');
//grabbing multiplayer game mode js code
var newsgame = require('./newsgame.js');

var app = express();
var http = require('http').Server(app);

require('dotenv').config();

//mongoose database
Mongoose.Promise = global.Promise;
Mongoose.connect(process.env.DB_URL);

// serve static html, js, css, and image files from the 'public' directory
app.use( express.static('public') );

//sockets io
var io = require('socket.io')(http);



// socket listening for connection: start game once connected
io.on('connection', function (socket) {
    console.log('connected: ', socket.id);
    newsgame.initGame(io, socket);
});

//tell express to use handlebars
app.engine('handlebars', hbs({defaultLayout:'main'}) );
app.set('view engine', 'handlebars');


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());


//starting page
var main = require('./routes/main');
app.use('/', main);
//singleplayer
var oneplayer = require('./routes/oneplayergame');
app.use('/singleplayer', oneplayer);
//twoplayer
var twoplayer = require('./routes/twoplayergame');
app.use('/twoplayer', twoplayer);


// use http to start server
http.listen(3000, function() {
  console.log('listening on *:3000');
});

