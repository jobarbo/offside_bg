import * as THREE from "../node_modules/three/build/three.module.js";
import animatedTextureShader from "./shaders/animatedTexture.glsl?raw";
import blurVertexShader from "./shaders/blurVertex.glsl?raw";
import baseVertexShader from "./shaders/baseVertex.glsl?raw";
import persistenceFragmentShader from "./shaders/persistenceFragment.glsl?raw";
import textureUrl from "../texture6.png";

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
		noiseScale: {value: 0.001}, // Controls noise amplitude
		rgbPersistFactor: {value: 1.0}, // Controls color persistence (higher = longer trails)
		alphaPersistFactor: {value: 1.0}, // Controls opacity persistence
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
