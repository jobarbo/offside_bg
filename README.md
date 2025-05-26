# Three.js Cube Animation (Vanilla JS Version)

This is a vanilla JavaScript version of the cube animation, without any bundling or build tools.

## Project Structure

- `index.html` - Main HTML file with Three.js loaded from CDN
- `js/main.js` - Main JavaScript file that loads shaders and creates the animation
- `shaders/` - Directory containing all GLSL shader files
- `texture2.png` - Texture used by the cubes

## How to Use

1. Simply serve the directory using any HTTP server
2. Open the index.html file in a browser

Example with Python:

```
python -m http.server
```

Then navigate to http://localhost:8000

## Integration

To integrate this into another project:

1. Copy the `js`, `shaders`, and texture files to your project
2. Include the HTML imports for Three.js:

```html
<script async src="https://unpkg.com/es-module-shims@1.7.3/dist/es-module-shims.js"></script>
<script type="importmap">
	{
		"imports": {
			"three": "https://unpkg.com/three@0.176.0/build/three.module.js",
			"three/addons/": "https://unpkg.com/three@0.176.0/examples/jsm/"
		}
	}
</script>
```

3. Add your own script tag pointing to the main.js file
4. The animation will run automatically
