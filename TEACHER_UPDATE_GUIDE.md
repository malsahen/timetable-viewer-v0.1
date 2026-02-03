# Teacher Timetable Update Procedure

Use this guide (or paste it to your AI assistant) when you have a **new teacher master PDF** with a **different order** of teachers.

## The Goal
1. Split the new master PDF.
2. Upload the new files to a specific version folder (e.g. `version/37/teacher/`).
3. Update the database mappings so that `Sarah` -> Page 1, `Khier` -> Page 5, etc.
4. **CRITICAL:** Do NOT delete or re-create teacher records. Only update the `page_mappings` table. This protects login links.

---

## Step 1: Split the PDF
Run your local script to split the master PDF into individual pages (`p-001.pdf`, `p-002.pdf`, etc.).
```bash
node pdf-work/scripts/split-local.mjs teacher
```

## Step 2: Upload to Storage
1. Go to Supabase Dashboard -> Storage -> `timetable` bucket.
2. Create a **new folder** for this version (e.g. `version/37`).
3. Inside that, create a `teacher` folder.
4. Upload all your split PDF files (`p-001.pdf` to `p-035.pdf`) into `version/37/teacher/`.

## Step 3: The "Magic" Prompt
Copy and paste this prompt to your AI assistant. It contains the logic to do the update safely.

---
**COPY BELOW THIS LINE**
---

I have a new teacher timetable PDF.
1. I have already split it and uploaded the files to Supabase Storage at path: `version/37/teacher/` (Change '37' to your new version number).
2. I have a NEW list of teachers in order (Page 1 matches name 1, Page 2 matches name 2, etc.).

**Here is the new list of names in order:**
1. [Name 1]
2. [Name 2]
3. ...
(Paste your full list here)

**Please generate a SQL script to:**
1. Create a new `version` entry (e.g. "Term 2 v1").
2. Insert the `page_mappings` for this new version.
3. **IMPORTANT:** Do NOT insert or delete from the `teachers` table. Only match against existing `slug`s.
4. If a name in my list doesn't strictly match a `slug` in the database, please tell me so I can fix the name in the list (e.g. "Dil" vs "Dil Jahia").
5. The `storage_path` should be `version/37/teacher/p-001.pdf` for the 1st name, `p-002.pdf` for the 2nd, etc.

---

## Why this is better
- **Safe:** It creates a *new version*. If something goes wrong, the old version is still active and working.
- **Smart:** It only touches `page_mappings`. It never touches `teachers` (profiles), so no one gets logged out or loses their password/email link.
- **Clean:** It uses explicit paths (`version/37/...`) so you don't have caching issues where the "old" Page 1 shows up instead of the new one.
