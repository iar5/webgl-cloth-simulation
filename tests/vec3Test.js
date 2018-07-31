{
    let v1 = new vec3(1, -5, 2)
    let v2 = new vec3(2, 0, 3)
    let cross = vec3.cross(v1, v2);
    console.assert(vec3.equals(cross, new vec3(-15, 1, 10)))
}
{
    let v1 = new vec3(4, 5, -3)
    let v2 = new vec3(-2, 2, -2)
    let dot = vec3.dot(v1, v2);
    console.assert(dot == 8)
}