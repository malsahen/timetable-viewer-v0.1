import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SUPABASE_URL = "https://oerubqpurgcuezqbinax.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcnVicXB1cmdjdWV6cWJpbmF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM0Nzk5MSwiZXhwIjoyMDc2OTIzOTkxfQ.RafhzDNOPwoTL0o7VAF97CA9MjhfFHbH_at6Q0Iwrxg";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function applyMigration() {
    const migrationPath = path.resolve("supabase/migrations/016_update_v37.sql");
    const sql = fs.readFileSync(migrationPath, "utf8");

    console.log("🚀 Applying migration 016_update_v37.sql...");

    // Using rpc to execute raw SQL if available, otherwise we might need a workaround.
    // However, in this environment, it's often easier to just notify the user or use a specific tool.
    // Since I don't have a direct SQL execution tool, I'll use the supabase client to update records directly.

    console.log("ℹ️ Applying updates via Supabase Client...");

    // Update teachers
    const { data: tData, error: tErr } = await supabase
        .from('page_mappings')
        .select('id, storage_path')
        .eq('kind', 'teacher');

    if (tErr) throw tErr;

    for (const row of tData) {
        if (row.storage_path.startsWith('version/')) {
            const fileName = row.storage_path.split('/').pop();
            const newPath = `version/37/teacher/${fileName}`;
            await supabase.from('page_mappings').update({ storage_path: newPath }).eq('id', row.id);
        }
    }
    console.log(`✅ Updated ${tData.length} teacher mappings.`);

    // Update classes
    const { data: cData, error: cErr } = await supabase
        .from('page_mappings')
        .select('id, storage_path')
        .eq('kind', 'class');

    if (cErr) throw cErr;

    for (const row of cData) {
        if (row.storage_path.startsWith('version/')) {
            const fileName = row.storage_path.split('/').pop();
            const newPath = `version/37/class/${fileName}`;
            await supabase.from('page_mappings').update({ storage_path: newPath }).eq('id', row.id);
        }
    }
    console.log(`✅ Updated ${cData.length} class mappings.`);
}

applyMigration().catch(console.error);
