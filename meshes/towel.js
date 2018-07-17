class Towel extends Mesh{
    constructor(amountX = 10, amountY = 10, density = 1) {
        super(basicProgram, gl.LINES)

        this.amountX = amountX;
        this.amountY = amountY;
        this.density = density;

        this._generatePointsSpringsAndTriangles();
        this._generateVerticesIndicesAndColors();

        this.points[0].pinned = true;
        //this.points[amountX - 1].pinned = true;
        //this.points[amountX * (amountY-1)].pinned = true;
        this.points[amountX * amountY -1].pinned = true;
    }
    _generatePointsSpringsAndTriangles() {
        this.points = [];
        for (let y = this.amountY; y>0; y--) {
            for (let x = 0; x < this.amountX; x++) {
                this.points.push({
                    x: x * this.density - this.amountX*this.density/2,
                    y: y * this.density,
                    z: 0,
                    oldx: x * this.density - this.amountX*this.density/2,
                    oldy: y * this.density,
                    oldz: 0
                });
            }
        }
        this.springs = [];
        for (let y=0; y < this.amountY; y++) {
            for (let x=0; x < this.amountX; x++) {
                /* strucutral springs */
                if (x+1 < this.amountX) {
                    let p0 = this.points[y*this.amountX + x],
                        p1 = this.points[y*this.amountX + x+1];
                    this.springs.push({p0, p1, length: vec3.dist(p0, p1), type: 'structural'});
                }
                if (y+1 < this.amountY) {
                    let p0 = this.points[y*this.amountX + x],
                        p1 = this.points[(y+1)*this.amountX + x];
                    this.springs.push({p0, p1, length: vec3.dist(p0, p1), type: 'structural'});
                }
                /* shear springs */
                if (x+1 < this.amountX && y+1 < this.amountY) {
                    let p0 = this.points[y*this.amountX + x],
                        p1 = this.points[(y+1)*this.amountX + x+1],
                        p2 = this.points[y*this.amountX + x+1],
                        p3 = this.points[(y+1)*this.amountX + x];
                    this.springs.push({p0: p0, p1: p1, length: vec3.dist(p0, p1), type: 'shear'});
                    this.springs.push({p0: p2, p1: p3, length: vec3.dist(p2, p3), type: 'shear'});
                }
                /* bend springs */
                if(x+2 < this.amountX) {
                    let p0 = this.points[y*this.amountX + x],
                        p1 = this.points[y*this.amountX + x+2];
                    this.springs.push({p0, p1, length: vec3.dist(p0, p1), type: 'bend'});
                }
                if(y+2 < this.amountY) {
                    let p0 = this.points[y*this.amountX + x],
                        p1 = this.points[(y+2)*this.amountX + x];
                    this.springs.push({p0, p1, length: vec3.dist(p0, p1), type: 'bend'});
                }
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
        for(let i=0; i < this._vertices.length/3; i++){
            this._colors.push(0, 0, 0, 1)
        }    
    }
}



