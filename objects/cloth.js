class Cloth{
    constructor(mass, stiffness) {
        if(stiffness > 1) stiffness = 1;
        else if(stiffness < 0.1) stiffness = .1;
        this.stiffness = stiffness;
        this.mass = mass;
        this.mesh = null;
    }
    applyMesh(mesh){
        if(!mesh instanceof Towel) throw Error("Mesh not suitable for cloth simulation")
        this.mesh = mesh;
        this._setupSpringMassSystem();
    }
    _setupSpringMassSystem(){
        if(this.mesh instanceof Towel){
            let points = this.mesh.points;
            let particelMass = this.mass/points.length;
            for (let i=0; i<points.length; i++) {
                let p = points[i];
                points[i] = new Particle(p, particelMass)
            }

            let springs = this.mesh.springs = [];
            let amountY = this.mesh.amountY;
            let amountX = this.mesh.amountX;
            for (let y=0; y < amountY; y++) {
                for (let x=0; x < amountX; x++) {
                    /* strucutral springs */
                    if (x+1 < amountX) {
                        let p0 = points[y*amountX + x],
                            p1 = points[y*amountX + x+1];
                        springs.push({p0, p1, length: vec3.dist(p0, p1), type: 'structural'});
                    }
                    if (y+1 < amountY) {
                        let p0 = points[y*amountX + x],
                            p1 = points[(y+1)*amountX + x];
                        springs.push({p0, p1, length: vec3.dist(p0, p1), type: 'structural'});
                    }
                    /* shear springs */
                    if (x+1 < amountX && y+1 < amountY) {
                        let p0 = points[y*amountX + x],
                            p1 = points[(y+1)*amountX + x+1],
                            p2 = points[y*amountX + x+1],
                            p3 = points[(y+1)*amountX + x];
                        springs.push({p0: p0, p1: p1, length: vec3.dist(p0, p1), type: 'shear'});
                        springs.push({p0: p2, p1: p3, length: vec3.dist(p2, p3), type: 'shear'});
                    }
                    /* bend springs */
                    if(x+2 < amountX) {
                        let p0 = points[y*amountX + x],
                            p1 = points[y*amountX + x+2];
                        springs.push({p0, p1, length: vec3.dist(p0, p1), type: 'bend'});
                    }
                    if(y+2 < amountY) {
                        let p0 = points[y*amountX + x],
                            p1 = points[(y+2)*amountX + x];
                        springs.push({p0, p1, length: vec3.dist(p0, p1), type: 'bend'});
                    }
                }
            }
        }
    }
    updateMesh(){
        this._verletIntegration();
        this._disctanceConstraint();
        this._bottomsCollisions();      
        this._objectCollisions();
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
        for (var i=0; i<40 && !stiffnesreached; i++) {
            stiffnesreached = true;
            for (var j=0; j < this.mesh.springs.length; j++) {
                let s = this.mesh.springs[j];
                let stregth;
                if(s.type == 'structural') stregth = 0.8;
                else if(s.type == 'shear') stregth = 0.9;
                else if(s.type == 'bend') stregth = 0.3;
                else stregth = 1;

                let d = vec3.sub(s.p0, s.p1)
                let dist = vec3.length(d)
                let percent = (dist - s.length) / dist;
                let offset = vec3.scale(d, percent / 2 * stregth)

                if (!s.p0.pinned) {
                    s.p0.x -= offset.x;
                    s.p0.y -= offset.y;
                    s.p0.z -= offset.z;
                }
                if (!s.p1.pinned) {
                    s.p1.x += offset.x;
                    s.p1.y += offset.y;
                    s.p1.z += offset.z;  
                }
                if(percent > this.stiffness) stiffnesreached = false;
            }
        }   
    }
    _bottomsCollisions() {
        let friction = 0.5;
        for (let p of this.mesh.points) {
            if (!p.pinned && p.y < 0) {
                p.y = 0;
                p.oldy = -p.oldy * bounce;
                p.oldx = p.x + (p.x-p.oldx) * friction;
                p.oldz = p.z + (p.z-p.oldz) * friction;
            }
        }
    }
    _objectCollisions() {
        for(let o of objects) {
            if(!o.resolveCollision) continue;
            for (let p of this.mesh.points) {
                o.resolveCollision(p);      
            }
        }
    } 
}