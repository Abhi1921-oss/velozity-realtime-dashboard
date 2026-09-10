import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, Search, Calendar } from 'lucide-react';

interface TaskFiltersProps {
  projects?: { id: string; name: string }[];
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({ projects = [] }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') || '';
  const priority = searchParams.get('priority') || '';
  const projectId = searchParams.get('projectId') || '';
  const dueDateFrom = searchParams.get('dueDateFrom') || '';
  const dueDateTo = searchParams.get('dueDateTo') || '';
  const search = searchParams.get('search') || '';

  const updateParam = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    setSearchParams(nextParams);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(status || priority || projectId || dueDateFrom || dueDateTo || search);

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.85rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', marginRight: '0.25rem' }}>
        <Filter size={16} />
        <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.03em' }}>FILTERS</span>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', flex: '1 1 180px', minWidth: '160px' }}>
        <Search
          size={14}
          style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          placeholder="Search task title..."
          value={search}
          onChange={(e) => updateParam('search', e.target.value)}
          style={{ paddingLeft: '30px', width: '100%' }}
        />
      </div>

      {/* Status Filter */}
      <select
        value={status}
        onChange={(e) => updateParam('status', e.target.value)}
        style={{ flex: '1 1 130px', minWidth: '120px' }}
      >
        <option value="">All Statuses</option>
        <option value="TODO">To Do</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="IN_REVIEW">In Review</option>
        <option value="DONE">Done</option>
        <option value="OVERDUE">Overdue</option>
      </select>

      {/* Priority Filter */}
      <select
        value={priority}
        onChange={(e) => updateParam('priority', e.target.value)}
        style={{ flex: '1 1 120px', minWidth: '110px' }}
      >
        <option value="">All Priorities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="CRITICAL">Critical</option>
      </select>

      {/* Project Selector (if multiple available) */}
      {projects.length > 0 && (
        <select
          value={projectId}
          onChange={(e) => updateParam('projectId', e.target.value)}
          style={{ flex: '1 1 160px', minWidth: '140px' }}
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      {/* Due Date Range (From / To) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: '1 1 240px', minWidth: '220px' }}>
        <Calendar size={14} color="var(--text-muted)" />
        <input
          type="date"
          value={dueDateFrom}
          title="Due Date From"
          onChange={(e) => updateParam('dueDateFrom', e.target.value)}
          style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>to</span>
        <input
          type="date"
          value={dueDateTo}
          title="Due Date To"
          onChange={(e) => updateParam('dueDateTo', e.target.value)}
          style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
        />
      </div>

      {/* Reset Filter Button */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="btn btn-secondary btn-sm"
          style={{ marginLeft: 'auto' }}
        >
          <X size={13} /> Reset
        </button>
      )}
    </div>
  );
};
