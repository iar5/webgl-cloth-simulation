precision mediump float;

uniform mat4 mvMatrix;
uniform mat4 projectionMatrix;

varying vec4 fragColor;
varying vec3 fragNormal;

vec3 ambientIntensity = vec3(0.3, 0.3, 0.3);
vec3 sunDirection = vec3(2.0, 4.0, 3.0);
vec3 sunColor = vec3(0.9, 0.9, 0.9);

void main() {
	vec3 surfaceNormal = normalize(fragNormal);
	vec3 normSunDir = normalize(sunDirection);
	vec3 lightIntensity = ambientIntensity + sunColor * max(dot(fragNormal, normSunDir), 0.0);

	gl_FragColor = vec4(fragColor.rgb * lightIntensity, fragColor.a);
}