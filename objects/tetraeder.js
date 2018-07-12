class Tetraeder {
    constructor(pos = {x: 0, y: 0, z: 0}) {
        this.pos = pos;
        this._positionBuffer, this._colorBuffer, this._indicesBuffer;
        this._generateVerticesIndicesAndColors();
    }
    _generateVerticesIndicesAndColors() {
        this._vertices = [
            this.pos.x +  1.0, this.pos.y +  1.0, this.pos.z +  1.0, 
            this.pos.x + -1.0, this.pos.y +  1.0, this.pos.z + -1.0, 
            this.pos.x +  1.0, this.pos.y + -1.0, this.pos.z + -1.0,
            this.pos.x + -1.0, this.pos.y + -1.0, this.pos.z +  1.0 
        ]
        this._indices = [
            1, 2, 3, 
            0, 3, 2, 
            0, 1, 3, 
            0, 2, 1  
        ]

        // nicht so ganz richtig 
        this._normals = []
        for(let i=0; i < this._indices.length/3; i++){
            let a = {x: this._vertices[this._indices[i*3]], y: this._vertices[this._indices[i*3]+1], z: this._vertices[this._indices[i*3]+2]};
            let b = {x: this._vertices[this._indices[i*3+1]], y: this._vertices[this._indices[i*3+1]+1], z: this._vertices[this._indices[i*3+1]+2]};
            let c = {x: this._vertices[this._indices[i*3+2]], y: this._vertices[this._indices[i*3+2]+1], z: this._vertices[this._indices[i*3+2]+2]};
            let n = vec3.normalize(vec3.cross(vec3.sub(b, a), vec3.sub(c, a)))
            this._normals.push(n.x, -n.y, n.z)
        }

        this._colors = [];
        for(let i=0; i < this._vertices.length/3; i++){
            this._colors.push(0, 1, 0, 1)
        }
    }
    init(gl) {
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
    }
    draw(gl) {
        gl.useProgram(phongProgram);

        gl.uniformMatrix4fv(phongProgram.projMatrixUniform, false, projectionMatrix);
		gl.uniformMatrix4fv(phongProgram.mvMatrixUniform, false, modelviewMatrix);

		gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._vertices), gl.STATIC_DRAW);
		gl.vertexAttribPointer(phongProgram.vertexPositionAttribute, this._positionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this._colorBuffer);
		gl.vertexAttribPointer(phongProgram.vertexColorAttribute, this._colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
        gl.vertexAttribPointer(phongProgram.vertexNormalAttribute, this._normalBuffer.itemSize, gl.FLOAT, gl.TRUE, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indicesBuffer);
        
		gl.drawElements(gl.TRIANGLES, this._indicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
    checkCollision(p){

    }
};

