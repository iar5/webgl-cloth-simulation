class Plane extends MeshObject{
    constructor(width=1, depth=1) {
        super(lightProgram, gl.TRIANGLES)
        this.width = width;
        this.depth = depth;
        this.midPoint = new Vec3(0, 0, 0);

        this._generateBufferData();
        this.points = generateVec3sFromContinousArray(this._vertices);
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
        this.midPoint.add(new Vec3(x,y,z))
        return super.translate(x, y, z);
    }
    /**
     * Naiver test, nicht weiter getestet auch nicht ganz richtig
     * @param {*} points 
     */
    resolvePartikelCollision(points){
        if(this.width == 0 && this.depth == 0) return
        let midPoint=this.midPoint, width=this.width, depth=this.depth;
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

