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

    // Add some normal-based coloring with increased intensity
    vec3 normalColor = vNormal * 0.5 + 0.5;

    // Mix texture with normal color
    vec4 finalColor = mix(texColor, vec4(normalColor, 1.0), 0.5);

    // Boost brightness and ensure full opacity
    finalColor.rgb *= 1.5;
    finalColor.a = 1.0;

    gl_FragColor = finalColor;
}