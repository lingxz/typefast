var canvas;
var currentScreen;
var mainGameScreen;

let words = [];
let wordblocks = [];
let wordsToWordblocks = {};

function beginloop() {
    var frameId = 0;
    var lastFrame = Date.now();

    function loop() {
        var thisFrame = Date.now();
        var elapsed = thisFrame - lastFrame;

        frameId = window.requestAnimationFrame(loop);

        currentScreen.update(elapsed);
        currentScreen.draw(surface);

        lastFrame = thisFrame;
    }
    loop();
}

canvas = $('div#main');

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
    wordblock.appendTo('body');
    wordblock.word = getRandomWord();
    wordblock.text(wordblock.word);
    wordblock.css({
        position: 'absolute',
        top: position.y,
        left: 0,
    });


    wordblock.update = function(elapsed) {
        const angle = Math.random() * Math.PI - Math.PI/2.; // replace with random function
        const dx = speed * Math.cos(angle) * elapsed;
        const dy = speed * Math.sin(angle) * elapsed;

        const currentPos = this.position();
        const newPos = {
            top: currentPos.top + dy,
            left: currentPos.left + dx
        };

        if (newPos.top > $(window).height() || newPos.left > $(window).width()) {
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
    let rate = 1;
    let numWords = 5;
    let speed = 0.1;
    let typedInput = "";

    let totalElapsed = 0;
    let typedInputDiv = $("<input type='text' autofocus/>", {"class": "typed"});
    typedInputDiv.appendTo('body');
    typedInputDiv.text(typedInput);
    typedInputDiv.css({
        position: 'absolute',
        bottom: 0,
    })

    function start() {
        for (var i = 0; i < numWords; i++) {
            const windowHeight = $(window).height();
            let random_y = Math.floor(Math.random() * windowHeight * 3/4);
            let wordblock = makeWordBlock(random_y, speed);
            words.push(wordblock.word);
            wordblocks.push(wordblock);
            wordsToWordblocks[wordblock.word] = wordblock;
        }

        typedInputDiv.on('input', function() {
            typedInput = typedInputDiv.val();

            if (typedInput in wordsToWordblocks) {
                wordsToWordblocks[typedInput].destroy()
                currentScreen.removeWordBlock(typedInput);
                typedInputDiv.val('');
            }
        })
    }

    function update(elapsed) {
        let indicesToRemove = [];
        for (var i = 0; i < wordblocks.length; i++) {
            let result = wordblocks[i].update(elapsed);
            if (!result) {
                indicesToRemove.push(i);
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
        totalElapsed += elapsed;
    }

    function removeWordBlock(word) {
        delete wordsToWordblocks[word];
        words = words.filter(function(e){return e !== word})
        wordblocks = wordblocks.filter(function(e){return e.word !== word})
    }

    return {
        start: start,
        update: update,
        removeWordBlock: removeWordBlock,
    }
}())

currentScreen = (function() {
    // currentScreen = mainGameScreen;
    // currentScreen.start();
    return mainGameScreen;
}())

function beginLoop() {
    var lastFrame = Date.now();
    currentScreen.start();
    const interval = 50;
    var id = setInterval(frame, interval);

    function frame() {
        var thisFrame = Date.now();
        var elapsed = thisFrame - lastFrame;

        currentScreen.update(elapsed);
        lastFrame = thisFrame;
    }
}

beginLoop();