// pdf-work/split-class.mjs
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";

const inputPath = path.resolve("./class-master.pdf");
const outputDir = path.resolve("./split");

await fs.promises.mkdir(outputDir, { recursive: true });

const bytes = await fs.promises.readFile(inputPath);
const pdfDoc = await PDFDocument.load(bytes);
const total = pdfDoc.getPageCount();

console.log(`[split] Loaded ${inputPath} with ${total} pages`);

for (let i = 0; i < total; i++) {
  const newPdf = await PDFDocument.create();
  const [page] = await newPdf.copyPages(pdfDoc, [i]);
  newPdf.addPage(page);

  const pageNo = String(i + 1).padStart(3, "0");
  const outPath = path.join(outputDir, `p-${pageNo}.pdf`);
  const outBytes = await newPdf.save();
  await fs.promises.writeFile(outPath, outBytes);
  console.log(`→ Created ${outPath}`);
}

console.log(`[split] Done. Saved all ${total} pages to ${outputDir}`);
