import React, { useState } from 'react';
import { Task, TaskStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { tasksApi } from '../../api';
import { format, isPast } from 'date-fns';
import { Calendar, User, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onStatusChanged?: (updatedTask: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChanged }) => {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const isAssignedToMe = user?.id === task.assignedToId;
  const canUpdateStatus = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER' || isAssignedToMe;

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === task.status || isUpdating) return;

    try {
      setIsUpdating(true);
      const updated = await tasksApi.updateStatus(task.id, newStatus);
      if (onStatusChanged) {
        onStatusChanged(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update task status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'prio-critical';
      case 'HIGH':
        return 'prio-high';
      case 'MEDIUM':
        return 'prio-medium';
      case 'LOW':
      default:
        return 'prio-low';
    }
  };

  const isTaskOverdue = task.status !== 'DONE' && (task.status === 'OVERDUE' || isPast(new Date(task.dueDate)));

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '0.85rem',
        borderLeft: `4px solid ${
          task.status === 'OVERDUE'
            ? '#ef4444'
            : task.status === 'DONE'
            ? '#10b981'
            : task.status === 'IN_REVIEW'
            ? '#f59e0b'
            : task.status === 'IN_PROGRESS'
            ? '#38bdf8'
            : '#64748b'
        }`,
      }}
    >
      <div>
        {/* Header: Project name, Task ID & Priority */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            #{task.id} {task.project?.name ? `• ${task.project.name}` : ''}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className={`prio-dot ${getPriorityClass(task.priority)}`} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              {task.priority}
            </span>
          </div>
        </div>

        {/* Task Title */}
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', lineHeight: 1.3 }}>
          {task.title}
        </h4>

        {/* Description */}
        {task.description && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
            {task.description}
          </p>
        )}
      </div>

      <div>
        {/* Metadata: Assignee & Due Date */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.65rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {task.assignedTo?.avatarUrl ? (
              <img
                src={task.assignedTo.avatarUrl}
                alt={task.assignedTo.name}
                style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <User size={14} color="var(--text-muted)" />
            )}
            <span style={{ color: isAssignedToMe ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: isAssignedToMe ? 700 : 500 }}>
              {task.assignedTo?.name || 'Unassigned'} {isAssignedToMe ? '(You)' : ''}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: isTaskOverdue ? '#f87171' : 'var(--text-muted)',
              fontWeight: isTaskOverdue ? 700 : 500,
            }}
          >
            {isTaskOverdue ? <AlertTriangle size={13} /> : <Calendar size={13} />}
            <span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
          </div>
        </div>

        {/* Status Dropdown / Controls */}
        <div
          style={{
            marginTop: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
          }}
        >
          <span className={`badge badge-${task.status.toLowerCase()}`}>
            {task.status.replace('_', ' ')}
          </span>

          {canUpdateStatus && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <select
                value={task.status}
                disabled={isUpdating}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.725rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
                <option value="OVERDUE">Overdue</option>
              </select>

              {/* Quick Status Advance Button for Developers */}
              {isAssignedToMe && task.status === 'TODO' && (
                <button
                  type="button"
                  onClick={() => handleStatusChange('IN_PROGRESS')}
                  disabled={isUpdating}
                  className="btn btn-sm btn-primary"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem' }}
                >
                  Start <ArrowRight size={11} />
                </button>
              )}

              {isAssignedToMe && task.status === 'IN_PROGRESS' && (
                <button
                  type="button"
                  onClick={() => handleStatusChange('IN_REVIEW')}
                  disabled={isUpdating}
                  className="btn btn-sm btn-primary"
                  style={{
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.7rem',
                    backgroundColor: '#f59e0b',
                  }}
                >
                  Submit Review <ArrowRight size={11} />
                </button>
              )}

              {(user?.role === 'PROJECT_MANAGER' || user?.role === 'ADMIN') && task.status === 'IN_REVIEW' && (
                <button
                  type="button"
                  onClick={() => handleStatusChange('DONE')}
                  disabled={isUpdating}
                  className="btn btn-sm btn-primary"
                  style={{
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.7rem',
                    backgroundColor: '#10b981',
                  }}
                >
                  Approve <CheckCircle2 size={11} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
