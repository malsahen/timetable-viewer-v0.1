import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Hardcoding credentials to ensure it just works immediately
const SUPABASE_URL = "https://oerubqpurgcuezqbinax.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcnVicXB1cmdjdWV6cWJpbmF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM0Nzk5MSwiZXhwIjoyMDc2OTIzOTkxfQ.RafhzDNOPwoTL0o7VAF97CA9MjhfFHbH_at6Q0Iwrxg";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const inputDir = path.resolve("pdf-work/out/teacher");
// THIS IS THE KEY CHANGE: Uploading to the specific folder structure DB expects
const targetFolder = "version/36/teacher";
const bucketName = "timetable";

async function uploadFiles() {
    if (!fs.existsSync(inputDir)) {
        console.error(`❌ Input directory not found: ${inputDir}`);
        return;
    }

    const files = fs.readdirSync(inputDir).filter((f) => f.endsWith(".pdf"));
    console.log(`📂 Found ${files.length} PDFs in ${inputDir}`);
    console.log(`🎯 Target Bucket Path: ${bucketName}/${targetFolder}`);

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
