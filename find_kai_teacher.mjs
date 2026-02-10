import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://oerubqpurgcuezqbinax.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcnVicXB1cmdjdWV6cWJpbmF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM0Nzk5MSwiZXhwIjoyMDc2OTIzOTkxfQ.RafhzDNOPwoTL0o7VAF97CA9MjhfFHbH_at6Q0Iwrxg";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function findTeacher() {
    const { data: teachers, error } = await supabase
        .from("teachers")
        .select("*")
        .or("full_name.ilike.%kai%,full_name.ilike.%chong%");

    if (error) {
        console.error("Error fetching teachers:", error);
        return;
    }

    console.log("Found teachers:");
    teachers.forEach(t => {
        console.log(JSON.stringify(t, null, 2));
    });
}

findTeacher();
