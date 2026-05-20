"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

const ADMIN_ROLES = ["CEO", "CPO", "PO"];

export default function Settings() {
  const [template, setTemplate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSubtaskTexts, setNewSubtaskTexts] = useState({});
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role || !ADMIN_ROLES.includes(role)) {
      alert("You do not have permission to view this page.");
      router.push("/");
    } else {
      fetchTemplate();
    }
  }, [router]);

  const fetchTemplate = async () => {
    try {
      const res = await fetch("/api/template");
      const data = await res.json();
      setTemplate(data);
    } catch (error) {
      console.error("Failed to fetch template", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await fetch("/api/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });
      alert("Template saved successfully!");
    } catch (error) {
      console.error("Failed to save template", error);
    }
  };

  const updateTask = (index, value) => {
    const newTemplate = [...template];
    newTemplate[index].name = value;
    setTemplate(newTemplate);
  };

  const updateTaskTiming = (index, value) => {
    const newTemplate = [...template];
    newTemplate[index].probableTiming = value;
    setTemplate(newTemplate);
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newTemplate = [...template];
    const temp = newTemplate[index];
    newTemplate[index] = newTemplate[index - 1];
    newTemplate[index - 1] = temp;
    setTemplate(newTemplate);
  };

  const moveDown = (index) => {
    if (index === template.length - 1) return;
    const newTemplate = [...template];
    const temp = newTemplate[index];
    newTemplate[index] = newTemplate[index + 1];
    newTemplate[index + 1] = temp;
    setTemplate(newTemplate);
  };

  const removeTask = (index) => {
    setTemplate(template.filter((_, i) => i !== index));
  };

  const updateSubtask = (taskIndex, subtaskIndex, value) => {
    const newTemplate = [...template];
    newTemplate[taskIndex].subtasks[subtaskIndex].text = value;
    setTemplate(newTemplate);
  };

  const updateSubtaskTiming = (taskIndex, subtaskIndex, value) => {
    const newTemplate = [...template];
    newTemplate[taskIndex].subtasks[subtaskIndex].probableTiming = value;
    setTemplate(newTemplate);
  };

  const addSubtask = (taskIndex, text) => {
    const newTemplate = [...template];
    if (!newTemplate[taskIndex].subtasks) {
      newTemplate[taskIndex].subtasks = [];
    }
    newTemplate[taskIndex].subtasks.push({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      text: text,
      status: "To Do",
      comments: []
    });
    setTemplate(newTemplate);
  };

  const removeSubtask = (taskIndex, subtaskIndex) => {
    const newTemplate = [...template];
    newTemplate[taskIndex].subtasks = newTemplate[taskIndex].subtasks.filter((_, i) => i !== subtaskIndex);
    setTemplate(newTemplate);
  };

  const addTask = () => {
    setTemplate([...template, { id: Date.now().toString(), name: "New Task", subtasks: [] }]);
  };

  if (loading) return <div className={styles.container}>Loading...</div>;

  return (
    <main className={`${styles.container} animate-fade-in`}>
      <header className={styles.header}>
        <h1 className={styles.title}>Global Template Settings</h1>
        <div>
          <Link href="/">
            <button className="glass-button" style={{ marginRight: '1rem', background: 'rgba(255,255,255,0.1)' }}>Back to Board</button>
          </Link>
          <button className="glass-button" onClick={handleSave}>Save Template</button>
        </div>
      </header>

      <div className={`${styles.card} glass-panel`}>
        <h3>Default Tasks Sequence</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          This sequence applies to all newly created projects. Top to bottom represents first to last.
        </p>

        <div className={styles.taskList} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {template.map((task, index) => (
            <div key={task.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div className={styles.taskRow} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ minWidth: '30px', color: 'var(--text-secondary)' }}>{index + 1}.</span>
                <input 
                  type="text" 
                  className={`glass-input ${styles.taskInput}`}
                  value={task.name || ""}
                  onChange={(e) => updateTask(index, e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className={styles.iconBtn} onClick={() => moveUp(index)}>↑</button>
                <button className={styles.iconBtn} onClick={() => moveDown(index)}>↓</button>
                <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => removeTask(index)}>✕</button>
              </div>
              
              <div style={{ paddingLeft: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>Default Subtasks</h4>
                {task.subtasks && task.subtasks.map((st, sIndex) => (
                  <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>-</span>
                    <input 
                      type="text" 
                      className="glass-input" 
                      value={st.text || ""}
                      onChange={(e) => updateSubtask(index, sIndex, e.target.value)}
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.9rem', flex: 1, maxWidth: '300px' }}
                    />
                    <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => removeSubtask(index, sIndex)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>✕</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <input 
                    type="text"
                    className="glass-input"
                    placeholder="+ Add default subtask"
                    value={newSubtaskTexts[task.id] || ""}
                    onChange={e => setNewSubtaskTexts({ ...newSubtaskTexts, [task.id]: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newSubtaskTexts[task.id]?.trim()) {
                          addSubtask(index, newSubtaskTexts[task.id]);
                          setNewSubtaskTexts({ ...newSubtaskTexts, [task.id]: "" });
                        }
                      }
                    }}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.9rem', width: '250px' }}
                  />
                  <button className="glass-button" style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }} onClick={() => {
                    if (newSubtaskTexts[task.id]?.trim()) {
                      addSubtask(index, newSubtaskTexts[task.id]);
                      setNewSubtaskTexts({ ...newSubtaskTexts, [task.id]: "" });
                    }
                  }}>Add</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="glass-button" onClick={addTask}>+ Add Task</button>
      </div>
    </main>
  );
}
