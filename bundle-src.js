// node bundle-src.js [outFile] [srcDir]
import { createWriteStream, promises as fs } from "fs";
import path from "path";

const root = process.cwd();
const srcDir = path.resolve(root, process.argv[3] || "src");
const outFile = path.resolve(root, process.argv[2] || "src_bundle.txt");

// file types to include
const exts = new Set([
  ".ts",".tsx",".js",".jsx",".css",".scss",".json",".md",".html",".txt"
]);

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  // stable order
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function main() {
  // ensure src exists
  await fs.access(srcDir).catch(() => {
    console.error(`Source not found: ${srcDir}`);
    process.exit(1);
  });

  // ensure parent of out exists
  await fs.mkdir(path.dirname(outFile), { recursive: true });

  const out = createWriteStream(outFile, { encoding: "utf8" });
  out.write(`// SRC BUNDLE ${new Date().toISOString()}\n`);

  for await (const file of walk(srcDir)) {
    if (!exts.has(path.extname(file).toLowerCase())) continue;
    const rel = path.relative(root, file).replaceAll("\\", "/");
    out.write(`\n/* FILE: ${rel} */\n`);
    out.write(await fs.readFile(file, "utf8"));
  }

  await new Promise((res, rej) => out.end(res)).catch(rej => {
    console.error("Write error:", rej);
    process.exit(1);
  });
  console.log(`Wrote ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
