// Degrees to radians
function degToRad(degrees) {
	return degrees * Math.PI / 180;
}

// by https://github.com/sessamekesh/IndigoCS-webgl-tutorials/blob/8194fa6fbfb44abac0cef9aaa96f906b8a34c9ef/util.js
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


// Kontinuierliches Array für WebGL Buffer <-> Array mit Vec3s
var generateContinousArrayFromVec3s = function(vec3s){       
	let result = []
	vec3s.forEach(vec => result.push(vec.x, vec.y, vec.z))
	return result
}
var generateVec3sFromContinousArray = function(arr){       
	let result = []
	for(let i = 0; i < arr.length; i+=3){
		result.push(new Vec3(arr[i], arr[i+1], arr[i+2]))
	}
	return result
}
