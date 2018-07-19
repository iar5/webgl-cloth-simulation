//https://github.com/sessamekesh/IndigoCS-webgl-tutorials/blob/master/05%20-%20Phong%20Lighting%20Intro/shader.fs.glsl
precision mediump float;
varying vec4 fragColor;
varying vec3 fragNormal;

void main()
{
	vec3 ambientIntensity = vec3(0.2, 0.2, 0.2);
	vec3 sunDirection = vec3(3.0, 4.0, 2.0);
	vec3 sunColor = vec3(0.9, 0.9, 0.9);

	vec3 surfaceNormal = normalize(fragNormal);
	vec3 normSunDir = normalize(sunDirection);
	vec3 lightIntensity = ambientIntensity + sunColor * max(dot(fragNormal, normSunDir), 0.0);

	gl_FragColor = vec4(fragColor.rgb * lightIntensity, fragColor.a);
}