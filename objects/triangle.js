class Triangle {
    constructor(a, b, c){
        this.a = a;
        this.b = b;
        this.c = c;

        // VORBERECHNUNETE DATEN
        // Für MÖLLER-TRUMBORE Ray-Triangle Algorithmus 
        // .. allgemeingültig
        this.EPSILON = 0.0001;
        this.edge1 = vec3.sub(this.b, this.a);
        this.edge2 = vec3.sub(this.c, this.a);
        this.n = vec3.normalize(vec3.cross(this.edge1, this.edge2));
        // .. mit Lotgerade (dir = -n)
        this.pvec = vec3.cross(vec3.scale(this.n, -1), this.edge2);
        this.det = vec3.dot(this.edge1, this.pvec);
    }
    moellerTrumbore(o, dir){
        let EPSILON=this.EPSILON, edge1=this.edge1, edge2=this.edge2, pvec=this.pvec, det=this.det;
        if(dir == undefined){
            // Point-Triangle mit Lotgerade
            dir = vec3.scale(this.n, -1)
        }
        else {
            // Edge-Triangle
            pvec = vec3.cross(dir, this.edge2);
            det = vec3.dot(edge1, pvec);
        }
        if (det < EPSILON) return null;
        let tvec = vec3.sub(o, this.a);
        let u = vec3.dot(tvec, pvec);
        if (u < 0 || u > det) return null;
        let qvec = vec3.cross(tvec, edge1);
        let w = vec3.dot(dir, qvec);
        if (w < 0 || u + w > det) return null;
        return vec3.dot(edge2, qvec) / det;
    }
    resolvePointCollision(p) { 
        // Idee: Punkt hinter Schnittpunkt während alter noch davor (in dir Richtung) -> Durchdringung
        // Anderer Ansatz: Punkt im Objekt wenn Anzahl Schnittpunkte ungerade, dann Projektion nach außen
        let n = this.n, dir = vec3.scale(n, -1)
        let t = this.moellerTrumbore(p)

        // 1. Positive Skalierung in dir-Richtung: Punkt wäre vor Ebene -> keine Durchdringung
        if(t == null || t > 0) return false; 
        let ip   = { x: p.x + t*dir.x, y: p.y + t*dir.y, z: p.z + t*dir.z }
        let oldp = { x: p.oldx,        y: p.oldy,        z: p.oldz };

        // 2. Abstand zur alten Position kleiner als zur Ebene: beide sind hinter der Ebene -> keine Durchdringung
        if(vec3.dist(p, oldp) < vec3.dist(p, ip)) return false; 

        ip = vec3.add(ip, vec3.scale(n, 0.0001))
        p.x = ip.x;
        p.y = ip.y;
        p.z = ip.z;
        p.oldx = ip.x;
        p.oldy = ip.y;
        p.oldz = ip.z;
        return true;
    }  
    resolveEdgeCollision(e){
        let edge1=this.edge1, edge2=this.edge2, edge3=vec3.sub(this.b, this.c);

        let o = e.p0;
        let dir = vec3.normalize(vec3.sub(e.p1, e.p0));
        let t = this.moellerTrumbore(o, dir);

        if(t == null || Math.abs(t) > vec3.length(dir)) return;
        let ip = { x: o.x + t*dir.x, y: o.y + t*dir.y, z: o.z + t*dir.z }
    }
}