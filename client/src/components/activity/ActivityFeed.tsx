import React, { useState, useEffect } from 'react';
import { ActivityLog } from '../../types';
import { activityApi } from '../../api';
import { useSocket } from '../../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import { Activity, Clock, Radio, ArrowRight, User } from 'lucide-react';

interface ActivityFeedProps {
  projectId?: string;
  limit?: number;
  title?: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  projectId,
  limit = 20,
  title = 'Live Activity Feed',
}) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [livePulseId, setLivePulseId] = useState<string | null>(null);
  const { onActivity } = useSocket();

  // 1. Missed event catchup: Fetch last 20 events from database on mount / reconnect
  const loadDatabaseFeed = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await activityApi.getFeed({ limit, projectId });
      setActivities(res.activities);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch activity logs from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseFeed();
  }, [projectId, limit]);

  // 2. Real-time updates via WebSocket without refreshing page
  useEffect(() => {
    const unsubscribe = onActivity((newActivity) => {
      // If a specific project is selected, verify matching projectId
      if (projectId && newActivity.projectId !== projectId) {
        return;
      }

      setActivities((prev) => {
        // Prevent duplicate insertions
        if (prev.some((a) => a.id === newActivity.id)) {
          return prev;
        }
        return [newActivity, ...prev.slice(0, 49)];
      });

      // Trigger temporary highlight pulse on new incoming live event
      setLivePulseId(newActivity.id);
      setTimeout(() => setLivePulseId(null), 3500);
    });

    return unsubscribe;
  }, [onActivity, projectId]);

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Activity size={18} color="var(--primary)" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title}</h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="live-indicator">
            <Radio size={12} />
            LIVE
          </span>
          <button
            type="button"
            onClick={loadDatabaseFeed}
            title="Fetch missed events from database"
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Catchup Sync
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {loading && activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Loading activity stream from database...
          </div>
        ) : error ? (
          <div style={{ padding: '1rem', color: '#f87171', fontSize: '0.85rem', textAlign: 'center' }}>
            {error}
          </div>
        ) : activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <Activity size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.85rem' }}>No recent activity recorded yet.</p>
          </div>
        ) : (
          activities.map((item) => {
            const isJustArrived = livePulseId === item.id;
            const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isJustArrived
                    ? 'rgba(99, 102, 241, 0.18)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: isJustArrived
                    ? '1px solid rgba(99, 102, 241, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.04)',
                  transition: 'all 0.3s ease',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: item.userId ? 'var(--primary-subtle)' : 'rgba(245, 158, 11, 0.15)',
                    color: item.userId ? 'var(--primary)' : '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  {item.userId ? <User size={14} /> : <Clock size={14} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Required format: "Ravi moved Task #12 from In Progress → In Review · 2 mins ago" */}
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 600 }}>{item.actionText}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem', fontSize: '0.75rem' }}>
                      · {timeAgo}
                    </span>
                  </p>

                  {item.project && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Project: {item.project.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
