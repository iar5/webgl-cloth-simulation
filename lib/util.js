// Degrees to radians
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


