// JavaScript source code
//Spatial bucket code is adapted from http://buildnewgames.com/broad-phase-collision-detection/
function SpatialBucketManager(cellSize, screenWidth, screenHeight) {
    this.cellSize = cellSize;
    this.cellSizeDecimal = 1 / cellSize;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.min = new Vector2(0, 0);
    this.max = new Vector2(screenWidth, screenHeight);
    this.grid = [[]];
    this.entities = [];
    this.totalCells = 0;
    this.allocatedCells = 0;
    this.hashChecks = 0;
    this.collisionTests = 0;
    this.gridWidth = Math.floor((this.max.x - this.min.x) / this.cellSize)
    this.gridHeight = Math.floor((this.max.y - this.min.y) / this.cellSize)


    SpatialBucketManager.prototype.update = function Update() {

        var entXMin
        , entXMax
        , entYMin
        , entYMax
        , i
        , j
        , ent
        , x
        , y
        , col
        , cell;

        this.totalCells = this.gridWidth * this.gridHeight;
        this.allocatedCells = 0;

        //Construct the grid
        this.grid = Array(this.gridWidth);

        //Insert all entities into the grid
        for (i = 0; i < this.entities.length; i++) {
            ent = this.entities[i];

            //We ignore it if its outside of our grid
            if (ent.pos.x < this.min.x || ent.pos.x > this.max.x
               || ent.pos.y < this.min.y || ent.pos.y > this.max.y
                ) {
                continue;
            }

            // find extremes of cells that entity overlaps
            // subtract min to shift grid to avoid negative numbers
            entXMin = Math.floor((ent.pos.x - this.min.x) / this.cellSize);
            entXMax = Math.floor((ent.pos.x + ent.radius - this.min.x) / this.cellSize);
            entYMin = Math.floor((ent.pos.y - this.min.y) / this.cellSize);
            entYMax = Math.floor((ent.pos.y + ent.radius - this.min.y) / this.cellSize);

            ////Insert entity into each cell it overlaps
            ////we loop to make sure all the cells between extremes are hit
            for (x = entXMin; x <= entXMax; x++) {
                //Make sure the column exists, initialize if not to grid height length
                if (!this.grid[x]) { this.grid[x] = Array(this.gridHeight); }

                gridCol = this.grid[x];
                //Loop through each cell in this column
                for (y = entYMin; y <= entYMax; y++) {
                    //Ensure we have a bucket to put entities into for this cell
                    if (!gridCol[y]) {
                        gridCol[y] = [];
                        //For stats
                        this.allocatedCells++;
                    }
                    cell = gridCol[y];
                    cell.push(ent);
                    ent.col = x;
                    ent.row = y;
                }
            }
        }


    };

    SpatialBucketManager.prototype.addObject = function Add(obj) {
        obj.myBucketManager = this;
        this.entities.push(obj);
    };

    SpatialBucketManager.prototype.removeObject = function Remove(obj) {
        obj.myBucketManager = null;
        this.entities.splice(this.entities.indexOf(obj), 1);
    };

    SpatialBucketManager.prototype.draw = function Draw(ctx) {
        var i,
            j,
            x,
            y

        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        for (i = 0; i < this.gridWidth; i++) {
            x = this.min.x + (i * this.cellSize);
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.max.y);
            ctx.stroke();
        }

        for (j = 0; j < this.gridHeight; j++) {
            y = this.min.y + (j * this.cellSize);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.max.x, y);
            ctx.stroke();
        }

        ctx.restore();
    };

    SpatialBucketManager.prototype.drawDebug = function DrawDebug(ctx) {
        ctx.fillText('Total Cells: ' + this.totalCells, 50, 120);
        ctx.fillText('Allocated Cells: ' + this.allocatedCells, 50, 140);
        ctx.fillText('Hash Checks: ' + this.hashChecks, 50, 160);
        ctx.fillText('Collision Checks: ' + this.collisionTests, 50, 180);
        ctx.fillText('Total Entities: ' + this.entities.length, 50, 200);
    };

    SpatialBucketManager.prototype.queryForCollisionPairs = function () {
        var checked = {}
        , pairs = []
        , entA
        , entB
        , hashA
        , hashB
        , i
        , j
        , k
        , l
        , col
        , cell;

        this.hashChecks = 0;
        this.collisionTests = 0;

        //For every column in the grid...
        for (i = 0; i < this.grid.length; i++) {
            col = this.grid[i];

            //ignore the columns that have no cells
            if (!col) { continue; }

            //for every cell within a column of the grid
            for (j = 0; j < col.length; j++) {
                cell = col[j];
                //ignore cells that have no objects
                if (!cell) { continue; }

                //For every object in the cell...
                for (k = 0; k < cell.length; k++) {
                    entA = cell[k];

                    //For every other object in a cell
                    for (l = k + 1; l < cell.length; l++) {
                        entB = cell[l];

                        //create a unique key to mark this pair

                        hashA = entA.id + ':' + entB.id;
                        hashB = entB.id + ':' + entA.id;

                        this.hashChecks += 2;

                        if (!checked[hashA] && !checked[hashB]) {

                            //Mark this pair as checked
                            checked[hashA] = checked[hashB] = true;

                            this.collisionTests += 1;

                            if (this.radiusCheck(entA, entB)) {
                                pairs.push([entA, entB]);
                            }
                        }
                    }
                }
            }
        }
        return pairs;
    };


    SpatialBucketManager.prototype.queryGrid = function (col, row) {
        var objs = [];

        if (!(typeof this.grid[col] === "undefined") && !(typeof this.grid[col][row] === "undefined")) {
            for (var i = 0; i < this.grid[col][row].length; i++) {
                objs.push(this.grid[col][row][i]);
            }
        }

        return objs;
    };

    //Pass in how large of a radius around the base column and row you want to search in
    SpatialBucketManager.prototype.queryGrids = function (col, row, radius) {

        var objs = [];

        for (var i = col - radius; i < this.grid.length && i <= col + radius; i++) {

            for (var j = row - radius; j < this.grid.length && j <= row + radius; j++) {

                if (!(typeof this.grid[i] === "undefined") && !(typeof this.grid[i][j] === "undefined")) {

                    for (var k = 0; k < this.grid[i][j].length; k++) {
                        objs.push(this.grid[i][j][k]);
                    }

                }
            }
        }

        return objs

    }

    SpatialBucketManager.prototype.radiusCheck = function (entA, entB) {
        var length = entA.radius + entB.radius;
        var vec = new Vector2(entA.pos.x - entB.pos.x, entA.pos.y - entB.pos.y);

        if (length < vec.mag()) {
            return true;
        } else {
            return false;
        }
    };

}
