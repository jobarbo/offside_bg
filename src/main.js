import * as THREE from "../node_modules/three/build/three.module.js";
import {EffectComposer} from "../node_modules/three/examples/jsm/postprocessing/EffectComposer.js";
import {RenderPass} from "../node_modules/three/examples/jsm/postprocessing/RenderPass.js";
import {ShaderPass} from "../node_modules/three/examples/jsm/postprocessing/ShaderPass.js";
import {AfterimagePass} from "../node_modules/three/examples/jsm/postprocessing/AfterimagePass.js";
import {UnrealBloomPass} from "../node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js";
import vertexShader from "./shaders/vertex.glsl?raw";
import fragmentShader from "./shaders/fragment.glsl?raw";
import blurVertexShader from "./shaders/blurVertex.glsl?raw";
import horizontalBlurShader from "./shaders/horizontalBlur.glsl?raw";
import verticalBlurShader from "./shaders/verticalBlur.glsl?raw";
import monochromeShader from "./shaders/monochrome.glsl?raw";
import animatedTextureShader from "./shaders/animatedTexture.glsl?raw";
import textureUrl from "../texture2.png";

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
	antialias: true,
	alpha: true,
	precision: "highp",
});

renderer.setClearColor(0x000000, 0); // Set clear color with 0 alpha for full transparency

// Critical: Don't clear the renderer automatically
renderer.autoClear = false;

// Handle pixel density
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Setup EffectComposer
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Add horizontal blur pass
const horizontalBlurPass = new ShaderPass({
	uniforms: {
		tDiffuse: {value: null},
		h: {value: 1.0 / window.innerWidth},
	},
	vertexShader: blurVertexShader,
	fragmentShader: horizontalBlurShader,
});
composer.addPass(horizontalBlurPass);

// Add vertical blur pass
const verticalBlurPass = new ShaderPass({
	uniforms: {
		tDiffuse: {value: null},
		v: {value: 1.0 / window.innerHeight},
	},
	vertexShader: blurVertexShader,
	fragmentShader: verticalBlurShader,
});
composer.addPass(verticalBlurPass);

// Add AfterImagePass with strong effect
const afterImagePass = new AfterimagePass(0.998); // Higher value = longer trails
composer.addPass(afterImagePass);

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
const cubeGeometry = new THREE.BoxGeometry(0.51, 1, 1);

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

	// Update shader time uniform
	cubeMaterial.uniforms.time.value = time * 0.01;

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

	// Render with composer
	composer.render();
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

	// Update composer size
	composer.setSize(width, height);

	// Update blur uniforms
	horizontalBlurPass.uniforms.h.value = 1.0 / width;
	verticalBlurPass.uniforms.v.value = 1.0 / height;
});

// Start animation
animate();

// Add a clear function for user interaction
function clearCanvas() {
	renderer.clear();
	composer.reset();
}

// Ensure proper transparency sorting
renderer.sortObjects = true;
renderer.setClearColor(0x000000, 0);
