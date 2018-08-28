class Vec3{
    /**
     * @param {Number} x 
     * @param {Number} y 
     * @param {Number} z 
     */
    constructor(x=0, y=0, z=0){
        this.x = x;
        this.y = y;
        this.z = z;
    }
    getLength(){
        return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z)
    }
    set(vec_x, y, z){
        // Wenn über Stringify geklont ists kein Klassenobjekt mehr, daher gucken obs normales Objekt mit xyz ist
        if(vec_x instanceof Vec3 || vec_x.x != null){
            this.x = vec_x.x;
            this.y = vec_x.y;
            this.z = vec_x.z;
        }
        else {
            this.x = vec_x;
            this.y = y;
            this.z = z;
        }
        return this;
    }
    isOrigin(){
        return this.x == 0 && this.y == 0 && this.z && 0;
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
    multiplyMat3(m){
        let temp = new Vec3();
        temp.x = this.x*m[0] + this.y*m[1] + this.z*m[2];
        temp.y = this.x*m[3] + this.y*m[4] + this.z*m[5];
        temp.z = this.x*m[6] + this.y*m[7] + this.z*m[8];
        this.set(temp)
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
