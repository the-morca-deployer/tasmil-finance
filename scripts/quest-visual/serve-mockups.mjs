// scripts/quest-visual/serve-mockups.mjs
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const ROOT = "/Users/nathan/Documents/morcalab/tasmil/tmp/quest-tasmil";
const PORT = 4599;
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".svg": "image/svg+xml", ".png": "image/png", ".webm": "video/webm", ".webp": "image/webp" };

createServer(async (req, res) => {
  try {
    const path = decodeURIComponent((req.url ?? "/").split("?")[0]);
    const file = join(ROOT, path === "/" ? "/Tasmil Explore.html" : path);
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
}).listen(PORT, () => console.warn(`mockups on http://localhost:${PORT}`));
