import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function checkPdf() {
    const pdfPath = path.resolve('pdf-work/teacher-master.pdf');
    const data = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(data);
    const pageCount = pdfDoc.getPageCount();
    console.log(`PDF Page Count: ${pageCount}`);
}

checkPdf().catch(console.error);
