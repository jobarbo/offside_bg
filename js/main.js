// Remove the import and use global THREE object
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js";

class CubeAnimation {
	constructor(container, options = {}) {
		this.container = container;
		this.options = {
			shadersPath: options.shadersPath || "../shaders",
			texturePath: options.texturePath || "../../texture6.png",
			width: options.width || container.clientWidth,
			height: options.height || container.clientHeight,
			numCubes: options.numCubes || 25,
			...options,
		};

		this.init();
	}

	async init() {
		// Load shaders
		const shaders = await Promise.all([
			fetch(`${this.options.shadersPath}/animatedTexture.glsl`).then((res) => res.text()),
			fetch(`${this.options.shadersPath}/blurVertex.glsl`).then((res) => res.text()),
			fetch(`${this.options.shadersPath}/baseVertex.glsl`).then((res) => res.text()),
			fetch(`${this.options.shadersPath}/persistenceFragment.glsl`).then((res) => res.text()),
		]);

		[this.animatedTextureShader, this.blurVertexShader, this.baseVertexShader, this.persistenceFragmentShader] = shaders;

		this.setupScene();
		this.setupEffects();
		this.createCubes();
		this.setupEventListeners();
		this.animate();
	}

	setupScene() {
		// Scene setup
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(75, this.options.width / this.options.height, 0.1, 1000);
		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
			precision: "highp",
		});

		this.renderer.setClearColor(0x000000, 0); // Set clear color with 0 alpha for transparency
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(this.options.width, this.options.height);
		this.container.appendChild(this.renderer.domElement);

		// Create render targets for ping-pong effect
		this.renderTarget0 = new THREE.WebGLRenderTarget(this.options.width * window.devicePixelRatio, this.options.height * window.devicePixelRatio);
		this.renderTarget1 = this.renderTarget0.clone();

		// Create a scene for the persistence effect
		this.persistenceScene = new THREE.Scene();
		this.orthoCamera = new THREE.OrthographicCamera(-this.options.width / 2, this.options.width / 2, this.options.height / 2, -this.options.height / 2, 0.1, 10);
		this.orthoCamera.position.set(0, 0, 1);
		this.orthoCamera.lookAt(new THREE.Vector3(0, 0, 0));

		// Create a full-screen quad for the persistence effect
		this.fullscreenQuadGeometry = new THREE.PlaneGeometry(this.options.width, this.options.height);
		this.fullscreenQuadMaterial = new THREE.ShaderMaterial({
			uniforms: {
				sampler: {value: null},
				time: {value: 0},
				aspect: {value: this.options.width / this.options.height},
				mousePos: {value: new THREE.Vector2(0, 0)},
				noiseFactor: {value: 3.2}, // Controls noise frequency
				noiseScale: {value: 0.004}, // Controls noise amplitude
				rgbPersistFactor: {value: 1.0}, // Controls color persistence (higher = longer trails)
				alphaPersistFactor: {value: 1.0}, // Controls opacity persistence
			},
			vertexShader: this.baseVertexShader,
			fragmentShader: this.persistenceFragmentShader,
			transparent: true,
		});
		this.fullscreenQuad = new THREE.Mesh(this.fullscreenQuadGeometry, this.fullscreenQuadMaterial);
		this.persistenceScene.add(this.fullscreenQuad);

		// Position camera
		this.camera.position.z = 12;
		this.camera.position.x = 0;
		this.camera.position.y = 0;

		// Ensure proper transparency sorting
		this.renderer.sortObjects = true;
		this.renderer.setClearColor(0x000000, 0);
	}

	setupEffects() {
		// Mouse position tracking
		this.mousePos = [0, 0];
		this.targetMousePos = [0, 0];

		// Load texture
		const textureLoader = new THREE.TextureLoader();
		this.texture = textureLoader.load(this.options.texturePath);
		this.texture.wrapS = this.texture.wrapT = THREE.RepeatWrapping;

		// Create custom shader material for cubes
		this.cubeMaterial = new THREE.ShaderMaterial({
			uniforms: {
				map: {value: this.texture},
				time: {value: 0.1},
				opacity: {value: 1.0},
			},
			vertexShader: this.blurVertexShader,
			fragmentShader: this.animatedTextureShader,
			transparent: true,
			depthWrite: false,
			depthTest: false,
		});
	}

	createCubes() {
		// Create cubes
		this.cubes = [];
		this.cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);

		// Noise settings
		this.noiseScale = 0.5;
		this.timeScale = 0.001;
		this.orbitRadius = 0.9;
		this.orbitSpeed = 0.0015;
		this.independentMotionScale = 2.0; // Scale of independent motion
		this.centeringForce = 0.7; // How strongly cubes are pulled to their orbital paths
		this.time = 0;

		// Create multiple cube instances
		for (let i = 0; i < this.options.numCubes; i++) {
			const cube = new THREE.Mesh(this.cubeGeometry, this.cubeMaterial);

			// Set initial positions in a circular pattern
			const angle = (i / this.options.numCubes) * Math.PI * 2;
			const radius = this.orbitRadius + (Math.random() - 0.5) * 0.01;
			cube.position.x = (Math.random() - 0.5) * 1;
			cube.position.y = (Math.random() - 0.5) * 1;
			cube.position.z = (Math.random() - 0.5) * 1;

			// Store original angle for orbital motion
			cube.userData.originalAngle = angle;
			cube.userData.radius = radius;
			cube.userData.offset = Math.random() * 1000;
			cube.userData.verticalOffset = Math.random() * Math.PI * 2; // Phase offset for vertical motion

			this.scene.add(cube);
			this.cubes.push(cube);
		}
	}

	setupEventListeners() {
		this.container.addEventListener("mousemove", (e) => {
			// Normalize to -1 to 1
			this.targetMousePos[0] = (e.clientX / this.options.width) * 2 - 1;
			this.targetMousePos[1] = -(e.clientY / this.options.height) * 2 + 1;
		});

		window.addEventListener("resize", () => {
			this.handleResize();
		});
	}

	// Noise function (Improved Perlin noise)
	noise(x, y, z) {
		const nx = Math.cos(x);
		const ny = Math.sin(y);
		const nz = Math.cos(z);
		return Math.cos(nx + ny + nz) * 0.1;
	}

	// Animation loop
	animate() {
		requestAnimationFrame(this.animate.bind(this));
		this.time += 3.5;

		if (this.controls) {
			this.controls.update();
		}

		// Update shader time uniforms
		this.cubeMaterial.uniforms.time.value = this.time * 0.01;
		this.fullscreenQuadMaterial.uniforms.time.value = this.time * 0.0001;

		// Example of how to change opacity (you can modify this value as needed)
		this.cubeMaterial.uniforms.opacity.value = 0.05; // Change this value to whatever opacity you want (0.0 to 1.0)

		// Update mouse position with smooth interpolation
		const mouseSpeed = 0.5;
		this.mousePos[0] += (this.targetMousePos[0] - this.mousePos[0]) * mouseSpeed;
		this.mousePos[1] += (this.targetMousePos[1] - this.mousePos[1]) * mouseSpeed;
		this.fullscreenQuadMaterial.uniforms.mousePos.value.set(this.mousePos[0], this.mousePos[1]);

		// Calculate shared rotation for all cubes
		const sharedNoiseX = this.noise(this.time * this.timeScale, 0, 0) * this.noiseScale;
		const sharedNoiseY = this.noise(0, this.time * this.timeScale, 0) * this.noiseScale;
		const sharedNoiseZ = this.noise(0, 0, this.time * this.timeScale) * this.noiseScale;

		const sharedRotationX = sharedNoiseX * Math.PI;
		const sharedRotationY = sharedNoiseY * Math.PI;
		const sharedRotationZ = sharedNoiseZ * Math.PI;

		// Update cubes
		this.cubes.forEach((cube, index) => {
			const offset = cube.userData.offset;
			const baseAngle = cube.userData.originalAngle;
			const radius = cube.userData.radius;

			// Calculate orbital position (base position)
			const currentAngle = baseAngle + this.time * this.orbitSpeed;
			const baseX = Math.cos(currentAngle) * radius;
			const baseY = Math.sin(currentAngle) * radius;

			// Calculate independent motions
			const independentX = this.noise(this.time * this.timeScale + offset, 0, offset) * this.independentMotionScale;
			const independentY = this.noise(0, this.time * this.timeScale + offset, offset) * this.independentMotionScale;
			const independentZ = this.noise(offset, this.time * this.timeScale, cube.userData.verticalOffset) * 111.5;

			// Blend between orbital position and independent motion
			cube.position.x = baseX + independentX;
			cube.position.y = baseY + independentY;
			cube.position.z = independentZ;

			// Apply shared rotation to all cubes
			cube.rotation.x = sharedRotationX + this.noise(this.time * this.timeScale, offset, 0) * Math.PI;
			cube.rotation.y = sharedRotationY + this.noise(offset, this.time * this.timeScale, 0) * Math.PI;
			cube.rotation.z = sharedRotationZ + this.noise(0, offset, this.time * this.timeScale) * Math.PI;
		});

		// ======= TRAIL EFFECT RENDERING (FOLLOWING DEMO2 APPROACH) =======

		// 1. Set the input texture to the fullscreen quad material
		this.fullscreenQuadMaterial.uniforms.sampler.value = this.renderTarget1.texture;

		// 2. Disable auto-clear to accumulate renders
		this.renderer.autoClearColor = false;

		// 3. Render to renderTarget0
		this.renderer.setRenderTarget(this.renderTarget0);
		this.renderer.clear(); // Clear once at the beginning

		// 4. Render the persistence effect (this will create the trails using the previous frame)
		this.renderer.render(this.persistenceScene, this.orthoCamera);

		// 5. Render the scene with cubes on top of the trails
		this.renderer.render(this.scene, this.camera);

		// 6. Render the result to the screen
		this.renderer.setRenderTarget(null);
		this.renderer.clear();

		// 7. Use renderTarget0 (which now has both the trails and the current frame)
		this.fullscreenQuadMaterial.uniforms.sampler.value = this.renderTarget0.texture;

		// 8. Set 1.0 to display the texture as-is without fading
		const originalRgb = this.fullscreenQuadMaterial.uniforms.rgbPersistFactor.value;
		const originalAlpha = this.fullscreenQuadMaterial.uniforms.alphaPersistFactor.value;
		this.fullscreenQuadMaterial.uniforms.rgbPersistFactor.value = 1.0;
		this.fullscreenQuadMaterial.uniforms.alphaPersistFactor.value = 1.0;

		// 9. Render to screen
		this.renderer.render(this.persistenceScene, this.orthoCamera);

		// 10. Restore original values
		this.fullscreenQuadMaterial.uniforms.rgbPersistFactor.value = originalRgb;
		this.fullscreenQuadMaterial.uniforms.alphaPersistFactor.value = originalAlpha;

		// 11. Swap render targets for the next frame
		const temp = this.renderTarget0;
		this.renderTarget0 = this.renderTarget1;
		this.renderTarget1 = temp;
	}

	// Handle window resize
	handleResize() {
		const width = this.container.clientWidth;
		const height = this.container.clientHeight;
		const pixelRatio = window.devicePixelRatio;

		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize(width, height);
		this.renderer.setPixelRatio(pixelRatio);

		// Update orthographic camera
		this.orthoCamera.left = -width / 2;
		this.orthoCamera.right = width / 2;
		this.orthoCamera.top = height / 2;
		this.orthoCamera.bottom = -height / 2;
		this.orthoCamera.updateProjectionMatrix();

		// Update fullscreen quad
		this.fullscreenQuad.geometry.dispose();
		this.fullscreenQuad.geometry = new THREE.PlaneGeometry(width, height);

		// Update aspect ratio
		this.fullscreenQuadMaterial.uniforms.aspect.value = width / height;

		// Update render targets
		this.renderTarget0.dispose();
		this.renderTarget1.dispose();
		this.renderTarget0 = new THREE.WebGLRenderTarget(width * pixelRatio, height * pixelRatio);
		this.renderTarget1 = this.renderTarget0.clone();
	}

	destroy() {
		// Cleanup
		window.removeEventListener("resize", this.handleResize);
		this.container.removeEventListener("mousemove", this.handleMouseMove);

		// Dispose of Three.js objects
		this.scene.traverse((object) => {
			if (object.geometry) object.geometry.dispose();
			if (object.material) {
				if (object.material.map) object.material.map.dispose();
				object.material.dispose();
			}
		});

		this.renderer.dispose();
		this.renderTarget0.dispose();
		this.renderTarget1.dispose();

		// Remove canvas
		this.container.removeChild(this.renderer.domElement);
	}
}

// Auto-initialize animations for elements with data-background-animation
function initBackgroundAnimations() {
	const elements = document.querySelectorAll("[data-background-animation]");

	elements.forEach((element) => {
		// Get options from data attributes
		const options = {
			shadersPath: element.dataset.shadersPath || "./shaders",
			texturePath: element.dataset.texturePath || "./textures/texture6.png",
			numCubes: parseInt(element.dataset.numCubes || "25", 10),
		};

		// Create animation instance
		const animation = new CubeAnimation(element, options);

		// Store animation instance on the element for future reference
		element._cubeAnimation = animation;

		// Clean up on page unload
		window.addEventListener("beforeunload", () => {
			animation.destroy();
		});
	});
}

// Auto-initialize when the DOM is ready
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initBackgroundAnimations);
} else {
	initBackgroundAnimations();
}
