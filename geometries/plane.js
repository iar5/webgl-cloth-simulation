class Plane extends Geometry{
    constructor(width, depth) {
        super(phongProgram, gl.TRIANGLES)
        this.width = width | 1;
        this.depth = depth | 1;
        this.midPoint = new vec3(0, 0, 0);

        this._generateBufferData();
        this.points = this.generatePointsFromContinousArray(this._vertices)
    }
    _generateBufferData() {
        /**
         *  A - B
         *  |   |
         *  D - C
         */
        this._vertices = [
            -this.width/2, 0, this.depth/2,   // 1: A
            this.width/2, 0, this.depth/2,    // 2: B
            this.width/2, 0, -this.depth/2,   // 3: C 
            -this.width/2, 0, -this.depth/2   // 4: D
        ]; 
        this._normals = [
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0
        ];
        this._indices = [
            0, 1, 2,
            2, 3, 0
        ];        
        this._colors = [];
        for(let i=0; i < this._vertices.length/3; i++){
            this._colors.push(.7, .95, .75, 1)
        }
    }
    translate(x, y, z){
        this.midPoint.add(new vec3(x,y,z))
        return super.translate(x, y, z);
    }
    resolveSoftPointCollision(points){
        let midPoint=this.midPoint, width=this.width, depth=this.depth;
        // sehr naiver test
        for(let p of points){
            if( -width/2+midPoint.x < p.x && p.x < width/2+midPoint.x 
            &&  -depth/2+midPoint.z < p.z && p.z < depth/2+midPoint.z 
            &&  p.y < midPoint.y          && p.old.y > midPoint.y)
            {
                p.y = midPoint.y+0.0001
                p.old.y = midPoint.y+0.0001
            }
        }
    }
};

