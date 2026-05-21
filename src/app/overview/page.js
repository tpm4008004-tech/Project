"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

const ADMIN_ROLES = ["CEO", "CPO", "PO"];

export default function Overview() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [allTaskNames, setAllTaskNames] = useState([]);
  const [expandedCell, setExpandedCell] = useState(null); // "projectId-taskName"
  const router = useRouter();

  useEffect(() => {
    fetchProjects();
  }, [router]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data);

      // Collect all unique task names across all projects (preserve order)
      const taskNameSet = new Set();
      data.forEach(p => {
        if (p.tasks) {
          p.tasks
            .sort((a, b) => (a.sequenceIndex || 0) - (b.sequenceIndex || 0))
            .forEach(t => taskNameSet.add(t.name));
        }
      });
      setAllTaskNames([...taskNameSet]);
    } catch (err) {
      console.error("Failed to fetch", err);
    } finally {
      setLoading(false);
    }
  };

  const saveTask = async (projectId, taskId, field, value) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const updatedTasks = project.tasks.map(t =>
      t.id === taskId ? { ...t, [field]: value } : t
    );
    const updatedProject = { ...project, tasks: updatedTasks };

    // Optimistic update
    setProjects(projects.map(p => p.id === projectId ? updatedProject : p));

    try {
      await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProject),
      });
    } catch (err) {
      console.error("Failed to save", err);
    }
  };

  const getStatusColor = (status) => {
    if (status === "Done") return "#22c55e";
    if (status === "In Progress") return "#f59e0b";
    return "rgba(255,255,255,0.3)";
  };

  const getStatusBg = (status) => {
    if (status === "Done") return "rgba(34,197,94,0.12)";
    if (status === "In Progress") return "rgba(245,158,11,0.12)";
    return "rgba(255,255,255,0.03)";
  };

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
          <h1 className={styles.title}>Project Overview</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            All projects × tasks — click any cell to view or edit details
          </p>
        </div>
        <span className={styles.userRole}>{userRole}</span>
      </header>

      <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.88rem',
          minWidth: `${Math.max(900, allTaskNames.length * 220 + 200)}px`
        }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
              <th style={{
                padding: '0.9rem 1.2rem',
                textAlign: 'left',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                borderRight: '1px solid rgba(255,255,255,0.08)',
                fontWeight: 600,
                fontSize: '0.9rem',
                minWidth: '180px',
                position: 'sticky',
                left: 0,
                background: 'rgba(15,15,25,0.95)',
                zIndex: 2
              }}>
                Project
              </th>
              {allTaskNames.map(name => (
                <th key={name} style={{
                  padding: '0.9rem 1rem',
                  textAlign: 'left',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  minWidth: '200px',
                  maxWidth: '260px'
                }}>
                  {name}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {projects.map((project, pIndex) => (
              <tr
                key={project.id}
                style={{ background: pIndex % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
              >
                {/* Project name cell */}
                <td style={{
                  padding: '1rem 1.2rem',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  borderRight: '1px solid rgba(255,255,255,0.08)',
                  position: 'sticky',
                  left: 0,
                  background: pIndex % 2 === 0 ? 'rgba(15,15,25,0.97)' : 'rgba(20,20,32,0.97)',
                  zIndex: 1
                }}>
                  <Link href={`/project/${project.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ fontWeight: 600, color: 'white', marginBottom: '0.2rem' }}>{project.title}</div>
                  </Link>
                  {project.description && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                      {project.description}
                    </div>
                  )}
                  <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {project.tasks ? `${project.tasks.filter(t => t.status === "Done").length}/${project.tasks.length} done` : '0 tasks'}
                  </div>
                </td>

                {/* Task cells */}
                {allTaskNames.map(taskName => {
                  const task = project.tasks?.find(t => t.name === taskName);
                  const cellKey = `${project.id}-${taskName}`;
                  const isExpanded = expandedCell === cellKey;

                  if (!task) {
                    return (
                      <td key={taskName} style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        borderRight: '1px solid rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.15)',
                        fontSize: '0.78rem',
                        fontStyle: 'italic'
                      }}>
                        —
                      </td>
                    );
                  }

                  const commentCount = task.comments ? task.comments.length : 0;
                  const statusColor = getStatusColor(task.status);

                  return (
                    <td key={taskName} style={{
                      padding: '0',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      borderRight: '1px solid rgba(255,255,255,0.05)',
                      verticalAlign: 'top',
                      background: getStatusBg(task.status),
                    }}>
                      {/* Collapsed header — always visible */}
                      <div
                        onClick={() => setExpandedCell(isExpanded ? null : cellKey)}
                        style={{ padding: '0.7rem 1rem', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                          <span style={{
                            display: 'inline-block',
                            width: '8px', height: '8px',
                            borderRadius: '50%',
                            background: statusColor,
                            flexShrink: 0
                          }} />
                          <span style={{ fontSize: '0.78rem', color: statusColor, fontWeight: 500 }}>
                            {task.status}
                          </span>
                          <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        </div>

                        {task.completionDate && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            📅 {new Date(task.completionDate + "T00:00:00").toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        )}

                        {commentCount > 0 && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            💬 {commentCount} comment{commentCount !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>

                      {/* Expanded panel */}
                      {isExpanded && (
                        <div style={{ padding: '0 1rem 1rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }} onClick={e => e.stopPropagation()}>

                          {/* Status toggle */}
                          <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
                            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>STATUS</label>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {["To Do", "In Progress", "Done"].map(s => (
                                <button
                                  key={s}
                                  onClick={() => saveTask(project.id, task.id, 'status', s)}
                                  style={{
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.72rem',
                                    cursor: 'pointer',
                                    background: task.status === s ? getStatusColor(s) : 'rgba(255,255,255,0.07)',
                                    color: task.status === s ? '#000' : 'var(--text-secondary)',
                                    fontWeight: task.status === s ? 600 : 400,
                                    border: 'none',
                                    transition: 'all 0.15s'
                                  }}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Completion Date */}
                          <div style={{ marginBottom: '0.75rem' }}>
                            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>COMPLETION DATE</label>
                            <input
                              type="date"
                              value={task.completionDate || ""}
                              onChange={e => saveTask(project.id, task.id, 'completionDate', e.target.value)}
                              style={{
                                background: 'rgba(255,255,255,0.07)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '5px',
                                color: 'white',
                                fontSize: '0.8rem',
                                padding: '0.3rem 0.5rem',
                                width: '100%'
                              }}
                            />
                          </div>

                          {/* Description */}
                          <div style={{ marginBottom: '0.75rem' }}>
                            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>DESCRIPTION</label>
                            <textarea
                              rows="3"
                              value={task.description || ""}
                              onChange={e => saveTask(project.id, task.id, 'description', e.target.value)}
                              placeholder="Add a description..."
                              style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '5px',
                                color: 'white',
                                fontSize: '0.8rem',
                                padding: '0.4rem 0.6rem',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                lineHeight: 1.4
                              }}
                            />
                          </div>

                          {/* Comments */}
                          {commentCount > 0 && (
                            <div>
                              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>COMMENTS</label>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '160px', overflowY: 'auto' }}>
                                {task.comments.map(c => (
                                  <div key={c.id} style={{
                                    padding: '0.4rem 0.6rem',
                                    background: 'rgba(255,255,255,0.04)',
                                    borderRadius: '5px',
                                    borderLeft: '2px solid rgba(167,139,250,0.4)'
                                  }}>
                                    <div style={{ fontSize: '0.7rem', color: '#a78bfa', marginBottom: '0.15rem', fontWeight: 500 }}>{c.author}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.3 }}>{c.text}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                      {new Date(c.timestamp).toLocaleString()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <Link href={`/project/${project.id}`} style={{ textDecoration: 'none' }}>
                            <button style={{
                              marginTop: '0.75rem',
                              width: '100%',
                              padding: '0.35rem',
                              background: 'rgba(167,139,250,0.12)',
                              border: '1px solid rgba(167,139,250,0.25)',
                              borderRadius: '5px',
                              color: '#a78bfa',
                              fontSize: '0.78rem',
                              cursor: 'pointer'
                            }}>
                              Open Project →
                            </button>
                          </Link>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {projects.length === 0 && (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '3rem' }}>
          No projects yet.
        </p>
      )}
    </main>
  );
}
