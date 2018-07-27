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
        if(this.mesh instanceof Towel){
            let towel = this.mesh;
            let structuralStrength = 0.9;
            let shearStrength = 0.9;
            let bendStrength = 0.3;
            let points = towel.points;
            let particelMass = this.mass / points.length / towel.density;
            for (let i=0; i<points.length; i++) {
                let p = points[i];
                points[i] = new Particle(p, particelMass)
            }
            let springs = towel.springs = [];
            let amountY = towel.amountY;
            let amountX = towel.amountX;
            for (let y=0; y < amountY; y++) {
                for (let x=0; x < amountX; x++) {
                    /* strucutral springs */
                    if (x+1 < amountX) {
                        let p0 = points[y*amountX + x],
                            p1 = points[y*amountX + x+1];
                        springs.push(new Spring(p0, p1, vec3.dist(p0, p1), structuralStrength));
                        }
                    if (y+1 < amountY) {
                        let p0 = points[y*amountX + x],
                            p1 = points[(y+1)*amountX + x];
                        springs.push(new Spring(p0, p1, vec3.dist(p0, p1), structuralStrength));
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
        else {
            throw new Error("Cloth für nicht Towel Objekte noch nicht ausimplementiert")
        }
    }
    /*
     * SIMULATION LOOP 
     */
    updateMesh(){
        this._verletIntegration();
        this._disctanceConstraint();
        this._bottomsCollisions(); 
        for(let o of objects) {
            if(o.resolveCollision) o.resolveCollision(this.mesh.points, this.mesh.springs);      
        }  
        this.mesh.compileVerticesFromPoints();
    }
    _verletIntegration() {
        for (let i=0; i < this.mesh.points.length; i++) {
            let p = this.mesh.points[i];
            if (p.pinned) continue;

            let vx = (p.x - p.oldx) + windX;
            let vy = (p.y - p.oldy) - p.mass * gravity; 
            let vz = (p.z - p.oldz) + windZ;
            p.oldx = p.x;
            p.oldy = p.y;
            p.oldz = p.z;
            p.x += vx * drag; // besser auf Dreiecksebene
            p.y += vy * drag;
            p.z += vz * drag;
        }
    }
    _disctanceConstraint() {
        let stiffnesreached = false;
        for (var i=0; i<50 && !stiffnesreached; i++) {
            stiffnesreached = true;
            for (var j=0; j < this.mesh.springs.length; j++) {
                let s = this.mesh.springs[j];

                let d = vec3.sub(s.p1, s.p0);
                let dist = vec3.length(d);
                let force = s.strength * (dist - s.length); 
                let offset = vec3.scale(vec3.normalize(d), force/2)
                if (!s.p0.pinned) {
                    s.p0.x += offset.x;
                    s.p0.y += offset.y;
                    s.p0.z += offset.z;
                }
                if (!s.p1.pinned) {
                    s.p1.x -= offset.x;
                    s.p1.y -= offset.y;
                    s.p1.z -= offset.z;  
                }
                // Abbruch wenn alle Korrekturen geringer sind als die zugelassene Elastizität
                if(force / dist >= this.stiffness) stiffnesreached = false;
            }
        }   
    }
    _bottomsCollisions() {
        let friction = 0.5;
        for (let p of this.mesh.points) {
            if (p.y < 0) {
                p.y = 0;
                p.oldy = -p.oldy * bounce;
                p.oldx = p.x + (p.x-p.oldx) * friction;
                p.oldz = p.z + (p.z-p.oldz) * friction;
            }
        }
    } 
}