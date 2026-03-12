import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const statuses = ['todo', 'doing', 'done'];
const priorities = ['low', 'medium', 'high', 'urgent'];
const assignees = ['Tom', 'Quinn', 'Rowan', null];
const tagNames = ['ops', 'product', 'finance', 'family', 'health', 'automation', 'backend', 'frontend'];

function assertSafeSeedTarget() {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  const mode = (process.env.MODE ?? '').toLowerCase();

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to run seed safely.');
  }

  let parsed = null;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL is invalid; refusing to run seed.');
  }

  const dbName = parsed.pathname.replace(/^\//, '').toLowerCase();
  const isProdlikeByName = dbName.includes('prodlike');
  const isProdlikeByPort = parsed.hostname === 'localhost' && parsed.port === '5433';
  const isProdlikeByMode = mode === 'prodlike';

  if (isProdlikeByName || isProdlikeByPort || isProdlikeByMode) {
    throw new Error(
      `Refusing to seed prodlike database (${dbName || 'unknown'} at ${parsed.host}). ` +
      'Seeding prodlike is permanently blocked.'
    );
  }
}

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function main() {
  assertSafeSeedTarget();

  await prisma.taskTag.deleteMany();
  await prisma.task.deleteMany();
  await prisma.tag.deleteMany();

  const tags = [];
  for (const name of tagNames) {
    tags.push(await prisma.tag.create({ data: { name } }));
  }

  for (let i = 1; i <= 24; i++) {
    const status = statuses[i % statuses.length];
    const priority = priorities[i % priorities.length];
    const archivedAt = i <= 3 ? daysAgo(i) : null;

    const task = await prisma.task.create({
      data: {
        title: `Seed Task ${i}`,
        description: `Seeded task ${i} for milestone 1 foundation validation`,
        status,
        priority,
        statusChangedAt: daysAgo(i % 10),
        dueAt: i % 2 === 0 ? daysAgo(-1 * (i % 7)) : null,
        completedAt: status === 'done' ? daysAgo(i % 5) : null,
        assignee: assignees[i % assignees.length],
        archivedAt
      }
    });

    await prisma.taskTag.createMany({
      data: [
        { taskId: task.id, tagId: tags[i % tags.length].id },
        { taskId: task.id, tagId: tags[(i + 2) % tags.length].id }
      ],
      skipDuplicates: true
    });

    if (i === 15) {
      await prisma.taskComment.createMany({
        data: [
          {
            taskId: task.id,
            author: 'Tom',
            body: 'Seeded follow-up: please make sure the comments flow is easy to demo.'
          },
          {
            taskId: task.id,
            author: 'Rowan',
            body: 'Added backend + UI coverage for comments and left room for richer thread features later.'
          }
        ]
      });
    }
  }

  await prisma.task.create({
    data: {
      title: 'Comment Test Task',
      description: 'Purpose-built seed task for validating the comments UI demo flow',
      status: 'todo',
      priority: 'high',
      statusChangedAt: new Date(),
      assignee: 'Rowan',
      ready: true,
      comments: {
        create: [
          {
            author: 'Tom',
            body: 'Please make sure seeded comments are clearly visible in the UI.'
          },
          {
            author: 'Rowan',
            body: 'Added this task so the comments feature is easy to review without creating new data first.'
          }
        ]
      }
    }
  });

  console.log('Seed complete: 25 tasks, 8 tags, Seed Task 15 comments, Comment Test Task.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
