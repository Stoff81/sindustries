const DEFAULT_API_BASE_BY_PORT = {
  '5173': 'http://localhost:4000/api/v1',
  '5174': 'http://localhost:4001/api/v1'
};

const API_BASE =
  import.meta.env.VITE_TASKS_API_BASE_URL
  ?? DEFAULT_API_BASE_BY_PORT[window.location.port]
  ?? 'http://localhost:4000/api/v1';

async function api(path, options) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'content-type': 'application/json', ...(options?.headers ?? {}) },
    ...options
  });

  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message ?? 'Request failed');
  return body;
}

export async function fetchTasks(filters) {
  const query = new URLSearchParams({ sort: 'priority', limit: '100' });
  if (filters.q) query.set('q', filters.q);
  if (filters.status) query.set('status', filters.status);
  if (filters.priority) query.set('priority', filters.priority);
  if (filters.tag) query.set('tag', filters.tag);
  if (filters.includeArchived) query.set('includeArchived', 'true');

  const response = await api(`/tasks?${query.toString()}`);
  return response.data;
}

export async function createTask(payload) {
  const response = await api('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return response.data;
}

export async function updateTask(id, patch) {
  const response = await api(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch)
  });

  return response.data;
}

export async function fetchTask(id) {
  const response = await api(`/tasks/${id}`);
  return response.data;
}

export async function archiveTask(id) {
  const response = await api(`/tasks/${id}`, { method: 'DELETE' });
  return response.data;
}

export async function createTaskComment(id, payload) {
  const response = await api(`/tasks/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return response.data;
}
