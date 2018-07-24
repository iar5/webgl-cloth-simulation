class Particle extends Point{
    constructor(x, y, z, oldx, oldy, oldz, mass){
        if(z == undefined){
            // x: Point
            // y: mass
            let p = x;
            super(p.x, p.y, p.z)
            this.oldx = p.x;
            this.oldy = p.y;
            this.oldz = p.z;
            this.mass = y;
        }
        else{
            super(x, y, z)
            this.oldx = oldx;
            this.oldy = oldy;
            this.oldz = oldz;
            this.mass = mass;
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