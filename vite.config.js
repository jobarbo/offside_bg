import glsl from "vite-plugin-glsl";

export default {
	assetsInclude: ["**/*.glsl"],
	build: {
		rollupOptions: {
			external: ["**/*.glsl"],
		},
	},
	plugins: [glsl()],
};
