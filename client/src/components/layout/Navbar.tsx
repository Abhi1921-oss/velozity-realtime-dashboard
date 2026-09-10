import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import { LogOut, Users, ShieldAlert, Briefcase, Code } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { connected, onlineCount } = useSocket();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '999px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <ShieldAlert size={12} /> Admin
          </span>
        );
      case 'PROJECT_MANAGER':
        return (
          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '999px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Briefcase size={12} /> Project Manager
          </span>
        );
      case 'DEVELOPER':
      default:
        return (
          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '999px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Code size={12} /> Developer
          </span>
        );
    }
  };

  return (
    <header
      style={{
        height: '64px',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'rgba(11, 15, 23, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
          Velozity Operations
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Real-time WebSocket Presence Indicator */}
        <div
          title={connected ? `${onlineCount} users connected in real time` : 'Connecting to live WebSocket service...'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.75rem',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: connected ? '#10b981' : '#f59e0b',
              boxShadow: connected ? '0 0 8px #10b981' : 'none',
            }}
          />
          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Users size={12} />
            <strong style={{ color: 'var(--text-primary)' }}>{onlineCount}</strong> online
          </span>
        </div>

        {/* Notifications Dropdown */}
        <NotificationDropdown />

        {/* User Info & Role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
            />
          ) : (
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              {user?.name?.charAt(0) || 'U'}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user?.name}</span>
              {getRoleBadge(user?.role)}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user?.email}</span>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={logout}
            title="Log Out"
            style={{
              marginLeft: '0.5rem',
              padding: '0.45rem',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
