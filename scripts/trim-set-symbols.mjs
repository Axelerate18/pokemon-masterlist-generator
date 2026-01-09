// scripts/trim-set-symbols.mjs
import fs from "fs";
import path from "path";
import sharp from "sharp";

const rawDir = path.join(process.cwd(), "public", "set-symbols", "raw");
const outDir = path.join(process.cwd(), "public", "set-symbols", "trimmed");

// Make sure output dir exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function trimAllPngs() {
  const files = fs.readdirSync(rawDir).filter((f) => f.toLowerCase().endsWith(".png"));

  if (files.length === 0) {
    console.log("No PNG files found in", rawDir);
    return;
  }

  console.log("Trimming set symbol PNGs:");
  for (const file of files) {
    const inPath = path.join(rawDir, file);
    const outPath = path.join(outDir, file);

    try {
      const TARGET_W = 32;
      const TARGET_H = 16;

      await sharp(inPath)
        .trim()
        // Force every output to the exact same pixel size (no aspect-ratio preserving)
        .resize(TARGET_W, TARGET_H, {
          fit: "fill",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toFile(outPath);

      console.log(`  ✅ Trimmed: ${file}`);
    } catch (err) {
      console.error(`  ❌ Failed for ${file}:`, err.message);
    }
  }

  console.log("Done. Trimmed icons saved to", outDir);
}

trimAllPngs().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
