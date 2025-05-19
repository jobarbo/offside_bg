import * as THREE from "three";
import vertexShader from "./shaders/vertex.glsl?raw";
import fragmentShader from "./shaders/fragment.glsl?raw";
import motionBlurShader from "./shaders/motionBlur.glsl?raw";
import feedbackShader from "./shaders/feedback.glsl?raw";

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
	antialias: true,
	alpha: true,
	precision: "highp",
});

// Critical: Don't clear the renderer automatically
renderer.autoClear = false;

// Handle pixel density
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Setup render targets for motion blur
const renderTargetParams = {
	minFilter: THREE.LinearFilter,
	magFilter: THREE.LinearFilter,
	format: THREE.RGBAFormat,
	stencilBuffer: false,
	type: THREE.FloatType,
};

let currentRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio, renderTargetParams);

let previousRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio, renderTargetParams);

// Setup motion blur pass
const motionBlurUniforms = {
	tOld: {value: previousRenderTarget.texture},
	tNew: {value: currentRenderTarget.texture},
	uDecay: {value: 0.991}, // Extremely high decay for long-lasting trails
};

const motionBlurMaterial = new THREE.ShaderMaterial({
	uniforms: motionBlurUniforms,
	vertexShader: `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`,
	fragmentShader: motionBlurShader,
});

const postProcessingScene = new THREE.Scene();
const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), motionBlurMaterial);
postProcessingScene.add(quad);

// Load texture
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load("texture.png");
texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

// Create custom shader material for cubes
const cubeMaterial = new THREE.ShaderMaterial({
	vertexShader,
	fragmentShader,
	transparent: false,
	uniforms: {
		uTexture: {value: texture},
		uTime: {value: 0},
	},
	side: THREE.FrontSide,
	depthWrite: true,
	depthTest: true,
	blending: THREE.NoBlending,
});

// Create cubes
const cubes = [];
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

// Noise settings
const noiseScale = 1.5;
const timeScale = 0.02;
const pathEvolutionScale = 0.01; // Speed at which paths evolve
let time = 0;

// Create multiple cube instances
for (let i = 0; i < 22; i++) {
	const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

	// Random initial positions
	cube.position.x = (Math.random() - 0.5) * 10;
	cube.position.y = (Math.random() - 0.5) * 10;
	cube.position.z = (Math.random() - 0.5) * 10;

	// Store original positions for noise movement
	cube.userData.originalPosition = cube.position.clone();
	cube.userData.offset = Math.random() * 1000; // Random offset for varied movement

	scene.add(cube);
	cubes.push(cube);
}

// Position camera
camera.position.z = 15;

// Noise function (Improved Perlin noise)
function noise(x, y, z) {
	const nx = Math.cos(x);
	const ny = Math.cos(y);
	const nz = Math.cos(z);
	return Math.cos(nx + ny + nz) * 0.5;
}

// Create background plane
const planeGeometry = new THREE.PlaneGeometry(40, 40);
const backgroundTarget = new THREE.WebGLRenderTarget(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio, {
	minFilter: THREE.LinearFilter,
	magFilter: THREE.LinearFilter,
	format: THREE.RGBAFormat,
	type: THREE.FloatType,
});

// Background accumulation shader
const backgroundMaterial = new THREE.ShaderMaterial({
	uniforms: {
		tDiffuse: {value: null},
		tPrevious: {value: null},
		uDecay: {value: 0.99},
	},
	vertexShader: `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`,
	fragmentShader: `
		uniform sampler2D tDiffuse;
		uniform sampler2D tPrevious;
		uniform float uDecay;
		varying vec2 vUv;

		void main() {
			vec4 current = texture2D(tDiffuse, vUv);
			vec4 previous = texture2D(tPrevious, vUv);

			// Accumulate and decay
			vec4 color = max(current, previous * uDecay);

			// Add some color persistence
			if (length(previous.rgb) > 0.1) {
				color.rgb = mix(color.rgb, previous.rgb, 0.95);
			}

			gl_FragColor = color;
		}
	`,
});

const backgroundPlane = new THREE.Mesh(planeGeometry, backgroundMaterial);
backgroundPlane.position.z = -20;
scene.add(backgroundPlane);

// Setup render targets for feedback loop
const renderTargetParamsFeedback = {
	minFilter: THREE.LinearFilter,
	magFilter: THREE.LinearFilter,
	format: THREE.RGBAFormat,
	type: THREE.FloatType,
};

const bufferA = new THREE.WebGLRenderTarget(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio, renderTargetParamsFeedback);

const bufferB = new THREE.WebGLRenderTarget(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio, renderTargetParamsFeedback);

// Setup feedback pass
const feedbackMaterial = new THREE.ShaderMaterial({
	uniforms: {
		tCurrent: {value: null},
		tPrevious: {value: null},
		uFeedbackAmount: {value: 0.85},
	},
	vertexShader: `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`,
	fragmentShader: feedbackShader,
	transparent: false,
	depthTest: false,
	depthWrite: false,
});

// Create post-processing scene
const feedbackQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), feedbackMaterial);
const feedbackScene = new THREE.Scene();
feedbackScene.add(feedbackQuad);

// Animation loop
function animate() {
	requestAnimationFrame(animate);
	time += 1;

	// Update shader uniforms
	cubeMaterial.uniforms.uTime.value = time * timeScale;

	// Update cubes
	cubes.forEach((cube, index) => {
		const offset = cube.userData.offset;
		const originalPos = cube.userData.originalPosition;

		// Add slow evolution to the base position
		const evolutionX = noise(time * pathEvolutionScale, offset, 0) * 5;
		const evolutionY = noise(offset, time * pathEvolutionScale, 0) * 5;
		const evolutionZ = noise(0, offset, time * pathEvolutionScale) * 5;

		// Generate primary movement noise
		const noiseX = noise(time * timeScale + offset, evolutionY, evolutionZ) * noiseScale;
		const noiseY = noise(evolutionX, time * timeScale + offset, evolutionZ) * noiseScale;
		const noiseZ = noise(evolutionX, evolutionY, time * timeScale + offset) * noiseScale;

		// Apply both evolution and noise to position
		cube.position.x = originalPos.x + noiseX * 1 + evolutionX;
		cube.position.y = originalPos.y + noiseY * 1 + evolutionY;
		cube.position.z = originalPos.z + noiseZ * 15 + evolutionZ;

		// Add evolution to rotation as well
		cube.rotation.x = noiseX * Math.PI + time * pathEvolutionScale * 0.1;
		cube.rotation.y = noiseY * Math.PI + time * pathEvolutionScale * 0.1;
		cube.rotation.z = noiseZ * Math.PI + time * pathEvolutionScale * 0.1;
	});

	// Render current frame to buffer A
	renderer.setRenderTarget(bufferA);
	renderer.render(scene, camera);

	// Apply feedback effect
	feedbackMaterial.uniforms.tCurrent.value = bufferA.texture;
	feedbackMaterial.uniforms.tPrevious.value = bufferB.texture;

	// Render feedback to buffer B
	renderer.setRenderTarget(bufferB);
	renderer.render(feedbackScene, orthoCamera);

	// Render final result to screen
	renderer.setRenderTarget(null);
	renderer.render(feedbackScene, orthoCamera);

	// Swap buffers
	const temp = bufferA;
	bufferA = bufferB;
	bufferB = temp;
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

	// Update all render targets
	currentRenderTarget.setSize(width * pixelRatio, height * pixelRatio);
	previousRenderTarget.setSize(width * pixelRatio, height * pixelRatio);
	backgroundTarget.setSize(width * pixelRatio, height * pixelRatio);

	// Update render targets
	bufferA.setSize(width * pixelRatio, height * pixelRatio);
	bufferB.setSize(width * pixelRatio, height * pixelRatio);
});

// Start animation
animate();

// Add a clear function for user interaction
function clearCanvas() {
	renderer.clear();
}
