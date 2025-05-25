uniform sampler2D map;
uniform float time;
uniform float opacity;
varying vec2 vUv;

// Gaussian blur parameters
const float blurRadius = 3.0;
const float blurSigma = 1.0;
const int samples = 19; // Number of samples in each direction

vec4 gaussianBlur(sampler2D tex, vec2 uv, vec2 resolution) {
    vec4 color = vec4(0.0);
    float total = 0.0;

    // Calculate pixel size
    vec2 pixel = vec2(1.0) / resolution;

    // Two-pass Gaussian blur
    for(int x = -samples/2; x <= samples/2; x++) {
        for(int y = -samples/2; y <= samples/2; y++) {
            vec2 offset = vec2(float(x), float(y)) * pixel * blurRadius;

            // Calculate Gaussian weight
            float distance = length(offset);
            float weight = exp(-(distance * distance) / (2.0 * blurSigma * blurSigma));

            color += texture2D(tex, uv + offset) * weight;
            total += weight;
        }
    }

    return color / total;
}

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

    // Apply Gaussian blur to the rotated and animated texture
    vec4 texel = gaussianBlur(map, rotatedUv, vec2(512.0, 512.0)); // Assuming texture size is 512x512

    // Convert to monochrome using standard luminance conversion
    float luminance = dot(texel.rgb, vec3(0.299, 0.587, 0.514));

    // Add contrast adjustment
    float contrast = 2.5; // Increase this value for more contrast
    float midpoint = 0.25;
    luminance = (luminance - midpoint) * contrast + midpoint;
    luminance = clamp(luminance, 0.0, 2.0); // Ensure values stay in valid range

    texel.rgb = vec3(luminance);

    // Add subtle glow effect
    float glow = 1.2 + sin(time) * 0.2;
    texel.rgb *= glow;

    // Apply opacity
    gl_FragColor = vec4(texel.rgb, texel.a * opacity);
}