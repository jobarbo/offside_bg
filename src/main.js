import * as THREE from "three";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer";
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass";
import {ShaderPass} from "three/examples/jsm/postprocessing/ShaderPass";
import {AfterimagePass} from "three/examples/jsm/postprocessing/AfterimagePass";
import vertexShader from "./shaders/vertex.glsl?raw";
import fragmentShader from "./shaders/fragment.glsl?raw";

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

// Setup EffectComposer
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Add AfterImagePass with strong effect
const afterImagePass = new AfterimagePass(0.989); // Higher value = longer trails
composer.addPass(afterImagePass);

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
const noiseScale = 1.0;
const timeScale = 0.002;
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
});

// Start animation
animate();

// Add a clear function for user interaction
function clearCanvas() {
	renderer.clear();
	composer.reset();
}
