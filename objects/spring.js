class Spring{
    constructor(p0, p1, initialLength, strength){
        this.p0 = p0;
        this.p1 = p1;
        this.initialLength = initialLength;      
        this.strength = strength; // [0; 1]
    }
    getElongationInPercent(){
        let length = Vec3.dist(this.p1, this.p0);
        let diff = length - this.initialLength
        return diff / this.initialLength
    }
    disctanceConstraint(){
        let d = Vec3.sub(this.p1, this.p0);
        let length = d.getLength();
        let diff = length - this.initialLength
        let force = this.strength * diff; 
        let offset = Vec3.scale(Vec3.normalize(d), force/2)
        
        if(!this.p0.pinned) this.p0.add(offset)
        if(!this.p1.pinned) this.p1.sub(offset) 
        return diff / this.initialLength
    }
}