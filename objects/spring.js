class Spring{
    /**
     * @param {Partikel} p0 
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
     * Korrigiert die Federn auf iher Ausgangslänge
     * Berechnen des Impulses = negativ überdehnte Strecke
     * @param {Number} strength Stärke der auswirkung der Korrektur
     */
    disctanceConstraint(strength=1){
        if(strength == 0) return;
        let d = Vec3.sub(this.p1, this.p0);
        let diff = d.getLength() - this.initialLength;

        /*
        let elongation = 0.01; // Zugelassene prozentuale Ausdehnung, unterhalb der die Feder nicht zusammengezogen/gestreckt wird
        let offset = elongation * this.initialLength;
        if (diff > 0) {
            if((diff -= offset) < 0) return
        } else if((diff += offset) > 0) return
        */

        d.normalize().scale(strength * diff);

        let m0, m1;
        if(!this.p0.pinned && !this.p1.pinned){
            m0 = .5, m1 = .5; 
        } else if(this.p0.pinned && this.p1.pinned) { 
            m0 = 0, m1 = 0; 
        } else if(this.p0.pinned) { 
            m0 = 0, m1 = 1; 
        } else if(this.p1.pinned) { 
            m0 = 1, m1 = 0; 
        } 

        this.p0.add(Vec3.scale(d, m0))
        this.p1.sub(Vec3.scale(d, m1)) 
    }
}