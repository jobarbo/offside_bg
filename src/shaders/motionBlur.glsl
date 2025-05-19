uniform sampler2D tOld;
uniform sampler2D tNew;
uniform float uDecay;
varying vec2 vUv;

void main() {
    vec4 texelOld = texture2D(tOld, vUv);
    vec4 texelNew = texture2D(tNew, vUv);

    // Create intense painting-like trails
    vec4 trail = texelOld * (uDecay + 0.4); // Very high persistence

    // Subtle color modulation for the trails
    trail.rgb *= 0.15; // Soften the trail colors

    // Aggressive blending for paint-like effect
    vec4 finalColor = max(texelNew, trail);

    // Layer multiple subtle trails for richness
    finalColor += trail * 0.08;
    finalColor += texelOld * 0.08;

    // Add a slight color boost to the new frame
    if (length(texelNew.rgb) > 0.1) {
        finalColor.rgb *= 1.2;
    }

    // Ensure we stay in valid range while preserving color ratios
    gl_FragColor = finalColor;
    gl_FragColor.rgb = clamp(gl_FragColor.rgb, vec3(0.0), vec3(1.0));
    gl_FragColor.a = min(1.0, gl_FragColor.a);
}