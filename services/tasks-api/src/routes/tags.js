import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const tagsRouter = Router();

tagsRouter.get('/tags', async (_req, res, next) => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: [{ name: 'asc' }]
    });

    return res.status(200).json({ data: tags });
  } catch (error) {
    return next(error);
  }
});
