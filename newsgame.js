var io;
var gameSocket;

// start new game 

exports.initGame = function(sio, socket){
    console.log("initgame");
    io = sio;
    gameSocket = socket;
    gameSocket.emit('connected', socket.id);

    // Host Events
    gameSocket.on('hostCreateNewPubGame', onhostCreateNewPubGame);
    gameSocket.on('hostCreateNewPriGame', onhostCreateNewPriGame);
    gameSocket.on('hostRoomFull', hostPrepareGame);
    gameSocket.on('hostCountdownFinished', hostStartGame);
    gameSocket.on('hostNextRound', hostNextRound);

    // Player Events
    gameSocket.on('playerJoinGame', playerJoinGame);
    gameSocket.on('playerAnswer', playerAnswer);
    gameSocket.on('playerRestart', playerRestart);
}

/* *******************************
   *                             *
   *       HOST FUNCTIONS        *
   *                             *
   ******************************* */

/**
 * The 'START' button was clicked and 'hostCreateNewGame' event occurred.
 */
function onhostCreateNewPubGame() {
    // open to strangers
    var gameroom = ( Math.random() * 100000 ) | 0;
    console.log(gameroom);
    console.log(this.id);

    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    this.emit('newGameCreated', {gameId: gameroom, mySocketId: this.id, publish: true});  

    // join the Room and wait for the players
    this.join(gameroom.toString());
};

function onhostCreateNewPriGame() {
    //game room to not be publicized, and instead encouraged to share on players own
    var gameroom = ( Math.random() * 100000 ) | 0;
    console.log(gameroom);
    console.log(this.id);

    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    this.emit('newGameCreated', {gameId: gameroom, mySocketId: this.id, publish: false});

    // join the Room and wait for the players
    this.join(gameroom.toString());
};

//lets host know two players are now present

function hostPrepareGame(gameId) {
    var sock = this;
    var data = {
        mySocketId : sock.id,
        gameId : gameId
    };
    //console.log("All Players Present. Preparing game...");
    io.sockets.in(data.gameId).emit('beginNewGame', data);
}

/*
 * The Countdown has finished, and the game begins!
 * @param gameId The game ID / room ID
 */
function hostStartGame(gameId) {
    console.log('Game Started.');
    sendWord(0,gameId); //START BY SENDING A RANDOM WORD !!! MUST CHANGE
};

//player answered correct, data: gameId and currentRound
function hostNextRound(data) {
    if(gameCountdown==0){
        io.sockets.in(data.gameId).emit('gameOver',data);
    } else {
        sendWord(data.round, data.gameId);
    }
}
/* *****************************
   *                           *
   *     PLAYER FUNCTIONS      *
   *                           *
   ***************************** */

/**
 * A player clicked the 'START GAME' button.
 * Attempt to connect them to the room that matches
 * the gameId entered by the player.
 * @param data Contains data entered via player's input - playerName and gameId.
 */
function playerJoinGame(data) {
    //console.log('Player ' + data.playerName + 'attempting to join game: ' + data.gameId );

    // A reference to the player's Socket.IO socket object
    var sock = this;

    // Look up the room ID in the Socket.IO manager object.
    var room = gameSocket.manager.rooms["/" + data.gameId];

    // If the room exists...
    if( room != undefined ){
        // attach the socket id to the data object.
        data.mySocketId = sock.id;

        // Join the room
        sock.join(data.gameId);

        //console.log('Player ' + data.playerName + ' joining game: ' + data.gameId );

        // Emit an event notifying the clients that the player has joined the room.
        io.sockets.in(data.gameId).emit('playerJoinedRoom', data);

    } else {
        // Otherwise, send an error message back to the player.
        this.emit('error',{message: "This room does not exist."} );
    }
}

/**
 * A player has tapped a word in the word list.
 * @param data gameId
 */
function playerAnswer(data) {
    // console.log('Player ID: ' + data.playerId + ' answered a question with: ' + data.answer);

    // The player's answer is attached to the data object.  \
    // Emit an event with the answer so it can be checked by the 'Host'
    io.sockets.in(data.gameId).emit('hostCheckAnswer', data);
}

/**
 * The game is over, and a player has clicked a button to restart the game.
 * @param data
 */
function playerRestart(data) {
    // console.log('Player: ' + data.playerName + ' ready for new game.');

    // Emit the player's data back to the clients in the game room.
    data.playerId = this.id;
    io.sockets.in(data.gameId).emit('playerJoinedRoom',data);
}

/* *************************
   *                       *
   *      GAME LOGIC       *
   *                       *
   ************************* */

/**
 * Get a word for the host, and a list of words for the player.
 *
 * @param searchTermIndex -- starts with 0
 * @param gameId The room identifier
 */

 //sendWord(randomword, gameId) MUST CHANGE
function sendWord(searchTermIndex, gameId) {
    var data = getSearchData(searchTermIndex);
    io.sockets.in(data.gameId).emit('newWordData', data);
}

//gets new word data to update
//param i is current index of the searchTerms.


////////////////////
//     CHANGE     //
////////////////////
function getSearchData(i){
    //randomly pull word from searchterms database and return that word

    return wordData;
}

/*
 * Javascript implementation of Fisher-Yates shuffle algorithm
 * http://stackoverflow.com/questions/2450954/how-to-randomize-a-javascript-array
 */
function shuffle(array) {
    var currentIndex = array.length;
    var temporaryValue;
    var randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

/**
 * Each element in the array provides data for a single round in the game.
 *
 * In each round, two random "words" are chosen as the host word and the correct answer.
 * Five random "decoys" are chosen to make up the list displayed to the player.
 * The correct answer is randomly inserted into the list of chosen decoys.
 *
 * @type {Array}
 */
var searchTerms = [];
    