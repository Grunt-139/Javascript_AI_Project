// JavaScript source code
//Our Vector Object
function Vector2(x, y) {
    this.x = x,
    this.y = y,
    Vector2.prototype.add = function (vec2) {
        this.x += vec2.x;
        this.y += vec2.y;
    };
    Vector2.prototype.sub = function (vec2) {
        this.x -= vec2.x;
        this.y -= vec2.y;
    };
    Vector2.prototype.magSqr = function () {
        return (this.x * this.x) + (this.y * this.y);
    };
    Vector2.prototype.mag = function () {
        return Math.sqrt((this.x * this.x) + (this.y * this.y));
    };
    Vector2.prototype.multScalar = function (scalar) {
        this.x *= scalar;
        this.y *= scalar;
    };

    Vector2.prototype.divScalar = function (scalar) {
        this.x /= scalar;
        this.y /= scalar;
    };

    Vector2.prototype.display = function () {
        console.log("X: " + this.x + " Y: " + this.y);
    };
    Vector2.prototype.normalize = function () {
        var m = this.mag();

        if (m > 0) {
            this.x /= m;
            this.y /= m;
        }
    };
    Vector2.prototype.normal = function () {
        var m = this.mag();
        if (m > 0) {
            return new Vector2(this.x / m, this.y / m);
        } else {
            return new Vector2(0, 0);
        }

    };

    Vector2.prototype.neg = function () {
        return new Vector2(-this.x, -this.y);
    };
}


function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function clamp(num, min, max) {
    if (num < min) {
        num = min;
    }

    if (num > max) {
        num = max;
    }

    return num;
}