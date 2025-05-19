import * as THREE from "three";

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
	antialias: true,
	alpha: true,
	precision: "highp", // High precision for better quality
});

// Handle pixel density
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create cubes
const cubes = [];
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const cubeMaterial = new THREE.MeshNormalMaterial({
	transparent: true,
	opacity: 0.8,
});

// Noise settings
const noiseScale = 1.5;
const timeScale = 0.02;
let time = 0;

// Create multiple cube instances
for (let i = 0; i < 12; i++) {
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

	// Update each cube
	cubes.forEach((cube, index) => {
		const offset = cube.userData.offset;
		const originalPos = cube.userData.originalPosition;

		// Generate noise values for each axis
		const noiseX = noise(time * timeScale + offset, 0, 0) * noiseScale;
		const noiseY = noise(0, time * timeScale + offset, 0) * noiseScale;
		const noiseZ = noise(0, 0, time * timeScale + offset) * noiseScale;

		// Apply noise to position
		cube.position.x = originalPos.x + noiseX * 5;
		cube.position.y = originalPos.y + noiseY * 1;
		cube.position.z = originalPos.z + noiseZ * 15;

		// Add slight rotation based on position
		cube.rotation.x = noiseX * Math.PI;
		cube.rotation.y = noiseY * Math.PI;
		cube.rotation.z = noiseZ * Math.PI;
	});

	renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener("resize", () => {
	const width = window.innerWidth;
	const height = window.innerHeight;

	camera.aspect = width / height;
	camera.updateProjectionMatrix();

	renderer.setSize(width, height);
	renderer.setPixelRatio(window.devicePixelRatio);
});

// Start animation
animate();
