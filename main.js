/*
 * Resource loading and application start
 */
var urls = ['shader/light.vs', 'shader/light.fs', 'shader/basic.vs', 'shader/basic.fs', "geometries/cube.json", "geometries/human_806polys.json", "geometries/icosa.json", "geometries/triangleBig.json"]
var resources = {};

urls.forEach(url => {
	loadTextResource(url, (resource) => {
		resources[url] = url.endsWith('.json') ? resource = JSON.parse(resource) : resource;
		if(Object.keys(resources).length == urls.length){
			window.onload = startApplication();
		}
	})
});



/*
 * Main application 
 */
var gl;
var lightProgram;
var basicProgram;
var stats;
var gui;

var	lastTick = 0;
var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;

var	modelviewMatrix = mat4.create();
var projectionMatrix = mat4.create();
var rotationMatrix = mat4.create();
mat4.identity(rotationMatrix);

var objects;
const camera = {
	position: [0.0, -4, -15.0],
	rotation: 0,
	angle: 35,
	animated: false
}


function startApplication() {	

	// ----------------- Setup ------------------ //

	gl = canvas.getContext("experimental-webgl");
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);

	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	initShaders();
	let loadingText = document.getElementById("loadingText");
	loadingText.parentNode.removeChild(loadingText);
	canvas.style.display = "initial";
	stats = new Stats();
	document.body.appendChild(stats.dom);

	// ----------------- Scene Start ------------------ //

	let cube = new Obj(resources["geometries/cube.json"]).setColor([1, 0, 0, .5]).translate(1.5, 3.5, -1.5);
	let	icosa = new Obj(resources["geometries/icosa.json"]).setColor([0, 0, 1, .5]).translate(-1.5, 3, 0);
	let triangle = new Obj(resources["geometries/triangleBig.json"]).translate(-.5, 1, -1);
	let	human = new Obj(resources["geometries/human_806polys.json"]);
	let	sphere = new Sphere(0.8, 18, 18).translate(-1.2, 2, -1);
	let	sphere2 = new Sphere(1.2, 22, 22).translate(1.2, 3, -1);

	//let towel = new Towel(24, 24, .25).rotateX(-90).translate(0, 6, 3).applyCloth(new Cloth(), [0, 23]);
	let towel2 = new Towel(36, 36, .1875).rotateX(-90).translate(0, 6, 3).applyCloth(new Cloth(), [0, 23]);
	//let towelTight = new Towel(48, 48, .125).rotateX(-90).translate(0, 6, 3).applyCloth(new Cloth(), [0, 47]);

	objects = [towel2, icosa, cube]
	





	// ----------------- Scene End ------------------ //

	objects.forEach(o => o.initGl(gl));
	loop();

	function loop() {
		if(camera.animated) animateCamera();
		gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		mat4.perspective(camera.angle, canvas.clientWidth/canvas.clientHeight, .01, 100.0, projectionMatrix); 
		mat4.identity(modelviewMatrix);
		mat4.translate(modelviewMatrix, camera.position);
		mat4.multiply(modelviewMatrix, rotationMatrix);
		mat4.rotate(modelviewMatrix, degToRad(camera.rotation), [0, 1, 0]);
		objects.forEach(o => {
			if(o.update) o.update();
			o.draw(gl)
		});
		stats.update();
		requestAnimationFrame(loop);
	}

	function animateCamera(){
		let timeNow = new Date().getTime();
		let elapsed = timeNow - lastTick;
		if(lastTick == 0) {
			lastTick = timeNow;
			return;
		}
		camera.rotation += (90 * elapsed) / 3000.0;
		lastTick = timeNow;
	}

	function initShaders() {
		basicProgram = createProgram(resources['shader/basic.vs'], resources['shader/basic.fs']);
		lightProgram = createProgram(resources['shader/light.vs'], resources['shader/light.fs']);
	}
	function createProgram(vertexShaderCode, fragmentShaderCode) {
		let program = gl.createProgram();
		var vshader = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vshader, vertexShaderCode);
		gl.compileShader(vshader);
		gl.attachShader(program, vshader);
		var fshader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fshader, fragmentShaderCode);
		gl.compileShader(fshader);
		gl.attachShader(program, fshader);
		gl.linkProgram(program);
		gl.useProgram(program);
		bindAttribute(program, "vertexPositionAttribute", "vertexPosition");
		bindAttribute(program, "vertexColorAttribute", "vertexColor");
		bindAttribute(program, "vertexNormalAttribute", "vertexNormal");
		program.projMatrixUniform = gl.getUniformLocation(program, "projectionMatrix");
		program.mvMatrixUniform = gl.getUniformLocation(program, "mvMatrix");
		return program;
	}
	function bindAttribute(program, programAttributeName, attributeName){
		program[programAttributeName] = gl.getAttribLocation(program, attributeName);
		gl.enableVertexAttribArray(program[programAttributeName]);
	}

	// ---------------- Mouse controls ------------------- //
	/*
	* Controls
	* by http://learningwebgl.com/blog/?p=1253
	*/
	canvas.onmousedown = function(event) {
		mouseDown = true;
		lastMouseX = event.clientX;
		lastMouseY = event.clientY;
	}
	document.onmouseup = function(event) { mouseDown = false }
	document.onmousemove = function(event) {
		if (!mouseDown) return;
		let newX = event.clientX;
		let newY = event.clientY;
		let deltaX = newX - lastMouseX;
		let newRotationMatrix = mat4.create();
		mat4.identity(newRotationMatrix);
		mat4.rotate(newRotationMatrix, degToRad(deltaX / 5), [0, 1, 0]);
		let deltaY = newY - lastMouseY;
		mat4.rotate(newRotationMatrix, degToRad(deltaY / 20), [1, 0, 0]);
		mat4.multiply(newRotationMatrix, rotationMatrix, rotationMatrix);

		lastMouseX = newX
		lastMouseY = newY;
	}
}