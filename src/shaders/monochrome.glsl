uniform sampler2D map;
varying vec2 vUv;

void main() {
    vec4 texel = texture2D(map, vUv);
    float luminance = dot(texel.rgb, vec3(0.299, 0.587, 0.114)); // Standard luminance conversion
    gl_FragColor = vec4(vec3(luminance), texel.a);
}