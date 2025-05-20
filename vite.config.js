import glsl from "vite-plugin-glsl";
import {defineConfig} from "vite";

export default defineConfig({
	assetsInclude: ["**/*.glsl", "**/*.png", "**/*.jpg", "**/*.jpeg"],
	plugins: [glsl()],
	build: {
		sourcemap: true,
	},
});
