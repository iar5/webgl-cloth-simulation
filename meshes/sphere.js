var sphereInstances=0;

class Sphere extends MeshObject{
    constructor(radius=1, numLatitudes=12, numLongitudes=12) {
        super(lightProgram, gl.TRIANGLES)
        this.radius = radius;
        this.numLatitudes = numLatitudes;
        this.numLongitudes = numLongitudes;
        this.midPoint = new Vec3(0, 0, 0);
        this.EPSILON = 0.01;
    }
    _initGl(){
        this._generateBufferData();
        this._setupGui();
        super._initGl();
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
                this._vertices.push(this.midPoint.x + x*this.radius, this.midPoint.y + y*this.radius, this.midPoint.z + z*this.radius);
            }
        }
        this._colors = [];
        for(let i=0; i < this._vertices.length/3; i++){
            this._colors.push(1, 1, 0, 1)
        }
        this._indices = [];
        for (let latitude=0; latitude < this.numLatitudes; latitude++){
            for (let longitude=0; longitude < this.numLongitudes; longitude++) {
                let first  = latitude * (this.numLongitudes + 1) + longitude;
                let second = first + this.numLongitudes + 1;
                this._indices.push(first, first+1, second);  
                this._indices.push(second, first+1, second+1);
            }
        }
    }
    _setupGui() {
        let guiFolder = this.guiFolder = window.gui.addFolder('sphere' + sphereInstances++);
        guiFolder.add(this, 'radius', 0, 5).step(0.01);
        guiFolder.add(this.midPoint, 'x', -7, 7).step(0.01);
        guiFolder.add(this.midPoint, 'y', -7, 7).step(0.01);
        guiFolder.add(this.midPoint, 'z', -7, 7).step(0.01);
    }


    /**
     * Durch die von der gui geupdaten Daten werden vertices in jedem Frame neu berechnet
     * Translate beachtet nur Mittelpunkt
     */
    update(){
        this._generateBufferData();
        super.update();
    }

    translate(x, y, z){
        this.midPoint.add(new Vec3(x,y,z))
        if(this.guiFolder) this.guiFolder.updateDisplay()
        return this
    }

    /**
     * Wird nicht erkannt wenn Partikel sich durch Kugel komplett durch bewegt, nur wenn er drin ist
     * @param {*} points 
     */
    resolvePointCollision(points){
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

