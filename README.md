# Three.js Cube Animation Background

A modular Three.js animation that creates an interactive 3D cube background with trail effects. Perfect for adding dynamic backgrounds to websites.

## Features

- Responsive 3D cube animation with trail effects
- Device orientation support for mobile devices
- Mouse interaction
- Configurable options (number of cubes, paths to assets, etc.)
- Modular design for easy integration
- Zero dependencies except Three.js

## Important Requirements

1. **HTTPS Required**: Device orientation features require a secure context (HTTPS). This is a browser security requirement.
2. **CORS Headers**: Your server must be configured to serve the following file types with proper CORS headers:
   - `.glsl` files: `Content-Type: text/plain`
   - `.js` files: `Content-Type: application/javascript`
   - Image files: Appropriate image MIME types

## Project Structure

```
animation/
├── js/
│   ├── main.js              # Main animation class
│   └── controls/
│       └── DeviceOrientationControls.js  # Local device controls implementation
├── shaders/
│   ├── animatedTexture.glsl
│   ├── baseVertex.glsl
│   ├── blurVertex.glsl
│   └── persistenceFragment.glsl
└── textures/
    └── texture6.png         # Texture for cubes
```

## Integration Guide

1. Copy the project files to your website:

   ```bash
   cp -r animation/js animation/shaders animation/textures /path/to/your/project/
   ```

2. Add Three.js dependencies to your HTML:

   ```html
   <script async src="https://unpkg.com/es-module-shims@1.7.3/dist/es-module-shims.js"></script>
   <script type="importmap">
   	{
   		"imports": {
   			"three": "https://unpkg.com/three@0.176.0/build/three.module.js"
   		}
   	}
   </script>
   ```

3. Import and initialize the animation in your JavaScript:

   ```javascript
   import CubeAnimation from "./js/main.js";

   // Get your container element
   const container = document.querySelector("#background-container");

   // Initialize with options
   const animation = new CubeAnimation(container, {
   	shadersPath: "/path/to/shaders",
   	texturePath: "/path/to/textures/texture6.png",
   	numCubes: 25, // Optional: default is 25
   	enableDeviceOrientation: true, // Optional: default is true
   	width: container.clientWidth, // Optional: default is container width
   	height: container.clientHeight, // Optional: default is container height
   });

   // Clean up when needed
   function cleanup() {
   	animation.destroy();
   }
   ```

4. Style your container:
   ```css
   #background-container {
   	position: fixed; /* or absolute based on your needs */
   	top: 0;
   	left: 0;
   	width: 100%;
   	height: 100%;
   	z-index: -1; /* Place it behind your content */
   	overflow: hidden;
   }
   ```

## Server Configuration

### Apache

Add these lines to your .htaccess file:

```apache
<FilesMatch "\.(glsl)$">
    Header set Content-Type "text/plain"
    Header set Access-Control-Allow-Origin "*"
</FilesMatch>
```

### Nginx

Add these lines to your server block:

```nginx
location ~* \.glsl$ {
    add_header Content-Type text/plain;
    add_header Access-Control-Allow-Origin *;
}
```

### Node.js/Express

```javascript
app.use((req, res, next) => {
	if (req.path.endsWith(".glsl")) {
		res.type("text/plain");
		res.header("Access-Control-Allow-Origin", "*");
	}
	next();
});
```

## Configuration Options

| Option                  | Type    | Default                | Description                         |
| ----------------------- | ------- | ---------------------- | ----------------------------------- |
| shadersPath             | string  | '../shaders'           | Path to shader files directory      |
| texturePath             | string  | '../../texture6.png'   | Path to cube texture file           |
| numCubes                | number  | 25                     | Number of cubes in the animation    |
| enableDeviceOrientation | boolean | true                   | Enable device orientation on mobile |
| width                   | number  | container.clientWidth  | Width of the animation              |
| height                  | number  | container.clientHeight | Height of the animation             |

## Browser Support

- Modern browsers that support WebGL
- Mobile browsers with device orientation API support
- Must be served over HTTPS for device orientation features

## Performance Tips

1. Adjust `numCubes` based on device performance
2. Consider disabling the animation on low-end devices
3. Use appropriate container size to avoid unnecessary rendering

## Troubleshooting

1. If shaders don't load:

   - Check the `shadersPath` configuration
   - Verify your server is serving .glsl files with correct CORS headers
   - Check browser console for CORS errors

2. If device orientation doesn't work:

   - Ensure you're using HTTPS
   - Check if the device has orientation sensors
   - On iOS, user interaction is required to enable device orientation

3. If texture is missing:

   - Verify the `texturePath` configuration
   - Check if the image file is being served correctly

4. For performance issues:
   - Try reducing the number of cubes
   - Check if the container size is appropriate
   - Monitor GPU usage in browser dev tools

## License

MIT License - Feel free to use in your projects
