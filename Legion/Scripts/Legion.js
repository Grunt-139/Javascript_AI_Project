// JavaScript source code
window.onload = function () {
    var canvas, ctx;

    var objects = new Array();

    var lastTime, targetFPS, elapsed;

    var bucketManager;
    var isPaused = false;
    var ctrlPressed = false;
    var spawnTypeBox, teamPicker;

    function init() {
        canvas = document.getElementById('gameCanvas');

        spawnTypeBox = document.getElementById('spawnTypeBox');
        spawnTypeBox.max = TYPES.LENGTH - 1;
        spawnTypeBox.min = TYPES.SOLDIER;

        teamPicker = document.getElementById('teamPicker');

        ctx = canvas.getContext("2d");

        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;

        bucketManager = new SpatialBucketManager(48, canvas.width, canvas.height);


        canvas.addEventListener('click', onClickHandler);
        document.addEventListener('keyup', onKeyUpHandler);
        document.addEventListener('keydown', onKeyDownHandler);

        targetFPS = 10;
        update();
    }

    //Adds a new Drone, with a set position, speed and turn speed
    function spawnObject(pos, type) {
        //var a = new AiObject(pos.x, pos.y, speed, turnSpeed)
        //objects.push(a);
        //bucketManager.addObject(a);

        if (type == TYPES.SOLDIER) {
            var s = new Soldier(pos.x, pos.y);
            s.team = teamPicker.value;
            objects.push(s);
            bucketManager.addObject(s);
        } else {
            return;
        }

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
            spawnObject(new Vector2(e.x, e.y), spawnTypeBox.value);
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
    }

    function onKeyDownHandler(e) {

        if (e.keyCode == 17) {
            ctrlPressed = true;
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
                for (var i = 0; i < objects.length; i++) {
                    objects[i].update();
                    //KeepObjectsInBounds(objects[i]);
                    WrapObjects(objects[i]);
                }

            }
            bucketManager.update();

            //Check for Collisions
            collisionChecks();

            //Draws everyone
            draw();
        }

        lastTime = now;

        //Keep everyone going at a nice smooth pace
        requestAnimationFrame(update, canvas);
    }

    function collisionChecks() {
        var pairs = bucketManager.queryForCollisionPairs();

        for (var i = 0; i < pairs.length; i++) {
            //Get overlap
            var x, y;
            x = pairs[i][0].pos.x - pairs[i][1].pos.x;
            y = pairs[i][0].pos.y - pairs[i][1].pos.y;
            //Move them
            pairs[i][0].pos.x += x;
            pairs[i][0].pos.y += y;

            pairs[i][1].pos.x += x;
            pairs[i][1].pos.y += y;

        }
    }

    function draw() {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawDebug(ctx);

        bucketManager.draw(ctx);

        for (var i = 0; i < objects.length; i++) {
            objects[i].draw(ctx);
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