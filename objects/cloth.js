class Cloth{
    constructor(mesh, particleMass, stiffness) {
        if(!mesh.springs) throw Error("Mesh not suitable for cloth simulation")
        this.particleMass = particleMass;
        this.stiffness = stiffness;
        this.mesh = mesh;
    }
    update() {
        this._verletIntegration();
        for (let i = 0; i < this.stiffness; i++) {
            this._disctanceConstraint();
        }      
        this._resolveCollisions();      
        this._bottomConstraint();
        this.mesh.compileVerticesFromPoints();
    }
    _verletIntegration() {
        for (let i=0; i < this.mesh.points.length; i++) {
            let p = this.mesh.points[i];
            if (p.pinned) continue;

            let vx = (p.x - p.oldx) + windX;
            let vy = (p.y - p.oldy) - this.particleMass * gravity; 
            let vz = (p.z - p.oldz) + windZ;
            p.oldx = p.x;
            p.oldy = p.y;
            p.oldz = p.z;
            p.x += vx * drag; // lieber auf Dreiecksebene
            p.y += vy * drag;
            p.z += vz * drag;
        }
    }
    _disctanceConstraint() {
        for (var i = 0; i < this.mesh.springs.length; i++) {
            let s = this.mesh.springs[i];
            let stregth;
            if(s.type == 'structural') stregth = 0.5;
            else if(s.type == 'shear') stregth = 0.9;
            else if(s.type == 'bend') stregth = 0.5;
            else stregth = 1;
    
            let dx = s.p1.x - s.p0.x,
                dy = s.p1.y - s.p0.y,
                dz = s.p1.z - s.p0.z,
                distance = Math.sqrt(dx*dx + dy*dy + dz*dz),
                difference = s.length - distance,
                percent = difference / distance / 2 * stregth,
                offsetX = dx * percent,
                offsetY = dy * percent,
                offsetZ = dz * percent;
                 
            if (!s.p0.pinned) {
                s.p0.x -= offsetX;
                s.p0.y -= offsetY;
                s.p0.z -= offsetZ;
            }
            if (!s.p1.pinned) {
                s.p1.x += offsetX;
                s.p1.y += offsetY;
                s.p1.z += offsetZ;
            }
        }
    }
    _bottomConstraint() {
        let friction = 0.5;
        for (let p of this.mesh.points) {
            if (!p.pinned && p.y < 0) {
                p.y = 0;
                p.oldy = -p.oldy * bounce;
                p.oldx = p.x + (p.x - p.oldx) * friction;
                p.oldz = p.z + (p.z - p.oldz) * friction;
            }
        }
    }
    _resolveCollisions() {
        for(let o of objects) {
            //if(o == this.mesh) continue; // eigenes mesh
            if(!o.resolveCollision) continue; // keine Kollisionserkennung möglich
            for (let p of this.mesh.points) {
                o.resolveCollision(p);      
            }
        }
    }
    /*_positionReset() {
        let maxStretch = .5;
        for (let s of this.mesh.springs) {
            let	dx = s.p1.x - s.p0.x,
                dy = s.p1.y - s.p0.y,
                dz = s.p1.z - s.p0.z,
                distance = Math.sqrt(dx*dx + dy*dy + dz*dz),
                difference = s.length - distance,
                percent = difference / distance;

            if (percent < maxStretch) continue;

            let offsetX = dx * percent;
            let offsetY = dy * percent;
            let offsetZ = dz * percent;

            if (s.p0.y < s.p1.y) {
                s.p0.x -= offsetX;
                s.p0.y -= offsetY;
                s.p0.z -= offsetZ;
            } else {
                s.p1.x -= offsetX;
                s.p1.y -= offsetY;
                s.p1.z -= offsetZ;
            }
        }
    }*/
}