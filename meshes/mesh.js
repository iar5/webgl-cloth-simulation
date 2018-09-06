/**
 * Klasse zum Laden von .json Dreiecksnetz Objekten, die mit assimp2json generiert wurden
 * Anforderungen
 * - .obj bzw .json darf keine Doppelten Vertices haben
 * - Also Face Indices nicht in der Form: [0,1,2], [3,4,5], ..
 * - Sondern [0,1,2], [0,2,3], .. o.Ä
 * - Sonst hat jedes Dreieck eigene Punkte die z.B. bei Umpositionierung unabhängig vom Dublikat sind
 */

class Mesh extends MeshObject {
    constructor(resourceJSON) {
        super(lightProgram, gl.TRIANGLES)
        if(!resourceJSON.meshes) throw Error ("JSON Formatierung nicht untersützt, bitte assimp2json benutzen.") 
        this.name = resourceJSON.rootnode.name;
        this._generateBufferData(resourceJSON)
        this._generatePointsAndTriangles();
        this._setupCollisionHirarchie();
    }

    _generateBufferData(model){
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
        this._colors = [];
        for(let i=0; i < this._vertices.length/3; i++){
            this._colors.push(.5, .6, .5, 1)
        }      
    }
    _generatePointsAndTriangles(){
        this.points = generateVec3sFromContinousArray(this._vertices)
        this.triangles = [];
        for(let i=0; i < this._indices.length; i+=3){
            this.triangles.push(new Triangle(
                this.points[this._indices[i]], 
                this.points[this._indices[i+1]], 
                this.points[this._indices[i+2]]
            ))
        }
    }
    _setupCollisionHirarchie(){
        // Erstellt mindestens eine AABB
        // triangles.length/200 ist die effizienteste Tiefe für human806poly Modell
        this.aabb = new AABB(null, this.triangles, Math.floor(this.triangles.length/200))
    }

    /**
     * Erweitern von Methoden
     * funciton.apply übergibt das args Array in 'Parameterform'
     * @param  {...any} args 
     */
    translate(...args){    
        let temp = super.translate.apply(this, args);
        this._setupCollisionHirarchie()
        return temp;
    }
    rotate(...args){    
        let temp = super.rotate.apply(this, args);
        this._setupCollisionHirarchie()
        return temp;
    }

    /**
     * Prüft wie viele Schnittpunkte ein Strahl aus Partikel+Geschw.vektor mit den Teilobjekte (Dreiecke) dieses Objektes besitzt
     * Insofern Objekt geschlossen ist (Planare Objekte ohne 'Volumen' falle weg):
     * @returns {true}  bei ungeraden Schnittpunkteanzahl
     * @returns {false} bei gerader Schnittpunktanzahl
     * (Nicht komplett auf Richtigkeit getestet)
     */
    isPointInside(p){
        let intersections = [];
        let dir = Vec3.sub(p, p.old).normalize();
        for (let tri of this.triangles) {
            let t = tri.getRayTriangleIntersection(p, dir);
            if(t != null && t > 0) intersections.push(new Vec3(p.x + t*dir.x, p.y + t*dir.y, p.z + t*dir.z))
        }  
        return this.triangles.length>1 && intersections.length % 2 == 1;
    } 

    resolvePartikelCollision(points){
        let triangles = this.triangles
        for(let p of points){
            triangles = this.aabb.getTestedTriangles(p);
            if(triangles == null) continue
            for (let t of triangles) {
                t.resolvePartikelCollision(p)
            }
        }
    }
}



