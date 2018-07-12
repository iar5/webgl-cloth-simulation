/*
 * Async shader loading + application start
 */
var phong_vs, phong_fs, cloth_vs, cloth_fs

loadTextResource("shader/phong.vs", function(text){
	phong_vs = text;
	loadTextResource("shader/phong.fs", function(text){
		phong_fs = text;
		loadTextResource("shader/cloth.vs", function(text){
			cloth_vs = text
			loadTextResource("shader/cloth.fs", function(text){
				cloth_fs = text;
				window.onload = initGL();
			})
		})
	})
})



/*
 * Global variables 
 */
var gl;
var stats;
var phongProgram;
var clothProgram;

var	lastTick = 0;
var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;

var	modelviewMatrix = mat4.create();
var projectionMatrix = mat4.create();
var rotationMatrix = mat4.create();
mat4.identity(rotationMatrix);

var camera = {
	position: [0.0, -4, -15.0],
	rotation: 0,
	angle: 35
}

var bounce = .9;    // aufprall 
var drag = 0.9;     // luftwiderstand
var gravity = 0.81; // gravität
var windX = 0.00000002;
var windZ = 0.0000001;


/*
 * Main application 
 */
function initGL () {
	stats = new Stats();
	document.body.appendChild(stats.dom);

	gl = canvas.getContext("experimental-webgl");
	gl.enable(gl.DEPTH_TEST);

	var objects = [
		new Towel(40, 30, 0.2, {x: -4, y: 0, z: 0}),
		//new Sphere(2, {x: 1.2, y: 2, z: 0}, 18, 18),
		new Sphere(1, {x: -2, y: 4, z: 0}, 18, 18),
		//new Tetraeder({x: 1, y: 2, z: 0}),
		new Obj("models/human_806polys.json"),
	];
	var cloth = new Cloth(objects[0], 0.02, 30)

	initShaders();
	objects.forEach(o => o.init(gl));
	loop();

	
	function loop() {
		//animateCamera();
		gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		mat4.perspective(camera.angle, canvas.clientWidth/canvas.clientHeight, .01, 100.0, projectionMatrix); 
		mat4.identity(modelviewMatrix);
		mat4.translate(modelviewMatrix, camera.position);
		mat4.multiply(modelviewMatrix, rotationMatrix);
		mat4.rotate(modelviewMatrix, degToRad(camera.rotation), [0, 1, 0]);

		cloth.update(objects);
		objects.forEach(o => o.draw(gl));

		stats.update();
		requestAnimationFrame(loop);
	}



	function animateCamera(){
		let timeNow = new Date().getTime();
		let elapsed = timeNow - lastTick;
		if(lastTick == 0) {
			lastTick = timeNow;
			return
		}
		camera.rotation += (90 * elapsed) / 3000.0;
		lastTick = timeNow;
	}

	function initShaders() {
		phongProgram = createProgram(phong_vs, phong_fs)
		gl.useProgram(phongProgram);
		bindAttribute(phongProgram, "vertexPositionAttribute", "vertexPosition")
		bindAttribute(phongProgram, "vertexColorAttribute", "vertexColor")
		bindAttribute(phongProgram, "vertexNormalAttribute", "vertexNormal")
		phongProgram.projMatrixUniform = gl.getUniformLocation(phongProgram, "projectionMatrix");
		phongProgram.mvMatrixUniform = gl.getUniformLocation(phongProgram, "mvMatrix");

		clothProgram = createProgram(cloth_vs, cloth_fs)
		gl.useProgram(clothProgram);
		bindAttribute(clothProgram, "vertexPositionAttribute", "vertexPosition")
		bindAttribute(clothProgram, "vertexColorAttribute", "vertexColor")
		clothProgram.projMatrixUniform = gl.getUniformLocation(clothProgram, "projectionMatrix");
		clothProgram.mvMatrixUniform = gl.getUniformLocation(clothProgram, "mvMatrix");
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
		return program;
	}
	function bindAttribute(program, programAttributeName, attributeName){
		program[programAttributeName] = gl.getAttribLocation(program, attributeName);
		gl.enableVertexAttribArray(program[programAttributeName]);
	}



	/*
	* Mouse controls
	* by http://learningwebgl.com/blog/?p=1253
	*/
	canvas.onmousedown = function(event) {
		mouseDown = true;
		lastMouseX = event.clientX;
		lastMouseY = event.clientY;
	}
	document.onmouseup = function(event) {
	mouseDown = false;
	}
	document.onmousemove = function(event) {
	if (!mouseDown) {
		return;
	}
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