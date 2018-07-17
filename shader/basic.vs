attribute vec3 vertexPosition;
attribute vec4 vertexColor;
uniform mat4 mvMatrix;
uniform mat4 projectionMatrix;
varying vec4 fragColor;

void main(void) {
    gl_PointSize = 3.0;
    gl_Position = projectionMatrix * mvMatrix * vec4(vertexPosition, 1.0);

    fragColor = vertexColor;
}