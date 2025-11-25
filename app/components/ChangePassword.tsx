// app/components/ChangePassword.tsx
"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const supabase = supabaseBrowser();

type ChangePasswordProps = {
  mustChange?: boolean;
};

export default function ChangePassword({ mustChange = false }: ChangePasswordProps) {
  // Important: start closed on BOTH server & client,
  // then open on client via useEffect if mustChange is true.
  const [open, setOpen] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (mustChange) {
      setOpen(true);
    }
  }, [mustChange]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (pwd.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (pwd !== pwd2) {
      setErr("Passwords do not match.");
      return;
    }

    try {
      setBusy(true);

      const { error } = await supabase.auth.updateUser({ password: pwd });
      if (error) throw error;

      // Clear the must_change_password flag server-side
      await fetch("/api/profile/clear-must-change", { method: "POST" }).catch(() => {});

      setMsg("Password updated successfully.");
      setTimeout(() => setOpen(false), 900);
    } catch (e: any) {
      setErr(e?.message || "Failed to update password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Manual change button when not forced */}
      {!mustChange && (
        <button className="btn btn-outline" onClick={() => setOpen(true)}>
          Change password
        </button>
      )}

      {open && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3 className="h3">
                {mustChange ? "Set your new password" : "Change password"}
              </h3>
            </div>
            <form className="modal-body stack" onSubmit={submit}>
              <div className="stack-xs">
                <label className="label">New password</label>
                <input
                  type="password"
                  className="input"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="stack-xs">
                <label className="label">Confirm new password</label>
                <input
                  type="password"
                  className="input"
                  value={pwd2}
                  onChange={(e) => setPwd2(e.target.value)}
                />
              </div>

              {err && <div className="alert error">{err}</div>}
              {msg && <div className="alert success">{msg}</div>}

              <div className="modal-footer">
                {!mustChange && (
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() => setOpen(false)}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                )}
                <button className="btn btn-primary" disabled={busy}>
                  {busy ? "Saving…" : "Save password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.35);
          display: grid;
          place-items: center;
          z-index: 50;
        }
        .modal {
          width: 100%;
          max-width: 520px;
          background: white;
          border-radius: 14px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        .modal-header {
          padding: 16px 20px;
          border-bottom: 1px solid #eee;
        }
        .modal-body {
          padding: 16px 20px;
        }
        .modal-footer {
          margin-top: 8px;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
      `}</style>
    </>
  );
}
