uniform sampler2D tCurrent;
uniform sampler2D tPrevious;
uniform float uFeedbackAmount;
varying vec2 vUv;

void main() {
    vec2 uv = vUv;

    // Sample current and previous frames
    vec4 current = texture2D(tCurrent, uv);
    vec4 previous = texture2D(tPrevious, uv);

    // Boost current frame visibility
    current.rgb *= 1.0; // Make current frame much brighter

    // Create feedback effect with boosted current frame
    vec4 color = mix(current, previous, 0.0);

    // More aggressive boost for moving parts
    if (length(current.rgb) > 0.1) {
        color.rgb *= 0.5;
    }

    gl_FragColor = color;
}