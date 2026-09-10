import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  ];

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      <div>
        {/* Logo Section */}
        <div
          style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Layers size={18} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              VELOZITY
            </h1>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              INTERNAL DASHBOARD
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav style={{ padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.95rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  boxShadow: isActive ? '0 2px 8px rgba(99, 102, 241, 0.35)' : 'none',
                  transition: 'all 0.15s ease',
                })}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Role Scoping Note in Sidebar Footer */}
      <div
        style={{
          padding: '1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
        }}
      >
        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
          CURRENT CONTEXT
        </div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {user?.role === 'ADMIN' && 'Enterprise Global Admin'}
          {user?.role === 'PROJECT_MANAGER' && 'Project Management View'}
          {user?.role === 'DEVELOPER' && 'Assigned Task Queue'}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          {user?.role === 'ADMIN' && 'Full system visibility & controls'}
          {user?.role === 'PROJECT_MANAGER' && 'Scoped to owned projects only'}
          {user?.role === 'DEVELOPER' && 'Direct task updates only'}
        </div>
      </div>
    </aside>
  );
};
