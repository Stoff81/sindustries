import { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_TASKS_API_BASE_URL ?? 'http://localhost:3000/api/v1';
const STATUSES = ['todo', 'doing', 'done'];

async function api(path, options) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'content-type': 'application/json', ...(options?.headers ?? {}) },
    ...options
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message ?? 'Request failed');
  return body;
}

export function App() {
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('backlog');
  const [selectedId, setSelectedId] = useState(null);
  const [filters, setFilters] = useState({ q: '', status: '', priority: '' });
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState('');

  const selectedTask = tasks.find((task) => task.id === selectedId) ?? null;

  async function loadTasks() {
    const query = new URLSearchParams({ sort: 'priority' });
    if (filters.q) query.set('q', filters.q);
    if (filters.status) query.set('status', filters.status);
    if (filters.priority) query.set('priority', filters.priority);
    const response = await api(`/tasks?${query.toString()}`);
    setTasks(response.data);
  }

  useEffect(() => {
    loadTasks().catch((e) => setError(e.message));
  }, [filters.q, filters.status, filters.priority]);

  const boardColumns = useMemo(() => {
    const columns = { todo: [], doing: [], done: [] };
    for (const task of tasks) columns[task.status]?.push(task);
    for (const status of STATUSES) {
      columns[status].sort((a, b) => new Date(a.statusChangedAt) - new Date(b.statusChangedAt));
    }
    return columns;
  }, [tasks]);

  async function createTask(event) {
    event.preventDefault();
    setError('');
    try {
      await api('/tasks', { method: 'POST', body: JSON.stringify({ title: newTitle }) });
      setNewTitle('');
      await loadTasks();
    } catch (e) {
      setError(e.message);
    }
  }

  async function patchTask(id, patch) {
    setError('');
    try {
      await api(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      await loadTasks();
    } catch (e) {
      setError(e.message);
    }
  }

  async function archiveTask(id) {
    setError('');
    try {
      await api(`/tasks/${id}`, { method: 'DELETE' });
      setSelectedId(null);
      await loadTasks();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main style={{ fontFamily: 'sans-serif', padding: 16 }}>
      <h1>Tasks</h1>
      <p>V1: backlog + kanban + create/update/archive</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setView('backlog')}>Backlog</button>
        <button onClick={() => setView('board')}>Kanban</button>
      </div>

      <form onSubmit={createTask} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input aria-label="New task title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
        <button type="submit">New Task</button>
      </form>

      {error ? <p role="alert">{error}</p> : null}

      {view === 'backlog' ? (
        <section>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              aria-label="Search"
              placeholder="Search"
              value={filters.q}
              onChange={(e) => setFilters((current) => ({ ...current, q: e.target.value }))}
            />
            <select
              aria-label="Status filter"
              value={filters.status}
              onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))}
            >
              <option value="">All statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select
              aria-label="Priority filter"
              value={filters.priority}
              onChange={(e) => setFilters((current) => ({ ...current, priority: e.target.value }))}
            >
              <option value="">All priorities</option>
              {['urgent', 'high', 'medium', 'low'].map((priority) => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </div>
          <ul aria-label="Backlog list">
            {tasks.map((task) => (
              <li key={task.id}>
                <button onClick={() => setSelectedId(task.id)}>{task.title}</button> [{task.priority}] ({task.status})
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section aria-label="Kanban board" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {STATUSES.map((status) => (
            <div
              key={status}
              data-testid={`column-${status}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData('text/plain');
                if (id) patchTask(id, { status });
              }}
              style={{ border: '1px solid #ccc', borderRadius: 8, padding: 8, minHeight: 180 }}
            >
              <h3>{status}</h3>
              <ol>
                {boardColumns[status].map((task) => (
                  <li key={task.id}>
                    <article
                      data-testid={`card-${task.id}`}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
                      style={{ border: '1px solid #ddd', borderRadius: 6, marginBottom: 8, padding: 8 }}
                    >
                      <button onClick={() => setSelectedId(task.id)}>{task.title}</button>
                      <div>{task.priority}</div>
                    </article>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </section>
      )}

      {selectedTask ? (
        <aside aria-label="Task detail" style={{ marginTop: 16, borderTop: '1px solid #ddd', paddingTop: 12 }}>
          <h2>{selectedTask.title}</h2>
          <label>
            Title
            <input
              aria-label="Detail title"
              defaultValue={selectedTask.title}
              onBlur={(e) => patchTask(selectedTask.id, { title: e.target.value })}
            />
          </label>
          <label>
            Status
            <select
              aria-label="Detail status"
              value={selectedTask.status}
              onChange={(e) => patchTask(selectedTask.id, { status: e.target.value })}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select
              aria-label="Detail priority"
              value={selectedTask.priority}
              onChange={(e) => patchTask(selectedTask.id, { priority: e.target.value })}
            >
              {['urgent', 'high', 'medium', 'low'].map((priority) => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </label>
          <button onClick={() => archiveTask(selectedTask.id)}>Archive task</button>
        </aside>
      ) : null}
    </main>
  );
}
