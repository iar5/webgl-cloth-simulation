precision mediump float;

uniform mat4 mvMatrix;
uniform mat4 projectionMatrix;

attribute vec3 vertexPosition;
attribute vec4 vertexColor;
attribute vec3 vertexNormal;
varying vec3 fragNormal;
varying vec4 fragColor;

void main(void) {
    gl_PointSize = 3.0;
    gl_Position = projectionMatrix * mvMatrix * vec4(vertexPosition, 1.0);

    fragNormal = (mvMatrix * vec4(vertexNormal, 0.0)).xyz;
    fragColor = vertexColor;
}





