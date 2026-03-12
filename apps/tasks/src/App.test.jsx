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
    comments: [],
    ...overrides
  };
}

describe('tasks ui', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('renders existing comments in the task detail view', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [mockTask({
            id: 'commented-task',
            title: 'Commented task',
            comments: [
              {
                id: 'comment-1',
                author: 'Quinn',
                text: 'Backend slice is in.',
                createdAt: '2026-03-12T09:00:00.000Z'
              }
            ]
          })]
        })
      })
    );

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Backlog' }));

    await screen.findByRole('list', { name: 'Backlog list' });
    fireEvent.click(screen.getByRole('button', { name: 'Commented task' }));

    expect(screen.getByRole('heading', { name: 'Comments' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Task comments' })).toBeInTheDocument();
    expect(screen.getByText('Backend slice is in.')).toBeInTheDocument();
    expect(screen.getByText('Quinn')).toBeInTheDocument();
  });

  it('creates a comment, disables submit while pending, and clears the composer on success', async () => {
    let comments = [];
    let resolvePost;

    const fetchMock = vi.fn((url, options = {}) => {
      const method = options.method ?? 'GET';
      const urlText = String(url);

      if (method === 'GET' && urlText.includes('/tasks?')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: [mockTask({ id: 'comment-create-task', title: 'Comment create task', comments })]
          })
        });
      }

      if (method === 'POST' && urlText.includes('/tasks/comment-create-task/comments')) {
        return new Promise((resolve) => {
          resolvePost = () => {
            comments = [
              {
                id: 'comment-2',
                author: 'Rowan',
                text: 'UI slice landed.',
                createdAt: '2026-03-12T10:00:00.000Z'
              }
            ];
            resolve({
              ok: true,
              json: async () => ({ data: comments[0] })
            });
          };
        });
      }

      throw new Error(`Unexpected fetch call: ${method} ${urlText}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Backlog' }));

    await screen.findByRole('list', { name: 'Backlog list' });
    fireEvent.click(screen.getByRole('button', { name: 'Comment create task' }));

    fireEvent.change(screen.getByLabelText('Comment author'), { target: { value: 'Rowan' } });
    fireEvent.change(screen.getByLabelText('Comment text'), { target: { value: 'UI slice landed.' } });

    const closeButton = screen.getByRole('button', { name: 'Close' });
    const addCommentButton = screen.getByRole('button', { name: 'Add comment' });
    expect(closeButton.compareDocumentPosition(addCommentButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(addCommentButton);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Adding…' })).toBeDisabled());
    resolvePost();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/tasks/comment-create-task/comments'), expect.objectContaining({ method: 'POST' })));
    await waitFor(() => expect(screen.getByText('UI slice landed.')).toBeInTheDocument());
    expect(screen.getByLabelText('Comment author')).toHaveValue('');
    expect(screen.getByLabelText('Comment text')).toHaveValue('');
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

  it('renders board columns sorted by priority, readiness, then createdAt', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            mockTask({ id: 'newer', title: 'Newer', status: 'todo', priority: 'medium', ready: false, createdAt: '2026-03-02T00:00:00.000Z' }),
            mockTask({ id: 'older', title: 'Older', status: 'todo', priority: 'medium', ready: false, createdAt: '2026-03-01T00:00:00.000Z' })
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

  it('shows assignee avatar on collapsed kanban cards', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [mockTask({ id: 'assigned', title: 'Assigned', assignee: 'Quinn' })]
        })
      })
    );

    render(<App />);

    const card = await screen.findByTestId('card-assigned');
    expect(within(card).getByLabelText('Assignee Quinn')).toHaveTextContent('Q');
  });

  it('refreshes tasks when the window regains focus', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [mockTask({ id: 'focus-task', title: 'Before refresh' })]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [mockTask({ id: 'focus-task', title: 'After refresh' })]
        })
      });

    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    expect(await screen.findByRole('button', { name: 'Before refresh' })).toBeInTheDocument();

    fireEvent(window, new Event('focus'));

    expect(await screen.findByRole('button', { name: 'After refresh' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('preserves unsaved task edits when closing and reopening a ticket', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [mockTask({ id: 'draft-task', title: 'Original title' })]
        })
      })
    );

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Backlog' }));

    await screen.findByRole('list', { name: 'Backlog list' });
    fireEvent.click(screen.getByRole('button', { name: 'Original title' }));
    fireEvent.change(screen.getByLabelText('Detail title'), { target: { value: 'Draft title' } });
    expect(screen.getByLabelText('Detail title')).toHaveValue('Draft title');

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.getByText('Unsaved')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Original title' }));
    expect(screen.getByLabelText('Detail title')).toHaveValue('Draft title');
  });

  it('restores unsaved task edits after remounting the page', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [mockTask({ id: 'persisted-task', title: 'Persist me' })]
        })
      })
    );

    const firstRender = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Backlog' }));

    await screen.findByRole('list', { name: 'Backlog list' });
    fireEvent.click(screen.getByRole('button', { name: 'Persist me' }));
    fireEvent.change(screen.getByLabelText('Detail title'), { target: { value: 'Restored draft' } });

    firstRender.unmount();

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Backlog' }));

    await screen.findByRole('list', { name: 'Backlog list' });
    expect(screen.getByText('Unsaved')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Persist me' }));
    expect(screen.getByLabelText('Detail title')).toHaveValue('Restored draft');
  });

  it('creates and archives a task from the UI', async () => {
    let createdVisible = false;

    const fetchMock = vi.fn(async (url, options = {}) => {
      const method = options.method ?? 'GET';
      const urlText = String(url);

      if (method === 'POST' && urlText.includes('/tasks')) {
        createdVisible = true;
        return { ok: true, json: async () => ({ data: mockTask({ id: 'created', title: 'Created' }) }) };
      }

      if (method === 'DELETE' && urlText.includes('/tasks/created')) {
        createdVisible = false;
        return { ok: true, json: async () => ({ data: { id: 'created', archivedAt: '2026-03-03T00:00:00.000Z' } }) };
      }

      if (method === 'GET' && urlText.includes('/tasks?')) {
        return {
          ok: true,
          json: async () => ({
            data: createdVisible
              ? [mockTask(), mockTask({ id: 'created', title: 'Created' })]
              : [mockTask()]
          })
        };
      }

      throw new Error(`Unexpected fetch call: ${method} ${urlText}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

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

  it('moves focus to the next editor field on Enter and saves from the last field', async () => {
    const fetchMock = vi.fn(async (url, options = {}) => {
      const method = options.method ?? 'GET';
      const urlText = String(url);

      if (method === 'GET' && urlText.includes('/tasks?')) {
        return {
          ok: true,
          json: async () => ({
            data: [mockTask({ id: 'editor-task', title: 'Editor task', description: 'Line one' })]
          })
        };
      }

      if (method === 'PATCH' && urlText.includes('/tasks/editor-task')) {
        return {
          ok: true,
          json: async () => ({
            data: mockTask({ id: 'editor-task', title: 'Editor task', description: 'Line one', ready: true })
          })
        };
      }

      throw new Error(`Unexpected fetch call: ${method} ${urlText}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Backlog' }));

    await screen.findByRole('list', { name: 'Backlog list' });
    fireEvent.click(screen.getByRole('button', { name: 'Editor task' }));

    const titleInput = screen.getByLabelText('Detail title');
    titleInput.focus();
    fireEvent.keyDown(titleInput, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(screen.getByLabelText('Detail description')).toHaveFocus();

    const descriptionInput = screen.getByLabelText('Detail description');
    descriptionInput.focus();
    fireEvent.keyDown(descriptionInput, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(screen.getByLabelText('Detail status')).toHaveFocus();

    screen.getByLabelText('Detail blocked').focus();
    fireEvent.keyDown(screen.getByLabelText('Detail blocked'), { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(screen.getByLabelText('Detail ready')).toHaveFocus();

    screen.getByLabelText('Detail ready').focus();
    fireEvent.keyDown(screen.getByLabelText('Detail ready'), { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/tasks/editor-task'), expect.objectContaining({ method: 'PATCH' })));
  });

  it('allows Shift+Enter to insert a newline in the description without saving', async () => {
    const fetchMock = vi.fn(async (url, options = {}) => {
      const method = options.method ?? 'GET';
      const urlText = String(url);

      if (method === 'GET' && urlText.includes('/tasks?')) {
        return {
          ok: true,
          json: async () => ({
            data: [mockTask({ id: 'multiline-task', title: 'Multiline task', description: 'Line one' })]
          })
        };
      }

      if (method === 'PATCH' && urlText.includes('/tasks/multiline-task')) {
        return {
          ok: true,
          json: async () => ({ data: mockTask({ id: 'multiline-task', title: 'Multiline task', description: 'Line one\nLine two' }) })
        };
      }

      throw new Error(`Unexpected fetch call: ${method} ${urlText}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Backlog' }));

    await screen.findByRole('list', { name: 'Backlog list' });
    fireEvent.click(screen.getByRole('button', { name: 'Multiline task' }));

    const descriptionInput = screen.getByLabelText('Detail description');
    descriptionInput.focus();
    fireEvent.change(descriptionInput, { target: { value: 'Line one\nLine two' } });
    fireEvent.keyDown(descriptionInput, { key: 'Enter', code: 'Enter', charCode: 13, shiftKey: true });

    expect(descriptionInput).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/tasks/multiline-task'), expect.objectContaining({ method: 'PATCH' }));
    expect(descriptionInput.value).toBe('Line one\nLine two');
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
      const includeArchivedCall = fetchMock.mock.calls.find(([url]) => String(url).includes('includeArchived=true'));
      expect(includeArchivedCall?.[0]).toContain('includeArchived=true');
    });
  });

  it('shows archived tasks on the kanban board when archived filter is enabled', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [mockTask()] }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [mockTask({ id: 'archived-task', title: 'Archived task', archivedAt: '2026-03-01T00:00:00.000Z' })]
        })
      });

    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await screen.findByTestId('column-todo');
    fireEvent.click(screen.getByRole('button', { name: 'Show archived' }));

    const archivedCard = await screen.findByTestId('card-archived-task');
    expect(archivedCard).toHaveClass('archived');
    expect(within(archivedCard).getByRole('button', { name: 'Archived task' })).toBeInTheDocument();
  });
});
