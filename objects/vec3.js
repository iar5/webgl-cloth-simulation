class Vec3{
    /**
     * @param {Number} x 
     * @param {Number} y 
     * @param {Number} z 
     */
    constructor(x, y, z){
        this.x = x;
        this.y = y;
        this.z = z;
    }
    getLength(){
        return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z)
    }
    set(vec){
        this.x = vec.x;
        this.y = vec.y;
        this.z = vec.z;
        return this;
    }
    normalize(){
        let l = this.getLength();
        this.x /= l;
        this.y /= l;
        this.z /= l;
        return this;
    }
    add(vec){
        this.x += vec.x;
        this.y += vec.y;
        this.z += vec.z;
        return this;
    }
    sub(vec){
        this.x -= vec.x;
        this.y -= vec.y;
        this.z -= vec.z;
        return this;
    }
    scale(s){
        this.x *= s;
        this.y *= s;
        this.z *= s;
        return this;
    }
    getCopie(){
        return new Vec3(this.x, this.y, this.z)
    }
    static length(v) { return v.getLength() }
    static dist(p0, p1) { return p0.getCopie().sub(p1).getLength() }
    static normalize(v) { return v.getCopie().normalize() }
    static add (v1, v2) { return v1.getCopie().add(v2) }
    static sub (v1, v2) { return v1.getCopie().sub(v2) }
    static scale (v, s) { return v.getCopie().scale(s) }
    static cross (v1, v2) { return new Vec3(v1.y*v2.z - v1.z*v2.y, v1.z*v2.x - v1.x*v2.z, v1.x*v2.y - v1.y*v2.x) }
    static dot(v1, v2) { return v1.x*v2.x + v1.y*v2.y + v1.z*v2.z }
    static equals(v1, v2) { return v1.x==v2.x && v1.y==v2.y && v1.z==v2.z }
}
