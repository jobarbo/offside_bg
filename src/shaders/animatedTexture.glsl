uniform sampler2D map;
uniform float time;
varying vec2 vUv;

void main() {
    // Create animated UV coordinates
    vec2 animatedUv = vUv;

    // Add wave-like distortion
    animatedUv.x += sin(vUv.y * 12.0 + time * 2.0) * 0.02;
    animatedUv.y += cos(vUv.x * 12.0 + time * 2.0) * 0.02;

    // Add rotating motion
    float angle = time * 0.05;
    vec2 center = vec2(0.5, 0.5);
    vec2 uv = animatedUv - center;
    vec2 rotatedUv = vec2(
        uv.x * cos(angle) - uv.y * sin(angle),
        uv.x * sin(angle) + uv.y * cos(angle)
    );
    rotatedUv += center;

    // Sample texture with animated coordinates
    vec4 texel = texture2D(map, rotatedUv);

    // Convert to monochrome using standard luminance conversion
    float luminance = dot(texel.rgb, vec3(0.299, 0.587, 0.514));
    texel.rgb = vec3(luminance);

    // Add pulsing effect


    gl_FragColor = texel;
}