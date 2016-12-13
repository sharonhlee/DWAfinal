//PAGE VIEW HANDLING

function showStage(stageName) {
    $('.stage').hide();
    $('#' + stageName).show();
};


//FORM SUBMIT HANDLING AND DATA STORING
$('#searchterms').focus();

$('form').on('submit', validateform);

function validateform(event) {

    //prevent form submission
    event.preventDefault();

    var alerted = false;
    var valid = false;
    countfields = $("#searchterms input").length
    $("#searchterms input").each(function() {
        if ($(this).val() == "" && alerted == false) {
            alert("Please fill in all fields!");
            alerted = true;
        } else if (!$(this).val() == "") {
            countfields -= 1;
            if (countfields == 0) {
                var stageName = "gamestart";
                showStage(stageName);
                handleSubmit(event);
            }
        }
    })
};

//api request info organization
function handleSubmit(event) {

    var formData = {
        'q': $('#searchterms input').serializeArray(),
        'begin_date': $('#year').val() + "0101",
        'end_date': $('#year').val() + "1231",
        'api_key': '28e65b2092ce45208a669293b9e14601'
    };
    //console.log(formData);
    //console.log(formData.q.length);

    searchData = []
    for (i = 0; i < formData.q.length; i++) {
        var eachSearchData = {
            'q': formData.q[i].value,
            'begin_date': formData.begin_date,
            'end_date': formData.end_date,
            'api-key': formData.api_key
        };
        searchData.push(eachSearchData);
    };
    //console.log(searchData);

    var searchArray = [];
    var hitcountArray = [];

    //getting hitcount for each inputted searchword, store searchword and corresponding hitcount in two separate arrays with the same index locator
    function requestApi(info) {

            $.ajax({
                url: 'http://api.nytimes.com/svc/search/v2/articlesearch.json',
                method: 'GET',
                data: info,
                dataType: 'jsonp',
                searchkey: info.q
            }).done(function(data) {
                num = data.response.meta.hits; //number of articles
                console.log(this.searchkey + ": " + num);
                searchArray.push(this.searchkey);
                hitcountArray.push(num);
                if (searchArray.length && hitcountArray.length == $("#searchterms input").length) {
                    console.log("we're all done.");
                    var partofschema = {
                        gameplay: [{ searchterm: String, hitcount: Number }]
                    };
                    for (i = 0; i < $("#searchterms input").length; i++) {
                        partofschema.gameplay[i] = {};
                        partofschema.gameplay[i].searchterm = searchArray[i];
                        partofschema.gameplay[i].hitcount = hitcountArray[i];
                    };

                    startGame(partofschema);

                };
            }).fail(function() {
                //console.log('ajax request failed: ' + this.searchkey);
                setTimeout(function() {
                    requestApi(info)
                }, 1000); //staggering requests since I was running into status code 429, if request fails then try again 2 seconds later
                return
            });

        };

    for (i = 0; i < searchData.length; i++) {

        requestApi(searchData[i]);
    };


};

// GAME / APP
var score = 0;
var newchoiceindex = 1;

function startGame(x) {
    var data = x;
    console.log(data);

    var rounds = data.gameplay.length - 1;


    var page = document.getElementById("gamestart")
    page.style.display = "block";
    page.style.position = "absolute";
    page.style.top = "0";
    page.style.right = "0";
    page.style.bottom = "0";
    page.style.left = "0";
    var div1 = document.createElement("div");
    div1.id = 'choice1display';
    div1.style.height = "50%";
    div1.style.width = "100%";
    page.appendChild(div1);



    var div2 = document.createElement("div");
    div2.id = 'choice2display';
    div2.style.height = "50%";
    div2.style.width = "100%";
    page.appendChild(div2);

    var c1button = document.getElementById('choice1display');
    var c2button = document.getElementById('choice2display');

    c1button.style.display = "flex";
    c2button.style.display = "flex";
    c1button.style.alignItems = "center";
    c2button.style.alignItems = "center";
    c1button.style.justifyContent = "center";
    c2button.style.justifyContent = "center";
    c1button.style.fontSize = "50px";
    c2button.style.fontSize = "50px";
    c1button.style.textTransform = "uppercase";
    c2button.style.textTransform = "uppercase";

    document.getElementById("scorekeeper").innerHTML=score;

    var choice1 = data.gameplay[0];
    c1button.innerHTML = choice1.searchterm;

    var choice2 = data.gameplay[1];
    c2button.innerHTML = choice2.searchterm;

    // c1button.addEventListener('click', checkAnswer(choice1, c1button, choice2,c2button,rounds, updateChoices));
    c1button.addEventListener('click', function() {
        if (choice1.hitcount > choice2.hitcount) {
            score += 1;
            document.getElementById("scorekeeper").innerHTML=score;
            newchoiceindex += 1;
            document.getElementById("answer").innerHTML = "CORRECT";
            window.setTimeout(function() { document.getElementById("answer").innerHTML = "" }, 1000);
            if (score == rounds) {
                c2button.innerHTML = choice2.searchterm + ": " + choice2.hitcount;
                gameOverWinner(data,score);
            } else {
                c1button.innerHTML = "";
                c1button.innerHTML = choice1.searchterm + ": " + choice1.hitcount;
                c2button.innerHTML = choice2.searchterm + ": " + choice2.hitcount;
                choice2 = data.gameplay[newchoiceindex];
                window.setTimeout(function() { c2button.innerHTML = "" }, 1000);
                window.setTimeout(function() { c2button.innerHTML = choice2.searchterm }, 1000);
            }
        } else {
            c1button.innerHTML = choice1.searchterm + ": " + choice1.hitcount;
            c2button.innerHTML = choice2.searchterm + ": " + choice2.hitcount
            gameOverLoser(data,score);
        };
    });
    c2button.addEventListener('click', function() {
        if (choice2.hitcount > choice1.hitcount) {
            score += 1;
            document.getElementById("scorekeeper").innerHTML=score;
            newchoiceindex += 1;
            document.getElementById("answer").innerHTML = "CORRECT";
            window.setTimeout(function() { document.getElementById("answer").innerHTML = "" }, 1000);
            //console.log("CORRECT!");
            if (score == rounds) {
                c1button.innerHTML = choice1.searchterm + ": " + choice1.hitcount;
                gameOverWinner(data,score);
            } else {
                c2button.innerHTML = "";
                c2button.innerHTML = choice2.searchterm + ": " + choice2.hitcount;
                c1button.innerHTML = choice1.searchterm + ": " + choice1.hitcount;
                choice1 = data.gameplay[newchoiceindex];
                window.setTimeout(function() { c1button.innerHTML = "" }, 1000);
                window.setTimeout(function() { c1button.innerHTML = choice1.searchterm }, 1000);
            }
        } else {
            c1button.innerHTML = choice1.searchterm + ": " + choice1.hitcount;
            c2button.innerHTML = choice2.searchterm + ": " + choice2.hitcount
            gameOverLoser(data,score);
        };
    });
};


function gameOverLoser(a,b) {
    console.log("gameover");
    console.log(a);
    var stageName = "gameover";
    showStage(stageName);
    document.getElementById("end message").innerHTML="Better luck next time! You scored at "+b;
    for (i=0;i<a.gameplay.length;i++){
        console.log(a.gameplay[i]);
        $.ajax({
            type: "POST",
            url: "/singleplayer/data",
            data: {
                "searchterm":a.gameplay[i].searchterm,
                "hitcount":JSON.stringify(a.gameplay[i].hitcount)
            },
            success: function(data) {
                //show content
                console.log('Successfully posted!')
            },
            error: function(err) {
                //show error message
                console.log("err");
            }
        });
    };
};

function gameOverWinner(c,d) {
    console.log("gamewon");
    console.log(c);
    var stageName = "gameover";
    showStage(stageName);
    document.getElementById("end message").innerHTML="Great Job, you beat all rounds! You scored at "+d;
    for (i=0;i<c.gameplay.length;i++){
        console.log(c.gameplay[i]);
        $.ajax({
            type: "POST",
            url: "/singleplayer/data",
            data: {
                "searchterm":c.gameplay[i].searchterm,
                "hitcount":JSON.stringify(c.gameplay[i].hitcount)
            },
            success: function(data) {
                //show content
                console.log('Successfully posted!')
            },
            error: function(err) {
                //show error message
                console.log("err");
            }
        });
    };
};

