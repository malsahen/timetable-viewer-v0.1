import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://oerubqpurgcuezqbinax.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcnVicXB1cmdjdWV6cWJpbmF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM0Nzk5MSwiZXhwIjoyMDc2OTIzOTkxfQ.RafhzDNOPwoTL0o7VAF97CA9MjhfFHbH_at6Q0Iwrxg";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkProfile() {
    const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", "260c79c0-b4c9-40ab-be2a-06faf8793ee5");

    if (error) {
        console.error("Error fetching profile:", error);
    } else {
        console.log("Found profile:", JSON.stringify(profiles, null, 2));
    }

    const { data: all_profiles, error: error2 } = await supabase
        .from("profiles")
        .select("*")
        .ilike("email", "%kai%");

    if (error2) {
        console.error("Error fetching all profiles:", error2);
    } else {
        console.log("Found other kai profiles:", JSON.stringify(all_profiles, null, 2));
    }
}

checkProfile();
