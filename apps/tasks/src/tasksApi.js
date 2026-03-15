/** @typedef {{ q?: string, status?: string, priority?: string, tag?: string, includeArchived?: boolean }} TaskFilters */

/**
 * @typedef {Object} Task
 * @property {string|number} id
 * @property {string} title
 * @property {string|null} [description]
 * @property {string} status
 * @property {string} priority
 * @property {string|null} [assignee]
 * @property {string|null} [dueAt]
 * @property {Array<{name: string}|string>} [tags]
 * @property {boolean} [blocked]
 * @property {boolean} [ready]
 * @property {string|null} [archivedAt]
 * @property {string|null} [createdAt]
 * @property {string|null} [statusChangedAt]
 * @property {Array<Comment>} [comments]
 */

/**
 * @typedef {Object} Comment
 * @property {string|number} [id]
 * @property {string} author
 * @property {string} text
 * @property {string} [createdAt]
 */

/**
 * @typedef {Object} CreateTaskPayload
 * @property {string} title
 * @property {string|null} [description]
 * @property {string} [priority]
 * @property {string|null} [dueAt]
 * @property {string|null} [assignee]
 * @property {string[]} [tags]
 * @property {boolean} [blocked]
 * @property {boolean} [ready]
 */

/**
 * @typedef {Object} UpdateTaskPayload
 * @property {string} [title]
 * @property {string|null} [description]
 * @property {string} [status]
 * @property {string} [priority]
 * @property {string|null} [assignee]
 * @property {string|null} [dueAt]
 * @property {string[]} [tags]
 * @property {boolean} [blocked]
 * @property {boolean} [ready]
 */

/**
 * @typedef {Object} CreateCommentPayload
 * @property {string} author
 * @property {string} text
 */

const DEFAULT_API_BASE_BY_PORT = {
  '5173': 'http://localhost:4000/api/v1',
  '5174': 'http://localhost:4001/api/v1'
};

const API_BASE =
  import.meta.env.VITE_TASKS_API_BASE_URL
  ?? DEFAULT_API_BASE_BY_PORT[window.location.port]
  ?? 'http://localhost:4000/api/v1';

/**
 * @template T
 * @param {string} path
 * @param {RequestInit} [options]
 * @returns {Promise<T>}
 */
async function api(path, options) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'content-type': 'application/json', ...(options?.headers ?? {}) },
    ...options
  });

  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message ?? 'Request failed');
  return body;
}

/**
 * Fetch tasks with optional filters
 * @param {TaskFilters} filters
 * @returns {Promise<Task[]>}
 */
export async function fetchTasks(filters) {
  const query = new URLSearchParams({ sort: 'priority', limit: '100' });
  if (filters.q) query.set('q', filters.q);
  if (filters.status) query.set('status', filters.status);
  if (filters.priority) query.set('priority', filters.priority);
  if (filters.tag) query.set('tag', filters.tag);
  if (filters.includeArchived) query.set('includeArchived', 'true');

  const response = await api(/** @type {any} */ ({ data: [] }), `/tasks?${query.toString()}`);
  return response.data;
}

/**
 * Create a new task
 * @param {CreateTaskPayload} payload
 * @returns {Promise<Task>}
 */
export async function createTask(payload) {
  const response = await api(/** @type {any} */ ({ data: null }), '/tasks', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return response.data;
}

/**
 * Update an existing task
 * @param {string|number} id
 * @param {UpdateTaskPayload} patch
 * @returns {Promise<Task>}
 */
export async function updateTask(id, patch) {
  const response = await api(/** @type {any} */ ({ data: null }), `/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch)
  });

  return response.data;
}

/**
 * Fetch a single task by ID
 * @param {string|number} id
 * @returns {Promise<Task>}
 */
export async function fetchTask(id) {
  const response = await api(/** @type {any} */ ({ data: null }), `/tasks/${id}`);
  return response.data;
}

/**
 * Archive a task
 * @param {string|number} id
 * @returns {Promise<{data: null}>}
 */
export async function archiveTask(id) {
  const response = await api(/** @type {any} */ ({ data: null }), `/tasks/${id}`, { method: 'DELETE' });
  return response.data;
}

/**
 * Add a comment to a task
 * @param {string|number} id
 * @param {CreateCommentPayload} payload
 * @returns {Promise<Comment>}
 */
export async function createTaskComment(id, payload) {
  const response = await api(/** @type {any} */ ({ data: null }), `/tasks/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return response.data;
}
