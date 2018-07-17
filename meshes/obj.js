class Obj extends Mesh {
    constructor(src) {
        super(phongProgram, gl.TRIANGLES)
        this.src = src;
    }
    init(gl, callback) {
        loadJSONResource(this.src, (model) => {
            // http://www.greentoken.de/onlineconv/ 
            if(!model.meshes) throw Error ("JSON Formatierung nicht untersützt") 

            this._vertices = []; 
            this._normals = []; 
            this._indices = [];
            let indices, indicesOffset = 0;
            for(let mesh of model.meshes){
                this._vertices = this._vertices.concat(mesh.vertices);
                this._normals = this._normals.concat(mesh.normals);
                indices = [].concat.apply([], mesh.faces);
                this._indices = this._indices.concat(indices.map(f => f+indicesOffset));
                indicesOffset += mesh.vertices.length/3;
            }
            this._colors = []
            for(let i=0; i<this._vertices.length/3; i++){
                this._colors.push(.5, .6, .5, 1)
            }

            this.generatePointsFromVertices();

            this.normals = [];
            for(let i=0; i < this._normals.length; i+=3){
                this.normals.push({x: this._normals[i], y: this._normals[i+1], z: this._normals[i+2]})
            }

            // Gilt nur bei Dreiecksnetze
            this.triangles = [];
            for(let i=0; i < this._indices.length; i+=3){
                this.triangles.push(new Triangle(
                    this.points[this._indices[i]], 
                    this.points[this._indices[i+1]], 
                    this.points[this._indices[i+2]]
                ))
            }
            super.init(gl, callback)
        })
    }
    resolveCollision(p){
        /* 
        TODO Bounding Boxes, 
            - rekursiv machen mit Teilung der Box
            - evtl auch für y/z
            - Box Höhe größer als lengste Dreiecks Kante
        - Initialisierung:
        biggestY, lowestY
        for(triangles)
            for(a, b, c)
                if(y > irgendwas)
                    box1.add(triangle)
        */
        for (let t of this.triangles) {
            t.resolveCollision(p);
        }
    }
};



