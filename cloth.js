window.addEventListener('load', () => {
    gui = new dat.GUI();
    var enviroment = gui.addFolder('enviroment');
    enviroment.add(this, 'gravity');
    enviroment.add(this, 'windX');
    enviroment.add(this, 'windZ');
    enviroment.add(this, 'drag', 0.9, 1.01);
})
var clothIstances = 0;

var gravity = 9.81; 
var windX = 0.00;
var windZ = 0.00;
var drag = 0.99; 

var defaultStiffness = 0.3;
var defaultIterations = 10; 




/**
 * Simuliert das Verhalten von Textil über ein Partikelnetz.
 * Damit eine Änderungen über einen Zeitschritt geschieht, muss updateMesh() aufgerufen werden
 * Mit einem Masse-Feder-System werden die Positionen der Partikel über Federn zusammengehalten
 * Dies geschieht iterativ, Abbruchbedingung sind @param stiffness und eine maximale Anzahl @param iterations
 * @param {Number} stiffness Prozentangabe [0;1] um wie viel sich die Federn maximal ausdehnen dürfen
 * @param {Number} iterations Anzal der (maximalen) Iterationen über die Distanzbedingungen, Auswirkung abhängig vom iterationMode
 */
class Cloth{
    constructor(stiffness=defaultStiffness, iterations=defaultIterations, iterationMode) {
        this.mesh = null;
        this.mass = 1; // wegnehmen
        this.iterations = iterations;
        this.stiffness = stiffness < 0 ? 0 : stiffness > 1 ? 2 : stiffness;
        this.iterationMode = iterationMode || "fullIteration"
        this.springStrengths = {
            'structural' : 1,
            'shear' : 1,
            'bend' : 0.5
        }
        this.elongationMap = false;
    }
    
    /**
     * "Zweiter Konstruktor" bzw. Initiator
     * Ersetzt die Punkte mit Partikel, initiert Federn
     * Initierung der Drieecke hier weil Referenzen von Punkten/Partikeln gespeichert werden und diese ja grad überschrieben wurden
     * @param {MeshObject} mesh 
     */
    applyMesh(mesh, pinArr){
        if(mesh instanceof Towel){
            this.mesh = mesh;
            this._pointsBakup = JSON.parse(JSON.stringify(mesh.points))
            this._setupSpringMass()
            this._setupGui();
            if(pinArr) this.pin(pinArr)
        }
        else throw Error("MeshObject not suitable for cloth simulation");
    }

    /**
     * Array mit Indices der Partikel, die von Kräften unbeachtetn sein sollen
     * @param {Array} pointIndices 
     */
    pin(pointIndices){
        for(let indice of pointIndices) this.mesh.points[indice].pin();
    }
    
    _setupSpringMass(){
        let towel=this.mesh;
        let amountY=towel.amountY, amountX=towel.amountX
        let particelMass = this.mass

        let points = towel.points;
        for (let i=0; i < points.length; i++) {
            points[i] = new Particle(points[i], particelMass)
        }
        let triangles = towel.triangles = [];
        for (let y=0; y < amountY; y++) {
            for (let x = 0; x < amountX; x++) {
                if (y + 1 == amountY) break;
                if (x + 1 == amountX) continue;
                triangles.push(new Triangle(points[y*amountX + x], points[(y+1)*amountX + x], points[y*amountX + x+1]));
                triangles.push(new Triangle(points[(y+1)*amountX + x], points[(y+1)*amountX + x+1], points[y*amountX + x+1]));
            }
        }
        let springs = this.springs = [];
        for (let y=0; y < amountY; y++) {
            for (let x=0; x < amountX; x++) {
                /* strucutral springs */
                if (x+1 < amountX) {
                    let p0 = points[y*amountX + x],
                        p1 = points[y*amountX + x+1];
                    springs.push(new Spring(p0, p1, Vec3.dist(p0, p1), 'structural'));
                    }
                if (y+1 < amountY) {
                    let p0 = points[y*amountX + x],
                        p1 = points[(y+1)*amountX + x];
                    springs.push(new Spring(p0, p1, Vec3.dist(p0, p1), 'structural'));
                    }
                /* shear springs */
                if (x+1 < amountX && y+1 < amountY) {
                    let p0 = points[y*amountX + x],
                        p1 = points[(y+1)*amountX + x+1],
                        p2 = points[y*amountX + x+1],
                        p3 = points[(y+1)*amountX + x];
                    springs.push(new Spring(p0, p1, Vec3.dist(p0, p1), 'shear'));
                    springs.push(new Spring(p2, p3, Vec3.dist(p2, p3), 'shear'));
                }
                /* bend springs */
                if(x+2 < amountX) {
                    let p0 = points[y*amountX + x],
                        p1 = points[y*amountX + x+2];
                    springs.push(new Spring(p0, p1, Vec3.dist(p0, p1), 'bend'));
                    }
                if(y+2 < amountY) {
                    let p0 = points[y*amountX + x],
                        p1 = points[(y+2)*amountX + x];
                    springs.push(new Spring(p0, p1, Vec3.dist(p0, p1), 'bend'));
                }
            }
        }
    }
    
    _setupGui(){
        let guiFolder = window.gui.addFolder('cloth'+clothIstances++);
        let springFolder = guiFolder.addFolder('spring strengths');
        springFolder.add(this.springStrengths, 'structural', 0, 1).step(0.1);
        springFolder.add(this.springStrengths, 'shear', 0, 1).step(0.1);
        springFolder.add(this.springStrengths, 'bend', 0, 1).step(0.1);
        guiFolder.add(this, 'iterations', 0, 200).step(1);
        guiFolder.add(this, 'stiffness', 0, 1);
        guiFolder.add(this, 'iterationMode', ["singleStiffness", "collectivStiffness", "fullIteration"]);
        guiFolder.add(this.mesh, 'drawMode', {filled: gl.TRIANGLES, grid: gl.LINES, partikel: gl.POINTS});
        guiFolder.add(this.mesh, 'programName', ["light", "basic"]);
        guiFolder.add(this, 'elongationMap');
        guiFolder.add({resetPosition: () => {
            let points = this.mesh.points;
            let pointsBak = this._pointsBakup
            for(let i=0; i<points.length; i++){
                points[i].set(pointsBak[i]);
                points[i].old.set(pointsBak[i]);

            }
        }}, 'resetPosition');
        guiFolder.open()
    }



    /** 
     * Simulation loop, muss vom Mesh aufgerufen werden
     */
    updateMesh(){
        this._applyExternalForces();
        this._applyInternalForces();
        this.mesh.recalculateTriangleNormals();
        this.mesh.updateNormalsFromTriangles();
        this.mesh.updateVerticesFromPoints();
        if(this.elongationMap) this.mesh._colors = this._getColorsFromElongation();
        else this.mesh._colors = this.mesh._colorsBackup;
    }
    
    _applyExternalForces() {
        for (let i=0; i < this.mesh.points.length; i++) {
            let p = this.mesh.points[i];

            let v = Vec3.sub(p, p.old);
            let a = new Vec3(windX, -gravity, windZ).scale(1/60/60).scale(p.mass);
            p.old.set(p);
            p.add((v.add(a).scale(drag)));
        }
    }
    _applyInternalForces() {
        let satisfied = false;
        let i = 1;
        let strength;
        this.__collisionConstraint();    
        for(; satisfied!=true && i<this.iterations+1; i++){
            satisfied = true;
            for (let s of this.springs) {
                strength = this.springStrengths[s.type];
                if(this.iterationMode == 'fullIteration'){
                    s.disctanceConstraint(strength)
                    satisfied = false;
                }
                else if(this.iterationMode == 'collectivStiffness'){
                    s.disctanceConstraint(strength)
                    if(Math.abs(s.getLastElongation(strength)) > this.stiffness) satisfied = false; 
                }   
                else if(this.iterationMode == 'singleStiffness'){
                    if(Math.abs(s.getActualElongation(strength)) > this.stiffness){
                        s.disctanceConstraint(strength)
                        satisfied = false; 
                        //console.log("Overeloganted spring by "+ Math.round((elogation-this.stiffness)*100) + "%")
                    }
                }
            }
        }
        this.__collisionConstraint();    

        if(this.iterationMode != 'fullIteration') {
            if(satisfied == true) console.log("Satisfied on iteration "+i+ "/"+this.iterations)
            else console.warn("Stiffness not satisfied! Increase (maximum) iterations if this message appears too often.")
        }
    }   
    __collisionConstraint() {
        // Bottom Collision    
        let bounce = 0.3;  
        let friction = .3;
        for (let p of this.mesh.points) {
            if (p.y < 0) {
                p.y = 0;
                p.old.x = p.x - (p.x-p.old.x) * friction;
                p.old.y = -p.old.y * bounce;
                p.old.z = p.z - (p.z-p.old.z) * friction;
            }
        }
        // Object Collision
        for(let o of objects) {
            if (o instanceof Sphere) o.resolvePointCollision(this.mesh.points);
            else o.resolvePartikelCollision(this.mesh.points);  
        }  
    } 
    _getColorsFromElongation(){
        let colors = [];
        for(let p of this.mesh.points){
            let elongationCount = 0;
            let strengthCount = 0;
            for(let s of this.springs){
                if(!(s.p0 == p || s.p1 == p)) continue;
                let strength = this.springStrengths[s.type];
                let elongation = s.getActualElongation(strength);
                elongationCount += elongation;
                strengthCount += strength;
            }
  
            const val = elongationCount/strengthCount;
            const stiff = this.stiffness;

            let rgb = new Vec3(
                val/stiff, // wird 0 wenn val negativ ist
                stiff,
                val/-stiff
            ).normalize();

            colors.push(rgb.x, rgb.y, rgb.z, 1)
        }
        return colors;
    }
}