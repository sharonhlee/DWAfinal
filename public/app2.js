;
jQuery(function($){    
    'use strict';

    var IO = {

        init: function() {
            console.log("app2 in the house");
            IO.socket = io();
            IO.bindEvents();
        },

        bindEvents : function() {
            IO.socket.on('connected', IO.onConnected );
            IO.socket.on('newGameCreated', IO.onNewGameCreated );
            IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom );
            IO.socket.on('beginNewGame', IO.beginNewGame );
            IO.socket.on('newWordData', IO.onNewWordData);
            IO.socket.on('hostCheckAnswer', IO.hostCheckAnswer);
            IO.socket.on('gameOver', IO.gameOver);
            IO.socket.on('error', IO.error );
        },

        //client just connected
        onConnected : function(data) {
            console.log("copy sesson ID");
            App.mySocketId = data;
            console.log(App.mySocketId)
        },

        //game ID generated, gameinit
        onNewGameCreated : function(data) {
            App.Host.gameInit(data);
        },

        /**
         * A player has successfully joined the game.
         * @param data {{playerName: string, gameId: int, mySocketId: int}}
         */
        playerJoinedRoom : function(data) {
            // update the waiting screen for both host and player
            App[App.myRole].updateWaitingScreen(data);
        },

        //two players both in room
        beginNewGame : function(data) {
            App[App.myRole].gameCountdown(data);
        },

        //send next word for next round
        onNewWordData : function(data) {
            // Update the current round
            App.currentRound = data.round;

            // Change the word for the Host and Player
            App[App.myRole].newWord(data);
        },

        //host player answered, check if correct
        hostCheckAnswer : function(data) {
            if(App.myRole === 'Host') {
                App.Host.checkAnswer(data);
            }
        },

        //gameover message
        gameOver : function(data) {
            App[App.myRole].endGame(data);
        },

        error : function(data) {
            alert(data.message);
        }

    };

    var App = {

        gameId: 0,

        //to differentiate player and host
        myRole: '',  

        mySocketId: '',

        currentRound: 0,

        //init loading screen

        init: function () {
            App.cacheElements();
            App.showInitScreen();
            App.bindEvents();
        },

        //on-screen elements used throughout the game
        cacheElements: function () {
            App.$doc = $(document);

            // templates
            App.$gameArea = $('#gameArea');
            App.$templateIntroScreen = $('#intro-screen-template').html();
            App.$templateNewGame = $('#create-game-template').html();
            App.$templateJoinGame = $('#join-game-template').html();
            App.$hostGame = $('#host-game-template').html();
        },

        //click handlers for the various buttons

        bindEvents: function () {
            // Host
            App.$doc.on('click', '#btnCreatePri', App.Host.onCreateClickPri );
            App.$doc.on('click', '#btnCreatePub', App.Host.onCreateClickPub );

            // Player
            App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
            App.$doc.on('click', '#btnStart',App.Player.onPlayerStartClick);
            App.$doc.on('click', '.btnAnswer',App.Player.onPlayerAnswerClick);
            App.$doc.on('click', '#btnPlayerRestart', App.Player.onPlayerRestart);
        },


        //starter screen
        showInitScreen: function() {
            App.$gameArea.html(App.$templateIntroScreen);
        },


        //all code relevant to "HOST" aka player who creates game room first
        Host : {

            players : [],

            isNewGame : false,

            numPlayersInRoom: 0,

            currentCorrectAnswer: '',

            //start button clicked
            onCreateClickPub: function () {
                console.log('pub');
                IO.socket.emit('hostCreateNewPubGame');
            },
            onCreateClickPri: function () {  
                console.log("pri");  
                IO.socket.emit('hostCreateNewPriGame');   
            },

            //host init waiting screen
            gameInit: function (data) {
                if (data.publish===true){
                    $.ajax({
                        type: "POST",
                        url: "/twoplayer/openrooms",
                        data: {
                            "gameid": JSON.stringify(data.gameId)
                        },
                        success: function(data) {
                        //show content
                        console.log('Room open to public players')
                        },
                        error: function(err) {
                        //show error message
                        console.log("Error, room was not published");
                        }
                    });
                }
                App.gameId = data.gameId;
                App.mySocketId = data.mySocketId;
                App.myRole = 'Host';
                App.Host.numPlayersInRoom = 0;
                console.log(App.gameId,App.mySocketId)

                App.Host.displayNewGameScreen({p:data.publish});
            },

            //waiting screen for host
            displayNewGameScreen : function(data) {
                // Fill the game screen with the appropriate HTML
                App.$gameArea.html(App.$templateNewGame);

                // show the room id on screen
                $('#spanNewGameCode').text(App.gameId);
            },

            //update host screen when player joins
            updateWaitingScreen: function(data) {
                // if restarted game
                if ( App.Host.isNewGame ) {
                    App.Host.displayNewGameScreen();
                }
                // Update host screen
                $('#playersWaiting')
                    .append('<p/>')
                    .text('Player ' + data.playerName + ' joined the game.');

                // store new player's data on host
                App.Host.players.push(data);

                // update to full num of players in room
                App.Host.numPlayersInRoom += 1;

                // If two players have joined, start the game!
                if (App.Host.numPlayersInRoom === 2) {
                    //alert server room's full
                    IO.emit('hostRoomFull',App.gameId);
                }
            },

            //instruct and countdown
            gameCountdown : function() {

                // Prepare the game screen with new HTML
                App.$gameArea.html(App.$hostGame);
                App.doTextFit('#hostWord');

                // on-screen countdown timer
                var $secondsLeft = $('#hostWord');
                App.countDown( $secondsLeft, 5, function(){
                    IO.emit('hostCountdownFinished', App.gameId);
                });

                // Display the players' names on screen
                $('#player1Score')
                    .find('.playerName')
                    .html(App.Host.players[0].playerName);

                $('#player2Score')
                    .find('.playerName')
                    .html(App.Host.players[1].playerName);

                // Set the Score section on screen to 0 for each player.
                $('#player1Score').find('.score').attr('id',App.Host.players[0].mySocketId);
                $('#player2Score').find('.score').attr('id',App.Host.players[1].mySocketId);
            },

            //show the words for current round
            newWord : function(data) {
                // Insert the new word into the DOM
                $('#hostWord').text(data.word);
                App.doTextFit('#hostWord');

                // Update the data for the current round
                App.Host.currentCorrectAnswer = data.answer;
                App.Host.currentRound = data.round;
            },

            //checking answer
            checkAnswer : function(data) {
                // verify answer clicked is from current round, prevents a 'late entry'
                if (data.round === App.currentRound){

                    // player's score
                    var $pScore = $('#' + data.playerId);

                    // if correct...
                    if( App.Host.currentCorrectAnswer === data.answer ) {
                        // add to score
                        $pScore.text( +$pScore.text() + 1 );

                        // go to next round
                        App.currentRound += 1;

                        // Prepare data to send to the server
                        var data = {
                            gameId : App.gameId,
                            round : App.currentRound
                        }

                        // Notify the server to start the next round.
                        IO.emit('hostNextRound',data);

                    } else {
                        // A wrong answer was submitted, so decrement the player's score.
                        $pScore.text( +$pScore.text() - 3 );
                    }
                }
            },


            /**
             * All 10 rounds have played out. End the game.
             * @param data
             */
            endGame : function(data) {
                // Get the data for player 1 from the host screen
                var $p1 = $('#player1Score');
                var p1Score = +$p1.find('.score').text();
                var p1Name = $p1.find('.playerName').text();

                // Get the data for player 2 from the host screen
                var $p2 = $('#player2Score');
                var p2Score = +$p2.find('.score').text();
                var p2Name = $p2.find('.playerName').text();

                // Find the winner based on the scores
                var winner = (p1Score < p2Score) ? p2Name : p1Name;
                var tie = (p1Score === p2Score);

                // Display the winner (or tie game message)
                if(tie){
                    $('#hostWord').text("It's a Tie!");
                } else {
                    $('#hostWord').text( winner + ' Wins!!' );
                }
                App.doTextFit('#hostWord');

                // Reset game data
                App.Host.numPlayersInRoom = 0;
                App.Host.isNewGame = true;
            },

            /**
             * A player hit the 'Start Again' button after the end of a game.
             */
            restartGame : function() {
                App.$gameArea.html(App.$templateNewGame);
                $('#spanNewGameCode').text(App.gameId);
            }
        },


        /* *****************************
           *        PLAYER CODE        *
           ***************************** */

        Player : {

            /**
             * A reference to the socket ID of the Host
             */
            hostSocketId: '',

            /**
             * The player's name entered on the 'Join' screen.
             */
            myName: '',

            /**
             * Click handler for the 'JOIN' button
             */
            onJoinClick: function () {
                // console.log('Clicked "Join A Game"');

                // Display the Join Game HTML on the player's screen.
                App.$gameArea.html(App.$templateJoinGame);
            },

            /**
             * The player entered their name and gameId (hopefully)
             * and clicked Start.
             */
            onPlayerStartClick: function() {
                // console.log('Player clicked "Start"');

                // collect data to send to the server
                var data = {
                    gameId : +($('#inputGameId').val()),
                    playerName : $('#inputPlayerName').val() || 'anon'
                };

                // Send the gameId and playerName to the server
                IO.socket.emit('playerJoinGame', data);

                // Set the appropriate properties for the current player.
                App.myRole = 'Player';
                App.Player.myName = data.playerName;
            },

            /**
             *  Click handler for the Player hitting a word in the word list.
             */
            onPlayerAnswerClick: function() {
                // console.log('Clicked Answer Button');
                var $btn = $(this);      // the tapped button
                var answer = $btn.val(); // The tapped word

                // Send the player info and tapped word to the server so
                // the host can check the answer.
                var data = {
                    gameId: App.gameId,
                    playerId: App.mySocketId,
                    answer: answer,
                    round: App.currentRound
                }
                IO.socket.emit('playerAnswer',data);
            },

            /**
             *  Click handler for the "Start Again" button that appears
             *  when a game is over.
             */
            onPlayerRestart : function() {
                var data = {
                    gameId : App.gameId,
                    playerName : App.Player.myName
                }
                IO.socket.emit('playerRestart',data);
                App.currentRound = 0;
                $('#gameArea').html("<h3>Waiting on host to start new game.</h3>");
            },

            /**
             * Display the waiting screen for player 1
             * @param data
             */
            updateWaitingScreen : function(data) {
                if(IO.socket.socket.sessionid === data.mySocketId){
                    App.myRole = 'Player';
                    App.gameId = data.gameId;

                    $('#playerWaitingMessage')
                        .append('<p/>')
                        .text('Joined Game ' + data.gameId + '. Please wait for game to begin.');
                }
            },

            /**
             * Display 'Get Ready' while the countdown timer ticks down.
             * @param hostData
             */
            gameCountdown : function(hostData) {
                App.Player.hostSocketId = hostData.mySocketId;
                $('#gameArea')
                    .html('<div class="gameOver">Get Ready!</div>');
            },

            /**
             * Show the list of words for the current round.
             * @param data{{round: *, word: *, answer: *, list: Array}}
             */
            newWord : function(data) {
                // Create an unordered list element
                var $list = $('<ul/>').attr('id','ulAnswers');

                // Insert a list item for each word in the word list
                // received from the server.
                $.each(data.list, function(){
                    $list                                //  <ul> </ul>
                        .append( $('<li/>')              //  <ul> <li> </li> </ul>
                            .append( $('<button/>')      //  <ul> <li> <button> </button> </li> </ul>
                                .addClass('btnAnswer')   //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                                .addClass('btn')         //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                                .val(this)               //  <ul> <li> <button class='btnAnswer' value='word'> </button> </li> </ul>
                                .html(this)              //  <ul> <li> <button class='btnAnswer' value='word'>word</button> </li> </ul>
                            )
                        )
                });

                // Insert the list onto the screen.
                $('#gameArea').html($list);
            },

            /**
             * Show the "Game Over" screen.
             */
            endGame : function() {
                $('#gameArea')
                    .html('<div class="gameOver">Game Over!</div>')
                    .append(
                        // Create a button to start a new game.
                        $('<button>Start Again</button>')
                            .attr('id','btnPlayerRestart')
                            .addClass('btn')
                            .addClass('btnGameOver')
                    );
            }
        },


        /* **************************
                  UTILITY CODE
           ************************** */

        /**
         * Display the countdown timer on the Host screen
         *
         * @param $el The container element for the countdown timer
         * @param startTime
         * @param callback The function to call when the timer ends.
         */
        countDown : function( $el, startTime, callback) {

            // Display the starting time on the screen.
            $el.text(startTime);
            App.doTextFit('#hostWord');

            // console.log('Starting Countdown...');

            // Start a 1 second timer
            var timer = setInterval(countItDown,1000);

            // Decrement the displayed timer value on each 'tick'
            function countItDown(){
                startTime -= 1
                $el.text(startTime);
                App.doTextFit('#hostWord');

                if( startTime <= 0 ){
                    // console.log('Countdown Finished.');

                    // Stop the timer and do the callback.
                    clearInterval(timer);
                    callback();
                    return;
                }
            }

        },

        /**
         * Make the text inside the given element as big as possible
         * See: https://github.com/STRML/textFit
         *
         * @param el The parent element of some text
         */
        doTextFit : function(el) {
            textFit(
                $(el)[0],
                {
                    alignHoriz:true,
                    alignVert:false,
                    widthOnly:true,
                    reProcess:true,
                    maxFontSize:300
                }
            );
        }

    };

    IO.init();
    App.init();

}($));
