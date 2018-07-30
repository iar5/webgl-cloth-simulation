class Triangle {
    /**
     * @param {Point} a Ecke 1
     * @param {Point} b Ecke 2
     * @param {Point} c Ecke 3
     */
    constructor(a, b, c){
        this.a = a;
        this.b = b;
        this.c = c;
        this._radius = Math.max(Math.max(vec3.sub(a,b).getLength(), vec3.sub(b,c).getLength()), vec3.sub(c,a).getLength())

        // VORBERECHNUNETE DATEN
        this.EPSILON = 0.0001
        this.edge1 = vec3.sub(this.b, this.a)
        this.edge2 = vec3.sub(this.c, this.a)
        this.n = vec3.normalize(vec3.cross(this.edge1, this.edge2))
        this.pvec = vec3.cross(vec3.scale(this.n, -1), this.edge2)
        this.det = vec3.dot(this.edge1, this.pvec)
    }

    /**
     * Testet ob Kollision überhaupt mlgich scheint mit einer Bounding Sphere 
     * Neuberechnung von Catenoid wegen Transformationen der Punkte
     * @param {Point} p 
     * @returns {boolean}
     */
    testBoundingSphere(p){
        let a=this.a, b=this.b, c=this.c, radius=this._radius;
        let catenoid = new Point((a.x+b.x+c.x)/3, (a.y+b.y+c.y)/3, (a.z+b.z+c.z)/3);
        return vec3.dist(p, catenoid) < radius;
    }

    /**
     * MÖLLER-TRUMBORE Ray-Triangle Intersection Algorithmus
     * @param {Point} o Ortsvektor des Strahles
     * @param {?} dir Als Richtungsvektor wird Lotgerade (dir = -n) genomen
     * @param {Point} dir Eigener Richtungsvektor des Strahles
     * @returns {Number} Skalar t
     */
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

    /**
     * Idee: Punkt hinter Schnittpunkt während alter noch davor (in dir Richtung) -> Durchdringung
     * Anderer Ansatz wäre Punkt im Objekt wenn Anzahl Schnittpunkte ungerade, dann Projektion nach außen
     * @param {Point} p 
     */
    resolveSoftPointCollision(p) { 
        let n = this.n, dir = vec3.scale(n, -1)
        let t = this.moellerTrumbore(p)

        // 1. Positive Skalierung in dir-Richtung: Punkt wäre vor Ebene -> keine Durchdringung
        if(t == null || t > 0) return false; 
        let ip   = new Point(p.x + t*dir.x, p.y + t*dir.y, p.z + t*dir.z)
        let oldp = new Point(p.old.x,       p.old.y,       p.old.z)
        // 2. Abstand zur alten Position kleiner als zur Ebene: beide sind hinter der Ebene -> keine Durchdringung
        if(vec3.dist(p, oldp) < vec3.dist(p, ip)) return false; 
        // 3. Auflösen
        ip.scale(1+this.EPSILON);
        p.set(ip);
        p.old.set(ip);
    }  

    /**
     * Ericson S.128
     * @param {Point} p Point
     * @param {Point} a Segment Start
     * @param {Point} b Segment End
     */
    closestPointOnSegmen(p, a, b){
        let ab = vec3.sub(b, a);
        let t = vec3.dot(vec3.sub(p,a),ab) / vec3.dot(ab,ab);
        if(t < 0) t = 0;
        if(t > 1) t = 1;
        return vec3.add(a, vec3.scale(ab, t)) 
    }

    /**
     * 
     * @param {Edge} e Edge/Spring mit zwei Punkten p1 und p2
     */
    resolveSoftEdgeCollision(e){
        let a=this.a, b=this.b, c=this.c, n=this.n;

        // 1. Schnittpunkt EdgeRay-Triangele
        let o = e.p0;
        let dir = vec3.normalize(vec3.sub(e.p1, e.p0));
        let t = this.moellerTrumbore(o, dir);
        if(t == null || Math.abs(t) > vec3.length(dir)) return;
        let ip = new Point(o.x + t*dir.x, o.y + t*dir.y, o.z + t*dir.z)
        // 2. Zu Welcher Dreieckskante geringster Abstand
        let iab = this.closestPointOnSegmen(ip, a, b);
        let ibc = this.closestPointOnSegmen(ip, b, c);
        let ica = this.closestPointOnSegmen(ip, c, a);
        let vab = vec3.sub(iab, ip);
        let vbc = vec3.sub(ibc, ip);
        let vca = vec3.sub(ica, ip);
        let dab = vec3.length(vab);
        let dbc = vec3.length(vbc);
        let dca = vec3.length(vca);
        
        let kv;
        if(dab < dbc && dab < dca) kv = vab
        else if(dbc < dca) kv = vbc  
        else kv = vca

        // 3. Punkte so verschieben, dass Kante am äußersten Punkt liegt
        e.p0.add(kv.scale(1+this.EPSILON));
        e.p1.add(kv.scale(1+this.EPSILON)); 
        e.p0.old.set(e.p0)
        e.p1.old.set(e.p1)     
    }
}