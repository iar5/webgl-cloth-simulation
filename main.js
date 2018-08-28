/*
 * Resource loading and application start
 */
var urls = [
	'shader/light.vs', 
	'shader/light.fs', 
	'shader/basic.vs', 
	'shader/basic.fs', 
	'geometries/cube.json', 
	'geometries/human_806polys.json', 
	'geometries/icosa.json', 
	'geometries/triangleBig.json',
	'geometries/pyramide.json',
	'geometries/sphere.json'
]
var resc = {};

urls.forEach(url => {
	loadTextResource(url, (resource) => {
		resc[url] = url.endsWith('.json') ? resource = JSON.parse(resource) : resource;
		if(Object.keys(resc).length == urls.length){
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
	 // wirkt als Transformation der gesamten Szene, also Werte umdrehen
	position: [0, -3, -15],
	rotation: [0, 0, 0],
	angle: 35,
	animated: false
}


function startApplication() {	
	setup()

	// ----------------- Scene Start ------------------ //

	let	sphere = new Sphere(1, 22, 22).translate(-2, 3, -1);
	let cube = new Mesh(resc["geometries/cube.json"]).setColor([.9, .7, .5, 1]).translate(2, 3, -1.5);
	let	icosa = new Mesh(resc["geometries/icosa.json"]).setColor([.55, .3, 1, 1]).translate(-.25, 3, 0.5);
	let	pyramide = new Mesh(resc["geometries/pyramide.json"]).setColor([.3, .55, 1, .5]).translate(-.1, 0.5, 0);
	let triangle = new Mesh(resc["geometries/triangleBig.json"]).translate(-.5, 1, -1);
	let	human = new Mesh(resc["geometries/human_806polys.json"]).translate(0, 0, -1);
	let	sphereTriMesh = new Mesh(resc["geometries/sphere.json"]).translate(0, 2, 0);

	//let towel = new Towel(24, 24, .25).rotateX(-90).translate(0, 6, 3).applyCloth(new Cloth(), [0, 23, 552]);
	//let towel = new Towel(36, 36, .1875).rotateX(-90).translate(0, 6, 3).applyCloth(new Cloth(), [0, 35, 1260]);
	//let towel = new Towel(48, 48, .125).rotateX(-90).translate(0, 6, 3).applyCloth(new Cloth(), [0, 47]);
	
	let cubeMid = new Mesh(resc["geometries/cube.json"]).setColor([.6, .6, .8, .6]).translate(0, 1, 0);
	let sphereMid = new Sphere(1, 22, 22).translate(0, 1, 0);
	let towel4pin = new Towel(24, 24, .25).rotateX(-90).translate(0, 2.5, 3).applyCloth(new Cloth(), [0, 23, 552, 575]);
	let towelFree = new Towel(48, 48, .125).rotateX(-90).translate(0, 5, 3).applyCloth(new Cloth());

	//let towelGarn = new Towel(6, 1, 1).applyCloth(new Cloth(), [0, 5]).translate(0, 3, 0);

	objects = [towelFree, pyramide]
	



	
	// ----------------- Scene End ------------------ //

	function setup(){
		gl = canvas.getContext("experimental-webgl");
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		basicProgram = createProgram(resc['shader/basic.vs'], resc['shader/basic.fs']);
		lightProgram = createProgram(resc['shader/light.vs'], resc['shader/light.fs']);
		let loadingText = document.getElementById("loadingText");
		loadingText.parentNode.removeChild(loadingText);
		canvas.style.display = "initial";
		stats = new Stats();
		document.body.appendChild(stats.dom);
	}

	let dummy = new Plane(0, 0);
	dummy.program = basicProgram // siehe Problem in mesh.draw()
	objects.unshift(dummy)
	objects.forEach(o => o.initGl());
	loop();

	function loop() {
		if(camera.animated) animateCamera();
		gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		mat4.perspective(camera.angle, canvas.clientWidth/canvas.clientHeight, .01, 100.0, projectionMatrix); 
		mat4.identity(modelviewMatrix);
		mat4.translate(modelviewMatrix, camera.position);
		mat4.multiply(modelviewMatrix, rotationMatrix);
		mat4.rotate(modelviewMatrix, degToRad(camera.rotation[0]), [1, 0, 0]);
		mat4.rotate(modelviewMatrix, degToRad(camera.rotation[1]), [0, 1, 0]);
		mat4.rotate(modelviewMatrix, degToRad(camera.rotation[2]), [0, 0, 1]);

		objects.forEach(o => {
			if(o.update) o.update();
			o.draw()
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
		program.projMatrixUniform = gl.getUniformLocation(program, "projectionMatrix");
		program.mvMatrixUniform = gl.getUniformLocation(program, "mvMatrix");
		program.vertexPositionAttribute = gl.getAttribLocation(program, 'vertexPosition');
		program.vertexColorAttribute = gl.getAttribLocation(program, 'vertexColor');
		program.vertexNormalAttribute = gl.getAttribLocation(program, 'vertexNormal');
		gl.enableVertexAttribArray(program.vertexPositionAttribute);
		gl.enableVertexAttribArray(program.vertexColorAttribute);		
		gl.enableVertexAttribArray(program.vertexNormalAttribute);

		return program;
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