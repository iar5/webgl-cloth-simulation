class Obj {
    constructor(src, pos) {
        this.src = src;
        this.pos = pos;
    }
    init(gl) {
        loadJSONResource(this.src, (model) => {

            // http://www.greentoken.de/onlineconv/ 
            if(!model.meshes) throw Error ("JSON Formatierung nicht untersützt") 

            this._vertices = []; this._normals = []; this._indices = [];
            let indices, indicesOffset = 0;
            for(let mesh of model.meshes){
                this._vertices = this._vertices.concat(mesh.vertices);
                this._normals = this._normals.concat(mesh.normals);
                indices = [].concat.apply([], mesh.faces);
                this._indices = this._indices.concat(indices.map(f => f+indicesOffset));
                indicesOffset += mesh.vertices.length/3;
            }
   
            this._colors = []
            for(let i=0; i<this._vertices.length/3; i++)
                this._colors.push(.5, .6, .5, 1)

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

            this._normalBuffer = gl.createBuffer();
            this._normalBuffer.itemSize = 3;
            this._normalBuffer.numItems = this._normals.length / 3;
            gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._normals), gl.STATIC_DRAW);

            this._colorBuffer = gl.createBuffer();
            this._colorBuffer.itemSize = 4;
            this._colorBuffer.numItems = this._colors.length / 4;
            gl.bindBuffer(gl.ARRAY_BUFFER, this._colorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._colors), gl.STATIC_DRAW);

        })
    }
    draw(gl) {
        if(!this._indices) return; // not loaded yet
        gl.useProgram(phongProgram);

		gl.uniformMatrix4fv(phongProgram.projMatrixUniform, false, projectionMatrix);
		gl.uniformMatrix4fv(phongProgram.mvMatrixUniform, false, modelviewMatrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._vertices), gl.STATIC_DRAW);
		gl.vertexAttribPointer(phongProgram.vertexPositionAttribute, this._positionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
        gl.vertexAttribPointer(phongProgram.vertexNormalAttribute, this._normalBuffer.itemSize, gl.FLOAT, gl.TRUE, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._colorBuffer);
		gl.vertexAttribPointer(phongProgram.vertexColorAttribute, this._colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indicesBuffer);

        gl.drawElements(gl.TRIANGLES, this._indicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
    checkCollision(p){
        
     }
};



