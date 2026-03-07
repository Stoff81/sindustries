import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const API_BASE = import.meta.env.VITE_TASKS_API_BASE_URL ?? 'http://localhost:3000/api/v1';
const STATUSES = ['todo', 'doing', 'done'];
const PRIORITIES = ['urgent', 'high', 'medium', 'low'];
const PRIORITY_SCORE = { urgent: 0, high: 1, medium: 2, low: 3 };

async function api(path, options) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'content-type': 'application/json', ...(options?.headers ?? {}) },
    ...options
  });

  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message ?? 'Request failed');
  return body;
}

function normalizeTaskForEditor(task) {
  return {
    title: task.title ?? '',
    description: task.description ?? '',
    status: task.status ?? 'todo',
    priority: task.priority ?? 'medium',
    assignee: task.assignee ?? '',
    dueAt: task.dueAt ? String(task.dueAt).slice(0, 10) : '',
    tagsText: Array.isArray(task.tags) ? task.tags.map((tag) => tag.name ?? tag).join(', ') : ''
  };
}

function TaskEditor({ task, onSave, onArchive, onClose }) {
  const [draft, setDraft] = useState(() => normalizeTaskForEditor(task));
  const descriptionRef = useRef(null);

  useEffect(() => {
    setDraft(normalizeTaskForEditor(task));
  }, [task]);

  useEffect(() => {
    const textarea = descriptionRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [draft.description]);

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="editor">
      <div className="editor-fields">
        <label>
          <span className="small">Title</span>
          <input className="edit-control" aria-label="Detail title" value={draft.title} onChange={(e) => update('title', e.target.value)} />
        </label>

        <label>
          <span className="small">Description</span>
          <textarea
            ref={descriptionRef}
            className="edit-control auto-grow-textarea"
            value={draft.description}
            rows={1}
            onChange={(e) => update('description', e.target.value)}
          />
        </label>

        <div className="editor-grid">
          <label>
            <span className="small">Status</span>
            <select className="edit-control" aria-label="Detail status" value={draft.status} onChange={(e) => update('status', e.target.value)}>
              {STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="small">Priority</span>
            <select className="edit-control" aria-label="Detail priority" value={draft.priority} onChange={(e) => update('priority', e.target.value)}>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="small">Assignee</span>
            <input className="edit-control" value={draft.assignee} onChange={(e) => update('assignee', e.target.value)} />
          </label>

          <label>
            <span className="small">Due date</span>
            <input className="edit-control" type="date" value={draft.dueAt} onChange={(e) => update('dueAt', e.target.value)} />
          </label>
        </div>

        <label>
          <span className="small">Tags (comma separated)</span>
          <input className="edit-control" value={draft.tagsText} onChange={(e) => update('tagsText', e.target.value)} placeholder="api, ui, urgent" />
        </label>
      </div>

      <div className="actions editor-actions">
        <button
          className="primary-btn font-display"
          onClick={() =>
            onSave({
              title: draft.title.trim(),
              description: draft.description.trim() || null,
              status: draft.status,
              priority: draft.priority,
              assignee: draft.assignee.trim() || null,
              dueAt: draft.dueAt ? new Date(`${draft.dueAt}T00:00:00`).toISOString() : null,
              tags: draft.tagsText
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
            })
          }
        >
          Save changes
        </button>
        <button className="secondary-btn font-display" onClick={onArchive}>Archive task</button>
        <button className="tertiary-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function assigneeInitial(assignee) {
  return assignee?.trim()?.charAt(0)?.toUpperCase() ?? null;
}

export function App() {
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('board');
  const [selectedId, setSelectedId] = useState(null);
  const [filters, setFilters] = useState({ q: '', status: '', priority: '', includeArchived: false });
  const [newTask, setNewTask] = useState({ title: '', expanded: false, description: '', priority: 'medium', assignee: '', dueAt: '', tagsText: '' });
  const [error, setError] = useState('');


  async function loadTasks() {
    const query = new URLSearchParams({ sort: 'priority' });
    if (filters.q) query.set('q', filters.q);
    if (filters.status) query.set('status', filters.status);
    if (filters.priority) query.set('priority', filters.priority);
    if (filters.includeArchived) query.set('includeArchived', 'true');

    const response = await api(`/tasks?${query.toString()}`);
    setTasks(response.data);
  }

  useEffect(() => {
    loadTasks().catch((e) => setError(e.message));
  }, [filters.q, filters.status, filters.priority, filters.includeArchived]);

  const boardColumns = useMemo(() => {
    const columns = { todo: [], doing: [], done: [] };
    for (const task of tasks) columns[task.status]?.push(task);
    for (const status of STATUSES) {
      columns[status].sort((a, b) => {
        const priorityDiff = (PRIORITY_SCORE[a.priority] ?? 99) - (PRIORITY_SCORE[b.priority] ?? 99);
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.statusChangedAt) - new Date(b.statusChangedAt);
      });
    }
    return columns;
  }, [tasks]);

  async function createTask(event) {
    event.preventDefault();
    setError('');
    try {
      await api('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: newTask.title.trim(),
          description: newTask.description.trim() || null,
          priority: newTask.priority,
          dueAt: newTask.dueAt ? new Date(`${newTask.dueAt}T00:00:00`).toISOString() : null,
          assignee: newTask.assignee.trim() || null,
          tags: newTask.tagsText
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        })
      });

      setNewTask({ title: '', expanded: false, description: '', priority: 'medium', assignee: '', dueAt: '', tagsText: '' });
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
    <main className="app-shell">
      <header className="hero-header">
        <div className="hero-pattern" aria-hidden="true" />
        <div className="hero-content">
          <div className="brand-wrap">
            <span className="brand font-display">Pulse</span>
          </div>
          <div className="hero-controls">
            <label className="search-wrap" aria-label="Search tasks">
              <span className="search-icon">⌕</span>
              <input
                aria-label="Search"
                placeholder="Search title or description"
                value={filters.q}
                onChange={(e) => setFilters((current) => ({ ...current, q: e.target.value }))}
              />
            </label>
            <button className={`nav-btn ${view === 'backlog' ? 'active' : ''}`} onClick={() => setView('backlog')}>Backlog</button>
            <button className={`nav-btn ${view === 'board' ? 'active' : ''}`} onClick={() => setView('board')}>Kanban</button>
            <button type="button" className="primary-btn font-display" onClick={() => setNewTask((current) => ({ ...current, expanded: true }))}>+ New Task</button>
          </div>
        </div>
      </header>

      <section className="content">
        <div className="filter-row panel">
          <label className="select-wrap">
            <select
              aria-label="Status filter"
              value={filters.status}
              onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))}
            >
              <option value="">Status: All statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>{`Status: ${status}`}</option>
              ))}
            </select>
          </label>
          <label className="select-wrap">
            <select
              aria-label="Priority filter"
              value={filters.priority}
              onChange={(e) => setFilters((current) => ({ ...current, priority: e.target.value }))}
            >
              <option value="">Priority: All priorities</option>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>{`Priority: ${priority}`}</option>
              ))}
            </select>
          </label>
          <button
            className={`ghost-btn ${filters.includeArchived ? 'archived-active' : ''}`}
            onClick={() => setFilters((current) => ({ ...current, includeArchived: !current.includeArchived }))}
          >
            {filters.includeArchived ? 'Hide archived' : 'Show archived'}
          </button>
        </div>

        {newTask.expanded ? (
          <form onSubmit={createTask} className="task-card stack create-card" aria-label="New task form">
            <div className="task-create-header">
              <h2 className="font-display">New Task</h2>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setNewTask((current) => ({ ...current, expanded: false }))}
              >
                Cancel
              </button>
            </div>

            <div className="editor-grid">
              <label style={{ gridColumn: '1 / -1' }}>
                <span className="small">Title</span>
                <input
                  className="edit-control"
                  aria-label="New task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask((current) => ({ ...current, title: e.target.value }))}
                  required
                />
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                <span className="small">Description</span>
                <input className="edit-control" value={newTask.description} onChange={(e) => setNewTask((current) => ({ ...current, description: e.target.value }))} />
              </label>
              <label>
                <span className="small">Priority</span>
                <select className="edit-control" value={newTask.priority} onChange={(e) => setNewTask((current) => ({ ...current, priority: e.target.value }))}>
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="small">Assignee</span>
                <input className="edit-control" value={newTask.assignee} onChange={(e) => setNewTask((current) => ({ ...current, assignee: e.target.value }))} />
              </label>
              <label>
                <span className="small">Due date</span>
                <input className="edit-control" type="date" value={newTask.dueAt} onChange={(e) => setNewTask((current) => ({ ...current, dueAt: e.target.value }))} />
              </label>
              <label>
                <span className="small">Tags</span>
                <input className="edit-control" value={newTask.tagsText} onChange={(e) => setNewTask((current) => ({ ...current, tagsText: e.target.value }))} placeholder="api, pulse" />
              </label>
            </div>

            <div className="actions">
              <button type="submit" className="primary-btn font-display">Create task</button>
            </div>
          </form>
        ) : null}

        {error ? <p role="alert" className="error">{error}</p> : null}

        {view === 'backlog' ? (
          <section>

            <ul aria-label="Backlog list" className="task-list">
              {tasks.map((task, index) => {
                const isSelected = selectedId === task.id;
                const taskTags = Array.isArray(task.tags) ? task.tags.map((tag) => tag.name ?? String(tag)) : [];
                const assignee = task.assignee ?? 'Unassigned';
                return (
                  <li key={task.id}>
                    <article className={`task-card ${task.archivedAt ? 'archived' : ''} card-tilt-${index % 3}`}>
                      <div className="task-row">
                        <button className="task-title-btn" onClick={() => setSelectedId(isSelected ? null : task.id)}>
                          {task.title}
                        </button>
                        <div className="assignee-chip">
                          {assigneeInitial(task.assignee) ? <span className="avatar-dot">{assigneeInitial(task.assignee)}</span> : null}
                          <span className="small">{assignee}</span>
                        </div>
                      </div>

                      <div className="badges">
                        <span className={`pill ${task.priority}`}>{task.priority}</span>
                        <span className="pill status">{task.status}</span>
                        {task.dueAt ? <span className="pill">Due {String(task.dueAt).slice(0, 10)}</span> : null}
                        {taskTags.map((tag) => <span key={`${task.id}-${tag}`} className="pill">#{tag}</span>)}
                      </div>

                      {isSelected ? (
                        <TaskEditor
                          task={task}
                          onSave={(patch) => patchTask(task.id, patch)}
                          onArchive={() => archiveTask(task.id)}
                          onClose={() => setSelectedId(null)}
                        />
                      ) : null}
                    </article>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : (
          <section aria-label="Kanban board" className="board-wrap">
            <div className="board">
              {STATUSES.map((status) => (
                <div
                  key={status}
                  data-testid={`column-${status}`}
                  className="column"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData('text/plain');
                    if (id) patchTask(id, { status });
                  }}
                >
                  <div className="column-head">
                    <h3 className="font-display">{status}</h3>
                    <span className="count-pill">{boardColumns[status].length}</span>
                  </div>
                  <ol>
                    {boardColumns[status].map((task, index) => {
                      const isSelected = selectedId === task.id;
                      return (
                        <li key={task.id}>
                          <article
                            data-testid={`card-${task.id}`}
                            className={`board-card card-tilt-${index % 3}`}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
                          >
                            <button className="task-title-btn" onClick={() => setSelectedId(isSelected ? null : task.id)}>{task.title}</button>
                            <div className="board-card-meta">
                              <span className={`pill ${task.priority}`}>{task.priority}</span>
                              <span className="small">{String(task.statusChangedAt).slice(0, 10)}</span>
                            </div>
                            {isSelected ? (
                              <TaskEditor
                                task={task}
                                onSave={(patch) => patchTask(task.id, patch)}
                                onArchive={() => archiveTask(task.id)}
                                onClose={() => setSelectedId(null)}
                              />
                            ) : null}
                          </article>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        )}
      </section>

      <nav className="mobile-nav" aria-label="Primary">
        <button className={view === 'backlog' ? 'active' : ''} onClick={() => setView('backlog')}>List</button>
        <button className="fab font-display" onClick={() => setNewTask((current) => ({ ...current, expanded: true }))}>＋</button>
        <button className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}>Board</button>
      </nav>
    </main>
  );
}
