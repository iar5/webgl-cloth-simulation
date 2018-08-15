class Spring{
    constructor(p0, p1, initialLength, type){
        this.p0 = p0;
        this.p1 = p1;
        this.initialLength = initialLength;    
        this.type = type;
        this._lastElongation;
    }
    getActualElongation(){
        let length = Vec3.dist(this.p1, this.p0);
        let diff = length - this.initialLength
        return diff / this.initialLength
    }
    getLastElongation(){
        return this._lastElongation
    }
    disctanceConstraint(strength){
        let d = Vec3.sub(this.p1, this.p0);
        let length = d.getLength();
        let diff = length - this.initialLength
        let force = Vec3.scale(Vec3.normalize(d), strength * diff)
        
        let m0 = this.p0.mass / (this.p0.mass + this.p1.mass);
        let m1 = this.p1.mass / (this.p0.mass + this.p1.mass)

        this.p0.add(Vec3.scale(force, m0))
        this.p1.sub(Vec3.scale(force, m1)) 
        this._lastElongation = diff / this.initialLength
    }
}