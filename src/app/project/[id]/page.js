"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

export default function ProjectDetail() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id;

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [username, setUsername] = useState(null);

  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const [newSubtaskComment, setNewSubtaskComment] = useState("");
  const [newSubtaskInput, setNewSubtaskInput] = useState({});

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const uname = localStorage.getItem("username");
    if (!role) {
      router.push("/login");
    } else {
      setUserRole(role);
      setUsername(uname);
      fetchProject();
    }
  }, [projectId, router]);

  const fetchProject = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      const p = data.find((p) => p.id === projectId);
      if (p) {
        p.tasks.sort((a, b) => (a.sequenceIndex || 0) - (b.sequenceIndex || 0));
        setProject(p);
      } else {
        alert("Project not found");
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to fetch project", error);
    } finally {
      setLoading(false);
    }
  };

  const saveProject = async (updatedProject) => {
    setProject(updatedProject);
    try {
      await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProject),
      });
    } catch (error) {
      console.error("Failed to save", error);
    }
  };

  const handleAddSubtask = (e, taskId) => {
    e.preventDefault();
    const text = newSubtaskInput[taskId] || "";
    if (!text.trim()) return;

    const taskIndex = project.tasks.findIndex(t => t.id === taskId);
    const updatedTasks = [...project.tasks];
    const st = updatedTasks[taskIndex].subtasks || [];
    st.push({ id: Date.now().toString(), text: text.trim(), status: "To Do", comments: [], completionDate: "" });
    updatedTasks[taskIndex].subtasks = st;

    saveProject({ ...project, tasks: updatedTasks });
    setNewSubtaskInput({ ...newSubtaskInput, [taskId]: "" });
  };

  const updateSubtaskStatus = (taskId, subtaskId, newStatus) => {
    const taskIndex = project.tasks.findIndex(t => t.id === taskId);
    const updatedTasks = [...project.tasks];
    const st = updatedTasks[taskIndex].subtasks.map(s =>
      s.id === subtaskId ? { ...s, status: newStatus } : s
    );
    updatedTasks[taskIndex].subtasks = st;
    saveProject({ ...project, tasks: updatedTasks });
  };

  const updateSubtaskCompletionDate = (taskId, subtaskId, date) => {
    const taskIndex = project.tasks.findIndex(t => t.id === taskId);
    const updatedTasks = [...project.tasks];
    const st = updatedTasks[taskIndex].subtasks.map(s =>
      s.id === subtaskId ? { ...s, completionDate: date } : s
    );
    updatedTasks[taskIndex].subtasks = st;
    saveProject({ ...project, tasks: updatedTasks });
  };

  const handleAddComment = (e, taskId) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const taskIndex = project.tasks.findIndex(t => t.id === taskId);
    const updatedTasks = [...project.tasks];
    const comments = updatedTasks[taskIndex].comments || [];
    comments.push({
      id: Date.now().toString(),
      text: newComment,
      author: `${userRole} (${username})`,
      timestamp: new Date().toISOString()
    });
    updatedTasks[taskIndex].comments = comments;

    saveProject({ ...project, tasks: updatedTasks });
    setNewComment("");
  };

  const handleAddSubtaskComment = (e, taskId, subtaskId) => {
    e.preventDefault();
    if (!newSubtaskComment.trim()) return;

    const taskIndex = project.tasks.findIndex(t => t.id === taskId);
    const updatedTasks = [...project.tasks];
    const st = updatedTasks[taskIndex].subtasks.map(s => {
      if (s.id === subtaskId) {
        const comments = s.comments || [];
        comments.push({
          id: Date.now().toString(),
          text: newSubtaskComment,
          author: `${userRole} (${username})`,
          timestamp: new Date().toISOString()
        });
        return { ...s, comments };
      }
      return s;
    });
    updatedTasks[taskIndex].subtasks = st;

    saveProject({ ...project, tasks: updatedTasks });
    setNewSubtaskComment("");
  };

  const updateTask = (index, field, value) => {
    const updatedTasks = [...project.tasks];
    updatedTasks[index][field] = value;
    saveProject({ ...project, tasks: updatedTasks });
  };

  const updateTaskCompletionDate = (index, date) => {
    const updatedTasks = [...project.tasks];
    updatedTasks[index].completionDate = date;
    saveProject({ ...project, tasks: updatedTasks });
  };

  const moveTaskSeqUp = (index) => {
    if (index === 0) return;
    const updatedTasks = [...project.tasks];
    const temp = updatedTasks[index];
    updatedTasks[index] = updatedTasks[index - 1];
    updatedTasks[index - 1] = temp;
    updatedTasks.forEach((t, i) => t.sequenceIndex = i);
    saveProject({ ...project, tasks: updatedTasks });
  };

  const moveTaskSeqDown = (index) => {
    if (index === project.tasks.length - 1) return;
    const updatedTasks = [...project.tasks];
    const temp = updatedTasks[index];
    updatedTasks[index] = updatedTasks[index + 1];
    updatedTasks[index + 1] = temp;
    updatedTasks.forEach((t, i) => t.sequenceIndex = i);
    saveProject({ ...project, tasks: updatedTasks });
  };

  const removeTask = (index) => {
    const updatedTasks = project.tasks.filter((_, i) => i !== index);
    updatedTasks.forEach((t, i) => t.sequenceIndex = i);
    saveProject({ ...project, tasks: updatedTasks });
  };

  const addTask = () => {
    const updatedTasks = [...project.tasks, {
      id: Date.now().toString(),
      name: "New Task",
      description: "",
      status: "To Do",
      completionDate: "",
      subtasks: [],
      comments: []
    }];
    updatedTasks.forEach((t, i) => t.sequenceIndex = i);
    saveProject({ ...project, tasks: updatedTasks });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isAdmin = userRole && ["CEO", "CPO", "PO"].includes(userRole);

  if (loading || !project) return <div className={styles.container}>Loading...</div>;

  return (
    <main className={`${styles.container} animate-fade-in`}>
      <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Link href="/">
            <button className="glass-button" style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.1)' }}>
              ← Back to Dashboard
            </button>
          </Link>
          <h1 className={styles.title}>{project.title}</h1>
          <p style={{ color: "var(--text-secondary)" }}>{project.description}</p>
        </div>

        {isAdmin && (
          <button className="glass-button" onClick={() => setSelectedTask("EDIT_SEQUENCE")}>
            ⚙️ Edit Project Tasks
          </button>
        )}
      </header>

      <div className={styles.board} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {project.tasks.map((task, index) => {
          const subCount = task.subtasks ? task.subtasks.length : 0;
          const subDone = task.subtasks ? task.subtasks.filter(s => s.status === "Done" || s.completed).length : 0;
          const commentCount = task.comments ? task.comments.length : 0;
          const isDoneDisabled = subCount > 0 && subDone < subCount;

          return (
            <div key={task.id} style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {/* Main Task Row */}
              <div
                className={styles.taskRow}
                style={{ padding: '0.6rem 0' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
                  <input
                    type="checkbox"
                    checked={task.status === "Done"}
                    disabled={!isAdmin || isDoneDisabled}
                    title={isDoneDisabled ? "Complete all subtasks first" : (!isAdmin ? "View only" : "")}
                    onChange={(e) => {
                      const updatedTasks = [...project.tasks];
                      updatedTasks[index].status = e.target.checked ? "Done" : "To Do";
                      saveProject({ ...project, tasks: updatedTasks });
                    }}
                    style={{ width: '1.2rem', height: '1.2rem', marginTop: '0.2rem', cursor: isDoneDisabled ? 'not-allowed' : 'pointer', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    {/* Task name + completion date inline */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span
                        className={styles.taskTitle}
                        style={{ margin: 0, fontSize: '1.05rem', textDecoration: task.status === "Done" ? 'line-through' : 'none', opacity: task.status === "Done" ? 0.55 : 1 }}
                      >
                        {task.name}
                      </span>

                      {/* Completion Date input inline */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>📅</span>
                        <input
                          type="date"
                          disabled={!isAdmin}
                          value={task.completionDate || ""}
                          onChange={(e) => updateTaskCompletionDate(index, e.target.value)}
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '4px',
                            color: task.completionDate ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontSize: '0.8rem',
                            padding: '0.15rem 0.4rem',
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                    </div>

                    {/* Description — inline editable */}
                    <textarea
                      readOnly={!isAdmin}
                      rows={task.description ? Math.min(4, (task.description.match(/\n/g) || []).length + 2) : 1}
                      value={task.description || ""}
                      onChange={(e) => {
                        const updatedTasks = [...project.tasks];
                        updatedTasks[index].description = e.target.value;
                        setProject({ ...project, tasks: updatedTasks });
                      }}
                      onBlur={(e) => updateTask(index, 'description', e.target.value)}
                      placeholder="Add a description..."
                      style={{
                        display: 'block',
                        marginTop: '0.3rem',
                        width: '100%',
                        maxWidth: '600px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px dashed rgba(255,255,255,0.1)',
                        color: task.description ? 'var(--text-secondary)' : 'rgba(255,255,255,0.2)',
                        fontSize: '0.85rem',
                        lineHeight: 1.5,
                        resize: 'none',
                        outline: 'none',
                        fontFamily: 'inherit',
                        padding: '0.1rem 0',
                        cursor: 'text',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={e => e.target.style.borderBottomColor = 'rgba(167,139,250,0.5)'}
                      onBlurCapture={e => e.target.style.borderBottomColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>
                </div>
              </div>

              {/* Subtasks */}
              <div style={{ paddingLeft: '2.5rem', paddingBottom: '0.75rem' }}>
                {task.subtasks && task.subtasks.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem', marginTop: '0.25rem' }}>
                    {task.subtasks.map(st => {
                      const isDone = st.status === "Done" || st.completed;
                      const stCommentCount = st.comments ? st.comments.length : 0;

                      return (
                        <div key={st.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <input
                              type="checkbox"
                              disabled={!isAdmin}
                              checked={isDone}
                              onChange={(e) => updateSubtaskStatus(task.id, st.id, e.target.checked ? "Done" : "To Do")}
                              style={{ cursor: 'pointer', flexShrink: 0 }}
                            />
                            <span style={{ fontSize: '0.92rem', textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.55 : 1 }}>
                              {st.text}
                            </span>

                            {/* Subtask completion date */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>📅</span>
                              <input
                                type="date"
                                disabled={!isAdmin}
                                value={st.completionDate || ""}
                                onChange={(e) => updateSubtaskCompletionDate(task.id, st.id, e.target.value)}
                                style={{
                                  background: 'rgba(255,255,255,0.06)',
                                  border: '1px solid rgba(255,255,255,0.12)',
                                  borderRadius: '4px',
                                  color: st.completionDate ? 'var(--text-primary)' : 'var(--text-secondary)',
                                  fontSize: '0.75rem',
                                  padding: '0.1rem 0.3rem',
                                  cursor: 'pointer'
                                }}
                              />
                            </div>

                            <div style={{ flex: 1 }} />

                            {/* Comments toggle */}
                            <div
                              onClick={() => setExpandedTaskId(expandedTaskId === `st-comments-${st.id}` ? null : `st-comments-${st.id}`)}
                              style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.78rem', userSelect: 'none' }}
                            >
                              💬 {stCommentCount} {expandedTaskId === `st-comments-${st.id}` ? '▲' : '▼'}
                            </div>
                          </div>

                          {expandedTaskId === `st-comments-${st.id}` && (
                            <div style={{ marginLeft: '1.5rem', padding: '0.75rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                              <div className={styles.commentList} style={{ maxHeight: '150px', marginBottom: '0.75rem' }}>
                                {st.comments && st.comments.map(c => (
                                  <div key={c.id} className={styles.commentItem} style={{ padding: '0.6rem' }}>
                                    <div className={styles.commentAuthor}>{c.author}</div>
                                    <div className={styles.commentText} style={{ fontSize: '0.85rem' }}>{c.text}</div>
                                    <div className={styles.commentDate} style={{ fontSize: '0.65rem' }}>{new Date(c.timestamp).toLocaleString()}</div>
                                  </div>
                                ))}
                                {(!st.comments || st.comments.length === 0) && (
                                  <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>No comments yet.</p>
                                )}
                              </div>
                              <form className={styles.commentInputBox} onSubmit={(e) => handleAddSubtaskComment(e, task.id, st.id)}>
                                <textarea
                                  className="glass-input"
                                  rows="2"
                                  placeholder="Write a comment..."
                                  value={newSubtaskComment}
                                  onChange={e => setNewSubtaskComment(e.target.value)}
                                  style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                                ></textarea>
                                <button type="submit" className="glass-button" style={{ alignSelf: 'flex-end', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Post</button>
                              </form>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add subtask */}
                {isAdmin && (
                  <form onSubmit={(e) => handleAddSubtask(e, task.id)} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <input
                      type="text"
                      className="glass-input"
                      placeholder="+ Add subtask"
                      value={newSubtaskInput[task.id] || ""}
                      onChange={e => setNewSubtaskInput({ ...newSubtaskInput, [task.id]: e.target.value })}
                      style={{ padding: '0.35rem 0.7rem', fontSize: '0.88rem', width: '220px' }}
                    />
                    {(newSubtaskInput[task.id] || "").trim() && (
                      <button type="submit" className="glass-button" style={{ padding: '0.35rem 0.7rem', fontSize: '0.85rem' }}>Add</button>
                    )}
                  </form>
                )}

                {/* Task Comments */}
                <div style={{ marginTop: '0.75rem' }}>
                  <div
                    onClick={() => setExpandedTaskId(expandedTaskId === `comments-${task.id}` ? null : `comments-${task.id}`)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', userSelect: 'none' }}
                  >
                    <span>💬 Comments ({commentCount})</span>
                    <span>{expandedTaskId === `comments-${task.id}` ? '▲' : '▼'}</span>
                  </div>

                  {expandedTaskId === `comments-${task.id}` && (
                    <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                      <div className={styles.commentList} style={{ maxHeight: '200px', marginBottom: '1rem' }}>
                        {task.comments && task.comments.map(c => (
                          <div key={c.id} className={styles.commentItem}>
                            <div className={styles.commentAuthor}>{c.author}</div>
                            <div className={styles.commentText}>{c.text}</div>
                            <div className={styles.commentDate}>{new Date(c.timestamp).toLocaleString()}</div>
                          </div>
                        ))}
                        {(!task.comments || task.comments.length === 0) && (
                          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>No comments yet.</p>
                        )}
                      </div>
                      <form className={styles.commentInputBox} onSubmit={(e) => handleAddComment(e, task.id)}>
                        <textarea
                          className="glass-input"
                          rows="2"
                          placeholder="Write a comment..."
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                        ></textarea>
                        <button type="submit" className="glass-button" style={{ alignSelf: 'flex-end', padding: '0.5rem 1rem' }}>Post</button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {project.tasks.length === 0 && (
          <p style={{ color: "var(--text-secondary)" }}>No tasks yet.</p>
        )}
      </div>

      {/* Edit Project Tasks Modal */}
      {selectedTask === "EDIT_SEQUENCE" && (
        <div className={`${styles.modalOverlay} ${styles.open}`}>
          <div className={`${styles.modal} glass-panel`} style={{ maxWidth: '600px', width: '90%' }}>
            <div className={styles.modalHeader}>
              <h2>Edit Project Tasks</h2>
              <button className={styles.closeBtn} onClick={() => setSelectedTask(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Modify tasks for this project. Reorder, rename, add descriptions, and set timing.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem', maxHeight: '60vh', overflowY: 'auto' }}>
              {project.tasks.map((task, index) => (
                <div key={task.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', minWidth: '20px' }}>{index + 1}.</span>
                    <input
                      type="text"
                      className="glass-input"
                      value={task.name || ""}
                      onChange={(e) => updateTask(index, 'name', e.target.value)}
                      style={{ flex: 1 }}
                      placeholder="Task name"
                    />
                    <button className="glass-button" style={{ padding: '0.4rem 0.7rem' }} onClick={() => moveTaskSeqUp(index)}>↑</button>
                    <button className="glass-button" style={{ padding: '0.4rem 0.7rem' }} onClick={() => moveTaskSeqDown(index)}>↓</button>
                    <button className="glass-button danger" style={{ padding: '0.4rem 0.7rem' }} onClick={() => removeTask(index)}>✕</button>
                  </div>
                  <textarea
                    className="glass-input"
                    rows="2"
                    placeholder="Description (optional)"
                    value={task.description || ""}
                    onChange={(e) => updateTask(index, 'description', e.target.value)}
                    style={{ fontSize: '0.88rem', resize: 'vertical' }}
                  />
                </div>
              ))}
            </div>
            <button className="glass-button" onClick={addTask}>+ Add Task</button>
          </div>
        </div>
      )}
    </main>
  );
}
