// JavaScript source code
window.onload = function () {
    var canvas, ctx;

    var drones = new Array();
    var blockObjects = new Array();

    var lastTime, targetFPS, elapsed;

    var bucketManager;
    var isPaused = false;
    var ctrlPressed = false;

    function init() {
        canvas = document.getElementById('gameCanvas');

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
    function spawnObject(pos, speed, turnSpeed) {
        var d = new Drone(pos.x, pos.y, speed, turnSpeed)
        drones.push(d);
        bucketManager.addObject(d);
    }

    function spawnBox(pos) {
        var block = new Block(pos.x, pos.y);
        blockObjects.push(block);
        bucketManager.addObject(block);
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

            var blockAmount = document.getElementById('blockAmount').value;
            for(var k=0; k < blockAmount; k++){
                spawnBox(new Vector2(randomIntFromInterval(0,ctx.canvas.width),randomIntFromInterval(0,ctx.canvas.height)));
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
                for (var i = 0; i < drones.length; i++) {
                    drones[i].update();
                    //KeepObjectsInBounds(drones[i]);
                    WrapObjects(drones[i]);
                }

                for (var k = 0; k < blockObjects.length; k++) {
                    blockObjects[k].update();
                }

            }
            bucketManager.update();

            var pairs = bucketManager.queryForCollisionPairs();

            for (var j = 0; j < pairs.length; j++) {
                var obj1 = pairs[j][0];
                var obj2 = pairs[j][1];
                //Collision between drone and box
                if ((obj1.type === TYPES.DRONE && obj2.type === TYPES.BOX) || (obj1.type === TYPES.DRONE && obj2.type === TYPES.BOX)) {

                    //TYPE 0 Drone
                    //Type 1 Box

                    //Now, if the drone has a block and it just hit a block well then we need to get rid of the block
                    if (obj1.type === TYPES.DRONE && obj1.attachedBlock !== undefined) {
                        obj1.attachedBlock.holder = undefined;
                        obj1.attachedBlock = undefined;
                        break;
                    }
                    else if (obj2.type === TYPES.DRONE && obj2.attachedBlock !== undefined) {
                        obj2.attachedBlock.holder = undefined;
                        obj2.attachedBlock = undefined;
                        break;
                    }

                    //If the box does not have a holder, we tell it that the drone is now its holder
                    if (obj1.type === TYPES.BOX && obj1.holder === undefined && obj2.attachedBlock === undefined) {
                        obj1.holder = obj2;
                        obj2.attachedBlock = obj1;
                        break;
                    }
                    else if (obj2.type === TYPES.BOX && obj2.holder === undefined && obj1.attachedBlock === undefined){
                        obj2.holder = obj1;
                        obj1.attachedBlock = obj2;
                        break;
                    }

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

        for (var k = 0; k < blockObjects.length; k++) {
            blockObjects[k].draw(ctx);
        }

        for (var i = 0; i < drones.length; i++) {
            drones[i].draw(ctx);
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