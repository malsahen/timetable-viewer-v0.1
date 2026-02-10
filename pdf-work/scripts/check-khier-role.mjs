import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://oerubqpurgcuezqbinax.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcnVicXB1cmdjdWV6cWJpbmF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM0Nzk5MSwiZXhwIjoyMDc2OTIzOTkxfQ.RafhzDNOPwoTL0o7VAF97CA9MjhfFHbH_at6Q0Iwrxg";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function check() {
    console.log("--- Profile Check ---");
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'mohammadkhier@ucsiinternationalschool.edu.my')
        .maybeSingle();

    console.log(JSON.stringify(profile, null, 2));

    console.log("\n--- Teacher Check ---");
    const { data: teacher } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', 'mohammadkhier@ucsiinternationalschool.edu.my')
        .maybeSingle();

    console.log(JSON.stringify(teacher, null, 2));
}

check().catch(console.error);
