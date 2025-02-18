/**
 * Elternklasse für die 3D Objekte der Szene
 * Bietet initialie sowie funktionale Methoden an
 * Die Vertices, Indices, Farmen und Normalen müssen vom Kind gesetzt werden. Sind diese gesetzt, so kann das MeshObject.initGl() aufgerufen werden
 * 
 */
class MeshObject{
    constructor(program=basicProgram, drawMode=gl.TRIANGLES) {
        this.program = program;
        this.drawMode = drawMode;
    }

    init(){
        this._colorsBackup = this._colors; // Zwischenspeicher für Towel damit nach colorMode wieder gewechselt werden kann
        this._positionBuffer = gl.createBuffer();
        this._indicesBuffer = gl.createBuffer();
        this._colorBuffer = gl.createBuffer();
        this._normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indicesBuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._colorBuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
    }
    draw(){
        // Direkte Zuweisung der Programme über dat.GUI klappt irgendwie nicht. Basic Programm ist wird dann irgendwie nur als String wiedergegeben
        // Außerdem muss mindestens ein Objekt mit basicProgram gezeichnet worden sein, wahrscheinlich damit Buffer gefüllt sind?
        // Versteh da Problem nicht aber workaround mit Dummyobjekt klappt. Zwar nervig aber nicht weiter schlimm
        if(this.programName == "light") gl.useProgram(lightProgram);
        else if(this.programName == "basic") gl.useProgram(basicProgram)
        else gl.useProgram(this.program)

        gl.uniformMatrix4fv(this.program.projMatrixUniform, false, projectionMatrix);
        gl.uniformMatrix4fv(this.program.mvMatrixUniform, false, modelviewMatrix);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer); 
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._vertices), gl.STATIC_DRAW); // update positions   
        gl.vertexAttribPointer(this.program.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._normals), gl.STATIC_DRAW);
        gl.vertexAttribPointer(this.program.vertexNormalAttribute, 3, gl.FLOAT, gl.TRUE, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._colors), gl.STATIC_DRAW);
        gl.vertexAttribPointer(this.program.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indicesBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._indices), gl.STATIC_DRAW);
        gl.drawElements(this.drawMode, this._indices.length, gl.UNSIGNED_SHORT, 0);
    }

    setColor(color){
        if(color instanceof Array) color = color;
        else if(color == 'red') color = [1, 0, 0, 1]
        else if(color == 'green') color = [0, 1, 0, 1]
        else if(color == 'blue') color = [0, 0, 1, 1]
        else if(color == 'yellow') color = [1, 1, 0, 1]
        else if(color == 'cyan') color = [0, 1, 1, 1]
        else if(color == 'magenta') color = [1, 0, 1, 1]
        else if(color == 'green') color = [0, 1, 0, 1]
        else throw new Error('Color ' + color + ' not valid')
        
        this._colors = [];
        for(let i=0; i<this._vertices.length/3; i++){
            this._colors.push(color[0], color[1], color[2], color[3]);
        }
        this._colorsBackup = this._colors; 
        return this;
    }

    /**
     * Animator für die Textilsimulaion existiert nur in Towel und überschreibt erweitert mesh.update()
     * @param {Function} callack 
     */
    applyUpdateCallback(callack){
        this.animator = callack;
        return this;
    }
    update(){
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
                if(tri.hasCornerPoint(p)) normale.add(tri.n)
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
     * Direkte Transformationen 
     * Es werden die Punkte, alten Punkte (von Partikel) und Normalen beachtet
     */
    translate(x, y, z){
        let temp = (x instanceof Vec3 ? x : new Vec3(x, y, z)) ;
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
        this.recalculateTriangleNormals();
        return this;
    }
}