import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, ShieldCheck, Briefcase, Code2, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (loginEmail?: string, loginPassword?: string) => {
    const targetEmail = loginEmail || email;
    const targetPass = loginPassword || password;

    if (!targetEmail || !targetPass) {
      setError('Please provide both email and password');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(targetEmail, targetPass);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  const quickSwitch = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    handleLogin(e, p);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        background: 'radial-gradient(ellipse at top, #161e38 0%, #080b12 100%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
              marginBottom: '1rem',
            }}
          >
            <Layers size={26} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
            Velozity Operations
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            Client Project Dashboard & Real-Time Feed
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: '#f87171',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="user@velozity.internal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.7rem 0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.7rem 0.9rem' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.9rem' }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick RBAC Switchers for Reviewer */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.75rem', textAlign: 'center' }}>
              ONE-CLICK ROLE DEMO LOGIN
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => quickSwitch('admin@velozity.internal', 'Admin@123')}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'space-between', padding: '0.5rem 0.75rem', width: '100%' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={14} color="#f87171" />
                  <span style={{ fontWeight: 600 }}>Elena Rostova</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                  ADMIN
                </span>
              </button>

              <button
                type="button"
                onClick={() => quickSwitch('sarah.pm@velozity.internal', 'Manager@123')}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'space-between', padding: '0.5rem 0.75rem', width: '100%' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Briefcase size={14} color="#38bdf8" />
                  <span style={{ fontWeight: 600 }}>Sarah Connor (Owns 2 Projects)</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                  PM 1
                </span>
              </button>

              <button
                type="button"
                onClick={() => quickSwitch('marcus.pm@velozity.internal', 'Manager@123')}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'space-between', padding: '0.5rem 0.75rem', width: '100%' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Briefcase size={14} color="#38bdf8" />
                  <span style={{ fontWeight: 600 }}>Marcus Vance (Owns 1 Project)</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                  PM 2
                </span>
              </button>

              <button
                type="button"
                onClick={() => quickSwitch('alex.dev@velozity.internal', 'Dev@123')}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'space-between', padding: '0.5rem 0.75rem', width: '100%' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Code2 size={14} color="#34d399" />
                  <span style={{ fontWeight: 600 }}>Alex Rivera</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                  DEVELOPER
                </span>
              </button>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          JWT authentication with HttpOnly refresh cookies & RBAC authorization
        </div>
      </div>
    </div>
  );
};
