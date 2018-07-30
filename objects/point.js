class Point {
    constructor(x, y, z){
        this.x = x;
        this.y = y;
        this.z = z;
    }
    getLength(){
        return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z)
    }
    normalize(){
        let l = this.length();
        this.x /= l;
        this.y /= l;
        this.z /= l;
        return this;
    }
    scale(s){
        this.x *= s;
        this.y *= s;
        this.z *= s;
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
    set(vec){
        this.x = vec.x;
        this.y = vec.y;
        this.z = vec.z;
        return this;
    }
    getPointCopie(){
        return new Point(this.x, this.y, this.z)
    }
}
