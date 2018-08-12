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

        if(color instanceof Array) this.color = color;
        else if(color == 'red') this.color = [1, 0, 0, 1]
        else if(color == 'green') this.color = [0, 1, 0, 1]
        else if(color == 'blue') this.color = [0, 0, 1, 1]
        else if(color == 'yellow') this.color = [1, 1, 0, 1]
        else if(color == 'cyan') this.color = [0, 1, 1, 1]
        else if(color == 'magenta') this.color = [1, 0, 1, 1]
        else this.color = [.5, .6, .5, 1]
    }

    initGl(gl, callback) {
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
            let r=this.color[0], g=this.color[1], b=this.color[2], a=this.color[3];
            for(let i=0; i<this._vertices.length/3; i++) this._colors.push(r,g,b,a);

            this.points = generateVec3sFromContinousArray(this._vertices)
            this.normals = [];
            for(let i=0; i < this._normals.length; i+=3){
                this.normals.push(new Vec3(this._normals[i], this._normals[i+1], this._normals[i+2]))
            }
            this.triangles = [];
            for(let i=0; i < this._indices.length; i+=3){
                this.triangles.push(new Triangle(
                    this.points[this._indices[i]], 
                    this.points[this._indices[i+1]], 
                    this.points[this._indices[i+2]]
                ))
            }
            super.initGl(gl, callback)
        })
    }

    /**
     * Prüft wie viele Schnittpunkte ein Strahl aus Partikel+Geschw.vektor mit den Teilobjekte (Dreiecke) dieses Objektes besitzt
     * Insofern Objekt geschlossen ist (Planare Objekte ohne 'Volumen' falle weg):
     * @returns {true}  bei ungeraden Schnittpunkteanzahl
     * @returns {false} bei gerader Schnittpunktanzahl
     * (Nicht komplett auf Richtigkeit getestet)
     */
    isPointInside(points){
        for(let p of points){
            let intersections = [];
            let dir = Vec3.sub(p, p.old).normalize();
            for (let tri of this.triangles) {
                let t = tri.moellerTrumbore(p, dir);
                if(t != null && t > 0) intersections.push(new Vec3(p.x + t*dir.x, p.y + t*dir.y, p.z + t*dir.z))
            }  
           return this.triangles.length>1 && intersections.length % 2 == 1;
        }
    } 
    resolvePartikelCollision(points){
        for (let t of this.triangles) {
            for(let p of points){
                if(!t.testPointSphere(p)) continue
                t.resolvePartikelCollision(p)
            }
        }
    }
    resolveTriangleCollision(softTriangles){
        for (let t of this.triangles) {
            for (let st of softTriangles) {
                if(!t.testTrianglSphere(st)) continue
                t.resolveTriangleCollision(st);
            }
        }
    }
}



