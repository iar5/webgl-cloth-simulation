class Particle extends Vec3{
    constructor(x, y, z, mass){
        // Partikel aus Vec3 
        if(z == undefined){
            let p = x;
            super(p.x, p.y, p.z)
            this.mass = y || 0.111;
            this.old = new Vec3(p.x, p.y, p.z)
        }
        // Komplett neuer Partikel
        else{
            super(x, y, z)
            this.mass = mass || 0.111;
            this.old = new Vec3(x, y, z)
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