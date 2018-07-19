vec3={}
vec3.dist = function(p0, p1) {
	let dx = p1.x - p0.x,
		dy = p1.y - p0.y,
		dz = p1.z - p0.z;
	return Math.sqrt(dx*dx + dy*dy + dz*dz);
}
vec3.normalize = function(v) {
    let l = vec3.length(v)
    return {x: v.x / l, y: v.y / l, z: v.z / l}
}
vec3.length = function (v) {return Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z)}
vec3.scale = function(v,s) {return {x: v.x*s, y: v.y*s, z: v.z*s}}
vec3.add = function(v1, v2) { return {x: v1.x + v2.x, y: v1.y + v2.y, z: v1.z + v2.z}}
vec3.sub = function(v1, v2) { return {x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z}}
vec3.dot = function(v1, v2) { return v1.x*v2.x + v1.y*v2.y + v1.z*v2.z}
vec3.cross = function(v1, v2) { return {
	x: v1.y*v2.z - v1.z*v2.y, 
	y: v1.z*v2.x - v1.x*v2.z, 
	z: v1.x*v2.y - v1.y*v2.x, 
}}

function degToRad(degrees) {
	return degrees * Math.PI / 180;
}



// https://github.com/sessamekesh/IndigoCS-webgl-tutorials/blob/8194fa6fbfb44abac0cef9aaa96f906b8a34c9ef/util.js
var loadJSONResource = function(url, callback) {
	loadTextResource(url, function (result) {
        callback(JSON.parse(result));
	});
};
var loadTextResource = function(url, callback) {
	var request = new XMLHttpRequest();
	request.open('GET', url + '?please-dont-cache=' + Math.random(), true);
	request.onload = function () {
		if (request.status < 200 || request.status > 299) {
			throw Error ('Error: HTTP Status ' + request.status + ' on resource ' + url);
		} else {
			callback(request.responseText);
		}
	};
	request.send();
};


