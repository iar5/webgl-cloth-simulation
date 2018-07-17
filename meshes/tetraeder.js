class Tetraeder extends Mesh{
    constructor() {
        super(phongProgram, gl.TRIANGLES)

        this._generateVerticesIndicesAndColors();
        this.generatePointsFromVertices();
        this._generateTrianglesAndNormals();
    }
    _generateVerticesIndicesAndColors() {
        this._vertices = [
            -0.81649658203125, -0.3333333206176758, 0.4714045333862305,
             0.81649658203125, -0.3333333206176758, 0.4714045333862305, 
             0, -0.3333333206176758, -0.9428090667724609,
             0,  1, 0 
        ];
        this._indices = [
            2, 1, 0, 
            1, 3, 0, 
            2, 3, 1, 
            0, 3, 2  
        ];
        this._normals = [
            0, 0, 0,
            .5, 1, 0,
            1, 0, 0,
            0, 1, 0
        ];
        this._colors = [];
        for(let i=0; i < this._vertices.length/3; i++){
            this._colors.push(0, 1, 0, 1)
        }
    }
    _generateTrianglesAndNormals(){
        this.triangles = [];
        for(let i=0; i < this._indices.length; i+=3){
            this.triangles.push(new Triangle(
                this.points[this._indices[i]], 
                this.points[this._indices[i+1]], 
                this.points[this._indices[i+2]]
            ))
        }
        this.normals = [];
        for(let i=0; i < this._normals.length; i+=3){
            this.normals.push({x: this._normals[i], y: this._normals[i+1], z: this._normals[i+2]})
        }
    }
};

