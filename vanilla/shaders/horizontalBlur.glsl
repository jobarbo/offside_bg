uniform sampler2D tDiffuse;
uniform float h;

varying vec2 vUv;

void main() {
    vec4 sum = vec4(0.0);
    float blurSize = h * 0.001; // Adjust blur size

    // Gaussian weights
    sum += texture2D(tDiffuse, vec2(vUv.x - 4.0 * blurSize, vUv.y)) * 0.051;
    sum += texture2D(tDiffuse, vec2(vUv.x - 3.0 * blurSize, vUv.y)) * 0.0918;
    sum += texture2D(tDiffuse, vec2(vUv.x - 2.0 * blurSize, vUv.y)) * 0.12245;
    sum += texture2D(tDiffuse, vec2(vUv.x - blurSize, vUv.y)) * 0.1531;
    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y)) * 0.1633;
    sum += texture2D(tDiffuse, vec2(vUv.x + blurSize, vUv.y)) * 0.1531;
    sum += texture2D(tDiffuse, vec2(vUv.x + 2.0 * blurSize, vUv.y)) * 0.12245;
    sum += texture2D(tDiffuse, vec2(vUv.x + 3.0 * blurSize, vUv.y)) * 0.0918;
    sum += texture2D(tDiffuse, vec2(vUv.x + 4.0 * blurSize, vUv.y)) * 0.051;

    gl_FragColor = sum;
}