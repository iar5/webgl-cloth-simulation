class Mesh{
    constructor(program, drawMode) {
        this.program = program;
        this.drawMode = drawMode;
    }

    /**
     * GL
     */
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
        this._normalBuffer = gl.createBuffer();
        this._normalBuffer.itemSize = 3;
        this._normalBuffer.numItems = this._normals.length / 3;
        gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._normals), gl.STATIC_DRAW);
        callback();
    }
    draw(gl){
        gl.useProgram(this.program);
		gl.uniformMatrix4fv(this.program.projMatrixUniform, false, projectionMatrix);
        gl.uniformMatrix4fv(this.program.mvMatrixUniform, false, modelviewMatrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer); 
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._vertices), gl.STATIC_DRAW); // update positions   
        gl.vertexAttribPointer(this.program.vertexPositionAttribute, this._positionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._normals), gl.STATIC_DRAW);
        gl.vertexAttribPointer(this.program.vertexNormalAttribute, this._normalBuffer.itemSize, gl.FLOAT, gl.TRUE, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._colorBuffer);
        gl.vertexAttribPointer(this.program.vertexColorAttribute, this._colorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indicesBuffer);
        gl.drawElements(this.drawMode, this._indicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    /**
     * Animator
     * @param {Cloth} cloth
     * @param {Array} pinArr Indices der Partikel die nach der Initierung des Cloth gepinned werden
     */
    applyCloth(cloth, pinArr){
        cloth.applyMesh(this);
        this.cloth = cloth;
        if(pinArr) cloth.pin(pinArr)
        return this;
    }
    applyUpdateCallback(callack){
        this.animator = callack;
        return this;
    }
    update(){
        if(this.cloth) this.cloth.updateMesh();
        if(this.animator) this.animator();
    }

    /**
     * Update Buffer Vertices mit neuen Partikelpositionen
     */
    updateVerticesFromPoints() {
        this._vertices = generateContinousArrayFromVec3s(this.points);
    }

    updateNormals(normals) {
        this._normals = generateContinousArrayFromVec3s(normals);
    }

    /**
     * Neuberechnung der Buffer Normalen der Vertices, falls die Dreiecke verändert wurden. 
     * https://stackoverflow.com/a/6661242/7764088
     */
    updateNormalsFromTriangles(){
        this._normals = [];
        for(let p of this.points){
            let normale = new Vec3();
            for(let tri of this.triangles){
                if(tri.hasPoint(p)) normale.add(tri.n)
            }
            normale.normalize();
            this._normals.push(normale.x, normale.y, normale.z)
        }
    }

    /**
     * Normalen der Dreiecke updaten 
     * Nur für dynamische Objekte wie Cloth
     */
    recalculateTriangleNormals(){
        for(let tri of this.triangles){
            tri.recalculateNormal()
        }
    }

    /**
     * Normalen + andere vorberechnete Daten neu berechnen
     * Für statische Objekte 
     */
    recalculateTrianglePrecalculations(){
        for(let tri of this.triangles){
            tri.recalculatePrecalculatio()
        }
    }

    /**
     * Transformationen 
     * Dabei werden die Punkte, alten Punkte (von Partikel) und Normalen beachtet
     */
    translate(x, y, z){
        let temp = new Vec3(x, y, z)
        this.points.forEach(pos => {
            pos.add(temp)
            if(pos.old) pos.old.add(temp)
        });
        this.updateVerticesFromPoints();
        return this; 
    }

    rotateX(degrees){
        let rad = degToRad(degrees)
        let matrix = mat3.create([1, 0, 0,   0, Math.cos(rad), -Math.sin(rad),   0, Math.sin(rad), Math.cos(rad) ])
        return this.rotate(matrix);
    }
    rotateY(degrees){
        let rad = degToRad(degrees)
        let matrix = mat3.create([Math.cos(rad), 0, Math.sin(rad),   0, 1, 0,   -Math.sin(rad), 0, Math.cos(rad)])
        return this.rotate(matrix);
    }
    rotateZ(degrees){
        let rad = degToRad(degrees)
        let matrix = mat3.create([Math.cos(rad), -Math.sin(rad), 0,   Math.sin(rad), Math.cos(rad), 0,   0, 0, 1])
        return this.rotate(matrix);
    }
    rotate(matrix){
        let normals = generateVec3sFromContinousArray(this._normals);
        for(let i=0; i<this.points.length; i++){
            let p = this.points[i];
            p.multiplyMat3(matrix);
            if(p instanceof Particle) p.old.multiplyMat3(matrix);
            normals[i].multiplyMat3(matrix).normalize();
        }
        this.updateVerticesFromPoints();
        this.updateNormals(normals);
        this.recalculateTrianglePrecalculations();
        return this;
    }
}