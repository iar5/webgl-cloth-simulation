class Cloth{
    constructor(stiffness, mass) {
        if (!stiffness) stiffness = 0.3;
        else if(stiffness < 0) stiffness = 0;
        else if(stiffness > 1) stiffness = 1;
        this.stiffness = stiffness
        this.mass = mass || 3;
        this.mesh = null;
    }
    applyMesh(mesh){
        if(!mesh instanceof Towel) throw Error("Mesh not suitable for cloth simulation")
        this.mesh = mesh;
        this._setupSpringMassSystem();
    }
    _setupSpringMassSystem(){
        if(!this.mesh instanceof Towel) throw new Error("Cloth für nicht Towel Objekte noch nicht ausimplementiert")
        let towel = this.mesh;

        let structuralStrength = 0.9;
        let shearStrength = 0.9;
        let bendStrength = 0.3;

        let points = towel.points;
        let particelMass = this.mass / points.length / towel.density;
        let amountY = towel.amountY, amountX = towel.amountX;

        for (let i=0; i<points.length; i++) {
            let p = points[i];
            points[i] = new Particle(p, particelMass)
        }
        let springs = this.springs = [];
        let edges = this.edges = [];
        for (let y=0; y < amountY; y++) {
            for (let x=0; x < amountX; x++) {
                /* strucutral springs */
                if (x+1 < amountX) {
                    let p0 = points[y*amountX + x],
                        p1 = points[y*amountX + x+1];
                    springs.push(new Spring(p0, p1, vec3.dist(p0, p1), structuralStrength));
                    edges.push(new Spring(p0, p1))
                    }
                if (y+1 < amountY) {
                    let p0 = points[y*amountX + x],
                        p1 = points[(y+1)*amountX + x];
                    springs.push(new Spring(p0, p1, vec3.dist(p0, p1), structuralStrength));
                    edges.push(new Spring(p0, p1))
                    }
                /* shear springs */
                if (x+1 < amountX && y+1 < amountY) {
                    let p0 = points[y*amountX + x],
                        p1 = points[(y+1)*amountX + x+1],
                        p2 = points[y*amountX + x+1],
                        p3 = points[(y+1)*amountX + x];
                    springs.push(new Spring(p0, p1, vec3.dist(p0, p1), shearStrength));
                    springs.push(new Spring(p2, p3, vec3.dist(p2, p3), shearStrength));
                }
                /* bend springs */
                if(x+2 < amountX) {
                    let p0 = points[y*amountX + x],
                        p1 = points[y*amountX + x+2];
                    springs.push(new Spring(p0, p1, vec3.dist(p0, p1), bendStrength));
                    }
                if(y+2 < amountY) {
                    let p0 = points[y*amountX + x],
                        p1 = points[(y+2)*amountX + x];
                    springs.push(new Spring(p0, p1, vec3.dist(p0, p1), bendStrength));
                }
            }
        }
    }
    /*
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

            let vx = (p.x - p.old.x) + windX;
            let vy = (p.y - p.old.y) - p.mass * gravity; 
            let vz = (p.z - p.old.z) + windZ;
            p.old.set(p)
            p.x += vx * drag; // besser auf Dreiecksebene
            p.y += vy * drag;
            p.z += vz * drag;
        }
    }
    _disctanceConstraint() {
        let stiffnesreached = false;
        for (var i=0; i<50 && !stiffnesreached; i++) {
            stiffnesreached = true;
            for (var j=0; j < this.springs.length; j++) {
                let s = this.springs[j];

                let d = vec3.sub(s.p1, s.p0);
                let dist = vec3.length(d);
                let force = s.strength * (dist - s.length); 
                let offset = vec3.scale(vec3.normalize(d), force/2)
                
                if (!s.p0.pinned) s.p0.add(offset)
                if (!s.p1.pinned) s.p1.sub(offset) 
    
                // Abbruch wenn alle Korrekturen geringer sind als die zugelassene Elastizität
                if(force / dist >= this.stiffness) stiffnesreached = false;
            }
        }   
    }
    _collisionConstraint() {
        // With Bottom
        let friction = 0.5;
        for (let p of this.mesh.points) {
            if (p.y < 0) {
                p.y = 0;
                p.old.y = -p.old.y * bounce;
                p.old.x = p.x + (p.x-p.old.x) * friction;
                p.old.z = p.z + (p.z-p.old.z) * friction;
            }
        }
        // With Objects
        for(let o of objects) {
            if(o.resolveSoftCollision) o.resolveSoftCollision(this.mesh.points, this.edges);      
        }  
    } 
}