// JavaScript source code
window.onload = function () {
    var canvas, ctx;

    var aiObjects = new Array();

    var lastTime, targetFPS, elapsed;

    var mousePos = new Vector2(0, 0);

    var bucketManager;
    var isPaused = false;
    var ctrlPressed = false;
    var altPressed = false;
    var shiftPressed = false;

    function init() {
        canvas = document.getElementById('gameCanvas');

        ctx = canvas.getContext("2d");

        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;

        bucketManager = new SpatialBucketManager(48, canvas.width, canvas.height);


        canvas.addEventListener('click', onClickHandler);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('keyup', onKeyUpHandler);
        document.addEventListener('keydown', onKeyDownHandler);

        targetFPS = 10;
        update();
    }

    //Adds a new Drone, with a set position, speed and turn speed
    function spawnObject(pos, speed, turnSpeed) {
        var d = new AiObject(pos.x, pos.y, speed, turnSpeed)
        aiObjects.push(d);
        bucketManager.addObject(d);
    }

    function onMouseMove(e) {
        mousePos.x = e.x;
        mousePos.y = e.y;
    }


    function onClickHandler(e) {

        var col = Math.floor(e.x * bucketManager.cellSizeDecimal);
        var row = Math.floor(e.y * bucketManager.cellSizeDecimal);
        var objs = bucketManager.queryGrid(col, row);
        //Get the object from our bucket
        for (var i = 0; i < objs.length; i++) {
            if (radiusCheck(objs[i], e)) {
                objs[i].increaseDebug();
            }
        }

        if (ctrlPressed) {
            var maxSpeed = document.getElementById('maxSpeedAmount').value;
            var turnSpeed = document.getElementById('turnSpeedAmount').value;
            var amount = document.getElementById('spawnAmount').value;

            for (var j = 0; j < amount; j++) {
                //Spawn a new object
                spawnObject(new Vector2(e.x, e.y), maxSpeed, turnSpeed);
            }
        }
    }

    function onKeyUpHandler(e) {
        //When you press the escape key
        if (e.keyCode == 27) {
            isPaused = !isPaused;
        }

        if (e.keyCode == 17) {
            ctrlPressed = false;
        }

        if (e.keyCode == 16) {
            shiftPressed = false;
        }

        if (e.keyCode == 18) {
            altPressed = false;
        }
    }

    function onKeyDownHandler(e) {

        if (e.keyCode == 17) {
            ctrlPressed = true;
        }

        if (e.keyCode == 16) {
            shiftPressed = true;
        }

        if (e.keyCode == 18) {
            altPressed = true;
        }
    }

    function radiusCheck(obj, e) {

        var vec = new Vector2(obj.pos.x - e.x, obj.pos.y - e.y);
        var mag = vec.magSqr();
        if (mag < obj.radius * obj.radius) {
            return true;
        } else {
            return false;
        }
    }


    function update(now) {

        if (!lastTime) { lastTime = now; }
        elapsed = now - lastTime;

        if (lastTime > targetFPS) {
            if (!isPaused) {
                for (var i = 0; i < aiObjects.length; i++) {
                    aiObjects[i].update();
                    //KeepObjectsInBounds(drones[i]);
                    WrapObjects(aiObjects[i]);
                }
            }
            bucketManager.update();

            //If alt is pressed, make them flee
            if (altPressed) {
                var col = Math.floor(mousePos.x * bucketManager.cellSizeDecimal);
                var row = Math.floor(mousePos.y * bucketManager.cellSizeDecimal);
                var objs = bucketManager.queryGrids(col, row,10);

                for (var j = 0; j < objs.length; j++) {
                    objs[j].flee(new Vector2(mousePos.x, mousePos.y));
                }
            }

            //if shift is pressed, make them seek
            if (shiftPressed) {
                var col = Math.floor(mousePos.x * bucketManager.cellSizeDecimal);
                var row = Math.floor(mousePos.y * bucketManager.cellSizeDecimal);
                var objs = bucketManager.queryGrids(col, row,10);

                for (var k = 0; k < objs.length; k++) {
                    objs[k].seek(new Vector2(mousePos.x, mousePos.y));
                }
            }

            //Draws everyone
            draw();
        }

        lastTime = now;

        //Keep everyone going at a nice smooth pace
        requestAnimationFrame(update, canvas);
    }


    function draw() {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawDebug(ctx);

        bucketManager.draw(ctx);

        for (var k = 0; k < aiObjects.length; k++) {
            aiObjects[k].draw(ctx);
        }


    }

    function drawDebug(ctx) {

        //Center
        ctx.beginPath();
        ctx.arc(canvas.width * 0.5, canvas.height * 0.5, 10, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'orange';
        ctx.fill();
        ctx.closePath();

        //Top
        ctx.beginPath();
        ctx.arc(canvas.width * 0.5, 0, 10, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'orange';
        ctx.fill();
        ctx.closePath();
        //Bottom
        ctx.beginPath();
        ctx.arc(canvas.width * 0.5, canvas.height, 10, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'orange';
        ctx.fill();
        ctx.closePath();
        //Left
        ctx.beginPath();
        ctx.arc(0, canvas.height * 0.5, 10, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'orange';
        ctx.fill();
        ctx.closePath();
        //Right
        ctx.beginPath();
        ctx.arc(canvas.width, canvas.height * 0.5, 10, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'orange';
        ctx.fill();
        ctx.closePath();


        ctx.fillStyle = 'black';
        ctx.font = '20px sans-serif';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Update Rate: ' + elapsed, 50, 100);

        bucketManager.drawDebug(ctx);

    }


    function WrapObjects(obj) {
        //X
        if (obj.pos.x > canvas.width) {
            obj.pos.x = obj.radius;

        }

        if (obj.pos.x < 0) {
            obj.pos.x = canvas.width - obj.radius;

        }
        //Y
        if (obj.pos.y > canvas.height) {
            obj.pos.y = obj.radius;

        }
        if (obj.pos.y < 0) {
            obj.pos.y = canvas.height - obj.radius;
        }
    }

    function KeepObjectsInBounds(obj) {

        //Keep it within screen bounds
        //X
        if (obj.pos.x > canvas.width) {
            obj.pos.x = canvas.width - obj.radius;
        }

        if (obj.pos.x < 0) {
            obj.pos.x = obj.radius;

        }
        //Y
        if (obj.pos.y > canvas.height) {
            obj.pos.y = canvas.height - obj.radius;

        }
        if (obj.pos.y < 0) {
            obj.pos.y = obj.radius;
        }

    }




    init();
};