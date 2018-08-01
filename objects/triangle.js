class Triangle {
    /**
     * @param {vec3} a Ecke 1
     * @param {vec3} b Ecke 2
     * @param {vec3} c Ecke 3
     */
    constructor(a, b, c){
        this.a = a;
        this.b = b;
        this.c = c;
        // VORBERECHNUNETE DATEN - Nur für statische Objekte!! (Ohne Roatation, Federn, o.Ä.)
        this.EPSILON = 0.0001
        this._edge1 = vec3.sub(this.b, this.a)
        this._edge2 = vec3.sub(this.c, this.a)
        this._n = vec3.normalize(vec3.cross(this._edge1, this._edge2))
        this._pvec = vec3.cross(vec3.scale(this._n, -1), this._edge2)
        this._det = vec3.dot(this._edge1, this._pvec)
    }

    /**
     * Testet ob Kollision überhaupt mlgich ist mit einer Bounding Sphere 
     * Neuberechnung von Catenoid wegen Transformationen der Punkte
     * @param {vec3} p 
     * @returns {boolean}
     */
    testPointSphere(p){
        return vec3.dist(p, this.getCatenoid()) + this.EPSILON <= this.getRadius();
    } 
    testTrianglSphere(t){
        return vec3.dist(t.getCatenoid(), this.getCatenoid()) +this.EPSILON <= t.getRadius()+this.getRadius();
    }
    getCatenoid(){
        let a=this.a, b=this.b, c=this.c;
        return new vec3((a.x+b.x+c.x)/3, (a.y+b.y+c.y)/3, (a.z+b.z+c.z)/3);
    }
    getRadius(){
        let a=this.a, b=this.b, c=this.c;
        return Math.max(Math.max(vec3.sub(a,b).getLength(), vec3.sub(b,c).getLength()), vec3.sub(c,a).getLength()) / 2
    }

    /**
     * 
     */
    getCCNormal(){
        this.edge1 = vec3.sub(this.b, this.a)
        this.edge2 = vec3.sub(this.c, this.a)
        return vec3.normalize(vec3.cross(this.edge1, this.edge2))
    }

    /**
     * Ericson S.128
     * @param {vec3} p Point
     * @param {vec3} a Segment Start
     * @param {vec3} b Segment End
     * @returns {vec3} closets point to segment
     */
    closestPointOnSegment(p, a, b){
        let ab = vec3.sub(b, a);
        let t = vec3.dot(vec3.sub(p,a),ab) / vec3.dot(ab,ab);
        if(t < 0) t = 0;
        if(t > 1) t = 1;
        return vec3.add(a, vec3.scale(ab, t)) 
    }

    /**
     * MÖLLER-TRUMBORE Ray-Triangle Intersection Algorithmus
     * @param {vec3} o Ortsvektor des Strahles
     * @param {vec3|?} dir Richtungsvektor des Strahles | Richtungsvektor ist Lotgerade (dir = -n)
     * @returns {Number} Skalar t
     */
    moellerTrumbore(o, dir){
        let EPSILON=this.EPSILON, edge1, edge2, pvec, det;
        if(dir == undefined){
            // Point-Triangle mit Lotgerade und vorberechneten Daten
            edge1 = this._edge1;
            edge2 = this._edge2;
            pvec = this._pvec;
            det = this._det;
            dir = vec3.scale(this._n, -1)
        }
        else {
            // Edge-Triangle (Costum Ray)
            edge1 = vec3.sub(this.b, this.a)
            edge2 = vec3.sub(this.c, this.a)
            pvec = vec3.cross(dir, edge2);
            det = vec3.dot(edge1, pvec); 
        }
        // det < 0 : Ray points away, negative t expected
        // det > 0 : positive t expected
        // det == 0 : Ray runs parallel to the plane of the triangle -> no t
        if (-EPSILON < det && det < EPSILON) return null;

        let inv_det = 1/det
        let tvec = vec3.sub(o, this.a);
        let u = vec3.dot(tvec, pvec) * inv_det;
        if (u < 0 || u > 1) return null;
        let qvec = vec3.cross(tvec, edge1);
        let w = vec3.dot(dir, qvec) * inv_det;
        if (w < 0 || u + w > 1) return null;
        return vec3.dot(edge2, qvec) * inv_det;

        // Alte Version, mit der Tests nicht klappen und wegen det=0 irgendwo raus springt
        // Nur für front-facing intersections (culling)
        /*let tvec = vec3.sub(o, this.a);
        let u = vec3.dot(tvec, pvec);
        if (u < 0 || u > det) return null;
        let qvec = vec3.cross(tvec, edge1);
        let w = vec3.dot(dir, qvec);
        if (w < 0 || u + w > det) return null;
        return vec3.dot(edge2, qvec) / det;*/
    }

    /**
     * Idee: Punkt hinter Schnittpunkt während alter noch davor (in dir Richtung) -> Durchdringung
     * Anderer Ansatz wäre Punkt im Objekt wenn Anzahl Schnittpunkte ungerade, dann Projektion nach außen
     * @param {vec3} p 
     */
    resolveSoftPointCollision(p) { 
        let dir  = vec3.scale(this._n, -1);
        let t = this.moellerTrumbore(p)
        // 1. Positive Skalierung in dir-Richtung: Punkt wäre vor Ebene -> keine Durchdringung
        if(t == null || t > this.EPSILON) return false; 
        let ip   = new vec3(p.x + t*dir.x, p.y + t*dir.y, p.z + t*dir.z)
        let oldp = new vec3(p.old.x,       p.old.y,       p.old.z)
        // 2. Abstand zur alten Position kleiner als zur Ebene: beide sind hinter der Ebene -> keine Durchdringung
        if(vec3.dist(p, oldp) < vec3.dist(p, ip)) return false; 
        // 3. Auflösen
        ip.scale(1+this.EPSILON);
        p.set(ip);
        p.old.set(ip);
    }  

    /**
     * 
     * @param {Edge} e Edge/Spring mit zwei Punkten p1 und p2
     */
    getEdgeEdgeContact(corner1, corner2){
        let a=this.a, b=this.b, c=this.c;

        // 1. Schnittpunkt EdgeRay-Triangele
        let o = corner1
        let dir = vec3.normalize(vec3.sub(corner2, corner1));
        let t = this.moellerTrumbore(o, dir);
        if(t == null || Math.abs(t) > vec3.length(dir)) return;
        let ip = new vec3(o.x + t*dir.x, o.y + t*dir.y, o.z + t*dir.z)
        // 2. Schnittpunkt mit Dreieckskanten
        let iab = this.closestPointOnSegment(ip, a, b);
        let ibc = this.closestPointOnSegment(ip, b, c);
        let ica = this.closestPointOnSegment(ip, c, a);
        let vab = vec3.sub(iab, ip);
        let vbc = vec3.sub(ibc, ip);
        let vca = vec3.sub(ica, ip);
        let dab = vec3.length(vab);
        let dbc = vec3.length(vbc);
        let dca = vec3.length(vca);

        // 3. Zu Welcher Dreieckskante hat die Gerade den geringster Abstand 
        let contact;
        if(dab < dbc && dab < dca)  contact = new Contact(ip, vab, dab);
        else if(dbc < dca)          contact = new Contact(ip, vbc, dbc);
        else                        contact = new Contact(ip, vca, dca); 
        return contact;

        // 3.1 So wie Vorher
        let impuls;
        if(dab < dbc && dab < dca)  impuls = vab;
        else if(dbc < dca)          impuls = vbc;
        else                        impuls = vca;
        // 4. Punkte verschieben so dass Kante am äußersten Punkt liegt
        impuls.scale(1+this.EPSILON);
        corner1.add(impuls);
        corner2.add(impuls); 
    }

    /**
     * @param {Triangle} t
     */
    resolveSoftTriangleCollision(t){
        this.resolveSoftPointCollision(t.a);
        this.resolveSoftPointCollision(t.b);
        this.resolveSoftPointCollision(t.c);

        let c_ab = this.getEdgeEdgeContact(t.a, t.b) || NaN; // null wäre nerviger zu prüfen
        let c_bc = this.getEdgeEdgeContact(t.b, t.c) || NaN;
        let c_ca = this.getEdgeEdgeContact(t.c, t.a) || NaN;
        let resolvingContact;

        if(c_ab.depth > c_bc && c_ab.depth > c_ca.depth) resolvingContact = c_ab
        else if(c_bc.depth > c_ca.depth)                 resolvingContact = c_bc
        else if(!isNaN(c_ca))                            resolvingContact = c_ca     
        else return;

        let tn = t.getCCNormal().add(this.getCCNormal()).normalize();
        let impuls = tn.scale(resolvingContact.depth + this.EPSILON);
        t.a.add(impuls)
        t.b.add(impuls)
        t.c.add(impuls)
    }
}