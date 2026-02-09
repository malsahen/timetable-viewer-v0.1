// app/page.tsx
import "server-only";
import Link from "next/link";

export const dynamic = "force-static";

export default async function Home() {
  return (
    <div className="min-h-[70vh]">
      {/* Hero */}
      <header className="brandmasthead bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
        <div className="container mx-auto max-w-5xl px-4 py-12 text-center">
          <h1 className="h1 text-2xl font-semibold tracking-tight text-slate-900">
            Announcements & Calendars
          </h1>
          <div className="text-[8px] text-slate-300 opacity-20">BUILD:bf47945_v1</div>
          <p className="muted mt-2 mx-auto max-w-2xl text-slate-600">
            All students share the same School Year and Assessment calendars.
            Check updates below and open the PDFs anytime.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/my-timetable"
              className="btn btn-primary rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Go to My Timetable
            </Link>
            <Link
              href="/login"
              className="btn btn-outline rounded-lg border border-indigo-300 bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-10">
        {/* Two-column layout */}
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
          {/* Announcements (static placeholder for now) */}
          <section className="card rounded-2xl border border-slate-200 bg-white shadow-md">
            <div className="card-header flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="h2 text-lg font-semibold text-slate-900">
                Announcements
              </h2>
            </div>

            <div className="card-body px-5 py-4">
              <ul className="stack space-y-4">
                <li className="row flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                  <div className="row-main">
                    <div className="row-title flex items-center gap-3">
                      <span className="font-semibold text-slate-900">
                        Announcement board coming soon
                      </span>
                      <span className="chip rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
                        Updates
                      </span>
                    </div>
                    <p className="row-sub mt-1 text-sm text-slate-700">
                      Timetable and school-wide announcements will appear here
                      once ICT enables the live feed.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* Right column: calendars + exam timetable */}
          <aside className="stack space-y-6">
            {/* Welcome blurb */}
            <div className="card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="card-body text-sm text-slate-700">
                Welcome to the Timetable Viewer. Use the buttons below to open
                or download the School Year and Assessment calendars.
              </div>
            </div>

            {/* School Year Calendar */}
            <div className="card rounded-2xl border border-slate-200 bg-white shadow-md">
              <div className="card-header border-b border-slate-200 px-5 py-4">
                <h3 className="h3 text-base font-semibold text-slate-900">
                  School Year Calendar
                </h3>
              </div>
              <div className="card-body px-5 py-4">
                <p className="muted mb-4 text-sm text-slate-600">
                  Term dates, holidays, and key events for this academic year.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/calendars/school-year.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-dark w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 md:w-auto"
                  >
                    Open PDF
                  </a>
                  <a
                    href="/calendars/school-year.pdf"
                    download
                    className="btn btn-quiet w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 md:w-auto"
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>

            {/* Assessment Calendar */}
            <div className="card rounded-2xl border border-slate-200 bg-white shadow-md">
              <div className="card-header border-b border-slate-200 px-5 py-4">
                <h3 className="h3 text-base font-semibold text-slate-900">
                  Assessment Calendar
                </h3>
              </div>
              <div className="card-body px-5 py-4">
                <p className="muted mb-4 text-sm text-slate-600">
                  Whole-school assessment weeks and important milestones.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/calendars/assessment-calendar.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-dark w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 md:w-auto"
                  >
                    Open PDF
                  </a>
                  <a
                    href="/calendars/assessment-calendar.pdf"
                    download
                    className="btn btn-quiet w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 md:w-auto"
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>

            {/* Exam Timetable stub */}
            <div className="card rounded-2xl border border-slate-200 bg-white shadow-md">
              <div className="card-header border-b border-slate-200 px-5 py-4">
                <h3 className="h3 text-base font-semibold text-slate-900">
                  Exam Timetable
                </h3>
              </div>
              <div className="card-body px-5 py-5 text-sm text-slate-600">
                <p className="muted">
                  Exam timetables will appear here in a future update. For now,
                  please refer to school communication channels for exam
                  schedules.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
