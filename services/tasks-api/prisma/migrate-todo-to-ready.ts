// Migration script to update existing tasks from todo -> ready
// Run this once to migrate existing data

import { prisma } from '../src/lib/prisma.ts';

async function migrate() {
  console.log('Starting migration: todo -> ready');
  
  // Update tasks with status 'todo' to 'ready'
  const result = await prisma.task.updateMany({
    where: { status: 'todo' },
    data: { status: 'ready' }
  });
  
  console.log(`Updated ${result.count} tasks from 'todo' to 'ready'`);
  
  // Verify the migration
  const todoCount = await prisma.task.count({ where: { status: 'todo' } });
  const readyCount = await prisma.task.count({ where: { status: 'ready' } });
  
  console.log(`Verification: ${todoCount} tasks still have 'todo', ${readyCount} have 'ready'`);
  
  await prisma.$disconnect();
  console.log('Migration complete');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
