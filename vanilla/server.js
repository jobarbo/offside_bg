import http from "http";
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

const MIME_TYPES = {
	".html": "text/html",
	".js": "text/javascript",
	".css": "text/css",
	".json": "application/json",
	".png": "image/png",
	".jpg": "image/jpg",
	".gif": "image/gif",
	".glsl": "text/plain",
};

const server = http.createServer((req, res) => {
	console.log(`Request: ${req.url}`);

	// Handle root path
	let filePath = req.url === "/" ? path.join(__dirname, "index.html") : path.join(__dirname, req.url);

	const extname = path.extname(filePath);

	// Set content type
	const contentType = MIME_TYPES[extname] || "application/octet-stream";

	// Read file
	fs.readFile(filePath, (error, content) => {
		if (error) {
			if (error.code === "ENOENT") {
				console.error(`File not found: ${filePath}`);
				res.writeHead(404);
				res.end("File not found");
			} else {
				console.error(`Server error: ${error.code}`);
				res.writeHead(500);
				res.end(`Server Error: ${error.code}`);
			}
		} else {
			res.writeHead(200, {"Content-Type": contentType});
			res.end(content, "utf-8");
		}
	});
});

server.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}/`);
	console.log(`Press Ctrl+C to stop the server`);
});
