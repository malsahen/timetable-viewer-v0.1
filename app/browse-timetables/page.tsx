import "server-only";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { redirect } from "next/navigation";
import BrowseClient from "./BrowseClient";

export const dynamic = "force-dynamic";

type ProfileRow = {
    id: number;
    user_id: string;
    email: string | null;
    role: "admin" | "teacher" | "student" | "browser" | null;
};

type ClassMapping = {
    owner_slug: string;
    storage_path: string;
    page_no: number | null;
    match_score: number | null;
    class_name: string | null;
};

type TeacherMapping = {
    owner_slug: string;
    storage_path: string;
    page_no: number | null;
    match_score: number | null;
    teacher_name: string | null;
};

export default async function BrowseTimetablesPage() {
    const sb = await supabaseServer();
    const admin = supabaseAdmin();

    // Auth check
    const { data: userData } = await sb.auth.getUser();
    const user = userData?.user ?? null;

    if (!user) {
        redirect("/login?next=/browse-timetables");
    }

    // Role check
    const { data: profile } = await sb
        .from("profiles")
        .select("id,user_id,email,role")
        .eq("user_id", user.id)
        .maybeSingle<ProfileRow>();

    const role = profile?.role ?? "student";

    // Allow browser, admin, and teacher roles to access this page
    if (role !== "browser" && role !== "admin" && role !== "teacher") {
        return (
            <div className="mx-auto mt-10 flex max-w-lg flex-col items-center px-4 text-center">
                <h1 className="h1 mb-2 text-xl font-semibold tracking-tight text-slate-900">
                    Access Denied
                </h1>
                <p className="muted text-sm text-slate-500">
                    You don't have permission to access this page.
                </p>
            </div>
        );
    }

    // Fetch current class version
    const { data: classVersion } = await admin
        .from("versions")
        .select("id,label,kind,is_current")
        .eq("kind", "class")
        .eq("is_current", true)
        .limit(1)
        .maybeSingle();

    // Fetch current teacher version
    const { data: teacherVersion } = await admin
        .from("versions")
        .select("id,label,kind,is_current")
        .eq("kind", "teacher")
        .eq("is_current", true)
        .limit(1)
        .maybeSingle();

    // Fetch all class mappings with class names
    let classMappings: ClassMapping[] = [];
    if (classVersion?.id) {
        const { data: mappings } = await admin
            .from("page_mappings")
            .select("owner_slug,storage_path,page_no,match_score")
            .eq("version_id", classVersion.id)
            .eq("kind", "class")
            .order("owner_slug");

        if (mappings && mappings.length > 0) {
            const slugs = mappings.map((m: any) => m.owner_slug);
            const { data: classes } = await admin
                .from("classes")
                .select("slug,name")
                .in("slug", slugs);

            const classMap = new Map(classes?.map((c: any) => [c.slug, c.name]) ?? []);

            classMappings = mappings.map((m: any) => ({
                owner_slug: m.owner_slug,
                storage_path: m.storage_path,
                page_no: m.page_no,
                match_score: m.match_score,
                class_name: classMap.get(m.owner_slug) ?? m.owner_slug,
            }));
        }
    }

    // Fetch all teacher mappings with teacher names
    let teacherMappings: TeacherMapping[] = [];
    if (teacherVersion?.id) {
        const { data: mappings } = await admin
            .from("page_mappings")
            .select("owner_slug,storage_path,page_no,match_score")
            .eq("version_id", teacherVersion.id)
            .eq("kind", "teacher")
            .order("owner_slug");

        if (mappings && mappings.length > 0) {
            const slugs = mappings.map((m: any) => m.owner_slug);
            const { data: teachers } = await admin
                .from("teachers")
                .select("slug,full_name")
                .in("slug", slugs);

            const teacherMap = new Map(teachers?.map((t: any) => [t.slug, t.full_name]) ?? []);

            teacherMappings = mappings.map((m: any) => ({
                owner_slug: m.owner_slug,
                storage_path: m.storage_path,
                page_no: m.page_no,
                match_score: m.match_score,
                teacher_name: teacherMap.get(m.owner_slug) ?? m.owner_slug,
            }));
        }
    }

    // Generate signed URLs for downloads
    const classesWithUrls = await Promise.all(
        classMappings.map(async (cm) => {
            const { data } = await admin.storage
                .from("timetable")
                .createSignedUrl(cm.storage_path, 60 * 60, { download: false });
            return {
                owner_slug: cm.owner_slug,
                name: cm.class_name ?? cm.owner_slug,
                signedUrl: data?.signedUrl ?? null,
                page_no: cm.page_no,
            };
        })
    );

    const teachersWithUrls = await Promise.all(
        teacherMappings.map(async (tm) => {
            const { data } = await admin.storage
                .from("timetable")
                .createSignedUrl(tm.storage_path, 60 * 60, { download: false });
            return {
                owner_slug: tm.owner_slug,
                name: tm.teacher_name ?? tm.owner_slug,
                signedUrl: data?.signedUrl ?? null,
                page_no: tm.page_no,
            };
        })
    );

    return (
        <BrowseClient
            userEmail={user.email ?? "Unknown"}
            userRole={role}
            classTimetables={classesWithUrls}
            teacherTimetables={teachersWithUrls}
            classVersion={classVersion?.label ?? `#${classVersion?.id ?? "unknown"}`}
            teacherVersion={teacherVersion?.label ?? `#${teacherVersion?.id ?? "unknown"}`}
        />
    );
}
