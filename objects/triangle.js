class Triangle {
    /**
     * @param {Vec3} a Ecke 1
     * @param {Vec3} b Ecke 2
     * @param {Vec3} c Ecke 3
     */
    constructor(a, b, c){
        this.a = a;
        this.b = b;
        this.c = c;
        this.EPSILON = 0.0000001 // Rechnabweichung Winkel
        this.OFFSET = 0.01 // Abstand auf welchen 
        this.recalculateNormal();
    }

    hasCornerPoint(p){
        return p == this.a || p == this.b || p == this.c;
    }

    /**
     * Werte vorberechnen?
     * Problem: nach jeder Korrektur eines Punktes ändern sich auch die Attribute seiner Dreiecke, also funktioniert Vorberechnung 1x pro Simulationsschitt nicht?
     * Unterscheidung ob dynamisch/statisches Dreieck sinnvoll?
     */
    recalculateNormal(){
        let edge1 = Vec3.sub(this.b, this.a)
        let edge2 = Vec3.sub(this.c, this.a)
        this.n = Vec3.normalize(Vec3.cross(edge1, edge2));
    }
    getCatenoid(){
        let a=this.a, b=this.b, c=this.c;
        return new Vec3((a.x+b.x+c.x)/3, (a.y+b.y+c.y)/3, (a.z+b.z+c.z)/3);
    }
    getRadius(){
        let a=this.a, b=this.b, c=this.c;
        return Math.max(Math.max(Vec3.sub(a,b).getLength(), Vec3.sub(b,c).getLength()), Vec3.sub(c,a).getLength()) / 2
    }

    /**
     * Testet ob Kollision überhaupt mlgich ist mit Bounding Objekten 
     * Neuberechnung von Catenoid, Radius etc wegen bewegung und verschiebung der Punkte
     * @returns {boolean}
     */
    testPointSphere(p){
        // ACHTUNG: Prüft nur aktuelle Position! Nicht die Bewegung die ein Paritkel gemacht hat
        return Vec3.dist(p, this.getCatenoid()) + this.EPSILON <= this.getRadius();
    } 
    testPartikelSphere(p){
        // TODO moving Point
        let v = Vec3.sub(p, p.old)
        return;
    } 
    testTrianglSphere(t){
        // TODO Moving-Sphere Sphere Testen S.224 Ericosn
        // Problem: Dreieck bzw. Bounding Sphere kann über den Zeitschritt neue größe angenommen haben weil sich Partikel nicht alle in die selbe Richtung bewegen 
        // -> Test über die größere Sphere laufen lassen? Von altem bzw. neuem Dreieck -> bzw. über Zylinder für dynamische 
        return Vec3.dist(t.getCatenoid(), this.getCatenoid()) + this.EPSILON <= t.getRadius()+this.getRadius();
    }

    /**
     * https://www.opengl.org/discussion_boards/showthread.php/183759-Finding-if-a-point-is-in-front-or-behind-a-plane
     * @param {Point} p 
     */
    isPointInFront(p){
        let v = Vec3.sub(p, this.a)
        let dot = Vec3.dot(v, this.n)
        return dot > 0
    }   


    /**
     * Möller-Trumbore Ray-Triangle Schnittpunkt Algorithmus
     * @param {Vec3} o Ortsvektor des Strahles
     * @param {Vec3} dir Richtungsvektor des Strahles 
     * @returns {Number} Skalar t
     */
    getRayTriangleIntersection(o, dir){
        let edge1 = Vec3.sub(this.b, this.a);
        let edge2 = Vec3.sub(this.c, this.a);
        let pvec = Vec3.cross(dir, edge2);
        let det = Vec3.dot(edge1, pvec); 
        // det < 0 : Strahö zeigt weg von Ebene, negatives t expected
        // det > 0 : Positives t expected
        // det == 0 : Strahl verläuft parallel zur Ebene des Dreiecks -> kein t
        if (-this.EPSILON < det && det < this.EPSILON) return null;
        let inv_det = 1/det;
        let tvec = Vec3.sub(o, this.a);
        let u = Vec3.dot(tvec, pvec) * inv_det;
        if (u < 0 || u > 1) return null;
        let qvec = Vec3.cross(tvec, edge1);
        let w = Vec3.dot(dir, qvec) * inv_det;
        if (w < 0 || u + w > 1) return null;
        return Vec3.dot(edge2, qvec) * inv_det;
    }

    /**
     * Ericson S.128
     * @param {Vec3} p Point
     * @param {Vec3} a Segment Start
     * @param {Vec3} b Segment End
     * @returns {Vec3} closets point to segment
     */
    getClosestPointOnSegment(p, a, b){
        let ab = Vec3.sub(b, a);
        let t = Vec3.dot(Vec3.sub(p,a),ab) / Vec3.dot(ab,ab);
        if(t < 0) t = 0;
        if(t > 1) t = 1;
        return Vec3.add(a, Vec3.scale(ab, t)) 
    }

    /**
     * Baustelle, nicht mehr aktuell
     * @param {Edge} e Edge/Spring mit zwei Punkten p1 und p2
     * @returns {Contact} 
     */
    getSegmentContact(corner1, corner2){
        // 1. Schnittpunkt des Segments mit dem Dreieck berechnne
        let o = corner1
        let v = Vec3.sub(corner2, corner1)
        let dir = Vec3.normalize(v);
        let t = this.getRayTriangleIntersection(o, dir);

        // 2. Liegt Schnittpunkt außerhalb Segments?
        if(t == null || Math.abs(t) > Vec3.length(v)) return null;
        let eip = new Vec3(o.x + t*dir.x, o.y + t*dir.y, o.z + t*dir.z)
        
        // 3. Nähester Punkt an jeder Dreieckskanten
        let iab = this.getClosestPointOnSegment(eip, this.a, this.b);
        let ibc = this.getClosestPointOnSegment(eip, this.b, this.c);
        let ica = this.getClosestPointOnSegment(eip, this.c, this.a);
        let vab = Vec3.sub(iab, eip);
        let vbc = Vec3.sub(ibc, eip);
        let vca = Vec3.sub(ica, eip);
        let dab = Vec3.length(vab);
        let dbc = Vec3.length(vbc);
        let dca = Vec3.length(vca);

        // 4. Zu Welcher Dreieckskante hat der Punkt den geringster Abstand 
        if(dab < dbc && dab < dca)  return new Contact(eip, vab, dab);
        else if(dbc < dca)          return new Contact(eip, vbc, dbc);
        else                        return new Contact(eip, vca, dca); 
    }


    /**
     * Idee: Punkt hinter Schnittpunkt während alter noch davor (in dir Richtung) -> Durchdringung 
     * (Nur für Eintritt aus der einen Richtung, nicht wenn sich was in den Partikel rein bewegt hat weil dann p und pold auf der selben Seite wären)
     * Anschließend gucken ob Schnittpunkt existiert 
     * @param {Vec3} p 
     */ 
    resolvePartikelCollision(p) { 
        let bp = this.isPointInFront(p)
        if(bp) return null;
        let bpold = this.isPointInFront(p.old);
        if(!bpold) return null; 
        
        let dir = Vec3.sub(p, p.old)
        let t = this.getRayTriangleIntersection(p, dir)
        if(t == null) return;
        let ip = new Vec3(p.x + t*dir.x, p.y + t*dir.y, p.z + t*dir.z)

        p.set(Vec3.add(ip, dir.normalize().scale(-this.OFFSET)));
    }  
}