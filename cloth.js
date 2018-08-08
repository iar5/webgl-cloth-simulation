// External forces
const gravity = 9.81; 
const windX = 0.001;
const windZ = 0.001;

// Spring forces
const structuralStrength = 0.9;
const shearStrength = 0.9;
const bendStrength = 0.3;

const inertia = 0.98; // partikel kommen schneller zur ruhe
const bounce = 0.6;  
const friction = 0.5;

const iterations = 50; 


/**
 * Simuliert das Verhalten von Textil über ein Partikelnetz.
 * Damit eine Änderungen über einen Zeitschritt geschieht, muss updateMesh() aufgerufen werden
 * Mit einem Masse-Feder-System werden die Positionen der Partikel über Federn zusammengehalten
 * Dies geschieht iterativ, Abbruchbedingung sind @param stiffness und eine maximale Anzahl @param iterations
 * @param {Number} stiffness Prozentangabe [0;1] um wie viel sich die Federn maximal ausdehnen dürfen
 * @param {Number} mass Gewicht des gesamten Textil
 */
class Cloth{
    constructor(stiffness, mass) {
        this.mesh = null;
        this.mass = mass || 1;
        if(!stiffness) this.stiffness = 0.1
        else if(stiffness < 0) this.stiffness = 0;
        else if(stiffness > 1) this.stiffness = 1;
    }
    applyMesh(mesh){
        if(!mesh instanceof Towel) throw Error("Mesh not suitable for cloth simulation");
        let towel=this.mesh=mesh, points=towel.points, amountY=towel.amountY, amountX=towel.amountX, density=towel.density;
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
    pin(... pins){
        for(let i of pins) this.mesh.points[i].pin();
    }
    unpin(... pins){
        for(let i of pins) this.mesh.points[i].unpin();
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
            let v = Vec3.sub(p, p.old).scale(inertia)
            let a = new Vec3(windX, -gravity, windZ).scale(1/p.mass).scale(1/60);
            p.old.set(p);
            p.add(v).add(a);
        }
    }
    _satisfyConstraints() {
        let satisfied = false;
        let elogation;
        let i = 0;

        while(satisfied != true){
            satisfied = true;
            for (let s of this.springs) {
                elogation = s.disctanceConstraint()
                if(elogation > this.stiffness) satisfied = false; 
            }
            this.__collisionConstraint();  
            //if(satisfied) console.log("Satisfied on iteration "+i+ "/"+iterations)
            //if(elogation > this.stiffness) console.log("Overeloganted spring by "+ Math.round((elogation-this.stiffness)*100) + "%")
            if(++i >= iterations) break;
        }  
    }   
    __collisionConstraint() {
        // Bottom Collision    
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