import glsl from "vite-plugin-glsl";

export default {
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
	},
};
