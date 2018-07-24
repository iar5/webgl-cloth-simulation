class Towel extends Mesh{
    constructor(amountX=10, amountY=10, density=1) {
        super(basicProgram, gl.LINES)
        this.amountX = amountX;
        this.amountY = amountY;
        this.density = density;
        this._generatePointsAndTriangles();
        this._generateVerticesIndicesAndColors();
    }
    _generatePointsAndTriangles() {
        this.points = [];
        for (let y = this.amountY; y>0; y--) {
            for (let x = 0; x < this.amountX; x++) {
                this.points.push({
                    x: x * this.density - this.amountX*this.density/2,
                    y: y * this.density,
                    z: 0,
                });
            }
        }
        this.triangles = [];
        for (let y = 0; y < this.amountY; y++) {
            for (let x = 0; x < this.amountX; x++) {
                if (y + 1 == this.amountY) break;
                if (x + 1 == this.amountX) continue;
                this.triangles.push(new Triangle(
                    this.points[y*this.amountX + x], 
                    this.points[y*this.amountX + x+1], 
                    this.points[(y+1)*this.amountX + x]
                ));
                this.triangles.push(new Triangle(
                    this.points[(y+1)*this.amountX + x], 
                    this.points[y*this.amountX + x+1], 
                    this.points[(y+1)*this.amountX + x+1]
                ));
            }
        }
    }
    _generateVerticesIndicesAndColors() {
        this.compileVerticesFromPoints();
        this._indices = [];
        for (let y = 0; y < this.amountY; y++) {
            for (let x = 0; x < this.amountX; x++) {
                if(this.drawMode == gl.TRIANGLES){
                    if (y + 1 == this.amountY) break;
                    if (x + 1 == this.amountX) continue;
                    this._indices.push(y*this.amountX + x, y*this.amountX + x+1, (y+1)*this.amountX + x);
                    this._indices.push((y+1)*this.amountX + x, y*this.amountX + x+1, (y+1)*this.amountX + x+1);
                }
                else if(this.drawMode == gl.LINES){
                    if (y+1 < this.amountY) this._indices.push(y*this.amountX + x, (y+1)*this.amountX + x);
                    if (x+1 < this.amountX) this._indices.push(y*this.amountX + x, y*this.amountX + x+1);
                    if (x+1 < this.amountX && y+1 < this.amountY) this._indices.push((y+1)*this.amountX + x, y*this.amountX + x+1);
                    //if (x+1 < this.amountX && y+1 < this.amountY) this._indices.push((y+1)*this.amountX + x+1, y*this.amountX + x); // weglassen, damit Dratsellung mit Kollisionsdreiecken übereinstimmt
                }
            }
        }
        this._colors = [];
        for(let i=0; i<this._vertices.length/3; i++){
            this._colors.push(.1, .1, .1, 1)
        }  
    }
    applyCloth(cloth){
        cloth.applyMesh(this);
        this.cloth = cloth;
        return this;
    }
    update(){
        if(this.cloth) this.cloth.updateMesh();
    }
}



