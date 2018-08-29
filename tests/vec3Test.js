{
    let v1 = new Vec3(1, -5, 2)
    let v2 = new Vec3(2, 0, 3)
    let cross = Vec3.cross(v1, v2);
    console.assert(Vec3.equals(cross, new Vec3(-15, 1, 10)))
}
{
    let v1 = new Vec3(4, 5, -3)
    let v2 = new Vec3(-2, 2, -2)
    let dot = Vec3.dot(v1, v2);
    console.assert(dot == 8)
}
{
    let v1 = new Vec3(4.3, 5.1, -3.09)
    let v2 = new Vec3(1.111, .872, -92.4)
    let d1 =  Vec3.sub(v1, v2).getLength();
    let d2 =  Vec3.dist(v1, v2);
    console.assert(d1 == d2)
}