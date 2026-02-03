import fs from 'fs';
import path from 'path';

const teachers = [
    "Sarah Louise George",
    "Richard Phipps-Brown",
    "Sadhana Shreevaani",
    "Thamaraii Gopalakrishnan",
    "Stefanos Anastasiou",
    "Nur Shafa Ashykin",
    "Nina Cher",
    "Jiah Zhung Lee",
    "Cheryl Ng Pei Ling",
    "Intan Azuwani",
    "Kyle Marriot",
    "Medhat Elbannan",
    "Chrys Chin",
    "Vallaipan Noel Karunajanan",
    "Mohammed Bilal Fazal",
    "Sumna Rasheed",
    "Paul Devonshire",
    "Kai Cheong Foo",
    "Foo Yi Ting",
    "Vladimir Vasilyev",
    "Danelle George",
    "Rashid Mundeth",
    "Khier Sahen",
    "Dil Jahia",
    "Amanda Lomas",
    "Nicola Robinson",
    "Amalia Rahwani",
    "Eunice Pang",
    "Kristy Choy",
    "Syasya Nabilah",
    "Javier Maestre Toscano",
    "Afifah Sulaiman",
    "Dianne Manisha",
    "Lourdes Joshua",
    "Hafilda Ummi"
];

function slugify(name) {
    return name.toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

const inputDir = path.resolve('pdf-work/out/teacher');
const outputDir = path.resolve('pdf-work/out/teacher-named');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

console.log("Mapping teachers to files...");
const mapping = [];

teachers.forEach((name, index) => {
    const pageNum = index + 1;
    const pageStr = String(pageNum).padStart(3, '0');
    const srcFile = path.join(inputDir, `p-${pageStr}.pdf`);
    const slug = slugify(name);
    const dstFile = path.join(outputDir, `${slug}.pdf`);

    if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, dstFile);
        console.log(`✅ [${pageStr}] ${name} -> ${slug}.pdf`);
        mapping.push({ name, slug, file: `${slug}.pdf`, original: `p-${pageStr}.pdf` });
    } else {
        console.error(`❌ [${pageStr}] File not found: ${srcFile}`);
    }
});

fs.writeFileSync(
    path.resolve('pdf-work/teacher-map.json'),
    JSON.stringify(mapping, null, 2)
);

console.log(`\n✨ Done! Renamed files in ${outputDir}`);
console.log(`✨ Mapping saved to pdf-work/teacher-map.json`);
