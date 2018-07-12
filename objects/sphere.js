class Sphere {
    constructor(radius=1, pos={x:0, y:0, z:0}, numLatitudes=8, numLongitudes=8) {
        this.pos = pos
        this.radius = radius;
        this.numLatitudes  = numLatitudes;
        this.numLongitudes = numLongitudes;

        this._generateVerticesIndicesAndColors();
        this._positionBuffer, this._colorBuffer, this._indicesBuffer;
    }
    _generateVerticesIndicesAndColors() {
        this._vertices = []; 
        this._normals = [];
        for (let latitude = 0; latitude <= this.numLatitudes; latitude++) {
            let theta = latitude * Math.PI / this.numLatitudes;
            let sinTheta = Math.sin(theta);
            let cosTheta = Math.cos(theta);

            for (var longitude = 0; longitude <= this.numLongitudes; longitude++) {
                let phi = longitude * 2 * Math.PI / this.numLongitudes;
                let cosPhi = Math.cos(phi);
                let sinPhi = Math.sin(phi);
                let x = cosPhi * sinTheta;
                let y = cosTheta;
                let z = sinPhi * sinTheta;
                this._normals.push(x);
                this._normals.push(y);
                this._normals.push(z);
                this._vertices.push(this.pos.x + this.radius * x);
                this._vertices.push(this.pos.y + this.radius * y);
                this._vertices.push(this.pos.z + this.radius * z);
            }
        }

        this._colors = [];
        for(let i=0; i < this._vertices.length/3; i++){
            this._colors.push(1, 0, 0, 1)
        }
        
        this._indices = [];
        for (let latitude=0; latitude < this.numLatitudes; latitude++){
            for (let longitude=0; longitude < this.numLongitudes; longitude++) {
                let first  = latitude * (this.numLongitudes + 1) + longitude;
                let second = first + this.numLongitudes + 1;
                this._indices.push(first);
                this._indices.push(second);
                this._indices.push(first + 1);
                this._indices.push(second);
                this._indices.push(second + 1);
                this._indices.push(first + 1);
            }
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
    }
    draw(gl) {
        gl.useProgram(phongProgram);
        
        gl.uniformMatrix4fv(phongProgram.projMatrixUniform, false, projectionMatrix);
		gl.uniformMatrix4fv(phongProgram.mvMatrixUniform, false, modelviewMatrix);

		gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._vertices), gl.STATIC_DRAW);
        gl.vertexAttribPointer(phongProgram.vertexPositionAttribute, this._positionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indicesBuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
        gl.vertexAttribPointer(phongProgram.vertexNormalAttribute, this._normalBuffer.itemSize, gl.FLOAT, gl.TRUE, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._colorBuffer);
        gl.vertexAttribPointer(phongProgram.vertexColorAttribute, this._colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.drawElements(gl.TRIANGLES, this._indicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
    checkCollision(p){
        if(vec3.distance(p, this.pos) < this.radius) {
            let newp = vec3.add(this.pos, vec3.scale(vec3.normalize({x: p.x - this.pos.x, y: p.y - this.pos.y, z: p.z - this.pos.z}), this.radius));
            p.oldx = p.x;
            p.oldy = p.y;
            p.oldz = p.z;
            p.x = newp.x;
            p.y = newp.y;
            p.z = newp.z;
        }
    }
};

