class Particle extends Vec3{
    constructor(x, y, z, mass){
        // Partikel aus vorhandenem Vec3 
        if(x instanceof Vec3){
            super(x.x, x.y, x.z)
            this.mass = y;
            this.old = new Vec3(x.x, x.y, x.z)
        }
        // Komplett neuer Partikel
        else{
            super(x, y, z)
            this.mass = mass;
            this.old = new Vec3(x, y, z)
        }
        this.pinned = false;
    } 
    pin(){
        this.pinned = true;
    }
    unpin(){
        this.pinned = false;
    }
}