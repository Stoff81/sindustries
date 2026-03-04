import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const validStatuses = new Set(['todo', 'doing', 'done']);
const validPriorities = new Set(['low', 'medium', 'high', 'urgent']);
const validSorts = new Set(['priority', 'createdAt', 'updatedAt', 'dueAt', 'statusChangedAt']);

const priorityOrder = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3
};

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function parseLimit(value) {
  const n = Number.parseInt(value ?? `${DEFAULT_LIMIT}`, 10);
  if (Number.isNaN(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

function encodeCursor(createdAt, id) {
  return Buffer.from(`${createdAt.toISOString()}::${id}`, 'utf8').toString('base64url');
}

function decodeCursor(cursor) {
  if (!cursor) return null;

  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const [createdAtRaw, id] = decoded.split('::');
    const createdAt = new Date(createdAtRaw);

    if (!id || Number.isNaN(createdAt.valueOf())) {
      return null;
    }

    return { createdAt, id };
  } catch {
    return null;
  }
}

function mapTask(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    statusChangedAt: task.statusChangedAt,
    priority: task.priority,
    dueAt: task.dueAt,
    completedAt: task.completedAt,
    assignee: task.assignee,
    archivedAt: task.archivedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    tags: task.tags?.map((taskTag) => taskTag.tag?.name).filter(Boolean) ?? []
  };
}

export const tasksRouter = Router();

tasksRouter.get('/tasks', async (req, res, next) => {
  try {
    const {
      status,
      priority,
      assignee,
      tag,
      q,
      dueBefore,
      dueAfter,
      limit: rawLimit,
      cursor,
      sort = 'priority'
    } = req.query;

    if (status && !validStatuses.has(status)) {
      return res.status(400).json({ error: 'Invalid status filter' });
    }

    if (priority && !validPriorities.has(priority)) {
      return res.status(400).json({ error: 'Invalid priority filter' });
    }

    if (sort && !validSorts.has(sort)) {
      return res.status(400).json({ error: 'Invalid sort value' });
    }

    const dueBeforeDate = parseDate(dueBefore);
    if (dueBefore && !dueBeforeDate) {
      return res.status(400).json({ error: 'Invalid dueBefore value' });
    }

    const dueAfterDate = parseDate(dueAfter);
    if (dueAfter && !dueAfterDate) {
      return res.status(400).json({ error: 'Invalid dueAfter value' });
    }

    const decodedCursor = decodeCursor(cursor);
    if (cursor && !decodedCursor) {
      return res.status(400).json({ error: 'Invalid cursor value' });
    }

    const limit = parseLimit(rawLimit);

    const where = {
      archivedAt: null,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(assignee ? { assignee: { equals: assignee, mode: 'insensitive' } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } }
            ]
          }
        : {}),
      ...(tag
        ? {
            tags: {
              some: {
                tag: {
                  name: { equals: tag, mode: 'insensitive' }
                }
              }
            }
          }
        : {}),
      ...(dueBeforeDate || dueAfterDate
        ? {
            dueAt: {
              ...(dueBeforeDate ? { lte: dueBeforeDate } : {}),
              ...(dueAfterDate ? { gte: dueAfterDate } : {})
            }
          }
        : {})
    };

    const orderBy =
      sort === 'priority'
        ? [{ createdAt: 'desc' }]
        : sort === 'dueAt'
          ? [{ dueAt: 'asc' }, { createdAt: 'desc' }]
          : [{ [sort]: 'desc' }, { createdAt: 'desc' }];

    const queryWhere = decodedCursor
      ? {
          AND: [
            where,
            {
              OR: [
                { createdAt: { lt: decodedCursor.createdAt } },
                {
                  createdAt: decodedCursor.createdAt,
                  id: { lt: decodedCursor.id }
                }
              ]
            }
          ]
        }
      : where;

    const tasks = await prisma.task.findMany({
      where: queryWhere,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      },
      take: limit + 1
    });

    let sortedTasks = tasks;
    if (sort === 'priority') {
      sortedTasks = [...tasks].sort((a, b) => {
        const p = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (p !== 0) return p;
        if (a.createdAt > b.createdAt) return -1;
        if (a.createdAt < b.createdAt) return 1;
        return b.id.localeCompare(a.id);
      });
    } else if (sort === 'dueAt') {
      sortedTasks = [...tasks].sort((a, b) => {
        if (!a.dueAt && !b.dueAt) return b.createdAt - a.createdAt;
        if (!a.dueAt) return 1;
        if (!b.dueAt) return -1;
        if (a.dueAt > b.dueAt) return 1;
        if (a.dueAt < b.dueAt) return -1;
        return b.createdAt - a.createdAt;
      });
    }

    const hasNextPage = sortedTasks.length > limit;
    const pageTasks = sortedTasks.slice(0, limit);
    const lastTask = pageTasks.at(-1);

    return res.status(200).json({
      data: pageTasks.map(mapTask),
      page: {
        limit,
        nextCursor: hasNextPage && lastTask ? encodeCursor(lastTask.createdAt, lastTask.id) : null,
        hasNextPage
      }
    });
  } catch (error) {
    return next(error);
  }
});

tasksRouter.get('/tasks/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: { id, archivedAt: null },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    return res.status(200).json({ data: mapTask(task) });
  } catch (error) {
    return next(error);
  }
});
