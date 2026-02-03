import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env.local
const envConfig = dotenv.parse(fs.readFileSync(".env.local"));
const SUPABASE_URL = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("❌ Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const inputDir = path.resolve("pdf-work/out/teacher");
const targetFolder = "teacher";
const bucketName = "timetable";

async function uploadFiles() {
    if (!fs.existsSync(inputDir)) {
        console.error(`❌ Input directory not found: ${inputDir}`);
        return;
    }

    const files = fs.readdirSync(inputDir).filter((f) => f.endsWith(".pdf"));
    console.log(`📂 Found ${files.length} PDFs in ${inputDir}`);

    for (const file of files) {
        const filePath = path.join(inputDir, file);
        const fileBuffer = fs.readFileSync(filePath);
        const storagePath = `${targetFolder}/${file}`;

        console.log(`⬆️ Uploading ${file} to ${storagePath}...`);

        const { error } = await supabase.storage
            .from(bucketName)
            .upload(storagePath, fileBuffer, {
                contentType: "application/pdf",
                upsert: true,
            });

        if (error) {
            console.error(`   ❌ Failed: ${error.message}`);
        } else {
            console.log(`   ✅ Success`);
        }
    }

    console.log("✨ All uploads complete.");
}

uploadFiles();
