class Towel{
    constructor(amountX = 10, amountY = 10, density = 1, pos = {x:0,y:0,z:0}) {
        this.amountX = amountX;
        this.amountY = amountY;
        this.density = density;
        this.pos = pos;

        this.points = [];
        this.springs = [];
        this._generatePointsAndSprings();
        this._generateVerticesIndicesAndColors();
        this._positionBuffer, this._colorBuffer, this._indicesBuffer;

        this.points[0].pinned = true;
        this.points[amountX - 1].pinned = true;
        this.points[amountX * (amountY-1)].pinned = true;
        this.points[amountX * amountY -1].pinned = true;
    }

    _generatePointsAndSprings() {
        let amountX = this.amountX, amountY = this.amountY;
        let springs = this.springs, points = this.points;

        // von links oben nach rechts unten
        for (let y = this.amountY; y>0; y--) {
            for (let x = 0; x < this.amountX; x++) {
                points.push({
                    x: this.pos.x + x*this.density,
                    y: this.pos.y + y*this.density,
                    z: this.pos.z,
                    oldx: this.pos.x + x*this.density,
                    oldy: this.pos.y + y*this.density,
                    oldz: this.pos.z
                });
            }
        }

        for (let y=0; y < amountY; y++) {
            for (let x=0; x < amountX; x++) {
                /* strucutral springs */
                if (x+1 < amountX) {
                    let p0 = points[y*amountX + x],
                        p1 = points[y*amountX + x+1];
                    springs.push({p0, p1, length: vec3.distance(p0, p1)});
                }
                if (y+1 < amountY) {
                    let p0 = points[y*amountX + x],
                        p1 = points[(y+1)*amountX + x];
                    springs.push({p0, p1, length: vec3.distance(p0, p1)});
                }
                /* shear springs */
                if (x+1 < amountX && y+1 < amountY) {
                    let p0 = points[y*amountX + x],
                        p1 = points[(y+1)*amountX + x+1],
                        p2 = points[y*amountX + x+1],
                        p3 = points[(y+1)*amountX + x];
                    springs.push({p0: p0, p1: p1, length: vec3.distance(p0, p1)});
                    springs.push({p0: p2, p1: p3, length: vec3.distance(p2, p3)});
                }
                /* flexion/bend springs */
                if(x+2 < amountX) {
                    let p0 = points[y*amountX + x],
                        p1 = points[y*amountX + x+2];
                    springs.push({p0, p1, length: vec3.distance(p0, p1)});
                }
                if(y+2 < amountY) {
                    let p0 = points[y*amountX + x],
                        p1 = points[(y+2)*amountX + x];
                    springs.push({p0, p1, length: vec3.distance(p0, p1)});
                }
            }
        }
    }
    _generateVerticesIndicesAndColors() {
        this.compilePointsToVertices();

        let amountX = this.amountX, amountY = this.amountY;

        this._indices = [];
        for (let y = 0; y < amountY; y++) {
            for (let x = 0; x < amountX; x++) {
                // for filled style with gl.TRIANGLES
                if(false){
                    if (y + 1 == amountY) break;
                    if (x + 1 == amountX) continue;
                    this._indices.push(y * amountX + x, y * amountX + x + 1, (y + 1) * amountX + x);
                    this._indices.push((y + 1) * amountX + x, y * amountX + x + 1, (y + 1) * amountX + x + 1);
                }
                // for grid style with gl.LINES
                else {
                    if (y+1 < amountY) this._indices.push(y*amountX + x, (y+1)*amountX + x);
                    if (x+1 < amountX) this._indices.push(y*amountX + x, y*amountX + x+1);
                    if (x+1 < amountX && y+1 < amountY) this._indices.push((y+1)*amountX + x,   y*amountX + x+1);
                    if (x+1 < amountX && y+1 < amountY) this._indices.push((y+1)*amountX + x+1, y*amountX + x);
                }
            }
        }
        this._colors = [];
        this.points.forEach(() => this._colors.push(0, 0, 0, 1))
    }
    compilePointsToVertices() {
        this._vertices = [];
        this.points.forEach( pos => this._vertices.push(pos.x, pos.y, pos.z) )
    }
    init(gl){
        this._positionBuffer = gl.createBuffer();
        this._positionBuffer.itemSize = 3;
        this._positionBuffer.numItems = this._vertices.length / 3;
        gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._vertices), gl.STATIC_DRAW);

        this._colorBuffer = gl.createBuffer();
        this._colorBuffer.itemSize = 4;
        this._colorBuffer.numItems = this._colors.length / 4;
        gl.bindBuffer(gl.ARRAY_BUFFER, this._colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._colors), gl.STATIC_DRAW);
        
        this._indicesBuffer = gl.createBuffer();
        this._indicesBuffer.itemSize = 1;
        this._indicesBuffer.numItems = this._indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indicesBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._indices), gl.STATIC_DRAW);

    }
    draw(gl){
		gl.useProgram(clothProgram);
		gl.uniformMatrix4fv(clothProgram.projMatrixUniform, false, projectionMatrix);
        gl.uniformMatrix4fv(clothProgram.mvMatrixUniform, false, modelviewMatrix);
                
		gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._vertices), gl.STATIC_DRAW);
		gl.vertexAttribPointer(clothProgram.vertexPositionAttribute, this._positionBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, this._colorBuffer);
		gl.vertexAttribPointer(clothProgram.vertexColorAttribute, this._colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indicesBuffer);
		gl.drawElements(gl.LINES, this._indicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
    checkCollision(p){ }
}



