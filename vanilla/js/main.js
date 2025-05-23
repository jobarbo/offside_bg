import * as THREE from "three";

// Use relative path for texture
const textureUrl = "../texture2.png";

// Define shader code directly to avoid loading issues
const animatedTextureShader = `
uniform sampler2D map;
uniform float time;
varying vec2 vUv;

void main() {
    // Create animated UV coordinates
    vec2 animatedUv = vUv;

    // Add wave-like distortion
    animatedUv.x += cos(vUv.y * 12.0 + time * 2.0) * 0.02;
    animatedUv.y += sin(vUv.x * 12.0 + time * 2.0) * 0.02;

    // Add rotating motion
    float angle = time * 0.5;
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

    gl_FragColor = texel;
}
`;

const blurVertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Start initialization right away since we have shader code
init();

// Function to initialize
function init() {
	// Scene setup
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	const renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true,
		precision: "highp",
	});

	renderer.setClearColor(0x000000, 0); // Set clear color with 0 alpha for transparency
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	// Create render targets for ping-pong effect
	let renderTarget0 = new THREE.WebGLRenderTarget(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
	let renderTarget1 = renderTarget0.clone();

	// Create persistence shader for trails
	const baseVertexShader = `
	varying vec2 v_uv;
	void main () {
	  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	  v_uv = uv;
	}
	`;

	const persistenceFragmentShader = `
	uniform sampler2D sampler;
	uniform float time;
	uniform float aspect;
	uniform vec2 mousePos;
	uniform float noiseFactor;
	uniform float noiseScale;
	uniform float rgbPersistFactor;
	uniform float alphaPersistFactor;

	varying vec2 v_uv;

	// Simplex noise function
	vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
	vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
	vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
	vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

	float snoise3(vec3 v) {
	  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
	  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

	  // First corner
	  vec3 i  = floor(v + dot(v, C.yyy));
	  vec3 x0 = v - i + dot(i, C.xxx);

	  // Other corners
	  vec3 g = step(x0.yzx, x0.xyz);
	  vec3 l = 1.0 - g;
	  vec3 i1 = min(g.xyz, l.zxy);
	  vec3 i2 = max(g.xyz, l.zxy);

	  vec3 x1 = x0 - i1 + C.xxx;
	  vec3 x2 = x0 - i2 + C.yyy;
	  vec3 x3 = x0 - D.yyy;

	  // Permutations
	  i = mod289(i);
	  vec4 p = permute(permute(permute(
		i.z + vec4(0.0, i1.z, i2.z, 1.0))
		+ i.y + vec4(0.0, i1.y, i2.y, 1.0))
		+ i.x + vec4(0.0, i1.x, i2.x, 1.0));

	  // Gradients: 7x7 points over a square, mapped onto an octahedron.
	  float n_ = 0.142857142857; // 1.0/7.0
	  vec3 ns = n_ * D.wyz - D.xzx;

	  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

	  vec4 x_ = floor(j * ns.z);
	  vec4 y_ = floor(j - 7.0 * x_);

	  vec4 x = x_ *ns.x + ns.yyyy;
	  vec4 y = y_ *ns.x + ns.yyyy;
	  vec4 h = 1.0 - abs(x) - abs(y);

	  vec4 b0 = vec4(x.xy, y.xy);
	  vec4 b1 = vec4(x.zw, y.zw);

	  vec4 s0 = floor(b0)*2.0 + 1.0;
	  vec4 s1 = floor(b1)*2.0 + 1.0;
	  vec4 sh = -step(h, vec4(0.0));

	  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
	  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

	  vec3 p0 = vec3(a0.xy,h.x);
	  vec3 p1 = vec3(a0.zw,h.y);
	  vec3 p2 = vec3(a1.xy,h.z);
	  vec3 p3 = vec3(a1.zw,h.w);

	  // Normalise gradients
	  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
	  p0 *= norm.x;
	  p1 *= norm.y;
	  p2 *= norm.z;
	  p3 *= norm.w;

	  // Mix final noise value
	  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
	  m = m * m;
	  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
	}

	void main() {
	  float a = snoise3(vec3(v_uv * noiseFactor, time * 0.1)) * noiseScale;
	  float b = snoise3(vec3(v_uv * noiseFactor, time * 0.1 + 100.0)) * noiseScale;
	  vec4 t0 = texture2D(sampler, v_uv + vec2(a, b) + mousePos * 0.005);

	  gl_FragColor = vec4(t0.xyz * rgbPersistFactor, alphaPersistFactor);
	}
	`;

	// Create a scene for the persistence effect
	const persistenceScene = new THREE.Scene();
	const orthoCamera = new THREE.OrthographicCamera(-window.innerWidth / 2, window.innerWidth / 2, window.innerHeight / 2, -window.innerHeight / 2, 0.1, 10);
	orthoCamera.position.set(0, 0, 1);
	orthoCamera.lookAt(new THREE.Vector3(0, 0, 0));

	// Create a full-screen quad for the persistence effect
	const fullscreenQuadGeometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
	const fullscreenQuadMaterial = new THREE.ShaderMaterial({
		uniforms: {
			sampler: {value: null},
			time: {value: 0},
			aspect: {value: window.innerWidth / window.innerHeight},
			mousePos: {value: new THREE.Vector2(0, 0)},
			noiseFactor: {value: 2.2}, // Controls noise frequency
			noiseScale: {value: 0.002}, // Controls noise amplitude
			rgbPersistFactor: {value: 1.0}, // Controls color persistence (higher = longer trails)
			alphaPersistFactor: {value: 1.999}, // Controls opacity persistence
		},
		vertexShader: baseVertexShader,
		fragmentShader: persistenceFragmentShader,
		transparent: true,
	});
	const fullscreenQuad = new THREE.Mesh(fullscreenQuadGeometry, fullscreenQuadMaterial);
	persistenceScene.add(fullscreenQuad);

	// Mouse position tracking
	const mousePos = [0, 0];
	const targetMousePos = [0, 0];
	document.addEventListener("mousemove", (e) => {
		// Normalize to -1 to 1
		targetMousePos[0] = (e.clientX / window.innerWidth) * 2 - 1;
		targetMousePos[1] = -(e.clientY / window.innerHeight) * 2 + 1;
	});

	// Load texture
	const textureLoader = new THREE.TextureLoader();
	const texture = textureLoader.load(textureUrl);
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

	// Create custom shader material for cubes
	const cubeMaterial = new THREE.ShaderMaterial({
		uniforms: {
			map: {value: texture},
			time: {value: 0.1},
		},
		vertexShader: blurVertexShader,
		fragmentShader: animatedTextureShader,
		transparent: false,
		depthWrite: true,
		depthTest: true,
	});

	// Create cubes
	const cubes = [];
	const cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);

	// Noise settings
	const noiseScale = 0.5;
	const timeScale = 0.001;
	const orbitRadius = 0.9;
	const orbitSpeed = 0.0015;
	const independentMotionScale = 2.0; // Scale of independent motion
	const centeringForce = 0.7; // How strongly cubes are pulled to their orbital paths
	let time = 0;

	// Create multiple cube instances
	for (let i = 0; i < 40; i++) {
		const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

		// Set initial positions in a circular pattern
		const angle = (i / 40) * Math.PI * 2;
		const radius = orbitRadius + (Math.random() - 0.5) * 0.1;
		cube.position.x = (Math.random() - 0.5) * 1;
		cube.position.y = (Math.random() - 0.5) * 1;
		cube.position.z = (Math.random() - 0.5) * 1;

		// Store original angle for orbital motion
		cube.userData.originalAngle = angle;
		cube.userData.radius = radius;
		cube.userData.offset = Math.random() * 1000;
		cube.userData.verticalOffset = Math.random() * Math.PI * 2; // Phase offset for vertical motion

		scene.add(cube);
		cubes.push(cube);
	}

	// Position camera
	camera.position.z = 12;
	camera.position.x = 0;
	camera.position.y = 0;

	// Noise function (Improved Perlin noise)
	function noise(x, y, z) {
		const nx = Math.cos(x);
		const ny = Math.sin(y);
		const nz = Math.cos(z);
		return Math.cos(nx + ny + nz) * 0.1;
	}

	// Animation loop
	function animate() {
		requestAnimationFrame(animate);
		time += 1.0;

		// Update shader time uniforms
		cubeMaterial.uniforms.time.value = time * 0.01;
		fullscreenQuadMaterial.uniforms.time.value = time * 0.01;

		// Update mouse position with smooth interpolation
		const mouseSpeed = 0.05;
		mousePos[0] += (targetMousePos[0] - mousePos[0]) * mouseSpeed;
		mousePos[1] += (targetMousePos[1] - mousePos[1]) * mouseSpeed;
		fullscreenQuadMaterial.uniforms.mousePos.value.set(mousePos[0], mousePos[1]);

		// Calculate shared rotation for all cubes
		const sharedNoiseX = noise(time * timeScale, 0, 0) * noiseScale;
		const sharedNoiseY = noise(0, time * timeScale, 0) * noiseScale;
		const sharedNoiseZ = noise(0, 0, time * timeScale) * noiseScale;

		const sharedRotationX = sharedNoiseX * Math.PI;
		const sharedRotationY = sharedNoiseY * Math.PI;
		const sharedRotationZ = sharedNoiseZ * Math.PI;

		// Update cubes
		cubes.forEach((cube, index) => {
			const offset = cube.userData.offset;
			const baseAngle = cube.userData.originalAngle;
			const radius = cube.userData.radius;

			// Calculate orbital position (base position)
			const currentAngle = baseAngle + time * orbitSpeed;
			const baseX = Math.cos(currentAngle) * radius;
			const baseY = Math.sin(currentAngle) * radius;

			// Calculate independent motions
			const independentX = noise(time * timeScale + offset, 0, offset) * independentMotionScale;
			const independentY = noise(0, time * timeScale + offset, offset) * independentMotionScale;
			const independentZ = noise(offset, time * timeScale, cube.userData.verticalOffset) * 111.5;

			// Blend between orbital position and independent motion
			cube.position.x = baseX + independentX;
			cube.position.y = baseY + independentY;
			cube.position.z = independentZ;

			// Apply shared rotation to all cubes
			cube.rotation.x = sharedRotationX + noise(time * timeScale, offset, 0) * Math.PI;
			cube.rotation.y = sharedRotationY + noise(offset, time * timeScale, 0) * Math.PI;
			cube.rotation.z = sharedRotationZ + noise(0, offset, time * timeScale) * Math.PI;
		});

		// ======= TRAIL EFFECT RENDERING (FOLLOWING DEMO2 APPROACH) =======

		// 1. Set the input texture to the fullscreen quad material
		fullscreenQuadMaterial.uniforms.sampler.value = renderTarget1.texture;

		// 2. Disable auto-clear to accumulate renders
		renderer.autoClearColor = false;

		// 3. Render to renderTarget0
		renderer.setRenderTarget(renderTarget0);
		renderer.clear(); // Clear once at the beginning

		// 4. Render the persistence effect (this will create the trails using the previous frame)
		renderer.render(persistenceScene, orthoCamera);

		// 5. Render the scene with cubes on top of the trails
		renderer.render(scene, camera);

		// 6. Render the result to the screen
		renderer.setRenderTarget(null);
		renderer.clear();

		// 7. Use renderTarget0 (which now has both the trails and the current frame)
		fullscreenQuadMaterial.uniforms.sampler.value = renderTarget0.texture;

		// 8. Set 1.0 to display the texture as-is without fading
		const originalRgb = fullscreenQuadMaterial.uniforms.rgbPersistFactor.value;
		const originalAlpha = fullscreenQuadMaterial.uniforms.alphaPersistFactor.value;
		fullscreenQuadMaterial.uniforms.rgbPersistFactor.value = 1.0;
		fullscreenQuadMaterial.uniforms.alphaPersistFactor.value = 1.0;

		// 9. Render to screen
		renderer.render(persistenceScene, orthoCamera);

		// 10. Restore original values
		fullscreenQuadMaterial.uniforms.rgbPersistFactor.value = originalRgb;
		fullscreenQuadMaterial.uniforms.alphaPersistFactor.value = originalAlpha;

		// 11. Swap render targets for the next frame
		const temp = renderTarget0;
		renderTarget0 = renderTarget1;
		renderTarget1 = temp;
	}

	// Handle window resize
	window.addEventListener("resize", () => {
		const width = window.innerWidth;
		const height = window.innerHeight;
		const pixelRatio = window.devicePixelRatio;

		camera.aspect = width / height;
		camera.updateProjectionMatrix();

		renderer.setSize(width, height);
		renderer.setPixelRatio(pixelRatio);

		// Update orthographic camera
		orthoCamera.left = -width / 2;
		orthoCamera.right = width / 2;
		orthoCamera.top = height / 2;
		orthoCamera.bottom = -height / 2;
		orthoCamera.updateProjectionMatrix();

		// Update fullscreen quad
		fullscreenQuad.geometry.dispose();
		fullscreenQuad.geometry = new THREE.PlaneGeometry(width, height);

		// Update aspect ratio
		fullscreenQuadMaterial.uniforms.aspect.value = width / height;

		// Update render targets
		renderTarget0.dispose();
		renderTarget1.dispose();
		renderTarget0 = new THREE.WebGLRenderTarget(width * pixelRatio, height * pixelRatio);
		renderTarget1 = renderTarget0.clone();
	});

	// Start animation
	animate();

	// Ensure proper transparency sorting
	renderer.sortObjects = true;
	renderer.setClearColor(0x000000, 0);
}
