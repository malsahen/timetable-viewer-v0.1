import "server-only";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import ChangePassword from "@/app/components/ChangePassword";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: number;
  user_id: string;
  email: string | null;
  role: "admin" | "teacher" | "student" | null;
  must_change_password?: boolean | null;
};

type TeacherRow = {
  id: number;
  user_id: string | null;
  full_name: string;
  email: string | null;
  slug: string;
  ft_class_slug: string | null;
  ct_class_slug: string | null;
};

type ClassRow = {
  id: number;
  slug: string;
  name: string | null;
};

export default async function MyTimetable() {
  const sb = await supabaseServer();
  const admin = supabaseAdmin();

  const debugMode = false;
  const debug: any = { steps: {} };

  const { data: userData } = await sb.auth.getUser();
  const user = userData?.user ?? null;

  if (!user) {
    return (
      <div className="mx-auto mt-10 flex max-w-lg flex-col items-center px-4 text-center">
        <h1 className="h1 mb-2 text-xl font-semibold tracking-tight text-slate-900">
          My Timetable
        </h1>
        <p className="muted text-sm text-slate-500">You’re not signed in.</p>
      </div>
    );
  }

  const { data: profile } = await sb
    .from("profiles")
    .select("id,user_id,email,role,must_change_password")
    .eq("user_id", user.id)
    .maybeSingle<ProfileRow>();

  const role = (profile?.role ?? "student") as ProfileRow["role"];

  /* =========================================================
   * TEACHER / ADMIN VIEW
   * =======================================================*/
  if (role === "teacher" || role === "admin") {
    // Link auth.user → teacher row
    const { data: teacher } = await admin
      .from("teachers")
      .select("id,user_id,full_name,email,slug,ft_class_slug,ct_class_slug")
      .or(
        `user_id.eq.${user.id},email.ilike.${(user.email || "")
          .toLowerCase()
          .trim()}`
      )
      .limit(1)
      .maybeSingle<TeacherRow>();

    if (!teacher) {
      return (
        <div className="mx-auto mt-10 flex w-full flex-col items-center px-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <h1 className="h1 mb-2 text-xl font-semibold tracking-tight text-slate-900">
              My Timetable
            </h1>
            <p className="muted text-sm text-slate-500 mb-3">
              Signed in as{" "}
              <strong className="font-semibold text-slate-900">
                {user.email}
              </strong>{" "}
              — role:{" "}
              <strong className="font-semibold text-slate-900">
                {role}
              </strong>
              .
            </p>
            <div className="alert error mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              We couldn’t find a teacher record linked to your account. Please
              contact ICT Support.
            </div>
          </div>
        </div>
      );
    }

    // Load current teacher + class versions
    const [{ data: teacherVersion }, { data: classVersion }] =
      await Promise.all([
        admin
          .from("versions")
          .select("id,label,kind,is_current")
          .eq("kind", "teacher")
          .eq("is_current", true)
          .limit(1)
          .maybeSingle(),
        admin
          .from("versions")
          .select("id,label,kind,is_current")
          .eq("kind", "class")
          .eq("is_current", true)
          .limit(1)
          .maybeSingle(),
      ]);

    const ftSlug = teacher.ft_class_slug;
    const ctSlug = teacher.ct_class_slug;
    const classSlugs = [ftSlug, ctSlug].filter(
      (s): s is string => !!s && s.trim() !== ""
    );

    // Personal teacher timetable mapping
    let teacherMapping: {
      storage_path: string;
      page_no: number | null;
      match_score: number | null;
    } | null = null;

    if (teacherVersion?.id) {
      const { data } = await admin
        .from("page_mappings")
        .select("storage_path,page_no,match_score")
        .eq("version_id", teacherVersion.id)
        .eq("kind", "teacher")
        .eq("owner_slug", teacher.slug)
        .maybeSingle();
      teacherMapping = data ?? null;
    }

    // Class timetables mappings
    let classMappings:
      | {
          owner_slug: string;
          storage_path: string;
          page_no: number | null;
          match_score: number | null;
        }[]
      | null = null;

    if (classVersion?.id && classSlugs.length > 0) {
      const { data } = await admin
        .from("page_mappings")
        .select("owner_slug,storage_path,page_no,match_score")
        .eq("version_id", classVersion.id)
        .eq("kind", "class")
        .in("owner_slug", classSlugs);
      classMappings = (data as any[]) ?? [];
    }

    // Class names
    let classesBySlug: Record<string, ClassRow> = {};
    if (classSlugs.length > 0) {
      const { data: klasses } = await admin
        .from("classes")
        .select("id,slug,name")
        .in("slug", classSlugs);
      (klasses ?? []).forEach((k: any) => {
        classesBySlug[k.slug] = k as ClassRow;
      });
    }

    // Signed URLs
    const teacherSignedUrl = teacherMapping
      ? (
          await admin.storage
            .from("timetable")
            .createSignedUrl(teacherMapping.storage_path, 60 * 60, {
              download: false,
            })
        ).data?.signedUrl ?? null
      : null;

    const classSigned: {
      slug: string;
      name: string;
      url: string | null;
      pageNo: number | null;
      matchScore: number | null;
      roleLabel: string;
    }[] = [];

    for (const slug of classSlugs) {
      const m = classMappings?.find((mm) => mm.owner_slug === slug) ?? null;
      const klass = classesBySlug[slug] ?? null;
      const signed = m
        ? (
            await admin.storage
              .from("timetable")
              .createSignedUrl(m.storage_path, 60 * 60, { download: false })
          ).data?.signedUrl ?? null
        : null;

      const roleLabel =
        slug === ftSlug
          ? "Form Tutor"
          : slug === ctSlug
          ? "Co-Tutor"
          : "Class";

      classSigned.push({
        slug,
        name: klass?.name ?? slug,
        url: signed,
        pageNo: m?.page_no ?? null,
        matchScore: m?.match_score ?? null,
        roleLabel,
      });
    }

    return (
      <div className="flex w-full flex-col items-center px-4 py-8">
        <h1 className="h1 mb-1 mt-2 text-xl font-semibold tracking-tight text-slate-900">
          My Timetable
        </h1>
        <p className="muted mb-4 text-sm text-slate-500">
          Signed in as{" "}
          <strong className="font-semibold text-slate-900">
            {user.email}
          </strong>{" "}
          — role:{" "}
          <strong className="font-semibold text-slate-900">
            {role}
          </strong>
          .
        </p>

        {profile?.must_change_password ? (
          <div className="alert warn mb-4 w-[95vw] max-w-[1800px] rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            For security, please set a new password now.
            <span className="ml-3 inline-flex">
              <ChangePassword mustChange />
            </span>
          </div>
        ) : null}

        {/* === Section A: Personal teacher timetable === */}
        <div className="w-[95vw] max-w-[1800px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl mb-8">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
            <div>
              <div className="font-semibold text-sm text-slate-900">
                Teacher timetable — {teacher.full_name}
              </div>
              <div className="text-xs text-slate-500">
                {teacherVersion
                  ? `Version: ${teacherVersion.label ?? `#${teacherVersion.id}`}`
                  : "No active teacher release set."}
                {teacherMapping?.page_no
                  ? ` • Page ${teacherMapping.page_no}`
                  : ""}
                {teacherMapping?.match_score !== null &&
                teacherMapping?.match_score !== undefined
                  ? ` • Match ${teacherMapping.match_score}`
                  : ""}
              </div>
            </div>

            <div className="flex gap-2">
              {!profile?.must_change_password && <ChangePassword />}
              {teacherSignedUrl && (
                <a
                  href={teacherSignedUrl + "&download=1"}
                  className="btn btn-primary inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                  rel="noopener noreferrer"
                >
                  Download PDF
                </a>
              )}
            </div>
          </div>

          {teacherSignedUrl ? (
            <div className="flex items-center justify-center bg-slate-100 p-2 sm:p-3">
              <object
                data={`${teacherSignedUrl}#zoom=page-width&view=FitH,100`}
                type="application/pdf"
                className="h-[90vh] w-[95vw] max-w-[1780px] rounded-lg border border-slate-300 bg-white shadow-inner"
                aria-label="Teacher timetable PDF"
              >
                <p className="px-4 py-6 text-center text-sm text-slate-700">
                  Your browser cannot display PDFs.{" "}
                  <a
                    href={teacherSignedUrl + "&download=1"}
                    className="underline underline-offset-2"
                  >
                    Download timetable
                  </a>
                  .
                </p>
              </object>
            </div>
          ) : (
            <div className="p-6">
              <div className="alert warn rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                We couldn’t find a teacher timetable mapped to{" "}
                <b>{teacher.slug}</b>. Please contact ICT Support if this
                should be available.
              </div>
            </div>
          )}
        </div>

        {/* === Section B: FT/CT class timetables === */}
        <div className="w-[95vw] max-w-[1800px] rounded-2xl border border-slate-200 bg-white shadow-md">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
            <div>
              <div className="font-semibold text-sm text-slate-900">
                My classes (Form / Co-Tutor)
              </div>
              <div className="text-xs text-slate-500">
                {classVersion
                  ? `Class version: ${classVersion.label ?? `#${classVersion.id}`}`
                  : "No active class release set."}
              </div>
            </div>
          </div>

          {classSigned.length === 0 ? (
            <div className="p-6">
              <p className="muted text-sm text-slate-500">
                No FT/CT classes linked to your teacher record yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
              {classSigned.map((c) => (
                <div
                  key={c.slug}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm text-slate-900">
                      {c.name}
                    </div>
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                      {c.roleLabel}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    slug: {c.slug}
                    {c.pageNo ? ` • Page ${c.pageNo}` : ""}
                    {c.matchScore !== null && c.matchScore !== undefined
                      ? ` • Match ${c.matchScore}`
                      : ""}
                  </div>
                  <div className="mt-2">
                    {c.url ? (
                      <a
                        href={c.url + "&download=1"}
                        className="btn btn-primary inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                        rel="noopener noreferrer"
                      >
                        Open timetable PDF
                      </a>
                    ) : (
                      <span className="text-xs text-amber-700">
                        No timetable mapped for this class yet.
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {debugMode && <DebugBlock data={debug} />}
      </div>
    );
  }

  /* =========================================================
   * STUDENT VIEW (unchanged from your working version)
   * =======================================================*/

  // student lookup
  const { data: student } = await admin
    .from("students")
    .select("id, class_slug, email, user_id")
    .or(
      `user_id.eq.${user.id},email.ilike.${(user.email || "")
        .toLowerCase()
        .trim()}`
    )
    .limit(1)
    .maybeSingle();

  if (!student?.class_slug) {
    return (
      <div className="mx-auto mt-10 flex w-full flex-col items-center px-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <h1 className="h1 mb-2 text-xl font-semibold tracking-tight text-slate-900">
            My Timetable
          </h1>
          <div className="alert error mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            We couldn’t find your class. Please contact ICT Support.
          </div>
        </div>
      </div>
    );
  }

  const { data: klass } = await admin
    .from("classes")
    .select("id, slug, name")
    .eq("slug", student.class_slug)
    .maybeSingle();

  const { data: currentVersion } = await admin
    .from("versions")
    .select("id, label, kind, is_current")
    .eq("kind", "class")
    .eq("is_current", true)
    .limit(1)
    .maybeSingle();

  const { data: mapping } = await admin
    .from("page_mappings")
    .select("storage_path, page_no, match_score")
    .eq("version_id", currentVersion?.id)
    .eq("kind", "class")
    .eq("owner_slug", klass?.slug)
    .maybeSingle();

  const storagePath = mapping?.storage_path ?? null;
  const pageNo = mapping?.page_no ?? null;
  const matchScore = mapping?.match_score ?? null;

  if (!storagePath) {
    return (
      <div className="mx-auto mt-10 flex w-full flex-col items-center px-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <h1 className="h1 mb-2 text-xl font-semibold tracking-tight text-slate-900">
            My Timetable
          </h1>
          <div className="alert error mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Couldn’t locate your class page for <b>{klass?.slug}</b>.
          </div>
        </div>
      </div>
    );
  }

  const { data: signed } = await admin.storage
    .from("timetable")
    .createSignedUrl(storagePath, 60 * 60, { download: false });

  const signedUrl = signed?.signedUrl ?? null;

  // ===== Render student =====
  return (
    <div className="flex w-full flex-col items-center px-4 py-8">
      <h1 className="h1 mb-1 mt-2 text-xl font-semibold tracking-tight text-slate-900">
        My Timetable
      </h1>
      <p className="muted mb-4 text-sm text-slate-500">
        Signed in as{" "}
        <strong className="font-semibold text-slate-900">{user.email}</strong>{" "}
        — class:{" "}
        <strong className="font-semibold text-slate-900">
          {klass?.name ?? klass?.slug}
        </strong>
      </p>

      {profile?.must_change_password ? (
        <div className="alert warn mb-4 w-[95vw] max-w-[1800px] rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          For security, please set a new password now.
          <span className="ml-3 inline-flex">
            <ChangePassword mustChange />
          </span>
        </div>
      ) : null}

      <div className="w-[95vw] max-w-[1800px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
          <div>
            <div className="font-semibold text-sm text-slate-900">
              Current version:{" "}
              {currentVersion?.label ?? `#${currentVersion?.id}`}
            </div>
            <div className="text-xs text-slate-500">
              {pageNo ? `Page ${pageNo}` : ""}
              {pageNo && matchScore !== null ? " • " : ""}
              {matchScore !== null ? `Match ${matchScore}` : ""}
            </div>
          </div>

          <div className="flex gap-2">
            {!profile?.must_change_password && <ChangePassword />}
            {signedUrl && (
              <a
                href={signedUrl + "&download=1"}
                className="btn btn-primary inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                rel="noopener noreferrer"
              >
                Download PDF
              </a>
            )}
          </div>
        </div>

        {signedUrl ? (
          <div className="flex items-center justify-center bg-slate-100 p-2 sm:p-3">
            <object
              data={`${signedUrl}#zoom=page-width&view=FitH,100`}
              type="application/pdf"
              className="h-[90vh] w-[95vw] max-w-[1780px] rounded-lg border border-slate-300 bg-white shadow-inner"
              aria-label="Timetable PDF"
            >
              <p className="px-4 py-6 text-center text-sm text-slate-700">
                Your browser cannot display PDFs.{" "}
                <a
                  href={signedUrl + "&download=1"}
                  className="underline underline-offset-2"
                >
                  Download timetable
                </a>
                .
              </p>
            </object>
          </div>
        ) : (
          <div className="p-6">
            <div className="alert error rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Failed to generate signed link.
            </div>
          </div>
        )}
      </div>

      {debugMode && <DebugBlock data={debug} />}
    </div>
  );
}

function DebugBlock({ data }: { data: any }) {
  return (
    <details className="card mt-6 w-[95vw] max-w-[1800px] rounded-xl border border-slate-200 bg-slate-50 shadow-sm" open>
      <summary className="card-header cursor-pointer border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
        <span className="h2">Debug</span>
      </summary>
      <div className="card-body px-4 py-3">
        <pre className="whitespace-pre-wrap break-all text-xs text-slate-700">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </details>
  );
}
