import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://oerubqpurgcuezqbinax.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcnVicXB1cmdjdWV6cWJpbmF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM0Nzk5MSwiZXhwIjoyMDc2OTIzOTkxfQ.RafhzDNOPwoTL0o7VAF97CA9MjhfFHbH_at6Q0Iwrxg";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function syncMappings(fromId, toId) {
    console.log(`   - Syncing mappings from Version ${fromId} to Version ${toId}...`);

    // 1. Fetch source mappings
    const { data: mappings, error: fetchErr } = await supabase.from('page_mappings').select('*').eq('version_id', fromId);
    if (fetchErr) {
        console.error(`   ❌ Failed to fetch mappings for Version ${fromId}:`, fetchErr.message);
        return;
    }
    if (!mappings || mappings.length === 0) {
        console.log(`   ⚠️ No mappings found for Version ${fromId}.`);
        return;
    }

    // 2. Clear existing target mappings (to avoid duplicate errors since we don't have a unique constraint)
    console.log(`   - Clearing existing mappings for Version ${toId}...`);
    const { error: delErr } = await supabase.from('page_mappings').delete().eq('version_id', toId);
    if (delErr) {
        console.warn(`   ⚠️ Could not clear old mappings:`, delErr.message);
    }

    // 3. Insert new mappings
    console.log(`   - Inserting ${mappings.length} mappings into Version ${toId}...`);
    const newMappings = mappings.map(m => ({
        version_id: toId,
        kind: m.kind,
        owner_slug: m.owner_slug,
        storage_path: m.storage_path.replace(`version/${fromId}/`, `version/${toId}/`),
        page_no: m.page_no,
        match_score: m.match_score,
        match_hits: m.match_hits
    }));

    // Batch insert
    const { error: insErr } = await supabase.from('page_mappings').insert(newMappings);

    if (insErr) {
        console.error(`   ❌ Failed to insert mappings for Version ${toId}:`, insErr.message);
    } else {
        console.log(`   ✅ Version ${toId} successfully synced from ${fromId}.`);
    }
}

async function apply() {
    console.log("🚀 Applying manual draft setup sync...");

    // Setup Versions labels - ensure they are correctly set
    console.log("   - Labelling draft versions...");
    await supabase.from('versions').update({ label: 'Term 1 Updated (Draft)', is_current: false }).eq('id', 51);
    await supabase.from('versions').update({ label: 'Term 1 (Draft)', is_current: false }).eq('id', 37);
    console.log("   ✅ Version labels updated.");

    // Sync Mappings
    // Teacher: Sync Draft(51) from Current(36)
    await syncMappings(36, 51);

    // Class: Sync Draft(37) from Current(38)
    await syncMappings(38, 37);

    console.log("\n🚀 All done! Draft views should now have data.");
    console.log("ℹ️ Note: profiles.can_view_drafts update skipped (hardcoded check in code is active).");
}

apply().catch(console.error);
