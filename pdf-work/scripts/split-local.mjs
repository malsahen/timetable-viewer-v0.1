// pdf-work/scripts/split-local.mjs
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";

/**
 * Usage:
 *   node pdf-work/scripts/split-local.mjs class
 *   node pdf-work/scripts/split-local.mjs teacher
 *
 * Looks for:
 *   class   -> pdf-work/class-master.pdf  -> pdf-work/out/class
 *   teacher -> pdf-work/teacher-master.pdf -> pdf-work/out/teacher
 */

const mode = (process.argv[2] || "").toLowerCase();
if (!["class", "teacher"].includes(mode)) {
  console.error("❌ Usage: node pdf-work/scripts/split-local.mjs <class|teacher>");
  process.exit(1);
}

const root = process.cwd();
let inputFile;

if (mode === "class") {
  inputFile = fs.existsSync(path.resolve(root, "pdf-work/class-master.pdf"))
    ? path.resolve(root, "pdf-work/class-master.pdf")
    : path.resolve(root, "pdf-work/class-master1.pdf");
} else {
  // User explicitly asked for teacher-master.pdf, so we prioritize that or just check it.
  // We'll prioritize teacher-master.pdf if it exists.
  inputFile = fs.existsSync(path.resolve(root, "pdf-work/teacher-master.pdf"))
    ? path.resolve(root, "pdf-work/teacher-master.pdf")
    : path.resolve(root, "pdf-work/teacher-master1.pdf");
}

const outDir = path.resolve(root, `pdf-work/out/${mode}`);

if (!fs.existsSync(inputFile)) {
  console.error(`❌ Input not found: ${inputFile}`);
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

const pdfBytes = fs.readFileSync(inputFile);
const srcPdf = await PDFDocument.load(pdfBytes);
const total = srcPdf.getPageCount();
console.log(`📄 Loaded ${total} pages from ${inputFile}`);

for (let i = 0; i < total; i++) {
  const dstPdf = await PDFDocument.create();
  const [page] = await dstPdf.copyPages(srcPdf, [i]);
  dstPdf.addPage(page);
  const name = `p-${String(i + 1).padStart(3, "0")}.pdf`;
  fs.writeFileSync(path.join(outDir, name), await dstPdf.save());
  console.log(`✅ Wrote ${name}`);
}
console.log(`✨ Split complete → ${outDir}`);
