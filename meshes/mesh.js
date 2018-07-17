/**
 * springs für cloth Objekte
 * points repräsentieren die _vertices. Werden für interne Berechnungen benutzt. 
 * _vertices für WebGL
 * _indices für WebGL
 * _normals für WebGL
 */

class Mesh{
    constructor(program, drawMode) {
        this.program = program;
        this.drawMode = drawMode;

        this._positionBuffer, this.__indicesBuffer, this._normalBuffer, this._colorBuffer;
        this._vertices, this._indices, this._normals, this._colors;
        this.points;
    }
    init(gl, callback){
        this._positionBuffer = gl.createBuffer();
        this._positionBuffer.itemSize = 3;
        this._positionBuffer.numItems = this._vertices.length / 3;
        gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._vertices), gl.STATIC_DRAW);

        this._indicesBuffer = gl.createBuffer();
        this._indicesBuffer.itemSize = 1;
        this._indicesBuffer.numItems = this._indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indicesBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._indices), gl.STATIC_DRAW);

        this._colorBuffer = gl.createBuffer();
        this._colorBuffer.itemSize = 4;
        this._colorBuffer.numItems = this._colors.length / 4;
        gl.bindBuffer(gl.ARRAY_BUFFER, this._colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._colors), gl.STATIC_DRAW);

        if(this._normals){
            this._normalBuffer = gl.createBuffer();
            this._normalBuffer.itemSize = 3;
            this._normalBuffer.numItems = this._normals.length / 3;
            gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._normals), gl.STATIC_DRAW);
        }
        callback();
    }
    draw(gl){
        gl.useProgram(this.program);

		gl.uniformMatrix4fv(this.program.projMatrixUniform, false, projectionMatrix);
        gl.uniformMatrix4fv(this.program.mvMatrixUniform, false, modelviewMatrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer); 
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._vertices), gl.STATIC_DRAW); // weil sich Positionen verändern       
        gl.vertexAttribPointer(this.program.vertexPositionAttribute, this._positionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._colorBuffer);
        gl.vertexAttribPointer(this.program.vertexColorAttribute, this._colorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        if(this._normals){
            gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._normals), gl.STATIC_DRAW);
            gl.vertexAttribPointer(this.program.vertexNormalAttribute, this._normalBuffer.itemSize, gl.FLOAT, gl.TRUE, 0, 0);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indicesBuffer);
		gl.drawElements(this.drawMode, this._indicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
    generatePointsFromVertices() {
        this.points = [];
        for(let i = 0; i < this._vertices.length; i+=3){
            this.points.push({
                x: this._vertices[i], 
                y: this._vertices[i+1], 
                z: this._vertices[i+2]
            })
        }
    }
    /**
     * Wenn Punkte verändert wurden, z.B. nach Verlet 
     */
    compileVerticesFromPoints() {
        this._vertices = [];
        this.points.forEach( pos => this._vertices.push(pos.x, pos.y, pos.z))
    }
    
    translate(x, y, z){
        // Für Kreis Mittelpunkt
        if(this.midPoint) {
            this.midPoint.x += x;
            this.midPoint.y += y;
            this.midPoint.z += z;
        };
        this.points.forEach(pos => {
            pos.x += x;
            pos.y += y;
            pos.z += z;
            if(pos.oldx) {
                pos.oldx += x;
                pos.oldy += y;
                pos.oldz += z;
            }
        });
        this.compileVerticesFromPoints();
        return this; 
    }
    // TODO Normalen mit rotieren
    rotateX(degrees){
        let rad = degToRad(degrees);
        this.points.forEach(pos => {
            let y = pos.y;
            pos.y = y*Math.cos(rad) - pos.z*Math.sin(rad);
            pos.z = y*Math.sin(rad) + pos.z*Math.cos(rad);
            if(pos.oldx) {
                let oldy = pos.oldy;
                pos.oldy = oldy*Math.cos(rad) - pos.oldz*Math.sin(rad);
                pos.oldz = oldy*Math.sin(rad) + pos.oldz*Math.cos(rad);
            }
        });
        this.compileVerticesFromPoints();
        return this;
    }
    rotateY(degrees){
        let rad = degToRad(degrees);
        this.points.forEach(pos => {
            let z = pos.z;
            pos.x = z*Math.sin(rad) + pos.x*Math.cos(rad);
            pos.z = z*Math.cos(rad) - pos.x*Math.sin(rad);
            if(pos.oldx) {
                let oldz = pos.oldz;
                pos.oldx = oldz*Math.sin(rad) + pos.oldx*Math.cos(rad);
                pos.oldz = oldz*Math.cos(rad) - pos.oldx*Math.sin(rad);
            }
        })
        this.compileVerticesFromPoints();
        return this;
    }
    rotateZ(degrees){
        let rad = degToRad(degrees);
        this.points.forEach(pos => {
            let x = pos.x;
            pos.x = x*Math.cos(rad) - pos.y*Math.sin(rad);
            pos.y = x*Math.sin(rad) + pos.y*Math.cos(rad);
            if(pos.oldx) {
                let oldx = pos.oldx;
                pos.oldx = oldx*Math.cos(rad) - pos.oldy*Math.sin(rad);
                pos.oldy = oldx*Math.sin(rad) + pos.oldy*Math.cos(rad);
            }
        })
        this.compileVerticesFromPoints();
    }
}