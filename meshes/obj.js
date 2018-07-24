/**
 * Wichtig für späteres Laden von Kleidungsmodellen in Verbindung mit Cloth:
 * - .obj bzw .json darf keine Doppelten Vertices haben! 
 * - Also nicht in der Form faces: [0,1,2], [3,4,5], ..
 * - Sondern [0,1,2], [0,2,3], .. o.Ä
 * - Sonst hat jedes Dreieck eigene Punkte die z.B. bei Umpositionierung unabhängig vom Dublikat sind
 */

class Obj extends Mesh {
    constructor(src, color) {
        super(phongProgram, gl.TRIANGLES)
        this.src = src;
        this.color = color;
    }
    init(gl, callback) {
        loadJSONResource(this.src, (model) => {
            console.log(model)
            if(!model.meshes) throw Error ("JSON Formatierung nicht untersützt, bitte assimp2json benutzen.") 

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
                if(this.color == 'red') this._colors.push(1, 0, 0, 1)
                else if(this.color == 'green') this._colors.push(0, 1, 0, 1)
                else if(this.color == 'blue') this._colors.push(0, 0, 1, 1)
                else if(this.color == 'yellow') this._colors.push(1, 1, 0, 1)
                else if(this.color == 'cyan') this._colors.push(0, 1, 1, 1)
                else if(this.color == 'magenta') this._colors.push(1, 0, 1, 1)
                else this._colors.push(.5, .6, .5, 1)
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



