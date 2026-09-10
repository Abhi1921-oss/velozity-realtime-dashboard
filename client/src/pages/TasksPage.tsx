import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Task, Project } from '../types';
import { tasksApi, projectsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { CheckSquare, Plus } from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const { onTaskUpdated, joinProject, leaveProject } = useSocket();
  const [searchParams] = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const canCreateTask = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';

  const currentProjectId = searchParams.get('projectId') || '';
  const currentStatus = searchParams.get('status') || '';
  const currentPriority = searchParams.get('priority') || '';
  const currentDueFrom = searchParams.get('dueDateFrom') || '';
  const currentDueTo = searchParams.get('dueDateTo') || '';
  const currentSearch = searchParams.get('search') || '';

  // Load project options for filters and creation
  useEffect(() => {
    projectsApi.getAll().then(setProjects).catch(console.error);
  }, [user?.id]);

  // Join WebSocket project room if filtered by project
  useEffect(() => {
    if (currentProjectId) {
      joinProject(currentProjectId);
      return () => leaveProject(currentProjectId);
    }
  }, [currentProjectId, joinProject, leaveProject]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tasksApi.getAll({
        projectId: currentProjectId || undefined,
        status: currentStatus || undefined,
        priority: currentPriority || undefined,
        dueDateFrom: currentDueFrom || undefined,
        dueDateTo: currentDueTo || undefined,
        search: currentSearch || undefined,
      });
      setTasks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when URL query parameters change (supporting shareable URLs!)
  useEffect(() => {
    loadTasks();
  }, [currentProjectId, currentStatus, currentPriority, currentDueFrom, currentDueTo, currentSearch]);

  // Real-time task update listener
  useEffect(() => {
    const unsubscribe = onTaskUpdated((updatedTask) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
      );
    });
    return unsubscribe;
  }, [onTaskUpdated]);

  const handleTaskStatusChanged = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Task Deliverables
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {user?.role === 'ADMIN' && 'Comprehensive task management across all agency projects.'}
            {user?.role === 'PROJECT_MANAGER' && 'Tasks belonging strictly to your owned client projects.'}
            {user?.role === 'DEVELOPER' && 'Your assigned deliverables queue with quick status progression.'}
          </p>
        </div>

        {canCreateTask && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus size={16} /> New Task
          </button>
        )}
      </div>

      {/* Shareable URL Filter Bar */}
      <TaskFilters projects={projects} />

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: 'var(--radius-sm)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading task stream...
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <CheckSquare size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            No Tasks Match Criteria
          </h3>
          <p style={{ fontSize: '0.85rem' }}>
            Try adjusting your status, priority, or date filters above.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChanged={handleTaskStatusChanged}
            />
          ))}
        </div>
      )}

      {canCreateTask && (
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onTaskCreated={loadTasks}
          projects={projects}
          defaultProjectId={currentProjectId}
        />
      )}
    </div>
  );
};
