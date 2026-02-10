import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://oerubqpurgcuezqbinax.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcnVicXB1cmdjdWV6cWJpbmF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM0Nzk5MSwiZXhwIjoyMDc2OTIzOTkxfQ.RafhzDNOPwoTL0o7VAF97CA9MjhfFHbH_at6Q0Iwrxg";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function diagnose() {
    console.log("🔍 Diagnosing DB Schema...");

    // 1. Check Profiles columns
    const { data: cols, error: colErr } = await supabase.rpc('exec_sql', {
        sql: "SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles';"
    });

    if (colErr) {
        console.error("❌ exec_sql failed (RPC might not exist):", colErr.message);
    } else {
        console.log("✅ Profiles Columns:", cols.map(c => c.column_name).join(", "));
    }

    // 2. Check Page Mappings constraints
    const { data: consts, error: constErr } = await supabase.rpc('exec_sql', {
        sql: "SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'public.page_mappings'::regclass;"
    });

    if (constErr) {
        console.error("❌ Failed to fetch constraints:", constErr.message);
    } else {
        console.log("✅ Page Mappings Constraints:", JSON.stringify(consts, null, 2));
    }

    // 3. Try to add column if missing
    console.log("🛠️ Attempting to add can_view_drafts if missing...");
    const { error: addErr } = await supabase.rpc('exec_sql', {
        sql: "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_view_drafts boolean DEFAULT false;"
    });
    if (addErr) console.error("❌ Failed to add column via RPC:", addErr.message);
    else console.log("✅ Column operation attempted.");
}

diagnose().catch(console.error);
