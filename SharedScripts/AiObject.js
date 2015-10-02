// JavaScript source code
var uniqID = 0;
var TYPES = Object.freeze({BASE:0,DRONE:1,BOX:2, SOLDIER:3, LENGTH:4});

//AI BASE OBJECT****************************************************************************************************************************
function AiObject(x, y, speed, turnSpeed) {
    this.id = uniqID++;
    this.type = TYPES.BASE;
    this.steering = new Vector2(0, 0);
    this.pos = new Vector2(x, y);
    this.velocity = new Vector2(randomIntFromInterval(-1, 1), randomIntFromInterval(-1, 1));
    this.maxSpeed = speed;
    this.turnSpeed = turnSpeed;
    this.wanderCircleDistance = 10;
    this.wanderCircleRadius = 5;
    this.wanderAngle = 0;
    this.radius = 5;
    this.wanderAngleAdjustment = 10;
    this.colour = 'black';
    this.fleeTargets = [];
    this.seekTargets = [];
    this.DEBUG_TYPE = { NONE: 0, ALL: 1, SEEK_FLEE: 2, SEEK: 3, FLEE: 4, VELOCITY: 5, WANDER: 6, FLOCK: 7, LENGTH: 8 }
    this.debugIndex = 0;
    this.col = 0;
    this.row = 0;
    this.myBucketManager = null;
    this.nearbyFriends = [];
    this.separationWeight = 1 / this.radius;
}

AiObject.prototype.draw = function draw(ctx) {

    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = this.colour;
    ctx.fill();
    ctx.closePath();

    if (this.debugIndex > 0) {

        if (this.debugIndex > this.DEBUG_TYPE.LENGTH) {
            this.debugIndex = 0;
        }

        this.drawDebug(ctx);
    }
};

//DEBUG***************************************************************************************************************************************
AiObject.prototype.drawDebug = function DrawDebug(ctx) {

    var i, j, k, v, d;


    //Draw flocking stuff
    if (this.debugIndex === this.DEBUG_TYPE.ALL || this.debugIndex === this.DEBUG_TYPE.FLOCK) {
        for (k = 0; k < this.nearbyFriends.length; k++) {
            if (this.nearbyFriends[k].id === this.id) {
                continue;
            }
            //ctx.beginPath();
            //ctx.arc(this.nearbyFriends[k].pos.x, this.nearbyFriends[k].pos.y, this.nearbyFriends[k].radius, 0, 2 * Math.PI, false);
            //ctx.fillStyle = 'orange';
            //ctx.fill();
            //ctx.closePath();
            ctx.beginPath();
            ctx.moveTo(this.pos.x, this.pos.y);
            ctx.lineTo(this.nearbyFriends[k].pos.x, this.nearbyFriends[k].pos.y);
            ctx.strokeStyle = 'orange';
            ctx.stroke();
        }
    }

    if (this.debugIndex < this.DEBUG_TYPE.FLEE || this.debugIndex === this.DEBUG_TYPE.ALL) {
        //Draw line to seek targets
        for (var i = 0; i < this.seekTargets.length; i++) {
            ctx.beginPath();
            ctx.moveTo(this.pos.x, this.pos.y);
            ctx.lineTo(this.seekTargets[i].x, this.seekTargets[i].y);
            ctx.strokeStyle = 'red';
            ctx.stroke();
        }
    }

    if (this.debugIndex === this.DEBUG_TYPE.FLEE || this.debugIndex < this.DEBUG_TYPE.SEEK || this.debugIndex === this.DEBUG_TYPE.ALL) {
        //Draw line to flee targets
        for (j = 0; j < this.fleeTargets.length; j++) {
            ctx.beginPath();
            ctx.moveTo(this.pos.x, this.pos.y);
            ctx.lineTo(this.fleeTargets[j].x, this.fleeTargets[j].y);
            ctx.strokeStyle = 'blue';
            ctx.stroke();
        }
    }
    if (this.debugIndex === this.DEBUG_TYPE.VELOCITY || this.debugIndex === this.DEBUG_TYPE.ALL) {
        //Draw current velocity
        v = this.velocity.normal();
        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.pos.x + (v.x * 20), this.pos.y + (v.y * 20));
        ctx.strokeStyle = 'black';
        ctx.stroke();

        //Draw steering velocity
        d = this.steering.normal();
        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.pos.x + (d.x * 20), this.pos.y + (d.y * 20));
        ctx.strokeStyle = 'orange';
        ctx.stroke();
    }

    //Draw wander info
    if (this.debugIndex === this.DEBUG_TYPE.WANDER || this.debugIndex === this.DEBUG_TYPE.ALL) {

        v = this.velocity.normal();

        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.pos.x + (v.x * this.wanderCircleDistance), this.pos.y + (v.y * this.wanderCircleDistance));
        ctx.strokeStyle = 'pink';

        ctx.beginPath();
        ctx.arc(this.pos.x + (v.x * this.wanderCircleDistance), this.pos.y + (v.y * this.wanderCircleDistance), this.wanderCircleRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'pink';
        ctx.stroke();

    }


};

AiObject.prototype.increaseDebug = function () {
    this.debugIndex++;
    if (this.debugIndex >= this.DEBUG_TYPE.LENGTH) {
        this.debugIndex = this.DEBUG_TYPE.NONE;
    }
    console.log(this.debugIndex);
}
//END DEBUG**********************************************************************************************************************

//UPDATE*************************************************************************************************************************
AiObject.prototype.update = function update() {
    //Seek Targets
    for (var j = 0; j < this.seekTargets.length; j++) {
        this.seek(this.seekTargets[j], 0);
    }

    //Flee Targets
    for (var i = 0; i < this.fleeTargets.length; i++) {
        this.flee(this.fleeTargets[i]);
    }

    this.wander();

    this.applySteering();
    this.reset();
};
//END UPDATES********************************************************************************************************************

//BEHAVIOUR*************************************************************************************************************
AiObject.prototype.flock = function () {
    //Flocking
    //1. Separation
    //2. Alignment
    //3. Cohesion

    var i, v, s, a, c, len, ai;
    s = new Vector2(0, 0);
    a = new Vector2(0, 0);
    c = new Vector2(0, 0);
    v = new Vector2(0, 0);
    len = 0;


    for (i = 0; i < this.nearbyFriends.length; i++) {

        if (this.nearbyFriends[i].id === this.id)
            continue;
        len++;

        //1. Separation
        //Create and add together the repulsive forces from our friends
        v = new Vector2(this.pos.x - this.nearbyFriends[i].pos.x, this.pos.y - this.nearbyFriends[i].pos.y);
        v.normalize();
        v.multScalar(this.separationWeight);
        s.add(v);

        //2. Alignment
        //We add all of our friends velocities together
        //Once out of this for loop we will find the average
        //Then subtract that from our velocity
        a.add(this.nearbyFriends[i].velocity);

        //3. Cohesion
        //We add together everyones position, afterwards we will find the average of it 
        //And direct the object towards that point
        c.add(this.nearbyFriends[i].pos);
    }

    //Lets get the average of our alignment and cohesion steps
    if (len > 0) {
        a.divScalar(len);
        c.divScalar(len);

        //Normalize alignment
        a.normalize();
        //Normalize the cohesion
        c.normalize();

        //Apply Separation
        this.steering.add(s);
        //Apply Alignment
        a.sub(this.velocity.neg());
        this.steering.add(a);
        //Apply Cohesion
        this.seek(c, 0);
    }


};

AiObject.prototype.FindNearbyFriends = function FindNearbyFriends() {
    if (!(typeof this.myBucketManager === 'null')) {
        this.col = Math.floor(this.pos.x * this.myBucketManager.cellSizeDecimal);
        this.row = Math.floor(this.pos.y * this.myBucketManager.cellSizeDecimal);
        //First we update our nearby friends
        this.nearbyFriends = this.myBucketManager.queryGrids(this.col, this.row, 3);
    }

    if (this.nearbyFriends.length > 1) {
        this.flock();
    }
};


AiObject.prototype.applySteering = function ApplySteering() {

    //this.steering.x = clamp(this.steering.x, -this.maxSpeed, this.maxSpeed);
    //this.steering.y = clamp(this.steering.y, -this.maxSpeed, this.maxSpeed);

    //this.steering.divScalar(this.mass);

    //Push in the right direction
    var s = this.steering.normal();
    //Right speed
    s.multScalar(this.turnSpeed);
    //Now we update our velocity
    this.velocity.add(s);
    this.velocity.normalize();
    this.velocity.multScalar(this.maxSpeed);

    //this.velocity.x = clamp(this.velocity.x, -this.maxSpeed, this.maxSpeed);
    //this.velocity.y = clamp(this.velocity.y, -this.maxSpeed, this.maxSpeed);

    this.pos.add(this.velocity);

};

//Behaviours
AiObject.prototype.seek = function Seek(target, slowingRadius) {

    var desiredVelocity = new Vector2(target.x, target.y);
    desiredVelocity.sub(this.pos);
    var dist = desiredVelocity.mag();

    //If arrival is true, we slow as we get closer to the object we are seeking
    if (dist < slowingRadius) {
        desiredVelocity.normalize();
        desiredVelocity.multScalar(this.maxSpeed * (dist / slowingRadius));

        //Else we just keep on heading towards it
    } else {
        desiredVelocity.normalize();
        desiredVelocity.multScalar(this.maxSpeed);
    }


    desiredVelocity.sub(this.velocity);

    this.steering.add(desiredVelocity);
};

AiObject.prototype.flee = function Flee(target) {

    var desiredVelocity = new Vector2(this.pos.x, this.pos.y);
    desiredVelocity.sub(target);

    desiredVelocity.sub(this.velocity);

    this.steering.add(desiredVelocity);
};

AiObject.prototype.wander = function Wander() {
    //Calculate the circle center
    var circleCenter = new Vector2(this.velocity.x, this.velocity.y);
    circleCenter.multScalar(this.wanderCircleDistance);

    //Calculate the displacement
    var displacement = new Vector2(0, this.wanderCircleRadius);

    //Randomly change the vector direction by making it change its current angle
    displacement = this.setAngle(displacement, this.wanderAngle);

    //Change wanderAngle just a bit, so it won't have the same value next frame.
    this.wanderAngle += ((Math.random() * 2) + -1) * this.wanderAngleAdjustment;
    circleCenter.add(displacement);

    this.steering.add(circleCenter);
};
//END BEHAVIOURS**********************************************************************************************************************

AiObject.prototype.reset = function Reset() {
    this.steering.x = 0;
    this.steering.y = 0;
};

AiObject.prototype.reverse = function Reverse() {
    this.steering.multScalar(-1);
};

AiObject.prototype.reverseX = function ReverseX() {
    this.steering.x *= -1;
};

AiObject.prototype.reverseY = function ReverseY() {
    this.steering.y *= -1;
};


AiObject.prototype.setAngle = function SetAngle(vec, rot) {
    var length = vec.mag();
    vec.x = Math.cos(rot) * length;
    vec.y = Math.sin(rot) * length;

    return vec;
};


//DRONES****************************************************************************************************************************
function Soldier(x, y) {
    this.id = uniqID++;
    this.type = TYPES.SOLDIER;
    this.steering = new Vector2(0, 0);
    this.pos = new Vector2(x, y);
    this.velocity = new Vector2(randomIntFromInterval(-1, 1), randomIntFromInterval(-1, 1));
    this.maxSpeed = 2;
    this.turnSpeed = 1;
    this.wanderCircleDistance = 15;
    this.wanderCircleRadius = 8;
    this.wanderAngle = 0;
    this.radius = 5;
    this.wanderAngleAdjustment = 10;
    this.team = 'blue';
    this.fleeTargets = [];
    this.seekTargets = [];
    this.mass = 5;
    this.DEBUG_TYPE = { NONE: 0, ALL: 1, SEEK_FLEE: 2, SEEK: 3, FLEE: 4, VELOCITY: 5, WANDER: 6, FLOCK: 7, LENGTH: 8 }
    this.debugIndex = 7;
    this.col = 0;
    this.row = 0;
    this.myBucketManager = null;
    this.nearbyFriends = [];
    this.nearbyEnemies = [];
    this.separationWeight = 1 / this.radius;
    this.attachedBlock = undefined;


    //Combat stuff
    this.health = 1;
    this.armour = 1;
    this.maxDmg = 10;
    this.minDmg = 5;
    this.defense = 10;

    this.takeDamage = function (dmg) {

    }

    this.getAttack = function () {

    }
}


Soldier.prototype = new AiObject();
Soldier.prototype.constructor = Soldier;

Soldier.prototype.draw = function (ctx) {
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI * this.health, false);
    ctx.fillStyle = this.team;
    ctx.fill();
    ctx.closePath();

    if (this.debugIndex > 0) {

        if (this.debugIndex > this.DEBUG_TYPE.LENGTH) {
            this.debugIndex = 0;
        }

        this.drawDebug(ctx);
    }
}

Soldier.prototype.update = function () {

    this.FindNearbyFriends();
    this.FindNearbyEnemies();

    for (var i = 0; i < this.seekTargets.length; i++) {
        this.seek(this.seekTargets[i].pos, 0);
    }

    this.wander();

    this.applySteering();
    this.reset();
}

Soldier.prototype.FindNearbyFriends = function () {
    if (!(typeof this.myBucketManager === 'null')) {
        this.col = Math.floor(this.pos.x * this.myBucketManager.cellSizeDecimal);
        this.row = Math.floor(this.pos.y * this.myBucketManager.cellSizeDecimal);
        //First we update our nearby friends
        var f = this.myBucketManager.queryGrids(this.col, this.row, 3);

        //Team check
        for (var i = 0; i < f.length; i++) {
            if (f[i].team !== this.team) {
                f.splice(i, 1);
                i--;
            }
        }

        this.nearbyFriends = f;

    }

    if (this.nearbyFriends.length > 1) {
        this.flock();
    }
}

Soldier.prototype.FindNearbyEnemies = function () {
    if (!(typeof this.myBucketManager === 'null')) {
        this.col = Math.floor(this.pos.x * this.myBucketManager.cellSizeDecimal);
        this.row = Math.floor(this.pos.y * this.myBucketManager.cellSizeDecimal);
        //First we update our nearby friends
        var e = this.myBucketManager.queryGrids(this.col, this.row, 3);

        //Team check
        for (var i = 0; i < e.length; i++) {
            if (e[i].team === this.team) {
                e.splice(i, 1);
                i--;
            }
        }

        //Set it
        this.nearbyEnemies = e;

        if (this.nearbyEnemies.length > 0) {
            this.seekTargets.push(this.nearbyEnemies[0]);
        }
    }

}

//DRONES****************************************************************************************************************************
function Drone(x, y, speed, turnSpeed) {
    this.id = uniqID++;
    this.type = TYPES.DRONE;
    this.steering = new Vector2(0, 0);
    this.pos = new Vector2(x, y);
    this.velocity = new Vector2(randomIntFromInterval(-1, 1), randomIntFromInterval(-1, 1));
    this.maxSpeed = speed;
    this.turnSpeed = turnSpeed;
    this.wanderCircleDistance = 10;
    this.wanderCircleRadius = 5;
    this.wanderAngle = 0;
    this.radius = 5;
    this.wanderAngleAdjustment = 10;
    this.colour = 'grey';
    this.fleeTargets = [];
    this.seekTargets = [];
    this.mass = 5;
    this.DEBUG_TYPE = { NONE: 0, ALL: 1, SEEK_FLEE: 2, SEEK: 3, FLEE: 4, VELOCITY: 5, WANDER: 6, FLOCK: 7, LENGTH: 8 }
    this.debugIndex = 0;
    this.col = 0;
    this.row = 0;
    this.myBucketManager = null;
    this.nearbyFriends = [];
    this.separationWeight = 1 / this.radius;
    this.attachedBlock = undefined;
}


Drone.prototype = new AiObject();
Drone.prototype.constructor = Drone;


//BLOCK
function Block(x, y) {
    this.type = TYPES.BOX;;
    this.pos = new Vector2(x, y);
    this.radius = 15;

    this.holder = undefined;

    Block.prototype.update = function update() {
        if (this.holder !== undefined) {
            this.pos.x = this.holder.pos.x;
            this.pos.y = this.holder.pos.y;
        }
    };

    Block.prototype.draw = function draw(ctx) {
        ctx.fillStyle = this.colour;
        ctx.fillRect(this.pos.x - this.radius, this.pos.y - this.radius, this.radius, this.radius);
        if (this.debugIndex > 0) {

            if (this.debugIndex > this.DEBUG_TYPE.LENGTH) {
                this.debugIndex = 0;
            }

            this.drawDebug(ctx);
        }
    };

}


