"use client";

import { useState, useMemo } from "react";

type TimetableItem = {
    owner_slug: string;
    name: string;
    signedUrl: string | null;
    page_no: number | null;
};

type BrowseClientProps = {
    userEmail: string;
    userRole: string;
    classTimetables: TimetableItem[];
    teacherTimetables: TimetableItem[];
    classVersion: string;
    teacherVersion: string;
};

export default function BrowseClient({
    userEmail,
    userRole,
    classTimetables,
    teacherTimetables,
    classVersion,
    teacherVersion,
}: BrowseClientProps) {
    const [activeTab, setActiveTab] = useState<"classes" | "teachers">("classes");
    const [searchQuery, setSearchQuery] = useState("");

    // Filter timetables based on search
    const filteredClasses = useMemo(() => {
        if (!searchQuery.trim()) return classTimetables;
        const query = searchQuery.toLowerCase();
        return classTimetables.filter(
            (item) =>
                item.name.toLowerCase().includes(query) ||
                item.owner_slug.toLowerCase().includes(query)
        );
    }, [classTimetables, searchQuery]);

    const filteredTeachers = useMemo(() => {
        if (!searchQuery.trim()) return teacherTimetables;
        const query = searchQuery.toLowerCase();
        return teacherTimetables.filter(
            (item) =>
                item.name.toLowerCase().includes(query) ||
                item.owner_slug.toLowerCase().includes(query)
        );
    }, [teacherTimetables, searchQuery]);

    const currentData = activeTab === "classes" ? filteredClasses : filteredTeachers;
    const currentVersion = activeTab === "classes" ? classVersion : teacherVersion;

    return (
        <div className="flex min-h-screen flex-col bg-white">
            {/* Premium Header - Inspired by Notion/Linear */}
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
                <div className="mx-auto max-w-7xl px-6 py-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Browse Timetables
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            {userEmail} <span className="mx-2">·</span>{" "}
                            <span className="capitalize">{userRole}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content - Generous Spacing */}
            <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
                {/* Controls Bar - Clean & Minimal */}
                <div className="mb-8 flex items-center gap-6">
                    {/* Refined Tabs */}
                    <nav className="flex gap-1">
                        <button
                            onClick={() => {
                                setActiveTab("classes");
                                setSearchQuery("");
                            }}
                            className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === "classes"
                                    ? "text-slate-900"
                                    : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Classes
                            <span className="ml-2 text-xs opacity-60">
                                {classTimetables.length}
                            </span>
                            {activeTab === "classes" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab("teachers");
                                setSearchQuery("");
                            }}
                            className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === "teachers"
                                    ? "text-slate-900"
                                    : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Teachers
                            <span className="ml-2 text-xs opacity-60">
                                {teacherTimetables.length}
                            </span>
                            {activeTab === "teachers" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                            )}
                        </button>
                    </nav>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Premium Search - Inspired by Google Drive */}
                    <div className="relative w-80">
                        <svg
                            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50"
                        />
                    </div>
                </div>

                {/* Meta Info - Subtle */}
                <div className="mb-4 flex items-center gap-3 text-xs text-slate-400">
                    <span className="rounded-md bg-slate-50 px-2 py-1 font-mono">
                        {currentVersion}
                    </span>
                    <span>·</span>
                    <span>
                        {currentData.length} {currentData.length === 1 ? "item" : "items"}
                    </span>
                </div>

                {/* Premium Table - Inspired by Linear/Notion */}
                {currentData.length === 0 ? (
                    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-12">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                            <svg
                                className="h-8 w-8 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-sm font-medium text-slate-900">
                            No {activeTab} found
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            {searchQuery
                                ? `No results matching "${searchQuery}"`
                                : `No ${activeTab} timetables available`}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Name
                                    </th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Identifier
                                    </th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Page
                                    </th>
                                    <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {currentData.map((item) => (
                                    <tr
                                        key={item.owner_slug}
                                        className="group transition-colors hover:bg-slate-50/50"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${activeTab === "classes"
                                                            ? "bg-blue-50 text-blue-600"
                                                            : "bg-emerald-50 text-emerald-600"
                                                        }`}
                                                >
                                                    {item.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium text-slate-900">
                                                    {item.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs text-slate-500">
                                                {item.owner_slug}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-600">
                                                {item.page_no ? `Page ${item.page_no}` : "—"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {item.signedUrl ? (
                                                <a
                                                    href={item.signedUrl + "&download=1"}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                                >
                                                    <svg
                                                        className="h-3.5 w-3.5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                        />
                                                    </svg>
                                                    Download
                                                </a>
                                            ) : (
                                                <span className="text-xs text-slate-400">N/A</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
