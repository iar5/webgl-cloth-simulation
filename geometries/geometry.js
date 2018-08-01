class Geometry{
    constructor(program, drawMode) {
        this.program = program;
        this.drawMode = drawMode;
    }
    initGl(gl, callback){
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
    applyCloth(cloth){
        cloth.applyGeometry(this);
        this.cloth = cloth;
        return this;
    }
    applyUpdateCallback(callack){
        this.updater = callack;
        return this;
    }
    compileVerticesFromPoints() {
        this._vertices = this.generateContinousArrayFromPoints(this.points);
    }
    generatePointsFromContinousArray(arr){
        let result = []
        for(let i = 0; i < arr.length; i+=3){
            result.push(new vec3(arr[i], arr[i+1], arr[i+2]))
        }
        return result
    }
    generateContinousArrayFromPoints(points){       
        let result = []
        points.forEach(pos => result.push(pos.x, pos.y, pos.z))
        return result
    }
    update(){
        if(this.cloth) this.cloth.updateGeometry();
        if(this.updater) this.updater();
    }
    /**
     * Transformationen 
     * TODO Normalen mit rotieren 
     */
    translate(x, y, z){
        let temp = new vec3(x, y, z)
        this.points.forEach(pos => {
            pos.add(temp)
            if(pos.old) pos.old.add(temp)
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
            if(pos instanceof Particle) {
                let oldy = pos.old.y;
                pos.old.y = oldy*Math.cos(rad) - pos.old.z*Math.sin(rad);
                pos.old.z = oldy*Math.sin(rad) + pos.old.z*Math.cos(rad);
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
            if(pos instanceof Particle) {
                let oldz = pos.old.z;
                pos.old.x = oldz*Math.sin(rad) + pos.old.x*Math.cos(rad);
                pos.old.z = oldz*Math.cos(rad) - pos.old.x*Math.sin(rad);
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
            if(pos instanceof Particle) {
                let oldx = pos.old.x;
                pos.old.x = oldx*Math.cos(rad) - pos.old.y*Math.sin(rad);
                pos.old.y = oldx*Math.sin(rad) + pos.old.y*Math.cos(rad);
            }
        })
        this.compileVerticesFromPoints();
        return this;
    }
}