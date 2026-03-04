import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  task: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  taskTag: {
    deleteMany: vi.fn(),
    createMany: vi.fn()
  },
  tag: {
    findMany: vi.fn(),
    upsert: vi.fn()
  }
};

vi.mock('../src/lib/prisma.js', () => ({
  prisma: prismaMock
}));

const { createApp } = await import('../src/app.js');

function task(overrides = {}) {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Task',
    description: null,
    status: 'todo',
    statusChangedAt: new Date('2026-03-01T00:00:00.000Z'),
    priority: 'medium',
    dueAt: null,
    completedAt: null,
    assignee: null,
    archivedAt: null,
    createdAt: new Date('2026-03-01T00:00:00.000Z'),
    updatedAt: new Date('2026-03-01T00:00:00.000Z'),
    tags: [],
    ...overrides
  };
}

describe('tasks api endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/v1/tasks returns paginated task list', async () => {
    prismaMock.task.findMany.mockResolvedValue([
      task({ id: 'a1111111-1111-1111-1111-111111111111', title: 'Urgent task', priority: 'urgent' }),
      task({ id: 'b1111111-1111-1111-1111-111111111111', title: 'Low task', priority: 'low' })
    ]);

    const app = createApp();
    const response = await request(app)
      .get('/api/v1/tasks')
      .query({ status: 'todo', limit: 2, q: 'task' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.page).toEqual({
      limit: 2,
      nextCursor: null,
      hasNextPage: false
    });
    expect(prismaMock.task.findMany).toHaveBeenCalledTimes(1);
  });

  it('GET /api/v1/tasks validates bad status filter', async () => {
    const app = createApp();

    const response = await request(app).get('/api/v1/tasks').query({ status: 'blocked' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid status filter' });
    expect(prismaMock.task.findMany).not.toHaveBeenCalled();
  });

  it('GET /api/v1/tasks/:id returns a single task', async () => {
    prismaMock.task.findFirst.mockResolvedValue(
      task({
        id: '22222222-2222-2222-2222-222222222222',
        title: 'Task detail',
        tags: [{ tag: { name: 'backend' } }]
      })
    );

    const app = createApp();
    const response = await request(app).get('/api/v1/tasks/22222222-2222-2222-2222-222222222222');

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe('22222222-2222-2222-2222-222222222222');
    expect(response.body.data.tags).toEqual(['backend']);
  });

  it('POST /api/v1/tasks creates a task', async () => {
    prismaMock.tag.upsert.mockResolvedValue({ id: 'tag-1', name: 'backend' });
    prismaMock.task.create.mockResolvedValue(task({ title: 'Created task', tags: [{ tag: { name: 'backend' } }] }));

    const app = createApp();
    const response = await request(app).post('/api/v1/tasks').send({
      title: 'Created task',
      priority: 'high',
      tags: ['backend']
    });

    expect(response.status).toBe(201);
    expect(response.body.data.title).toBe('Created task');
    expect(response.body.data.tags).toEqual(['backend']);
    expect(prismaMock.task.create).toHaveBeenCalledTimes(1);
  });

  it('PATCH /api/v1/tasks/:id updates task fields', async () => {
    prismaMock.task.findFirst
      .mockResolvedValueOnce(task())
      .mockResolvedValueOnce(task({ title: 'Updated title', status: 'doing' }));
    prismaMock.task.update.mockResolvedValue(task({ title: 'Updated title', status: 'doing' }));

    const app = createApp();
    const response = await request(app)
      .patch('/api/v1/tasks/11111111-1111-1111-1111-111111111111')
      .send({ title: 'Updated title', status: 'doing' });

    expect(response.status).toBe(200);
    expect(response.body.data.title).toBe('Updated title');
    expect(response.body.data.status).toBe('doing');
    expect(prismaMock.task.update).toHaveBeenCalledTimes(1);
  });

  it('DELETE /api/v1/tasks/:id archives task', async () => {
    prismaMock.task.findFirst.mockResolvedValueOnce(task());
    prismaMock.task.update.mockResolvedValue({
      id: '11111111-1111-1111-1111-111111111111',
      archivedAt: new Date('2026-03-04T00:00:00.000Z')
    });

    const app = createApp();
    const response = await request(app).delete('/api/v1/tasks/11111111-1111-1111-1111-111111111111');

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe('11111111-1111-1111-1111-111111111111');
    expect(response.body.data.archivedAt).toBeDefined();
  });

  it('GET /api/v1/tasks/:id returns 404 when missing', async () => {
    prismaMock.task.findFirst.mockResolvedValue(null);

    const app = createApp();
    const response = await request(app).get('/api/v1/tasks/missing');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Task not found' });
  });

  it('GET /api/v1/tags returns tags in name order', async () => {
    prismaMock.tag.findMany.mockResolvedValue([
      { id: '1', name: 'backend', createdAt: new Date('2026-03-01T00:00:00.000Z') },
      { id: '2', name: 'frontend', createdAt: new Date('2026-03-01T00:00:00.000Z') }
    ]);

    const app = createApp();
    const response = await request(app).get('/api/v1/tags');

    expect(response.status).toBe(200);
    expect(response.body.data.map((tag) => tag.name)).toEqual(['backend', 'frontend']);
    expect(prismaMock.tag.findMany).toHaveBeenCalledWith({ orderBy: [{ name: 'asc' }] });
  });

  it('POST /api/v1/tags upserts tag', async () => {
    prismaMock.tag.upsert.mockResolvedValue({ id: 'tag-1', name: 'backend', createdAt: new Date() });

    const app = createApp();
    const response = await request(app).post('/api/v1/tags').send({ name: 'Backend' });

    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe('backend');
    expect(prismaMock.tag.upsert).toHaveBeenCalledTimes(1);
  });
});
