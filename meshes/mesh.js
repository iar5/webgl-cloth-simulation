/**
 * springs für cloth Objekte
 * triangles repräsentieren die _indices, werden für Kollision benutzt
 * points repräsentieren die _vertices, werden für interne Berechnungen benutzt. 
 * _vertices, _indices, _normals, _colors für WebGL
 * _positionBuffer, _indicesBuffer, _normalBuffer, _colorBuffer für WebGL
 */

class Mesh{
    constructor(program, drawMode) {
        this.program = program;
        this.drawMode = drawMode;
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
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._vertices), gl.STATIC_DRAW); // update positions   
        gl.vertexAttribPointer(this.program.vertexPositionAttribute, this._positionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._colorBuffer);
        gl.vertexAttribPointer(this.program.vertexColorAttribute, this._colorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        if(this._normals){
            // gl.enableVertexAttribArray(this.program.vertexNormalAttribute);
            gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._normals), gl.STATIC_DRAW);
            gl.vertexAttribPointer(this.program.vertexNormalAttribute, this._normalBuffer.itemSize, gl.FLOAT, gl.TRUE, 0, 0);
        }
        else{
            // INVALID_OPERATION: drawElements: no buffer is bound to enabled attribute
            // Weil im Phong Programm gl.enableVertexAttribArray(program.vertexNormalAttribute). Wenn Phong Programm existiert kommt Error auxh nicht und Towel kann auch allein gezeichnet werden
            // Angedachte Lösung, die nicht klappt:
            // gl.disableVertexAttribArray(this.program.vertexNormalAttribute);
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
     * Wird bei Cloth update nicht beachtet 
     */
    pin(... points){
        points.forEach(i => {
            if(i >= this.points.length) console.error("mesh.pin(p), p index out of range");
            else this.points[i].pinned = true
        })
    }
    unpin(... points){
        points.forEach(i => {
            if(i >= this.points.length) console.error("mesh.unpin(p), p index out of range");
            else this.points[i].pinned = false
        })
    }
    /**
     * Transformationen 
     * TODO Normalen mit rotieren
     */
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
        return this;
    }
    /**
     * Vertices updaten, wenn Punkte verändert wurden
     */
    compileVerticesFromPoints() {
        this._vertices = [];
        this.points.forEach( pos => this._vertices.push(pos.x, pos.y, pos.z))
    }
}