class Sphere extends Mesh{
    constructor(radius=1, numLatitudes=8, numLongitudes=8) {
        super(phongProgram, gl.TRIANGLES)
        this.radius = radius;
        this.numLatitudes  = numLatitudes;
        this.numLongitudes = numLongitudes;

        this.midPoint = {x: 0, y: 0, z:0}
        this.offset = 0.05;

        this._generateVerticesIndicesAndColors();
        this.generatePointsFromVertices();
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
                this._vertices.push(this.radius * x);
                this._vertices.push(this.radius * y);
                this._vertices.push(this.radius * z);
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
    resolveCollision(points){
        for(let p of points){
            if(vec3.dist(p, this.midPoint) < this.radius + this.offset) {
                let newp = vec3.add(this.midPoint, vec3.scale(vec3.normalize({x: p.x - this.midPoint.x, y: p.y - this.midPoint.y, z: p.z - this.midPoint.z}), this.radius + this.offset));
                p.oldx = p.x;
                p.oldy = p.y;
                p.oldz = p.z;
                p.x = newp.x;
                p.y = newp.y;
                p.z = newp.z;
            }
        }
    }
};

