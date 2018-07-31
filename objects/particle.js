class Particle extends vec3{
    constructor(x, y, z, mass){
        if(z == undefined){
            let p = x;
            super(p.x, p.y, p.z)
            this.mass = y;
            this.old = new vec3(p.x, p.y, p.z)
        }
        else{
            super(x, y, z)
            this.mass = mass;
            this.old = new vec3(x, y, z)
        }
        this.pinned = false;
    } 
    pin(){
        //this.mass = Number.NEGATIVE_INFINITY;
        this.pinned = true;
    }
    unpin(){
        this.pinned = false;
    }
}