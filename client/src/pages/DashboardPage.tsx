import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { statsApi, tasksApi, projectsApi } from '../api';
import { DashboardStats, Task, Project } from '../types';
import { ActivityFeed } from '../components/activity/ActivityFeed';
import { TaskCard } from '../components/tasks/TaskCard';
import {
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  Users,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { onlineCount, onlineUsers } = useSocket();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await statsApi.getDashboard();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user?.role]);

  if (loading && !stats) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading executive dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: '#f87171', textAlign: 'center' }}>
        <p>Error loading dashboard metrics: {error}</p>
        <button onClick={fetchStats} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Welcome Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Welcome back, {user?.name}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {user?.role === 'ADMIN' && 'Real-time agency overview, cross-project deliverables, and live WebSocket telemetry.'}
            {user?.role === 'PROJECT_MANAGER' && 'Project portfolio health, upcoming milestone due dates, and developer deliverables.'}
            {user?.role === 'DEVELOPER' && 'Your assigned sprint deliverables ordered strictly by priority and due date.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/tasks" className="btn btn-secondary">
            <CheckSquare size={16} /> View All Tasks
          </Link>
          <Link to="/projects" className="btn btn-primary">
            <FolderKanban size={16} /> View Projects
          </Link>
        </div>
      </div>

      {/* 1. ADMIN DASHBOARD SPECIFICATION */}
      {user?.role === 'ADMIN' && stats?.role === 'ADMIN' && (
        <>
          {/* Top Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {/* Total Projects */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em' }}>TOTAL PROJECTS</span>
                <FolderKanban size={20} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>
                {stats.totalProjects}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Active agency workspaces
              </div>
            </div>

            {/* Total Tasks */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em' }}>TOTAL TASKS</span>
                <CheckSquare size={20} color="#38bdf8" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>
                {stats.totalTasks}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Across all agency clients
              </div>
            </div>

            {/* Overdue Task Count */}
            <div
              className="glass-panel"
              style={{
                padding: '1.25rem',
                borderLeft: '4px solid #ef4444',
                background: 'rgba(239, 68, 68, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f87171' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em' }}>OVERDUE TASKS</span>
                <AlertTriangle size={20} color="#ef4444" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: '#f87171' }}>
                {stats.overdueTaskCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: '0.25rem' }}>
                Automated background cron flagged
              </div>
            </div>

            {/* Active Users Online Right Now (WebSocket presence) */}
            <div
              className="glass-panel"
              style={{
                padding: '1.25rem',
                borderLeft: '4px solid #10b981',
                background: 'rgba(16, 185, 129, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#34d399' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em' }}>USERS ONLINE NOW</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span className="prio-dot" style={{ backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                  <Users size={20} color="#10b981" />
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: '#34d399' }}>
                {onlineCount || stats.activeUsersOnline}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6ee7b7', marginTop: '0.25rem' }}>
                Live WebSocket socket presence
              </div>
            </div>
          </div>

          {/* Status Breakdown & Global Live Feed Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem' }}>
            {/* Total Tasks by Status Breakdown */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} color="var(--primary)" /> Tasks by Status
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.entries(stats.tasksByStatus).map(([st, count]) => {
                  const percentage = stats.totalTasks > 0 ? Math.round((count / stats.totalTasks) * 100) : 0;
                  const label = st.replace('_', ' ');

                  const getColor = (s: string) => {
                    if (s === 'OVERDUE') return '#ef4444';
                    if (s === 'DONE') return '#10b981';
                    if (s === 'IN_REVIEW') return '#f59e0b';
                    if (s === 'IN_PROGRESS') return '#38bdf8';
                    return '#64748b';
                  };

                  return (
                    <div key={st}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 600 }}>{label}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          <strong>{count}</strong> ({percentage}%)
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${percentage}%`,
                            height: '100%',
                            backgroundColor: getColor(st),
                            borderRadius: '999px',
                            transition: 'width 0.5s ease-in-out',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Online Users List in Admin Dashboard */}
              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  CONNECTED CLIENTS ({onlineUsers.length})
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {onlineUsers.map((u) => (
                    <span
                      key={u.userId}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <span className="prio-dot" style={{ backgroundColor: '#10b981' }} />
                      <strong>{u.name}</strong> ({u.role})
                    </span>
                  ))}
                  {onlineUsers.length === 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      No other concurrent sockets
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Global Live Activity Feed */}
            <div style={{ height: '520px' }}>
              <ActivityFeed title="Global Activity Feed (All Projects)" />
            </div>
          </div>
        </>
      )}

      {/* 2. PROJECT MANAGER DASHBOARD SPECIFICATION */}
      {user?.role === 'PROJECT_MANAGER' && stats?.role === 'PROJECT_MANAGER' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em' }}>MY PROJECTS</span>
                <FolderKanban size={20} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>
                {stats.projectsSummary.totalProjects}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Managed strictly under your ownership
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em' }}>TASKS IN MY PROJECTS</span>
                <CheckSquare size={20} color="#38bdf8" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>
                {stats.projectsSummary.totalTasks}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Team deliverables in flight
              </div>
            </div>

            {/* Critical Priority Tasks */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #f43f5e' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f43f5e' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em' }}>CRITICAL TASKS</span>
                <AlertTriangle size={20} color="#f43f5e" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: '#f43f5e' }}>
                {stats.tasksByPriority.CRITICAL || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Urgent priority attention required
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem' }}>
            {/* Upcoming Due Dates This Week & Tasks by Priority */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Tasks by Priority */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
                  Tasks by Priority
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                  {Object.entries(stats.tasksByPriority).map(([prio, count]) => (
                    <div
                      key={prio}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {prio}
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.2rem' }}>
                        {count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Due Dates This Week */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} color="#38bdf8" /> Upcoming Due Dates This Week
                </h3>

                {stats.upcomingTasksThisWeek.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No upcoming task deadlines this week.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {stats.upcomingTasksThisWeek.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{t.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Project: {t.project?.name} • Assignee: {t.assignedTo?.name}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`badge badge-${t.status.toLowerCase()}`}>
                            {t.status.replace('_', ' ')}
                          </span>
                          <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.25rem', fontWeight: 600 }}>
                            Due {format(new Date(t.dueDate), 'EEE, MMM d')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* PM Role Scoped Live Activity Feed */}
            <div style={{ height: '560px' }}>
              <ActivityFeed title="My Projects Activity Feed" />
            </div>
          </div>
        </>
      )}

      {/* 3. DEVELOPER DASHBOARD SPECIFICATION */}
      {user?.role === 'DEVELOPER' && stats?.role === 'DEVELOPER' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL ASSIGNED</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.35rem' }}>{stats.totalAssigned}</div>
            </div>
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '3px solid #38bdf8' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8' }}>IN PROGRESS</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.35rem', color: '#38bdf8' }}>
                {stats.statusBreakdown.IN_PROGRESS || 0}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '3px solid #f59e0b' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b' }}>IN REVIEW</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.35rem', color: '#f59e0b' }}>
                {stats.statusBreakdown.IN_REVIEW || 0}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '3px solid #10b981' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>COMPLETED</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.35rem', color: '#10b981' }}>
                {stats.statusBreakdown.DONE || 0}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
            {/* Developer Assigned Tasks Queue (Sorted by Priority then Due Date) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                  My Assigned Tasks (Priority & Due Date Sorted)
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Update status directly below
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {stats.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChanged={() => fetchStats()}
                  />
                ))}
                {stats.tasks.length === 0 && (
                  <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No assigned tasks found.
                  </div>
                )}
              </div>
            </div>

            {/* Developer Role Scoped Live Feed */}
            <div style={{ height: '600px' }}>
              <ActivityFeed title="My Tasks Activity Feed" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
