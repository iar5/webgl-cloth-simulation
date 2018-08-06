class Cloth{
    constructor(stiffness, mass) {
        if (!stiffness) stiffness = 0.3;
        else if(stiffness < 0) stiffness = 0.01;
        else if(stiffness > 1) stiffness = 1;
        this.stiffness = stiffness
        this.mass = mass || 4;
        this.mesh = null;
    }
    applyMesh(mesh){
        if(!mesh instanceof Towel) throw Error("Mesh not suitable for cloth simulation")
        this.mesh = mesh;
        this._setupSpringMassSystem();
    }

    _setupSpringMassSystem(){
        if(!this.mesh instanceof Towel) throw new Error("Cloth nur für Towel Objekte implementiert (Rechtecksmesh)")
        let towel = this.mesh;
        let points=towel.points, amountY=towel.amountY, amountX=towel.amountX, density=towel.density;

        // Oberflächenberechnung korrekt, 
        // Unsicher warum geteilt durch Gesamtmasse. Auswirkung ist jedenfalls richtig
        // Bei gleicher Fläche bleibt Masse der Partikel gleiche
        let particelMass = amountX*density*amountY*density / this.mass 

        let structuralStrength = 0.9;
        let shearStrength = 0.9;
        let bendStrength = 0.3;
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

    /** 
     * SIMULATION LOOP 
     */
    updateMesh(){
        this._verletIntegration();
        this._disctanceConstraint();
        this._collisionConstraint(); 
        this.mesh.compileVerticesFromPoints();
    }

    _verletIntegration() {
        for (let i=0; i < this.mesh.points.length; i++) {
            let p = this.mesh.points[i];
            if (p.pinned) continue;

            // a= f/m = f*1/m
            // a=/60 weil a in Meter pro Sekunde und in einer Sekunde 60 Berechnungen stattfinden sollen
            let a = new Vec3(windX, -gravity, windZ).scale(1/(p.mass*60)) 
            let v = Vec3.sub(p, p.old);
            p.old.set(p);
            p.add(v.add(a).scale(drag));
        }
    }

    /**
     * this.stiffnes entpsircht Prozentangabe wie viel sich die Federn maximal ausdehnen dürfen
     * Abbruch wenn alle Korrekturen geringer sind als die zugelassene Elastizität (oder Maximalanzahl der Wiederholungen erreicht -> geht stark auf die Performance)
     */
    _disctanceConstraint() {
        let stiffnesreached = false;
        for (var i=0; i<50 && !stiffnesreached; i++) {
            stiffnesreached = true;
            for (var j=0; j < this.springs.length; j++) {
                let s = this.springs[j];

                let d = Vec3.sub(s.p1, s.p0);
                let dist = Vec3.length(d);
                let force = s.strength * (dist - s.length); 
                let offset = Vec3.scale(Vec3.normalize(d), force/2)
                
                if (!s.p0.pinned) s.p0.add(offset)
                if (!s.p1.pinned) s.p1.sub(offset) 
                if(force / dist >= this.stiffness) stiffnesreached = false; 
            }
            if(i==49) console.log("Maximum stiff iteration number reached")
        }   
    }

    _collisionConstraint() {
        // Bottom Collision
        let friction = .5;
        let bounce = .9;     
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
            else if(o instanceof Obj) o.resolveSoftPointCollision(this.mesh.points);  
            //else if(o instanceof Obj) o.resolveSoftTriangleCollision(this.triangles);  
            //else if(o instanceof Obj) o.checkIfPointIsInside(this.mesh.points);  
        }  
    } 
}