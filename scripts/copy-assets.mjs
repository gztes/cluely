import { cp } from "node:fs/promises";

await cp("src/renderer/index.html", "dist/renderer/index.html");
