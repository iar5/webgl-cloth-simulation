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
    }

    /**
     * Idee: Punkt hinter Schnittpunkt während alter noch davor (in dir Richtung) -> Durchdringung
     * Wird (bis jetzt) nur auf statischen Dreiecken aufgerufen, daher vorberechnete Daten
     * @param {vec3} p 
     */
    getContinousPointContact(p) { 
        // 1. Positive Skalierung in dir-Richtung: Punkt wäre vor Ebene -> keine Durchdringung
        let t = this.moellerTrumbore(p) // not needed to pass over dir, its alredy precalculated in there 
        if(t == null || t > 0) return null; 
        let dir  = vec3.scale(this._n, -1);
        let ip   = new vec3(p.x + t*dir.x, p.y + t*dir.y, p.z + t*dir.z)

        // 2. Abstand zur alten Position kleiner als zur Ebene: beide sind hinter der Ebene -> keine Durchdringung
        if(vec3.dist(p, p.old) < vec3.dist(p, ip)) return null; 
        return new Contact(ip, vec3.dist(p, ip), vec3.sub(ip, p))
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
     * 
     * @param {Edge} e Edge/Spring mit zwei Punkten p1 und p2
     * @returns {Contact} 
     */
    getSegmentContact(corner1, corner2){
        // 1. Schnittpunkt des Segments mit dem Dreieck berechnne
        let o = corner1
        let v = vec3.sub(corner2, corner1)
        let dir = vec3.normalize(v);
        let t = this.moellerTrumbore(o, dir);

        // 2. Liegt Schnittpunkt außerhalb Segments?
        if(t == null || Math.abs(t) > vec3.length(v)) return null;
        let eip = new vec3(o.x + t*dir.x, o.y + t*dir.y, o.z + t*dir.z)
        
        // 3. Nähester Punkt an jeder Dreieckskanten
        let iab = this.closestPointOnSegment(eip, this.a, this.b);
        let ibc = this.closestPointOnSegment(eip, this.b, this.c);
        let ica = this.closestPointOnSegment(eip, this.c, this.a);
        let vab = vec3.sub(iab, eip);
        let vbc = vec3.sub(ibc, eip);
        let vca = vec3.sub(ica, eip);
        let dab = vec3.length(vab);
        let dbc = vec3.length(vbc);
        let dca = vec3.length(vca);

        // 4. Zu Welcher Dreieckskante hat der Punkt den geringster Abstand 
        if(dab < dbc && dab < dca)  return new Contact(eip, vab, dab);
        else if(dbc < dca)          return new Contact(eip, vbc, dbc);
        else                        return new Contact(eip, vca, dca); 
    }

    /**
     * @param {Triangle} t
     */
    resolveSoftTriangleCollision(t){
        // 1. Point-Triangle Intersection
        let c_a = this.getContinousPointContact(t.a);
        let c_b = this.getContinousPointContact(t.b);
        let c_c = this.getContinousPointContact(t.c);

        if(c_a) t.a.set(vec3.scale(c_a.point, 1+this.EPSILON))
        if(c_b) t.b.set(vec3.scale(c_b.point, 1+this.EPSILON))
        if(c_c) t.c.set(vec3.scale(c_c.point, 1+this.EPSILON))
        if(c_a) t.a.old.set(vec3.scale(c_a.point, 1+this.EPSILON))
        if(c_b) t.b.old.set(vec3.scale(c_b.point, 1+this.EPSILON))
        if(c_c) t.c.old.set(vec3.scale(c_c.point, 1+this.EPSILON))


        // 2. Edge-Triangle Intersection
        let c_ab = this.getSegmentContact(t.a, t.b) || NaN; // null wäre nerviger zu prüfen
        let c_bc = this.getSegmentContact(t.b, t.c) || NaN;
        let c_ca = this.getSegmentContact(t.c, t.a) || NaN;
        let resolvingContact;
        let resolvingEdge1;
        let resolvingEdge2;

        if(c_ab.depth > c_bc && c_ab.depth > c_ca.depth) {
            resolvingEdge1 = t.a;
            resolvingEdge2 = t.b;
            resolvingContact = c_ab
        }
        else if(c_bc.depth > c_ca.depth)  {
            resolvingEdge1 = t.b;
            resolvingEdge2 = t.c;
            resolvingContact = c_bc
        }              
        else if(!isNaN(c_ca)) {
            resolvingEdge1 = t.c;
            resolvingEdge2 = t.a;
            resolvingContact = c_ca     
        }                           
        else return;

        let impuls = vec3.scale(resolvingContact.normal, resolvingContact.depth + this.EPSILON);
        resolvingEdge1.add(impuls)
        resolvingEdge2.add(impuls)
    }
}