import { useEffect, useMemo, useRef, useState } from 'react';
import { useTasks } from './useTasks.js';
import { useTaskDrafts } from './useTaskDrafts.js';
import { useDebounce } from './hooks/useDebounce.js';
import { useToast } from './hooks/useToast.js';
import { TaskEditor } from './components/TaskEditor.jsx';
import { STATUSES, PRIORITIES, PRIORITY_SCORE } from './utils/constants.js';
import { createConfettiPieces, normalizeTaskForEditor, assigneeInitial } from './utils/helpers.js';
import { getStoredView, setStoredView } from './utils/storage.js';

export function App() {
  const [view, setView] = useState(getStoredView);
  const [selectedId, setSelectedId] = useState(null);
  const [filters, setFilters] = useState({ q: '', status: '', priority: '', tag: '', includeArchived: false });
  
  // Default backlog view to Status: Todo
  useEffect(() => {
    if (view === 'backlog' && filters.status === '') {
      setFilters((current) => ({ ...current, status: 'todo' }));
    }
  }, [view, filters.status]);

  // Persist view to localStorage
  useEffect(() => {
    setStoredView(view);
  }, [view]);

  // Debounce search filter
  const debouncedSearch = useDebounce(filters.q, 300);

  // Toast notifications
  const { toasts, showToast } = useToast();

  const [newTask, setNewTask] = useState({ title: '', expanded: false, description: '', priority: 'medium', assignee: '', dueAt: '', tagsText: '', blocked: false, ready: false });
  const [confettiBursts, setConfettiBursts] = useState([]);
  const [submittingCommentForTaskId, setSubmittingCommentForTaskId] = useState(null);
  const confettiTimeoutsRef = useRef(new Map());
  const audioContextRef = useRef(null);
  const taskCardRefs = useRef({});

  // Scroll to task card after save/close if needed
  function scrollToTaskIfNeeded(taskId) {
    // Use setTimeout to ensure DOM has updated after TaskEditor is removed
    setTimeout(() => {
      const cardEl = taskCardRefs.current[taskId];
      if (!cardEl) return;
      
      const cardRect = cardEl.getBoundingClientRect();
      const headerHeight = document.querySelector('header')?.offsetHeight || 0;
      
      // If the top of the card is above the visible area (below header), scroll it into view
      // Account for the sticky header by adding headerHeight offset
      if (cardRect.top < headerHeight) {
        const offsetPosition = cardEl.offsetTop - headerHeight - 10; // 10px buffer
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 0);
  }

  // Compute filters with debounced search for API calls
  const apiFilters = useMemo(() => ({
    ...filters,
    q: debouncedSearch
  }), [filters, debouncedSearch]);

  const {
    tasks,
    error,
    isLoading,
    createTask: createTaskRequest,
    updateTask: patchTaskRequest,
    archiveTask: archiveTaskRequest,
    createTaskComment: createTaskCommentRequest,
    refreshTask
  } = useTasks(apiFilters, {
    pauseAutoRefresh: selectedId !== null,
    refreshIntervalMs: 3000
  });
  const {
    getDraft,
    storeDraft,
    clearDraft,
    isTaskDirty,
    hasUnsavedDrafts
  } = useTaskDrafts(normalizeTaskForEditor, tasks);

  // Extract unique tags from all tasks for the filter dropdown
  const allTags = useMemo(() => {
    const tagSet = new Set();
    tasks.forEach((task) => {
      if (Array.isArray(task.tags)) {
        task.tags.forEach((tag) => {
          const tagName = typeof tag === 'string' ? tag : tag.name;
          if (tagName) tagSet.add(tagName);
        });
      }
    });
    return Array.from(tagSet).sort();
  }, [tasks]);

  useEffect(() => {
    return () => {
      for (const timeoutId of confettiTimeoutsRef.current.values()) {
        window.clearTimeout(timeoutId);
      }
      confettiTimeoutsRef.current.clear();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (!hasUnsavedDrafts) return undefined;

    function handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedDrafts]);

  const boardColumns = useMemo(() => {
    const columns = { todo: [], doing: [], done: [] };
    for (const task of tasks) columns[task.status]?.push(task);
    for (const status of STATUSES) {
      columns[status].sort((a, b) => {
        const priorityDiff = (PRIORITY_SCORE[a.priority] ?? 99) - (PRIORITY_SCORE[b.priority] ?? 99);
        if (priorityDiff !== 0) return priorityDiff;
        // Secondary sort: ready tasks first, then by date created
        if (a.ready !== b.ready) return a.ready ? -1 : 1;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
    }
    return columns;
  }, [tasks]);

  // Backlog list uses same sort order: priority, readiness, date created
  const sortedBacklogTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const priorityDiff = (PRIORITY_SCORE[a.priority] ?? 99) - (PRIORITY_SCORE[b.priority] ?? 99);
      if (priorityDiff !== 0) return priorityDiff;
      if (a.ready !== b.ready) return a.ready ? -1 : 1;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  }, [tasks]);

  async function createTask(event) {
    event.preventDefault();
    try {
      await createTaskRequest({
        title: newTask.title.trim(),
        description: newTask.description.trim() || null,
        priority: newTask.priority,
        dueAt: newTask.dueAt ? new Date(`${newTask.dueAt}T00:00:00`).toISOString() : null,
        assignee: newTask.assignee.trim() || null,
        tags: newTask.tagsText
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        blocked: newTask.blocked,
        ready: newTask.ready
      });
      setNewTask({ title: '', expanded: false, description: '', priority: 'medium', assignee: '', dueAt: '', tagsText: '', blocked: false, ready: false });
      showToast('Task created', 'success');
    } catch {
      showToast('Failed to create task', 'error');
    }
  }

  async function patchTask(id, patch) {
    try {
      await patchTaskRequest(id, patch);
      showToast('Task updated', 'success');
      return true;
    } catch {
      showToast('Failed to update task', 'error');
      return false;
    }
  }

  async function archiveTask(id) {
    try {
      await archiveTaskRequest(id);
      clearDraft(id);
      setSelectedId(null);
      showToast('Task archived', 'success');
      return true;
    } catch {
      showToast('Failed to archive task', 'error');
      return false;
    }
  }

  async function createTaskComment(id, payload) {
    setSubmittingCommentForTaskId(id);
    try {
      await createTaskCommentRequest(id, payload);
      await refreshTask(id);
      return true;
    } catch {
      return false;
    } finally {
      setSubmittingCommentForTaskId((current) => (current === id ? null : current));
    }
  }

  async function playSalesBell() {
    try {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextCtor();
      }

      const context = audioContextRef.current;
      if (context.state === 'suspended') {
        await context.resume();
      }

      const now = context.currentTime + 0.02;
      const notes = [523.25, 659.25, 783.99, 1046.5];

      notes.forEach((frequency, index) => {
        const start = now + index * 0.09;
        const duration = 0.24;

        const lead = context.createOscillator();
        const leadGain = context.createGain();
        lead.type = 'square';
        lead.frequency.setValueAtTime(frequency, start);
        leadGain.gain.setValueAtTime(0.001, start);
        leadGain.gain.exponentialRampToValueAtTime(0.17, start + 0.02);
        leadGain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        lead.connect(leadGain);
        leadGain.connect(context.destination);
        lead.start(start);
        lead.stop(start + duration + 0.03);

        const shimmer = context.createOscillator();
        const shimmerGain = context.createGain();
        shimmer.type = 'triangle';
        shimmer.frequency.setValueAtTime(frequency * 2, start);
        shimmerGain.gain.setValueAtTime(0.001, start);
        shimmerGain.gain.exponentialRampToValueAtTime(0.06, start + 0.02);
        shimmerGain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        shimmer.connect(shimmerGain);
        shimmerGain.connect(context.destination);
        shimmer.start(start);
        shimmer.stop(start + duration + 0.03);
      });
    } catch {
      // No-op on browsers that block or lack Web Audio.
    }
  }

  function openTask(taskId) {
    setSelectedId(taskId);
    void refreshTask(taskId).catch(() => {});
  }

  function toggleTask(taskId, isSelected) {
    if (isSelected) {
      setSelectedId(null);
      return;
    }
    openTask(taskId);
  }

  function launchPulseCelebration() {
    void playSalesBell();

    const id = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const pieces = createConfettiPieces();
    setConfettiBursts((current) => [...current, { id, pieces }]);

    const timeoutId = window.setTimeout(() => {
      setConfettiBursts((current) => current.filter((burst) => burst.id !== id));
      confettiTimeoutsRef.current.delete(id);
    }, 2800);

    confettiTimeoutsRef.current.set(id, timeoutId);
  }

  function updatePulseHoverMotion(event) {
    const element = event.currentTarget;
    const bounds = element.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const x = Math.min(Math.max((event.clientX - bounds.left) / bounds.width, 0), 1);
    const y = Math.min(Math.max((event.clientY - bounds.top) / bounds.height, 0), 1);
    const centerX = x - 0.5;
    const centerY = y - 0.5;
    const distance = Math.min(Math.hypot(centerX, centerY), 0.75);

    const sway = centerX * 11;
    const lift = 3 + Math.abs(centerY) * 7;
    const speed = 460 + Math.round(distance * 360);

    element.style.setProperty('--pulse-tilt', `${(centerX * 5.5).toFixed(2)}deg`);
    element.style.setProperty('--pulse-sway-a', `${sway.toFixed(2)}px`);
    element.style.setProperty('--pulse-sway-b', `${(-sway * 0.72).toFixed(2)}px`);
    element.style.setProperty('--pulse-up-a', `-${lift.toFixed(2)}px`);
    element.style.setProperty('--pulse-up-b', `-${(lift + 1.8).toFixed(2)}px`);
    element.style.setProperty('--pulse-down', `${(centerY * 1.6).toFixed(2)}px`);
    element.style.setProperty('--pulse-speed', `${speed}ms`);
  }

  function resetPulseHoverMotion(event) {
    const element = event.currentTarget;
    element.style.removeProperty('--pulse-tilt');
    element.style.removeProperty('--pulse-sway-a');
    element.style.removeProperty('--pulse-sway-b');
    element.style.removeProperty('--pulse-up-a');
    element.style.removeProperty('--pulse-up-b');
    element.style.removeProperty('--pulse-down');
    element.style.removeProperty('--pulse-speed');
  }

  return (
    <main className="app-shell">
      <header className="hero-header">
        <div className="hero-pattern" aria-hidden="true" />
        <div className="hero-content">
          <div className="brand-wrap">
            <button
              type="button"
              className="brand brand-btn font-display"
              onClick={launchPulseCelebration}
              onPointerEnter={updatePulseHoverMotion}
              onPointerMove={updatePulseHoverMotion}
              onPointerLeave={resetPulseHoverMotion}
              aria-label="Ring Pulse sales bell"
            >
              Pulse
            </button>
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
            <button className={`nav-btn ${view === 'board' ? 'active' : ''}`} onClick={() => { setView('board'); setFilters((current) => ({ ...current, status: '' })); }}>Kanban</button>
            <button type="button" className="primary-btn font-display" onClick={() => setNewTask((current) => ({ ...current, expanded: true }))}>+ New Task</button>
          </div>
        </div>
      </header>

      <section className="content">
        <div className="filter-row panel">
          <div className="filter-controls">
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
            {allTags.length > 0 && (
              <label className="select-wrap">
                <select
                  aria-label="Tag filter"
                  value={filters.tag}
                  onChange={(e) => setFilters((current) => ({ ...current, tag: e.target.value }))}
                >
                  <option value="">Tag: All tags</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>{`Tag: ${tag}`}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="filter-actions">
            <button
              className={`ghost-btn archived-toggle ${filters.includeArchived ? 'archived-active' : ''}`}
              onClick={() => setFilters((current) => ({ ...current, includeArchived: !current.includeArchived }))}
            >
              {filters.includeArchived ? 'Hide archived' : 'Show archived'}
            </button>
          </div>
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

            <div className="editor-toggles">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={newTask.blocked}
                  onChange={(e) => setNewTask((current) => ({ ...current, blocked: e.target.checked }))}
                />
                <span>Blocked</span>
              </label>
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={newTask.ready}
                  onChange={(e) => setNewTask((current) => ({ ...current, ready: e.target.checked }))}
                />
                <span>Ready</span>
              </label>
            </div>

            <div className="actions">
              <button type="submit" className="primary-btn font-display">Create task</button>
            </div>
          </form>
        ) : null}

        {error ? <p role="alert" className="error">{error}</p> : null}

        {isLoading && tasks.length === 0 ? (
          <div className="loading-spinner" role="status" aria-label="Loading tasks">
            <div className="spinner" />
            <span className="sr-only">Loading tasks...</span>
          </div>
        ) : null}

        {view === 'backlog' ? (
          <section>

            <ul aria-label="Backlog list" className="task-list">
              {sortedBacklogTasks.map((task, index) => {
                const isSelected = selectedId === task.id;
                const draft = getDraft(task);
                const hasDraft = isTaskDirty(task);
                const taskTags = Array.isArray(task.tags) ? task.tags.map((tag) => tag.name ?? String(tag)) : [];
                const assignee = task.assignee ?? 'Unassigned';
                return (
                  <li key={task.id}>
                    <article 
                      ref={(el) => { taskCardRefs.current[task.id] = el; }}
                      className={`task-card ${task.archivedAt ? 'archived' : ''} ${task.blocked ? 'blocked' : ''} ${task.ready ? 'ready' : ''} ${isSelected ? 'is-editing' : ''} card-tilt-${index % 3}`}
                      onClick={() => {
                        if (!isSelected) openTask(task.id);
                      }}
                    >
                      <div className="task-row">
                        <button 
                          className="task-title-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTask(task.id, isSelected);
                          }}
                        >
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
                        {hasDraft ? <span className="pill draft-pill">Unsaved</span> : null}
                        {task.dueAt ? <span className="pill">Due {String(task.dueAt).slice(0, 10)}</span> : null}
                        {taskTags.map((tag) => <span key={`${task.id}-${tag}`} className="pill">#{tag}</span>)}
                      </div>

                      {isSelected ? (
                        <TaskEditor
                          draft={draft}
                          task={task}
                          isDirty={hasDraft}
                          onDraftChange={(nextDraft) => storeDraft(task, nextDraft)}
                          onSave={async (patch) => {
                            const didSave = await patchTask(task.id, patch);
                            if (!didSave) return;
                            clearDraft(task.id);
                            setSelectedId(null);
                            scrollToTaskIfNeeded(task.id);
                          }}
                          onArchive={() => archiveTask(task.id)}
                          onClose={() => {
                            setSelectedId(null);
                            scrollToTaskIfNeeded(task.id);
                          }}
                          onAddComment={(payload) => createTaskComment(task.id, payload)}
                          isSubmittingComment={submittingCommentForTaskId === task.id}
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
                      const draft = getDraft(task);
                      const hasDraft = isTaskDirty(task);
                      const assigneeLetter = assigneeInitial(task.assignee);
                      const assignee = task.assignee?.trim() || 'Unassigned';
                      const taskTags = Array.isArray(task.tags) ? task.tags.map((tag) => tag.name ?? String(tag)) : [];
                      return (
                        <li key={task.id}>
                          <article
                            data-testid={`card-${task.id}`}
                            className={`board-card ${task.archivedAt ? 'archived' : ''} ${task.blocked ? 'blocked' : ''} ${task.ready ? 'ready' : ''} ${isSelected ? 'is-editing' : ''} card-tilt-${index % 3}`}
                            draggable={!isSelected}
                            onDragStart={(e) => {
                              if (!isSelected) e.dataTransfer.setData('text/plain', task.id);
                            }}
                            onClick={(e) => {
                              if (!isSelected) {
                                e.stopPropagation();
                                openTask(task.id);
                              }
                            }}
                          >
                            <div className="task-row board-card-row">
                              <button 
                                className="task-title-btn" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTask(task.id, isSelected);
                                }}
                              >
                                {task.title}
                              </button>
                            </div>
                            <div className="board-card-meta">
                              <span className={`pill ${task.priority}`}>{task.priority}</span>
                              {taskTags.map((tag) => <span key={tag} className="pill tag-pill">#{tag}</span>)}
                              <div className="board-card-meta-right">
                                {hasDraft ? <span className="pill draft-pill">Unsaved</span> : null}
                                {task.ready ? <span className="ready-dot" aria-label="Ready">✓</span> : null}
                                {assigneeLetter ? <span className="avatar-dot" title={assignee} aria-label={`Assignee ${assignee}`}>{assigneeLetter}</span> : null}
                                <span className="small">{String(task.statusChangedAt).slice(0, 10)}</span>
                              </div>
                            </div>
                            {isSelected ? (
                              <TaskEditor
                                draft={draft}
                                task={task}
                                isDirty={hasDraft}
                                onDraftChange={(nextDraft) => storeDraft(task, nextDraft)}
                                onSave={async (patch) => {
                                  const didSave = await patchTask(task.id, patch);
                                  if (!didSave) return;
                                  clearDraft(task.id);
                                  setSelectedId(null);
                                  scrollToTaskIfNeeded(task.id);
                                }}
                                onArchive={() => archiveTask(task.id)}
                                onClose={() => {
                                  setSelectedId(null);
                                  scrollToTaskIfNeeded(task.id);
                                }}
                                onAddComment={(payload) => createTaskComment(task.id, payload)}
                                isSubmittingComment={submittingCommentForTaskId === task.id}
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
        <button className={view === 'board' ? 'active' : ''} onClick={() => { setView('board'); setFilters((current) => ({ ...current, status: '' })); }}>Board</button>
      </nav>

      {/* Toast notifications */}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>

      {/* Accessibility: announce task count to screen readers */}
      <div className="sr-only" role="status" aria-live="polite">
        {isLoading ? 'Loading tasks...' : `${tasks.length} tasks`}
      </div>

      <div className="confetti-layer" aria-hidden="true">
        {confettiBursts.map((burst) => (
          <div key={burst.id} className="confetti-burst">
            {burst.pieces.map((piece) => (
              <span
                key={`${burst.id}-${piece.id}`}
                className="confetti-piece"
                style={{
                  '--confetti-color': piece.color,
                  '--confetti-start-x': `${piece.startX}vw`,
                  '--confetti-drift': `${piece.drift}px`,
                  '--confetti-rotation': `${piece.rotation}deg`,
                  '--confetti-size': `${piece.size}px`,
                  '--confetti-duration': `${piece.duration}ms`,
                  '--confetti-delay': `${piece.delay}ms`
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
