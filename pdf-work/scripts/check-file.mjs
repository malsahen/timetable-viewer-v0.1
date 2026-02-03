import { createClient } from "@supabase/supabase-js";

// Hardcoding for this specific check to avoid module resolution headaches
const SUPABASE_URL = "https://oerubqpurgcuezqbinax.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcnVicXB1cmdjdWV6cWJpbmF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM0Nzk5MSwiZXhwIjoyMDc2OTIzOTkxfQ.RafhzDNOPwoTL0o7VAF97CA9MjhfFHbH_at6Q0Iwrxg";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const pathToCheck = "version/36/teacher/p-023.pdf";
const bucket = "timetable";

console.log(`Checking if "${pathToCheck}" exists in bucket "${bucket}"...`);

// List the directory to see what IS there
const { data, error } = await supabase.storage.from(bucket).list("version/36/teacher");

if (error) {
    console.error("Error listing files:", error);
} else {
    const found = data.find(f => f.name === "p-023.pdf");
    if (found) {
        console.log("✅ File FOUND:", found);

        // Try signing
        const { data: signed, error: signError } = await supabase.storage
            .from(bucket)
            .createSignedUrl(pathToCheck, 60);

        if (signed) console.log("✅ Generated Signed URL:", signed.signedUrl);
        if (signError) console.error("❌ Signing Error:", signError);

    } else {
        console.log("❌ File NOT FOUND in listing.");
        console.log("Files found in 'version/36/teacher':", data.length > 0 ? data.map(f => f.name) : "NONE");
    }
}
