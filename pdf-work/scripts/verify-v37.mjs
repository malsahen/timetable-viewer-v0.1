import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://oerubqpurgcuezqbinax.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcnVicXB1cmdjdWV6cWJpbmF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM0Nzk5MSwiZXhwIjoyMDc2OTIzOTkxfQ.RafhzDNOPwoTL0o7VAF97CA9MjhfFHbH_at6Q0Iwrxg";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function verify() {
    console.log("🔍 Checking page_mappings table...");

    // Check teacher mappings
    const { data: teachers, error: tErr } = await supabase
        .from('page_mappings')
        .select('owner_slug, storage_path')
        .eq('kind', 'teacher')
        .limit(5);

    if (tErr) console.error("❌ Teacher Query Error:", tErr);
    else {
        console.log("Teacher Samples:");
        teachers.forEach(t => console.log(`  - ${t.owner_slug}: ${t.storage_path}`));
    }

    // Check class mappings
    const { data: classes, error: cErr } = await supabase
        .from('page_mappings')
        .select('owner_slug, storage_path')
        .eq('kind', 'class')
        .limit(5);

    if (cErr) console.error("❌ Class Query Error:", cErr);
    else {
        console.log("Class Samples:");
        classes.forEach(c => console.log(`  - ${c.owner_slug}: ${c.storage_path}`));
    }

    // Verify a random file from version 37
    const testFile = "version/37/teacher/p-001.pdf";
    console.log(`\n🧪 Testing storage access for: ${testFile}`);
    const { data: list, error: lErr } = await supabase.storage.from('timetable').list('version/37/teacher');

    if (lErr) console.error("❌ Storage Listing Error:", lErr);
    else {
        const found = list.find(f => f.name === 'p-001.pdf');
        if (found) console.log("✅ File exists in storage.");
        else console.log("❌ File NOT FOUND in storage.");
    }
}

verify().catch(console.error);
