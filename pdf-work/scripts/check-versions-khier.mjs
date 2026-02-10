import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://oerubqpurgcuezqbinax.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcnVicXB1cmdjdWV6cWJpbmF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM0Nzk5MSwiZXhwIjoyMDc2OTIzOTkxfQ.RafhzDNOPwoTL0o7VAF97CA9MjhfFHbH_at6Q0Iwrxg";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function check() {
    console.log("--- RECENT VERSIONS ---");
    const { data: versions } = await supabase
        .from('versions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
    console.log(JSON.stringify(versions, null, 2));

    for (const v of versions) {
        const { count } = await supabase
            .from('page_mappings')
            .select('*', { count: 'exact', head: true })
            .eq('version_id', v.id);
        console.log(`Version ${v.id} (${v.label}): ${count} mappings`);
    }
}

check().catch(console.error);
