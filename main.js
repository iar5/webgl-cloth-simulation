/*
 * Async shader loading + application start
 */
var phong_vs, phong_fs, basic_vs, basic_fs

loadTextResource("shader/phong.vs", function(text){
	phong_vs = text;
	loadTextResource("shader/phong.fs", function(text){
		phong_fs = text;
		loadTextResource("shader/basic.vs", function(text){
			basic_vs = text
			loadTextResource("shader/basic.fs", function(text){
				basic_fs = text;
				window.onload = initGL();
			})
		})
	})
})



/*
 * Main Application
 */
var gl;
var stats;
var phongProgram;
var basicProgram;

var	lastTick = 0;
var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;

var	modelviewMatrix = mat4.create();
var projectionMatrix = mat4.create();
var rotationMatrix = mat4.create();
mat4.identity(rotationMatrix);

var bounce = .9;     
var drag = 0.9;      
var gravity = 0.981; 
var windX = 0.000001;
var windZ = 0.000001;

var objects;
var camera = {
	position: [0.0, -4, -15.0],
	rotation: 0,
	angle: 35,
	animated: false
}

function initGL () {	
	gl = canvas.getContext("experimental-webgl");
	gl.enable(gl.DEPTH_TEST);
	initShaders();

	// ----------------- Scene ------------------ //
	/* IMPROVEMENTS
	- x, y, z als Array darstellen
	- p.oldx etc. als seperaten Punkt
	*/
	let cube = new Obj("modelsJson/cube.json", 'yellow');
	let triangle = new Obj("modelsJson/triangle.json", 'green');
	let	human = new Obj("modelsJson/human_806polys.json");
	let	icosa = new Obj("modelsJson/icosa.json", 'green');
	let	sphere = new Sphere(.6, 18, 18).translate(1.5, 5, -1);
	let	dummyObject = new Sphere(0,0,0); // damit towel als alleiniges Objekt gezeichnet werden kann. siehe problem in draw()
	let towel = new Towel(20, 20, .3).rotateX(90).translate(0, 6, -2).applyCloth(new Cloth(0.02, 20));
	let towelFree = new Towel(50, 40, .15).rotateX(90).translate(0, 6, -3).applyCloth(new Cloth(0.02, 40));
	let towel1Pin = new Towel(30, 30, .2).translate(3, 3, 0).applyCloth(new Cloth(0.015, 10));
	towel1Pin.pin(0);
	towel.pin(380, 399);

	var initialisationCallback = () => {
		if(icosa.points) icosa.translate(1,4,1.5);
		if(triangle.points) triangle.translate(1,3.5,1)	
	}

	objects = [dummyObject, towel, triangle, human];


	// ----------------- Start and Loop ------------------ //
	var starter = function(count){
		var counter = count;
		return function(){
			counter--;
			if(counter == 0) start();
		}
	}(objects.length)

	objects.forEach(o => {
		o.init(gl, starter)
	});

	function start(){
		initialisationCallback()
		let elem = document.getElementById("loadingText");
		elem.parentNode.removeChild(elem);
		stats = new Stats();
		document.body.appendChild(stats.dom);
		canvas.style.display = "initial";
		loop();
	}

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
			o.draw(gl)}
		);
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

	// --------------- WebGL -------------------- //
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
		return program;
	}
	function initShaders() {
		basicProgram = createProgram(basic_vs, basic_fs)
		gl.useProgram(basicProgram);
		bindAttribute(basicProgram, "vertexPositionAttribute", "vertexPosition");
		bindAttribute(basicProgram, "vertexColorAttribute", "vertexColor");
		basicProgram.projMatrixUniform = gl.getUniformLocation(basicProgram, "projectionMatrix");
		basicProgram.mvMatrixUniform = gl.getUniformLocation(basicProgram, "mvMatrix");

		phongProgram = createProgram(phong_vs, phong_fs)
		gl.useProgram(phongProgram);
		bindAttribute(phongProgram, "vertexPositionAttribute", "vertexPosition");
		bindAttribute(phongProgram, "vertexColorAttribute", "vertexColor");
		bindAttribute(phongProgram, "vertexNormalAttribute", "vertexNormal");
		phongProgram.projMatrixUniform = gl.getUniformLocation(phongProgram, "projectionMatrix");
		phongProgram.mvMatrixUniform = gl.getUniformLocation(phongProgram, "mvMatrix");
	}
	function bindAttribute(program, programAttributeName, attributeName){
		program[programAttributeName] = gl.getAttribLocation(program, attributeName);
		gl.enableVertexAttribArray(program[programAttributeName]);
	}


	// ---------------- Mouse controls ------------------- //
	/*
	* Mouse controls
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