class Spring{
    constructor(p0, p1, initialLength, type){
        this.p0 = p0;
        this.p1 = p1;
        this.initialLength = initialLength;    
        this.type = type;
        this._lastElongation;
    }
    
    /**
     * Ausdehnung der Feder unter Betracht der Stärke (oder eben nicht, wenn kein Parameter übergben)
     * @param {Number} strength 
     */
    getActualElongation(strength=1){
        let length = Vec3.dist(this.p1, this.p0);
        let diff = length - this.initialLength;
        return diff / this.initialLength * strength;
    }
    getLastElongation(strength=1){
        return this._lastElongation * strength;
    }

    /**
     * Distanzbedingung
     * @param {Number} strength 
     */
    disctanceConstraint(strength=1){
        let d = Vec3.sub(this.p1, this.p0)
        let diff = d.getLength() - this.initialLength
        let force = Vec3.normalize(d).scale(strength * diff)
        
        let m0, m1;
        if(this.p0.mass != this.p1.mass){
            m0 = this.p0.mass / (this.p0.mass + this.p1.mass)
            m1 = this.p1.mass / (this.p0.mass + this.p1.mass)
        }
        else m0 = m1 = 0.5;

        this.p0.add(Vec3.scale(force, m0))
        this.p1.sub(Vec3.scale(force, m1)) 
        this._lastElongation = diff / this.initialLength
    }
}