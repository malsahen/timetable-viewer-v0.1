import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://oerubqpurgcuezqbinax.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcnVicXB1cmdjdWV6cWJpbmF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM0Nzk5MSwiZXhwIjoyMDc2OTIzOTkxfQ.RafhzDNOPwoTL0o7VAF97CA9MjhfFHbH_at6Q0Iwrxg";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function fix() {
    console.log("🚀 Creating proper Teacher Draft Version...");

    // 1. Create new version
    const { data: version, error: vErr } = await supabase
        .from('versions')
        .insert({
            label: 'Term 1 Updated (Draft)',
            kind: 'teacher',
            is_current: false,
            status: 'ready'
        })
        .select()
        .single();

    if (vErr) throw vErr;
    console.log(`   ✅ Created Version ${version.id}`);

    // 2. Sync mappings from the newly processed files (which were at version/37/teacher/)
    // Actually, I have the names in teacher-map.json
    const fs = await import('fs');
    const path = await import('path');
    const teacherMap = JSON.parse(fs.readFileSync(path.resolve('pdf-work/teacher-map.json'), 'utf8'));

    console.log(`   - Syncing ${teacherMap.length} teacher mappings...`);
    for (const entry of teacherMap) {
        // Use the storage path we uploaded to in previous task: version/37/teacher/p-xxx.pdf
        const storagePath = `version/37/teacher/${entry.original}`;

        await supabase.from('page_mappings').upsert({
            version_id: version.id,
            kind: 'teacher',
            owner_slug: entry.slug,
            storage_path: storagePath,
            page_no: parseInt(entry.original.match(/\d+/)[0]),
            match_score: 100
        }, { onConflict: 'version_id,kind,owner_slug' });
    }

    console.log("✨ Draft sync complete.");
    return version.id;
}

fix().then(id => {
    console.log(`\n👉 PLEASE UPDATE app/my-timetable/page.tsx to use version ID: ${id}`);
}).catch(console.error);
