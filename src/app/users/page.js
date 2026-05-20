"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../page.module.css";

const ROLE_HIERARCHY = {
  "CEO": ["CPO", "PO", "Architect", "Franchise Owner"],
  "CPO": ["PO", "Architect", "Franchise Owner"],
  "PO": ["Architect", "Franchise Owner"],
};

const ROLE_COLORS = {
  "CEO":              { bg: "rgba(167,139,250,0.15)", color: "#a78bfa" },
  "CPO":              { bg: "rgba(96,165,250,0.15)",  color: "#60a5fa" },
  "PO":               { bg: "rgba(52,211,153,0.15)",  color: "#34d399" },
  "Architect":        { bg: "rgba(251,191,36,0.15)",  color: "#fbbf24" },
  "Franchise Owner":  { bg: "rgba(249,115,22,0.15)",  color: "#f97316" },
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role || !ROLE_HIERARCHY[role]) {
      alert("Access denied.");
      router.push("/");
      return;
    }
    setUserRole(role);
    setNewRole(ROLE_HIERARCHY[role][0]);
    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    } catch {
      setMessage({ text: "Failed to load users.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callerRole: userRole, username: newUsername.trim(), password: newPassword, role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: `User "${newUsername}" created successfully!`, type: "success" });
        setNewUsername("");
        setNewPassword("");
        setNewRole(ROLE_HIERARCHY[userRole][0]);
        fetchUsers();
      } else {
        setMessage({ text: data.error || "Failed to create user.", type: "error" });
      }
    } catch {
      setMessage({ text: "An error occurred.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (targetUsername) => {
    if (!confirm(`Delete user "${targetUsername}"? This cannot be undone.`)) return;
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callerRole: userRole, targetUsername }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.filter(u => u.username !== targetUsername));
        setMessage({ text: `User "${targetUsername}" deleted.`, type: "success" });
      } else {
        setMessage({ text: data.error || "Failed to delete.", type: "error" });
      }
    } catch {
      setMessage({ text: "An error occurred.", type: "error" });
    }
  };

  const allowedRoles = ROLE_HIERARCHY[userRole] || [];
  // Users visible: only those whose role is below the caller
  const visibleUsers = users.filter(u => allowedRoles.includes(u.role));

  if (loading) return <div className={styles.container}>Loading...</div>;

  return (
    <main className={styles.container}>
      <header className={styles.header} style={{ marginBottom: '2rem' }}>
        <div>
          <Link href="/">
            <button className="glass-button" style={{ marginBottom: '0.75rem', background: 'rgba(255,255,255,0.08)' }}>
              ← Back to Dashboard
            </button>
          </Link>
          <h1 className={styles.title}>User Management</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Manage accounts below your role level
          </p>
        </div>
        <span className={styles.userRole}>{userRole}</span>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '2rem', alignItems: 'start' }}>

        {/* ── Create User Form ── */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem' }}>Add New User</h2>

          {message.text && (
            <div style={{
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              background: message.type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              color: message.type === 'success' ? '#4ade80' : '#f87171',
              border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`
            }}>
              {message.type === 'success' ? '✅ ' : '⚠️ '}{message.text}
            </div>
          )}

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Username</label>
              <input
                type="text"
                className="glass-input"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder="e.g. john_architect"
                required
                minLength={2}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Password</label>
              <input
                type="password"
                className="glass-input"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 4 characters"
                required
                minLength={4}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Role</label>
              <select
                className="glass-input"
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                {allowedRoles.map(r => (
                  <option key={r} value={r} style={{ background: '#1a1a2e', color: 'white' }}>{r}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="glass-button"
              disabled={submitting}
              style={{ marginTop: '0.25rem', padding: '0.7rem', fontSize: '0.95rem' }}
            >
              {submitting ? "Creating..." : "+ Create User"}
            </button>
          </form>
        </div>

        {/* ── User List ── */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem' }}>
            Existing Users
            <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
              ({visibleUsers.length} under your level)
            </span>
          </h2>

          {visibleUsers.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No users below your role yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {visibleUsers.map(u => {
                const roleStyle = ROLE_COLORS[u.role] || { bg: 'rgba(255,255,255,0.08)', color: 'white' };
                return (
                  <div key={u.username} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <div style={{
                      width: '36px', height: '36px',
                      borderRadius: '50%',
                      background: roleStyle.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', flexShrink: 0
                    }}>
                      👤
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{u.username}</div>
                      <span style={{
                        display: 'inline-block',
                        marginTop: '0.15rem',
                        padding: '0.1rem 0.55rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 500,
                        background: roleStyle.bg,
                        color: roleStyle.color
                      }}>
                        {u.role}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(u.username)}
                      style={{
                        padding: '0.3rem 0.7rem',
                        borderRadius: '6px',
                        background: 'rgba(239,68,68,0.1)',
                        color: '#f87171',
                        border: '1px solid rgba(239,68,68,0.2)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.target.style.background = 'rgba(239,68,68,0.25)'}
                      onMouseLeave={e => e.target.style.background = 'rgba(239,68,68,0.1)'}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
