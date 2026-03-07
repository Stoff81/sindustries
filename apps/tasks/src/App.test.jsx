import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App.jsx';

function mockTask(overrides = {}) {
  return {
    id: 'task-1',
    title: 'Task 1',
    status: 'todo',
    statusChangedAt: '2026-03-01T00:00:00.000Z',
    priority: 'medium',
    ...overrides
  };
}

describe('tasks ui', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders backlog list and filter controls', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [mockTask()] }) }));

    render(<App />);

    // Click Backlog button to switch from default Kanban view
    fireEvent.click(screen.getByRole('button', { name: 'Backlog' }));

    expect(await screen.findByRole('list', { name: 'Backlog list' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
    expect(screen.getByLabelText('Status filter')).toBeInTheDocument();
    expect(screen.getByLabelText('Priority filter')).toBeInTheDocument();
  });

  it('renders board columns sorted by statusChangedAt', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            mockTask({ id: 'newer', title: 'Newer', status: 'todo', statusChangedAt: '2026-03-02T00:00:00.000Z' }),
            mockTask({ id: 'older', title: 'Older', status: 'todo', statusChangedAt: '2026-03-01T00:00:00.000Z' })
          ]
        })
      })
    );

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Kanban' }));

    const todoColumn = await screen.findByTestId('column-todo');
    const cards = within(todoColumn).getAllByRole('button');
    expect(cards[0]).toHaveTextContent('Older');
    expect(cards[1]).toHaveTextContent('Newer');
  });

  it('creates and archives a task from the UI', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [mockTask()] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: mockTask({ id: 'created', title: 'Created' }) }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [mockTask(), mockTask({ id: 'created', title: 'Created' })] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { id: 'created', archivedAt: '2026-03-03T00:00:00.000Z' } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [mockTask()] }) });

    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    // Switch to Backlog view from default Kanban view
    fireEvent.click(screen.getByRole('button', { name: 'Backlog' }));

    await screen.findByRole('list', { name: 'Backlog list' });
    fireEvent.click(screen.getByRole('button', { name: '+ New Task' }));
    fireEvent.change(screen.getByLabelText('New task title'), { target: { value: 'Created' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create task' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/tasks'), expect.objectContaining({ method: 'POST' })));

    fireEvent.click(await screen.findByRole('button', { name: 'Created' }));
    fireEvent.click(screen.getByRole('button', { name: 'Archive task' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/tasks/created'), expect.objectContaining({ method: 'DELETE' })));
  });

  it('toggles archived filter and updates query', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [mockTask()] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [mockTask({ archivedAt: '2026-03-01T00:00:00.000Z' })] }) });

    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    // Switch to Backlog view from default Kanban view
    fireEvent.click(screen.getByRole('button', { name: 'Backlog' }));

    await screen.findByRole('list', { name: 'Backlog list' });
    fireEvent.click(screen.getByRole('button', { name: 'Show archived' }));

    await waitFor(() => {
      const callUrl = fetchMock.mock.calls[1][0];
      expect(callUrl).toContain('includeArchived=true');
    });
  });
});
