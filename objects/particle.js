class Particle extends Point{
    constructor(x, y, z, mass){
        if(z == undefined){
            let p = x;
            super(p.x, p.y, p.z)
            this.mass = y;
            this.old = new Point(p.x, p.y, p.z)
        }
        else{
            super(x, y, z)
            this.mass = mass;
            this.old = new Point(x, y, z)
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