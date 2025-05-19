uniform sampler2D uTexture;
uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    // Animate UVs based on time and position
    vec2 uv = vUv;
    uv.x += sin(vPosition.y * 0.2 + uTime * 0.5) * 0.1;
    uv.y += cos(vPosition.x * 0.2 + uTime * 0.5) * 0.1;

    // Sample texture with animated UVs
    vec4 texColor = texture2D(uTexture, uv);

    // Add some normal-based coloring with moderate intensity
    vec3 normalColor = vNormal * 0.5 + 0.5;
    normalColor *= 0.8; // Reduce the brightness

    // Mix texture with normal color (more weight to texture)
    vec4 finalColor = mix(texColor, vec4(normalColor, 1.0), 0.3);
    finalColor.a = 1.0; // Fully opaque

    gl_FragColor = finalColor;
}