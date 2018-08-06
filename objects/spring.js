class Spring{
    constructor(p0, p1, length, strength){
        this.p0 = p0;
        this.p1 = p1;
        this.length = length;
        this.strength = strength;
    }
    disctanceConstraint(){
        let d = Vec3.sub(this.p1, this.p0);
        let dist = Vec3.length(d);
        let force = this.strength * (dist - this.length); 
        let offset = Vec3.scale(Vec3.normalize(d), force/2) // adjust
        
        if(!this.p0.pinned) this.p0.add(offset)
        if(!this.p1.pinned) this.p1.sub(offset) 

        return force / dist;
    }
}