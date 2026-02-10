import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://oerubqpurgcuezqbinax.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcnVicXB1cmdjdWV6cWJpbmF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM0Nzk5MSwiZXhwIjoyMDc2OTIzOTkxfQ.RafhzDNOPwoTL0o7VAF97CA9MjhfFHbH_at6Q0Iwrxg";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function findUser() {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error("Error listing users:", error);
        return;
    }

    console.log("Found users:");
    users.filter(u =>
        u.email?.toLowerCase().includes("kai") ||
        u.email?.toLowerCase().includes("chong") ||
        u.email?.toLowerCase().includes("foo")
    ).forEach(u => {
        console.log(`- ID: ${u.id}, Email: ${u.email}`);
    });
}

findUser();
