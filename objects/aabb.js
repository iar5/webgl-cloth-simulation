class AABB{
    /**
     * Axis Aligned Bounding Box
     * @param {AABB} parent 
     * @param {Array} triangles set welches AABB umfassen soll und dann auf Kinder aufgeteilt wird
     * @param {Number} depth wie viele kinder AABBs soll es geben
     */
    constructor(parent, triangles, depth){
        this.parent = parent;
        this.children = [];
        this.EPSILON = 0.01;
        
        let xmin=Number.MAX_SAFE_INTEGER, xmax=Number.MIN_SAFE_INTEGER; 
        let ymin=Number.MAX_SAFE_INTEGER, ymax=Number.MIN_SAFE_INTEGER;
        let zmin=Number.MAX_SAFE_INTEGER, zmax=Number.MIN_SAFE_INTEGER;
        
        // Maximalen Grenzen bestimmen
        for(let t of triangles){
            for(let p of [t.a, t.b, t.c]){
                if(p.x < xmin) xmin = p.x;
                if(p.x > xmax) xmax = p.x;
                if(p.y < ymin) ymin = p.y;
                if(p.y > ymax) ymax = p.y;
                if(p.z < zmin) zmin = p.z;
                if(p.z > zmax) zmax = p.z;
            }
        }
        this.min = new Vec3(xmin, ymin, zmin)
        this.max = new Vec3(xmax, ymax, zmax)

        if(depth <= 0 || triangles < 4) {
            this.children = triangles;
        }
        else {
            // Längste Achse bestimmen
            let x=xmax-xmin, y=ymax-ymin, z=zmax-zmin;
            let achse;
            let value;
            if(x>y && x>z)  achse='x', value=(xmax+xmin)/2;
            else if(y>z)    achse='y', value=(ymax+ymin)/2; 
            else            achse='z', value=(zmax+zmin)/2;                       

            // Trianglen an Achse aufteilen oder auch beiden Gruppen hinzufügen wenn es sich über beide streckt
            let greater = [];
            let lower = [];
            for(let t of triangles){
                let isInGreater=false;
                let isInLower=false;
                for(let p of [t.a, t.b, t.c]){
                    if(p[achse] > value) isInGreater=true;
                    else isInLower=true;
                }
                if(isInGreater) greater.push(t);
                if(isInLower) lower.push(t);
            }
            this.children.push(new AABB(this, greater, depth-1))
            this.children.push(new AABB(this, lower, depth-1))
        }
    }

    /**
     * Rekursive AABB Prüfung + Rückhabe der Dreieck
     * @param {Partikel} p 
     * @returns {Array} triangles
     */
    getTestedTriangles(p){
        if(!this.testPartikel(p)){
            return null;
        }
        else{
            if(this.children[0] instanceof Triangle)    
                return this.children;
            if(this.children[0] instanceof AABB) {
                let result1 = this.children[0].getTestedTriangles(p)
                let result2 = this.children[1].getTestedTriangles(p)
                if(result1 && !result2) return result1;
                else if(!result1 && result2) return result2;
                else if(result1 && result2) return Array.from(new Set(result1.concat(result2))); // Keine Duplikate  
            }
        }
    }
    

    /**
     * Ericson S. 183
     * @param {*} p 
     */
    testPartikel(p){
        let c = Vec3.add(this.min, this.max).scale(0.5)
        let e = Vec3.sub(this.max, c)
        let m = Vec3.add(p, p.old).scale(0.5)
        let d = Vec3.sub(p.old, m)
        m.sub(c)

        let adx = Math.abs(d.x);
        if(Math.abs(m.x) > e.x+adx) return false;
        let ady = Math.abs(d.y);
        if(Math.abs(m.y) > e.y+ady) return false;
        let adz = Math.abs(d.z);
        if(Math.abs(m.z) > e.z+adz) return false;
        adx += this.EPSILON, adx += this.EPSILON, adx += this.EPSILON

        if(Math.abs(m.y*d.z - m.z*d.y) > e.y*adz + e.z*ady) return false;
        if(Math.abs(m.z*d.x - m.x*d.z) > e.x*adz + e.z*adx) return false;
        if(Math.abs(m.x*d.y - m.y*d.x) > e.x*ady + e.y*adx) return false;
        
        return true;
    }
}