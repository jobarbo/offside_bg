import glsl from "vite-plugin-glsl";
import {defineConfig} from "vite";
import path from "path";

export default defineConfig({
	assetsInclude: ["**/*.glsl", "**/*.png", "**/*.jpg", "**/*.jpeg"],
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					three: ["three"],
				},
			},
		},
	},
	plugins: [glsl()],
	resolve: {
		dedupe: ["three"],
		alias: {
			three: path.resolve("./node_modules/three"),
		},
	},
});
