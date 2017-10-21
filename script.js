var canvas;
var currentScreen;
var mainGameScreen;

let words = [];
let wordblocks = [];
let wordsToWordblocks = {};

canvas = $('div#board');

jQuery.fn.center = function () {
    this.css("position","absolute");
    this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2) + 
                                                $(window).scrollTop()) + "px");
    this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2) + 
                                                $(window).scrollLeft()) + "px");
    return this;
}

function getRandomWord() {
    while (true) {
        let randomWord = wordlist[Math.floor(Math.random()*wordlist.length)];
        if (!(randomWord in wordsToWordblocks)) {
            return randomWord;
        }
    }
}

function makeWordBlock(y, speed){
    var position = {
        x: 0,
        y: y,
    }

    const wordblock = $("<div>", {"class": "word"});
    canvas.append(wordblock);
    wordblock.word = getRandomWord();
    wordblock.text(wordblock.word);
    wordblock.css({
        position: 'absolute',
        top: position.y,
        left: 0,
    });


    wordblock.update = function(elapsed) {
        const random = Math.random();
        let angle;
        if (random > 0.8) {
            angle = Math.random() * Math.PI - Math.PI/2.; // replace with random function
        } else {
            angle = 0;
        }
        const dx = speed * Math.cos(angle) * elapsed;
        const dy = speed * Math.sin(angle) * elapsed;

        const currentPos = this.position();
        const newPos = {
            top: currentPos.top + dy,
            left: currentPos.left + dx
        };

        if (newPos.top > $(window).height() || newPos.left + this.width() > $(window).width()) {
            this.destroy();
            return false;
        }

        this.css('top', currentPos.top + dy);
        this.css('left', currentPos.left + dx);
        return true;
    };

    wordblock.destroy = function() {
        this.remove();
    }

    return wordblock;
}

mainGameScreen = (function() {

    let initial,
        params,
        timeintervals,
        numwords,
        typedInput,
        missed,
        score,
        maxMissed,
        gameOver,
        typedInputDiv,
        scoresDiv,
        maxParams;

    function setInitialParams() {
        initial = {
            rate: 0.5,  // word blocks per SECOND
            drate: 0.01,
            speed: 0.03,
            dspeed: 0.0002,
        };

        params = initial;
        maxParams = {
            rate: 1.33,
            speed: 0.1,
        }

        timeIntervals = {
            speed: 0,
            dspeed: 1000,
            rate: 0,
            drate: 1000,
            beforeLastAdd: 0,
        }

        numWords = 5;
        
        typedInput = "";
        missed = 0;
        score = 0;
        maxMissed = 3;
        gameOver = false;

        typedInputDiv = $("<input type='text' autofocus/>", {"id": "game-input", "class": "typed"});

        scoresDiv = $("<div>", {"class": "missed"});
    }

    setInitialParams();

    function addWordBlock() {
        const windowHeight = $(window).height();
        let random_y = Math.floor(Math.random() * windowHeight * 3/4);
        let wordblock = makeWordBlock(random_y, params.speed);
        words.push(wordblock.word);
        wordblocks.push(wordblock);
        wordsToWordblocks[wordblock.word] = wordblock;
    }

    function start() {
        canvas.append(typedInputDiv)
        typedInputDiv.text(typedInput);
        typedInputDiv.css({
            position: 'absolute',
            bottom: '10px',
            left: '10px',
        })
        typedInputDiv.focus();

        canvas.append(scoresDiv);
        scoresDiv.css({
            position: 'absolute',
            bottom: '10px',
            right: '10px',
        })
        scoresDiv.text("Score: " + score + " Missed: " + missed);

        typedInputDiv.on('input', function() {
            typedInput = typedInputDiv.val().trim();

            if (typedInput in wordsToWordblocks) {
                wordsToWordblocks[typedInput].destroy()
                removeWordBlock(typedInput);
                score += 1;
                typedInputDiv.val('');
                scoresDiv.text("Score: " + score + " Missed: " + missed);
            }
        })
        typedInputDiv.keypress(function(e) {
            if (e.which == 13) {
                // clear input on enter
                typedInputDiv.val('');
            }
        })
    }

    function pause() {
        typedInputDiv.prop("disabled", true);
    }

    function unpause() {
        typedInputDiv.prop("disabled", false);
        typedInputDiv.focus();
    }

    function update(elapsed) {
        let indicesToRemove = [];
        for (var i = 0; i < wordblocks.length; i++) {
            let result = wordblocks[i].update(elapsed);
            if (!result) {
                indicesToRemove.push(i);
                missed += 1
                scoresDiv.text("Score: " + score + " Missed: " + missed);
                if (missed >= maxMissed) {
                    gameOver = true;
                }
            }
        }
        indicesToRemove.sort(function(a, b) {
            return a - b;
        });

        while (indicesToRemove.length) {
            let current = indicesToRemove.pop();
            let wb = wordblocks[current];
            wordblocks.splice(current, 1);
            delete wordsToWordblocks[wb.word];
            words = words.filter(function(e){return e !== wb.word});
        }

        timeIntervals.speed += elapsed;
        timeIntervals.rate += elapsed;
        timeIntervals.beforeLastAdd += elapsed;

        let wordBlocksToAdd = Math.floor(timeIntervals.beforeLastAdd * params.rate / 1000.);
        if (wordBlocksToAdd > 0) {
            let current = timeIntervals.beforeLastAdd;
            timeIntervals.beforeLastAdd = current - wordBlocksToAdd * 1000 / params.rate;
            for (var i = 0; i < wordBlocksToAdd; i++) {
                addWordBlock();
            }
        }

        if (timeIntervals.speed > timeIntervals.dspeed) {
            timeIntervals.speed = 0;
            if (params.speed < maxParams.speed) {
                params.speed += initial.dspeed;
            }
        };

        if (timeIntervals.rate > timeIntervals.drate) {
            timeIntervals.rate = 0;
            if (params.rate < maxParams.rate) {
                params.rate += initial.drate;
            }
        };

    }

    function removeWordBlock(word) {
        delete wordsToWordblocks[word];
        words = words.filter(function(e){return e !== word})
        wordblocks = wordblocks.filter(function(e){return e.word !== word})
    }

    function isGameOver() {
        return gameOver;
    }

    function getGameScore() {
        return score;
    }

    return {
        start: start,
        update: update,
        isGameOver: isGameOver,
        getGameScore: getGameScore,
        reset: setInitialParams,
        pause: pause,
        unpause: unpause,
    }
}())


currentScreen = (function() {
    
    let interval_ids = [];

    function startGame() {
        clearAllIntervals();
        canvas.empty();
        $("typed")
        $('div#intro').hide();
        beginLoop();
    }

    function restartGame() {
        clearAllIntervals();
        $('div#gameover').hide();
        mainGameScreen.reset();
        beginLoop();
    }

    function endGame() {
        $("#pause-screen").hide();
        canvas.empty();
        clearAllIntervals();
        const score = mainGameScreen.getGameScore();
        const highscore = localStorage.getItem("typefast-highscore");
        let newHighScore = false;
        if (highscore !== null) {
            console.log(highscore);
            console.log(score);
            if (score > highscore) {
                localStorage.setItem("typefast-highscore", score);
                newHighScore = true;
            }
            $('#prev-highscore').text(highscore);
        } else {
            localStorage.setItem("typefast-highscore", score);
            $('#prev-highscore-div').hide();
        }
        if (!newHighScore) {
            $('#highscore-congrats').hide();
        } else {
            $('#highscore-congrats').show();
        }
        $("div#score").text(score);
        $("div#gameover").show();
    }

    function beginLoop() {
        canvas.css("opacity", 1);
        var lastFrame = Date.now();
        mainGameScreen.start();
        const interval = 50;
        id = setInterval(frame, interval);
        interval_ids.push(id);

        function frame() {
            var thisFrame = Date.now();
            var elapsed = thisFrame - lastFrame;

            mainGameScreen.update(elapsed);
            if (mainGameScreen.isGameOver()) {
                clearInterval(id);
                endGame();
            }
            lastFrame = thisFrame;
        }

        let paused = false;
        window.addEventListener('keypress', function(e) {
            if (e.code === 'Space') {
                if (paused) {
                    // unpause game
                    canvas.css("opacity", 1);
                    $('div#pause-screen').hide();
                    mainGameScreen.unpause();
                    let id = setInterval(frame, interval);
                    interval_ids.push(id);
                    lastFrame = Date.now();
                } else {
                    $('div#pause-screen').center();
                    $('div#pause-screen').show();
                    canvas.css("opacity", 0.4);
                    // pause game
                    clearAllIntervals();
                    mainGameScreen.pause();
                }
                paused = !paused;
            }
        }, true)
    }

    function clearAllIntervals() {
        for (var i = interval_ids.length - 1; i >= 0; i--) {
            clearInterval(interval_ids[i]);
        }
    }

    return {
        startGame: startGame,
        restartGame: restartGame,
        endGame: endGame,
    }
}())