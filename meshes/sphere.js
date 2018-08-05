class Sphere extends Mesh{
    constructor(radius=1, numLatitudes=8, numLongitudes=8) {
        super(phongProgram, gl.TRIANGLES)
        this.radius = radius;
        this.numLatitudes = numLatitudes;
        this.numLongitudes = numLongitudes;
       
        this.EPSILON = 0.01;
        this.midPoint = new Vec3(0, 0, 0);

        this._generateBufferData();
        this.points = this.generatePointsFromContinousArray(this._vertices)
    }
    _generateBufferData() {
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
                this._normals.push(x, y, z);
                this._vertices.push(x*this.radius, y*this.radius, z*this.radius);
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
                this._indices.push(first, second, first+1);  
                this._indices.push(second, second+1, first+1);
            }
        }
    }
    translate(x, y, z){
        this.midPoint.add(new Vec3(x,y,z))
        return super.translate(x, y, z);
    }
    resolveSoftPointCollision(points){
        let midPoint = this.midPoint
        for(let p of points){
            if(Vec3.dist(p, midPoint) < this.radius+this.EPSILON) {
                let impuls = Vec3.scale(new Vec3(p.x-midPoint.x, p.y-midPoint.y, p.z-midPoint.z).normalize(), this.radius+this.EPSILON)
                let newp = Vec3.add(midPoint, impuls);
                p.old.set(p)
                p.set(newp)
            }
        }
    }
};

