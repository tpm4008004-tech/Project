"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

const ADMIN_ROLES = ["CEO", "CPO", "PO"];

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role) {
      router.push("/login");
    } else {
      setUserRole(role);
      fetchProjects();
    }
  }, [router]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
    router.push("/login");
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const newProject = await res.json();
      setProjects([...projects, newProject]);
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
    } catch (error) {
      console.error("Failed to add project", error);
    }
  };

  const deleteProject = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project?")) return;
    
    try {
      setProjects(projects.filter(p => p.id !== id));
      await fetch(`/api/projects?id=${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to delete project", error);
      fetchProjects();
    }
  };

  const isAdmin = userRole && ADMIN_ROLES.includes(userRole);

  if (loading || !userRole) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <main className={`${styles.container} animate-fade-in`}>
      <header className={styles.header}>
        <h1 className={styles.title}>Project Dashboard</h1>
        
        <div className={styles.userProfile}>
          <span className={styles.userRole}>{userRole}</span>
          {isAdmin && (
          <>
             <Link href="/users">
                <button className="glass-button" style={{ background: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.25)' }}>👥 Users</button>
              </Link>
              <Link href="/settings">
                <button className="glass-button" style={{ background: 'rgba(255,255,255,0.1)' }}>⚙️ Template</button>
              </Link>
              <button className="glass-button" onClick={() => setIsModalOpen(true)}>
                + New Project
              </button>
            </>
          )}
         <Link href="/overview">
            <button className="glass-button" style={{ background: 'rgba(167,139,250,0.15)', borderColor: 'rgba(167,139,250,0.3)' }}>📊 Overview</button>
          </Link>
          <Link href="/change-password">
            <button className="glass-button" style={{ background: 'rgba(255,255,255,0.07)', fontSize: '0.85rem' }}>🔑 Change Password</button>
          </Link>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className={styles.board}>
        {projects.map(project => {
          const totalTasks = project.tasks ? project.tasks.length : 0;
          const completedTasks = project.tasks ? project.tasks.filter(t => t.status === "Done").length : 0;
          const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

          return (
            <Link href={`/project/${project.id}`} key={project.id} style={{ textDecoration: 'none' }}>
              <div className={`${styles.projectCard} glass-panel`}>
                <h3 className={styles.cardTitle}>{project.title}</h3>
                {project.description && (
                  <p className={styles.cardDescription}>{project.description}</p>
                )}
                
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${progressPercent}%` }}></div>
                </div>
                <div className={styles.progressText}>
                  {completedTasks} / {totalTasks} Tasks Done
                </div>

                {isAdmin && (
                  <button 
                    className={styles.deleteBtn}
                    onClick={(e) => deleteProject(e, project.id)}
                  >
                    Delete Project
                  </button>
                )}
              </div>
            </Link>
          );
        })}
        {projects.length === 0 && (
          <p style={{ color: "var(--text-secondary)" }}>No projects found. Create one to get started!</p>
        )}
      </div>

      {/* Add Project Modal */}
      <div className={`${styles.modalOverlay} ${isModalOpen ? styles.open : ""}`}>
        <div className={`${styles.modal} glass-panel`}>
          <h2 className={styles.modalTitle}>New Project</h2>
          <form onSubmit={handleAddProject}>
            <div className={styles.formGroup}>
              <label>Project Title</label>
              <input 
                type="text" 
                className="glass-input" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Redesign Landing Page"
                required
                autoFocus
              />
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea 
                className="glass-input" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
                rows={3}
              />
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="glass-button">
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
