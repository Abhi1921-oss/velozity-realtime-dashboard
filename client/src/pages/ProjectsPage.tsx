import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { projectsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { FolderKanban, Plus, User, Building, CheckSquare, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canCreateProject = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectsApi.getAll();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [user?.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Projects Portfolio
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {user?.role === 'ADMIN' && 'Full agency oversight across all client initiatives.'}
            {user?.role === 'PROJECT_MANAGER' && 'Projects strictly created and governed under your management.'}
            {user?.role === 'DEVELOPER' && 'Projects where you have assigned sprint deliverables.'}
          </p>
        </div>

        {canCreateProject && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: 'var(--radius-sm)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FolderKanban size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            No Projects Accessible
          </h3>
          <p style={{ fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto' }}>
            {user?.role === 'PROJECT_MANAGER'
              ? 'You have not created any projects yet. Click "New Project" to launch your first client workspace.'
              : 'No projects currently match your role permissions or active assignments.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {projects.map((project) => (
            <div
              key={project.id}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.3 }}>
                    {project.name}
                  </h3>
                </div>

                {project.description && (
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '1.25rem' }}>
                    {project.description}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                {project.client && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.785rem', color: 'var(--text-secondary)' }}>
                    <Building size={14} color="var(--primary)" />
                    <span>Client: <strong>{project.client.company}</strong> ({project.client.name})</span>
                  </div>
                )}

                {project.owner && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.785rem', color: 'var(--text-secondary)' }}>
                    <User size={14} color="#38bdf8" />
                    <span>Project Manager: <strong>{project.owner.name}</strong></span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <CheckSquare size={13} />
                    <strong>{project._count?.tasks ?? 0}</strong> tasks
                  </span>

                  <Link
                    to={`/tasks?projectId=${project.id}`}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem' }}
                  >
                    View Tasks
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={loadProjects}
      />
    </div>
  );
};
