class Spring{
    /**
     * @param {Partikel p0 
     * @param {Partikel} p1 
     * @param {Number} initialLength Initialer Abstand zwischen p0 und p1. Wird nicht hier berechnet, da einzelnen Textilteile später so zusammengeogen werden sollen
     * @param {String} type Hierdrüber wird die Stärke der Federn erkannt. Keine direkte Speicheurng in Spring, da die Federstärke für alle einer Art dynamisch von außen angepasst werden soll
     */
    constructor(p0, p1, initialLength, type){
        this.p0 = p0;
        this.p1 = p1;
        this.initialLength = initialLength;    
        this.type = type;
        this._lastElongation;
    }
    
    /**
     * Ausdehnung der Feder unter Betrachtung der Stärke (oder eben nicht, wenn kein Parameter übergben)
     * Wobei 1 ^= 100%
     * @param {Number} strength  
     */
    getElongation(strength=1){
        let diff = Vec3.dist(this.p1, this.p0) - this.initialLength;
        return diff / this.initialLength * strength;
    }

    /**
     * Distanzbedingung
     * @param {Number} strength 
     */
    disctanceConstraint(strength=1){
        let d = Vec3.sub(this.p1, this.p0)
        let diff = d.getLength() - this.initialLength;
        let force = Vec3.normalize(d).scale(strength * diff)
        
        let m0, m1;
        if(this.p0.mass != this.p1.mass){
            m0 = this.p0.mass / (this.p0.mass + this.p1.mass)
            m1 = this.p1.mass / (this.p0.mass + this.p1.mass)
        }
        else m0 = m1 = 0.5;

        this.p0.add(Vec3.scale(force, m0))
        this.p1.sub(Vec3.scale(force, m1)) 
    }
}