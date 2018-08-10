window.addEventListener('load', () => {
    gui = new dat.GUI();
    var enviroment = gui.addFolder('enviroment');
    enviroment.add(this, 'gravity');
    enviroment.add(this, 'windX');
    enviroment.add(this, 'windZ');
    enviroment.add(this, 'drag', 0.9, 1.1);
})
var clothIstances = 0;

var gravity = 9.81; 
var windX = 0.00;
var windZ = 0.00;
var drag = 0.99; 

var structuralStrength = 0.9;
var shearStrength = 0.9;
var bendStrength = 0.3;

var defaultMass = 1
var defaultStiffness = 0.4
var defaultIterations = 100; 



/**
 * Simuliert das Verhalten von Textil über ein Partikelnetz.
 * Damit eine Änderungen über einen Zeitschritt geschieht, muss updateMesh() aufgerufen werden
 * Mit einem Masse-Feder-System werden die Positionen der Partikel über Federn zusammengehalten
 * Dies geschieht iterativ, Abbruchbedingung sind @param stiffness und eine maximale Anzahl @param iterations
 * @param {Number} stiffness Prozentangabe [0;1] um wie viel sich die Federn maximal ausdehnen dürfen
 * @param {Number} mass Gewicht des gesamten Textil
 */
class Cloth{
    constructor(stiffness=defaultStiffness, mass=defaultMass, iterations=defaultIterations) {
        this.mesh = null;
        this.mass = mass;
        this.iterations = iterations;
        this.iterationMode = "collectiv"
        this.stiffness = stiffness < 0 ? 0 : stiffness > 1 ? 2 : stiffness;

        let guiFolder = window.gui.addFolder('cloth'+clothIstances++);
        guiFolder.add(this, 'iterations', 0, 500).step(1);
        guiFolder.add(this, 'stiffness', 0, 2);
        guiFolder.add(this, 'iterationMode', ["single", "collectiv", "fullIteration"]);
    }
    applyMesh(mesh){
        if(mesh instanceof Towel){
            let towel=this.mesh=mesh;
            let points=towel.points, amountY=towel.amountY, amountX=towel.amountX, density=towel.density;
            let particelMass = amountX*density*amountY*density / this.mass

            for (let i=0; i < points.length; i++) {
                points[i] = new Particle(points[i], particelMass)
            }
            let springs = this.springs = [];
            for (let y=0; y < amountY; y++) {
                for (let x=0; x < amountX; x++) {
                    /* strucutral springs */
                    if (x+1 < amountX) {
                        let p0 = points[y*amountX + x],
                            p1 = points[y*amountX + x+1];
                        springs.push(new Spring(p0, p1, Vec3.dist(p0, p1), structuralStrength));
                        }
                    if (y+1 < amountY) {
                        let p0 = points[y*amountX + x],
                            p1 = points[(y+1)*amountX + x];
                        springs.push(new Spring(p0, p1, Vec3.dist(p0, p1), structuralStrength));
                        }
                    /* shear springs */
                    if (x+1 < amountX && y+1 < amountY) {
                        let p0 = points[y*amountX + x],
                            p1 = points[(y+1)*amountX + x+1],
                            p2 = points[y*amountX + x+1],
                            p3 = points[(y+1)*amountX + x];
                        springs.push(new Spring(p0, p1, Vec3.dist(p0, p1), shearStrength));
                        springs.push(new Spring(p2, p3, Vec3.dist(p2, p3), shearStrength));
                    }
                    /* bend springs */
                    if(x+2 < amountX) {
                        let p0 = points[y*amountX + x],
                            p1 = points[y*amountX + x+2];
                        springs.push(new Spring(p0, p1, Vec3.dist(p0, p1), bendStrength));
                        }
                    if(y+2 < amountY) {
                        let p0 = points[y*amountX + x],
                            p1 = points[(y+2)*amountX + x];
                        springs.push(new Spring(p0, p1, Vec3.dist(p0, p1), bendStrength));
                    }
                }
            }
            let triangles = this.triangles = [];
            for (let y=0; y < amountY; y++) {
                for (let x = 0; x < amountX; x++) {
                    if (y + 1 == amountY) break;
                    if (x + 1 == amountX) continue;
                    triangles.push(new Triangle(points[y*amountX + x], points[(y+1)*amountX + x], points[y*amountX + x+1]));
                    triangles.push(new Triangle(points[(y+1)*amountX + x], points[(y+1)*amountX + x+1], points[y*amountX + x+1]));
                }
            }
        }
        else throw Error("Mesh not suitable for cloth simulation");

    }
    pin(pins){
        for(let i of pins) this.mesh.points[i].pin();
    }


    /** 
     * Simulation loop
     */
    updateMesh(){
        this._applyExternalForces();
        this._satisfyConstraints();
        this.mesh.compileVerticesFromPoints();
    }

    _applyExternalForces () {
        for (let i=0; i < this.mesh.points.length; i++) {
            let p = this.mesh.points[i];
            if (p.pinned) continue;

            //let v = Vec3.sub(p, p.old).scale(1/60);
            //let a = new Vec3(windX, -gravity, windZ).scale(1/p.mass).scale(1/60/60*0.5);
            let v = Vec3.sub(p, p.old)
            let a = new Vec3(windX, -gravity, windZ).scale(1/p.mass).scale(1/60);
            p.old.set(p);
            p.add((v.add(a).scale(drag)));
        }
    }
    _satisfyConstraints() {
        let satisfied = false;

        for(let i=1; satisfied!=true && i<this.iterations; i++){
            satisfied = true;
            for (let s of this.springs) {

                if(this.iterationMode == 'single'){
                    if(Math.abs(s.getElongationInPercent()) > this.stiffness){
                        let elogation = s.disctanceConstraint(this.stiffness)
                        satisfied = false; 
                        //console.log("Overeloganted spring by "+ Math.round((elogation-this.stiffness)*100) + "%")
                    }
                }
                else if(this.iterationMode == 'collectiv'){
                    let elongation = s.disctanceConstraint()
                    if(Math.abs(elongation) > this.stiffness) satisfied = false; 
                }   
                else if(this.iterationMode == 'fullIteration'){
                    satisfied = false;
                    s.disctanceConstraint()
                }
            }

            if(satisfied == true) console.log("Satisfied on iteration "+i+ "/"+this.iterations)
            this.__collisionConstraint();  
        }  
    }   
    __collisionConstraint() {
        // Bottom Collision    
        let bounce = 0.6;  
        let friction = 0.5;
        for (let p of this.mesh.points) {
            if (p.y < 0) {
                p.y = 0;
                p.old.x = p.x + (p.x-p.old.x) * friction;
                p.old.y = -p.old.y * bounce;
                p.old.z = p.z + (p.z-p.old.z) * friction;
            }
        }
        // Object Collision
        for(let o of objects) {
            if(o instanceof Towel) continue;
            else if(o instanceof Sphere || o instanceof Plane) o.resolveSoftPointCollision(this.mesh.points);
            else if(o instanceof Obj) o.resolvePartikelCollision(this.mesh.points);  
            //else if(o instanceof Obj) o.resolveTriangleCollision(this.triangles);  
        }  
    } 
}