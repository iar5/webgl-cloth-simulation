class Towel extends MeshObject {
    constructor(amountX = 10, amountY = 10, density = 1) {
        super(lightProgram, gl.TRIANGLES)
        this.amountX = amountX;
        this.amountY = amountY;
        this.density = density;
        this._generateBufferData();
        this._generatePointsAndTriangles();
        this._changeIndicesFromDrawMode();
        this.programName = "light" // Siehe Problembeschreibung in mesh.draw()

    }
    _generateBufferData() {
        /*
        * PUNKTE:
        * 1, 2, 3, 4, 5, 6, 7, 8, ... amountX-1,
        * amountX, amountX+1, amountX+2, ... ,
        * 2*amountX, 2*amountX+2, 2*amountX+3 ... ,
        * 3*amountX, ...
        */        
        this._vertices = [];
        for (let y = this.amountY; y > 0; y--) {
            for (let x = 0; x < this.amountX; x++) {
                this._vertices.push(
                    x * this.density - this.amountX * this.density / 2,
                    y * this.density,
                    0,
                );
            }
        }
        this._normals = [];
        for (let i = 0; i < this._vertices.length / 3; i++) {
            this._normals.push(0, 1, 0)
        }
        this._colors = [];
        for (let i = 0; i < this._vertices.length / 3; i++) {
            this._colors.push(.5, .7, .5, 1)
        }
        /*
        * Triangle INDICES: (CounterClockwise)
        * 1 . .  |  1 3 .  |  . 1 3  |  . . 3
        * 2 3 .  |  . 2 .  |  . 2 .  |  . 1 2
        */
       this._triangleIndices = [];
       for (let y = 0; y < this.amountY; y++) {
           for (let x = 0; x < this.amountX; x++) {
                if (y + 1 == this.amountY) break;
                if (x + 1 == this.amountX) continue;
                this._triangleIndices.push(y*this.amountX + x, (y+1)*this.amountX + x, (y+1)*this.amountX + x+1);
                this._triangleIndices.push(y*this.amountX + x, (y+1)*this.amountX + x+1, y*this.amountX + x+1);
                //this._triangleIndices.push(y*this.amountX + x, (y+1)*this.amountX + x, y*this.amountX + x+1);
                //this._triangleIndices.push((y+1)*this.amountX + x, (y+1)*this.amountX + x+1, y*this.amountX + x+1);
           }
       }
       this._lineIndices = [];
       for (let y = 0; y < this.amountY; y++) {
            for (let x = 0; x < this.amountX; x++) {
                if (y + 1 < this.amountY) this._lineIndices.push(y * this.amountX + x, (y+1)*this.amountX + x);
                if (x + 1 < this.amountX) this._lineIndices.push(y * this.amountX + x, y * this.amountX + x + 1);
                if (x + 1 < this.amountX && y + 1 < this.amountY) this._lineIndices.push((y + 1) * this.amountX + x + 1, y * this.amountX + x); // weglassen, damit Dratsellung mit Kollisionsdreiecken übereinstimmt
                //if (x + 1 < this.amountX && y + 1 < this.amountY) this._lineIndices.push((y + 1) * this.amountX + x, y * this.amountX + x + 1);            
            }
        }
    }
    _generatePointsAndTriangles() {
        let points = this.points = generateVec3sFromContinousArray(this._vertices)
        let indices = this._triangleIndices;
        let triangles = this.triangles = [];
        for (let i=0; i < indices.length; i+=3) {
            triangles.push(new Triangle(points[indices[i]], points[indices[i+1]], points[indices[i+2]]));
        }
    }

    /**
     * Indices je nach derzitigem Zeichenmodus anpassen
     */
    _changeIndicesFromDrawMode(){
        if (this.drawMode == gl.TRIANGLES) this._indices = this._triangleIndices;
        else this._indices = this._lineIndices;
    }

    /**
     * Textil Animator
     * Erst aufrufen, nachdem alle initialen Transformationen ausgeführt sind, da ein Bakup vom jetzigen Standpunkt gespeichert wird
     * @param {Cloth} cloth
     * @param {Array} pinArr Indices der Partikel die nach der Initierung des Cloth gepinned werden
     */
    applyCloth(cloth, pinArr){
        cloth.applyMesh(this, pinArr);
        this.cloth = cloth;
        return this;
    }
    update(){
        this.cloth.updateMesh();
        this._changeIndicesFromDrawMode();
        super.update();
    }
    

    /**
     * TODO Hier self collision 
     * Wie gewohnt über die Dreiecke, vorher nur adjazente von ausschließen?
     * @param {*} points 
     */
    resolvePartikelCollision(points){
        return;
    }

}
