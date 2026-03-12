import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { useTasks } from './useTasks.js';
import { useTaskDrafts } from './useTaskDrafts.js';
const STATUSES = ['todo', 'doing', 'done'];
const PRIORITIES = ['urgent', 'high', 'medium', 'low'];
const PRIORITY_SCORE = { urgent: 0, high: 1, medium: 2, low: 3 };
const CONFETTI_COLORS = ['#ffc935', '#00d4ff', '#ff3e8a', '#31c76a', '#f3f1ec', '#7d5dff'];

function createConfettiPieces(pieceCount = 120) {
  return Array.from({ length: pieceCount }, (_, index) => ({
    id: index,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    startX: 5 + Math.random() * 90,
    drift: -180 + Math.random() * 360,
    rotation: -520 + Math.random() * 1040,
    size: 6 + Math.random() * 8,
    duration: 1200 + Math.random() * 1300,
    delay: Math.random() * 220
  }));
}

function normalizeComments(comments) {
  return Array.isArray(comments) ? comments : [];
}

function formatCommentTimestamp(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
}

function normalizeTaskForEditor(task) {
  return {
    title: task.title ?? '',
    description: task.description ?? '',
    status: task.status ?? 'todo',
    priority: task.priority ?? 'medium',
    assignee: task.assignee ?? '',
    dueAt: task.dueAt ? String(task.dueAt).slice(0, 10) : '',
    tagsText: Array.isArray(task.tags) ? task.tags.map((tag) => tag.name ?? tag).join(', ') : '',
    blocked: task.blocked ?? false,
    ready: task.ready ?? false
  };
}

function TaskEditor({ draft, task, isDirty, onDraftChange, onSave, onArchive, onClose, onAddComment, isSubmittingComment }) {
  const descriptionRef = useRef(null);
  const titleRef = useRef(null);
  const statusRef = useRef(null);
  const priorityRef = useRef(null);
  const assigneeRef = useRef(null);
  const dueAtRef = useRef(null);
  const tagsRef = useRef(null);
  const blockedRef = useRef(null);
  const readyRef = useRef(null);
  const [commentDraft, setCommentDraft] = useState({ author: '', text: '' });
  const [isCommentComposerOpen, setIsCommentComposerOpen] = useState(false);

  useEffect(() => {
    const textarea = descriptionRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [draft.description]);

  function update(field, value) {
    onDraftChange({ ...draft, [field]: value });
  }

  function stopPropagation(e) {
    e.stopPropagation();
  }

  function buildSavePayload() {
    return {
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      status: draft.status,
      priority: draft.priority,
      assignee: draft.assignee.trim() || null,
      dueAt: draft.dueAt ? new Date(`${draft.dueAt}T00:00:00`).toISOString() : null,
      tags: draft.tagsText
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      blocked: draft.blocked,
      ready: draft.ready
    };
  }

  const focusOrder = [
    titleRef,
    descriptionRef,
    statusRef,
    priorityRef,
    assigneeRef,
    dueAtRef,
    tagsRef,
    blockedRef,
    readyRef
  ];

  function focusNextField(currentRef) {
    const currentIndex = focusOrder.findIndex((ref) => ref === currentRef);
    const nextRef = focusOrder[currentIndex + 1];
    if (nextRef?.current) {
      nextRef.current.focus();
      if (typeof nextRef.current.select === 'function') {
        nextRef.current.select();
      }
      return true;
    }
    return false;
  }

  function handleKeyDown(e, currentRef, isMultiLine = false) {
    if (e.key !== 'Enter' || e.shiftKey) {
      return;
    }

    e.preventDefault();

    if (!focusNextField(currentRef)) {
      onSave(buildSavePayload());
    }
  }

  async function handleAddComment() {
    const payload = {
      author: commentDraft.author.trim(),
      text: commentDraft.text.trim()
    };

    if (!payload.author || !payload.text) return;

    const didCreate = await onAddComment(payload);
    if (!didCreate) return;
    setCommentDraft({ author: '', text: '' });
    setIsCommentComposerOpen(false);
  }

  const comments = [...normalizeComments(task.comments)].sort((a, b) => {
    const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (timeDiff !== 0) return timeDiff;
    return String(b.id ?? '').localeCompare(String(a.id ?? ''));
  });

  return (
    <div className="editor" onClick={(e) => e.stopPropagation()}>
      <div className="editor-fields">
        <label>
          <span className="small">Title</span>
          <input ref={titleRef} className="edit-control" aria-label="Detail title" value={draft.title} onChange={(e) => update('title', e.target.value)} onMouseDown={stopPropagation} onTouchStart={stopPropagation} onKeyDown={(e) => handleKeyDown(e, titleRef, false)} autoFocus />
        </label>

        <label>
          <span className="small">Description</span>
          <textarea
            ref={descriptionRef}
            className="edit-control auto-grow-textarea"
            aria-label="Detail description"
            value={draft.description}
            rows={1}
            onChange={(e) => update('description', e.target.value)}
            onMouseDown={stopPropagation}
            onTouchStart={stopPropagation}
            onKeyDown={(e) => handleKeyDown(e, descriptionRef, true)}
          />
        </label>

        <div className="editor-grid">
          <label>
            <span className="small">Status</span>
            <select ref={statusRef} className="edit-control" aria-label="Detail status" value={draft.status} onChange={(e) => update('status', e.target.value)} onMouseDown={stopPropagation} onTouchStart={stopPropagation} onKeyDown={(e) => handleKeyDown(e, statusRef)}>
              {STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="small">Priority</span>
            <select ref={priorityRef} className="edit-control" aria-label="Detail priority" value={draft.priority} onChange={(e) => update('priority', e.target.value)} onMouseDown={stopPropagation} onTouchStart={stopPropagation} onKeyDown={(e) => handleKeyDown(e, priorityRef)}>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="small">Assignee</span>
            <input ref={assigneeRef} className="edit-control" aria-label="Detail assignee" value={draft.assignee} onChange={(e) => update('assignee', e.target.value)} onMouseDown={stopPropagation} onTouchStart={stopPropagation} onKeyDown={(e) => handleKeyDown(e, assigneeRef, false)} />
          </label>

          <label>
            <span className="small">Due date</span>
            <input ref={dueAtRef} className="edit-control" aria-label="Detail due date" type="date" value={draft.dueAt} onChange={(e) => update('dueAt', e.target.value)} onMouseDown={stopPropagation} onTouchStart={stopPropagation} onKeyDown={(e) => handleKeyDown(e, dueAtRef)} />
          </label>
        </div>

        <label>
          <span className="small">Tags (comma separated)</span>
          <input ref={tagsRef} className="edit-control" aria-label="Detail tags" value={draft.tagsText} onChange={(e) => update('tagsText', e.target.value)} placeholder="api, ui, urgent" onMouseDown={stopPropagation} onTouchStart={stopPropagation} onKeyDown={(e) => handleKeyDown(e, tagsRef, false)} />
        </label>

        <div className="editor-toggles">
          <label className="toggle-label">
            <input
              ref={blockedRef}
              aria-label="Detail blocked"
              type="checkbox"
              checked={draft.blocked}
              onChange={(e) => update('blocked', e.target.checked)}
              onKeyDown={(e) => handleKeyDown(e, blockedRef)}
            />
            <span>Blocked</span>
          </label>
          <label className="toggle-label">
            <input
              ref={readyRef}
              aria-label="Detail ready"
              type="checkbox"
              checked={draft.ready}
              onChange={(e) => update('ready', e.target.checked)}
              onKeyDown={(e) => handleKeyDown(e, readyRef)}
            />
            <span>Ready</span>
          </label>
        </div>
      </div>

      <div className="actions editor-actions">
        <div className="editor-primary-actions">
          <button
            className="primary-btn font-display"
            onClick={() => onSave(buildSavePayload())}
          >
            Save changes
          </button>
          <button className="secondary-btn font-display" onClick={onArchive}>Archive task</button>
          <button className="tertiary-btn" onClick={onClose}>Close</button>
        </div>

        <div className="comments-section">
          <div className="comments-header">
            <h4 className="font-display">Comments</h4>
            <div className="comments-header-actions">
              <span className="small comments-count">{comments.length === 0 ? 'No comments yet' : `${comments.length} comment${comments.length === 1 ? '' : 's'}`}</span>
              <button
                className={`${isCommentComposerOpen ? 'tertiary-btn' : 'primary-btn font-display'} comment-toggle-btn`}
                type="button"
                aria-expanded={isCommentComposerOpen}
                aria-controls="task-comment-composer"
                onClick={() => setIsCommentComposerOpen((current) => !current)}
              >
                {isCommentComposerOpen ? 'Close' : '+'}
              </button>
            </div>
          </div>

          {isCommentComposerOpen ? (
            <div id="task-comment-composer" className="comment-composer">
              <label>
                <span className="small">Comment author</span>
                <input
                  className="edit-control"
                  aria-label="Comment author"
                  value={commentDraft.author}
                  onChange={(e) => setCommentDraft((current) => ({ ...current, author: e.target.value }))}
                  onMouseDown={stopPropagation}
                  onTouchStart={stopPropagation}
                />
              </label>
              <label>
                <span className="small">Comment</span>
                <textarea
                  className="edit-control"
                  aria-label="Comment text"
                  value={commentDraft.text}
                  rows={3}
                  onChange={(e) => setCommentDraft((current) => ({ ...current, text: e.target.value }))}
                  onMouseDown={stopPropagation}
                  onTouchStart={stopPropagation}
                />
              </label>
              <div className="actions">
                <button
                  className="primary-btn font-display"
                  type="button"
                  onClick={() => void handleAddComment()}
                  disabled={isSubmittingComment || !commentDraft.author.trim() || !commentDraft.text.trim()}
                >
                  {isSubmittingComment ? 'Adding…' : 'Add comment'}
                </button>
              </div>
            </div>
          ) : null}

          {comments.length > 0 ? (
            <ol className="comments-list" aria-label="Task comments">
              {comments.map((comment) => (
                <li key={comment.id} className="comment-card">
                  <div className="comment-meta">
                    <strong>{comment.author}</strong>
                    <time className="small" dateTime={comment.createdAt}>{formatCommentTimestamp(comment.createdAt)}</time>
                  </div>
                  <p>{comment.text}</p>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function assigneeInitial(assignee) {
  return assignee?.trim()?.charAt(0)?.toUpperCase() ?? null;
}

export function App() {
  const [view, setView] = useState('board');
  const [selectedId, setSelectedId] = useState(null);
  const [filters, setFilters] = useState({ q: '', status: '', priority: '', tag: '', includeArchived: false });
  
  // Default backlog view to Status: Todo
  useEffect(() => {
    if (view === 'backlog' && filters.status === '') {
      setFilters((current) => ({ ...current, status: 'todo' }));
    }
  }, [view, filters.status]);

  const [newTask, setNewTask] = useState({ title: '', expanded: false, description: '', priority: 'medium', assignee: '', dueAt: '', tagsText: '', blocked: false, ready: false });
  const [confettiBursts, setConfettiBursts] = useState([]);
  const [submittingCommentForTaskId, setSubmittingCommentForTaskId] = useState(null);
  const confettiTimeoutsRef = useRef(new Map());
  const audioContextRef = useRef(null);
  const taskCardRefs = useRef({});

  // Scroll to task card after save/close if needed
  function scrollToTaskIfNeeded(taskId) {
    const cardEl = taskCardRefs.current[taskId];
    if (!cardEl) return;
    
    const cardRect = cardEl.getBoundingClientRect();
    const headerHeight = document.querySelector('header')?.offsetHeight || 0;
    
    // If the top of the card is above the visible area (below header), scroll it into view
    if (cardRect.top < headerHeight) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  const {
    tasks,
    error,
    createTask: createTaskRequest,
    updateTask: patchTaskRequest,
    archiveTask: archiveTaskRequest,
    createTaskComment: createTaskCommentRequest,
    refreshTask
  } = useTasks(filters, {
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
    } catch {}
  }

  async function patchTask(id, patch) {
    try {
      await patchTaskRequest(id, patch);
      return true;
    } catch {
      return false;
    }
  }

  async function archiveTask(id) {
    try {
      await archiveTaskRequest(id);
      clearDraft(id);
      setSelectedId(null);
      return true;
    } catch {
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
            <button className={`nav-btn ${view === 'board' ? 'active' : ''}`} onClick={() => setView('board')}>Kanban</button>
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
        <button className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}>Board</button>
      </nav>

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
