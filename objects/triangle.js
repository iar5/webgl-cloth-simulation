class Triangle {
    constructor(a, b, c){
        this.a = a;
        this.b = b;
        this.c = c;

        // VORBERECHNUNGEN 
        // Für MÖLLER-TRUMBORE Algorithmus, Ray-Triangle Intersection mit Lotgerade
        this.EPSILON = 0.0001;
        // Ebene aufspannende Vektoren
        this.edge1 = vec3.sub(this.b, this.a);
        this.edge2 = vec3.sub(this.c, this.a);
        // Senkrechte der Ebene dient als Lotgerade
        // -> dir = -n, Vertauschen der Kanten beim Kreuzprodukt kehrt Richtungsvektor um
        this.dir = vec3.normalize(vec3.cross(this.edge2, this.edge1));
        this.pvec = vec3.cross(this.dir, this.edge2);
        this.det = vec3.dot(this.edge1, this.pvec);
    }
    perpendicularRayTriangleIntersection(p){
        let EPSILON=this.EPSILON, edge1=this.edge1, edge2=this.edge2, dir=this.dir, pvec=this.pvec, det=this.det;
        if (det < EPSILON) return null;
        let tvec = vec3.sub(p, this.a);
        let u = vec3.dot(tvec, pvec);
        if (u < 0 || u > det) return null;
        let qvec = vec3.cross(tvec, edge1);
        let w = vec3.dot(dir, qvec);
        if (w < 0 || u + w > det) return null;
        return vec3.dot(edge2, qvec) / det;
    }
    resolveCollision (p) { 
        // Idee: Neuer Punkt weiter vom Schnittpunkt entfernt als alter -> Punkt liegt irgendwo hinter Dreieck 
        // P ist dichter an IP als er sich bewegt hat -> Hat Dreieck durchquärt
        // PROBLEM: Wenn p.old=ip+v oder/bzw. p; p=ip -> im nächsten Schritt: p.old ist im Objekt drin ODER p ist durch ext. Forces wieder drin -> Kollision wird nicht erkannt
        // LÖSUNG: p.old=ip; p=ip+spigelvektor
        // -> Kann nicht erkennen ob Punkt im Objekt ist, daher darf er erst gar nicht rein
        // Anderer Kollisionsansatz: Punkt im Objekt wenn Anzahl Schnittpunkte ungerade, dann Projektion nach außen
        // Erkennung das Eindringen eines Punktes richtig! (p war im letzten Schritt noch draußen)
        let dir = this.dir
        let t = this.perpendicularRayTriangleIntersection(p)
        if(t == null) return null;
        if(t > 0) return null; // Wenn t > 0 liegt Schnittpunkt vor p (ray=p+t*dir), p ist also nicht hinter Ebene / hat sie nicht durchquärt

        let ip   = { x: p.x+t*dir.x, y: p.y+t*dir.y, z: p.z+t*dir.z }
        let oldp = { x: p.oldx,      y: p.oldy,      z: p.oldz };
        let v = vec3.sub(p, oldp);
        let nextp = vec3.add(p, v);

        let dist_p = vec3.dist(p, ip);
        let dist_oldp = vec3.dist(oldp, ip);
        let dist_nextp = vec3.dist(nextp, ip);

        if(!(dist_oldp <= dist_nextp && dist_p <= vec3.length(v))) return null;

        let n = vec3.scale(dir, -1)
        let v_normalized = vec3.normalize(v);
        let out_v = vec3.scale(vec3.sub(v_normalized, vec3.scale(n, 2*vec3.dot(v_normalized, n))), dist_oldp); // Spiegelpunkt an n-Achse
        //let out_v = vec3.scale(v_normalized, -dist_oldp);  

        // Problem: p.old liegt im nächsten Schritt dichter an Triangle als der Punkt -> Abbruch
        // Anderer Ansatz mit p=ip und p.old=p?

        /* Test */
        p.x = ip.x +out_v.x
        p.y = ip.y +out_v.y
        p.z = ip.z +out_v.z
        p.oldx = p.x;
        p.oldy = p.y;
        p.oldz = p.z;

        /* So wie ich denke 
        p.x = ip.x + out_v.x;
        p.y = ip.y + out_v.y;
        p.z = ip.z + out_v.z;
        p.oldx = ip.x;
        p.oldy = ip.y;
        p.oldz = ip.z;*/

        /* So wie irgendwie klappt 
        p.x = ip.x + out_v.x;
        p.y = ip.y + out_v.y;
        p.z = ip.z + out_v.z;
        p.oldx = v.x;
        p.oldy = v.y;
        p.oldz = v.z; */
    }






    // ---------------- //
     
    /*checkCollision(p){
        let threshold = 1 // "Dicke" der Kollisionsebene
        let dist = this.planeDistance(p)
        if(-threshold <= dist && dist <= 0) {
            this.insideCheck(p);
            p = p;
        } else return false
    }
    planeDistance(p){
        // 0 : liegt auf Ebene
        // - : liegt über der Ebene (in Bezug auf Richtung des n Vektors)
        // + : liegt unter der Ebene (in Bezug auf Richtung des n Vektors)
        // .. insofern Normale auch nach Außen zeigt
        return vec3.dot(this._n, vec3.sub(p, this._o));
    }
    insideCheck(p){
        // https://github.com/SebLague/Gamedev-Maths/blob/master/PointInTriangle.cs
        // a,b,c werden von R3 in R2 projeziert
        let xy = Math.abs(vec3.dot(this._n, {x:0, y:0, z:1})) 
        let yz = Math.abs(vec3.dot(this._n, {x:1, y:0, z:0}))
        let xz = Math.abs(vec3.dot(this._n, {x:0, y:1, z:0}))

        // gucken zu welcher Ebene geringster Winkel und dann auf die projezieren
        let a = {x: this.a.x, y: this.a.y}
        let b = {x: this.b.x, y: this.b.y}
        let c = {x: this.c.x, y: this.c.y}

        let s1 = c.y - a.y;
        let s2 = c.x - a.x;
        let s3 = b.y - a.y;
        let s4 = p.y - a.y;

        let w1 = (a.x*s1+s4*s2-p.x*s1) / (s3*s2 - (b.x-a.x)*s1);
        let w2 = (s4-w1*s3) / s1;
        
        return w1>=0 && w2>=0 && (w1+w2)<=1
    }*/   
}