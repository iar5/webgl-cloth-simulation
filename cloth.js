class Cloth{
    constructor(mesh, particleMass, stiffness) {
        this.particleMass = particleMass;
        this.stiffness = stiffness;
        this.mesh = mesh;
    }
    update(objects) {
        this._verletIntegration();
        for (let i = 0; i < this.stiffness; i++) {
            this._disctanceConstraint();
            this._collisionConstraint(objects);
            //this._positionReset();
        }
        this._bottomConstraint();
        this.mesh.compilePointsToVertices();
    }
    _verletIntegration() {
        for (let i=0; i < this.mesh.points.length; i++) {
            let p = this.mesh.points[i];
            if (p.pinned) continue;

            let vx = (p.x - p.oldx) + windX;
            let vy = (p.y - p.oldy) - this.particleMass*gravity; 
            let vz = (p.z - p.oldz) + windZ;
            p.oldx = p.x;
            p.oldy = p.y;
            p.oldz = p.z;
            p.x += vx * drag;
            p.y += vy * drag;
            p.z += vz * drag;
        }
    }
    _disctanceConstraint() {
        for (var i = 0; i < this.mesh.springs.length; i++) {
            let s = this.mesh.springs[i],
                dx = s.p1.x - s.p0.x,
                dy = s.p1.y - s.p0.y,
                dz = s.p1.z - s.p0.z,
                distance = Math.sqrt(dx*dx + dy*dy + dz*dz),
                difference = s.length - distance,
                percent = difference / distance / 2,
                offsetX = dx * percent,
                offsetY = dy * percent,
                offsetZ = dz * percent;
                // Dämpfung einbauen (nicht mehr also x% differenz erlauben)
                 
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
        for (let p of this.mesh.points) {
            if (!p.pinned && p.y < 0) {
                p.y = 0;
                p.oldy = p.y + (p.y - p.oldy) * drag * bounce;
            }
        }
    }
    _collisionConstraint(objects) {
        for (let p of this.mesh.points) {
            for(let o of objects)
                o.checkCollision(p)
        }
    }
    _positionReset() {
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
    }
    /*_eulerIntegration() {
        //http://codeflow.org/entries/2010/aug/28/integration-by-example-euler-vs-verlet-vs-runge-kutta/
        var steps = 8;
        var delta = 1/steps
        for (let i=0; i < this.mesh.points.length; i++) {
            let p = this.mesh.points[i];
            if (p.pinned) continue;

            for(var i=0; i<steps; i++){
                var G = 1500.0;
                var pos1 = center, pos2 = body
                var direction = pos1.sub(pos2);
                var length = direction.length();
                var normal = direction.normalized();
                var acc = normal.mul(G/Math.pow(length, 2));

                velocity.iadd(acc.mul(delta));
                position.iadd(body.velocity.mul(delta));
            }
        }
    }*/
}