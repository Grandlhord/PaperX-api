import express from 'express'
import { pool } from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get(`/`, async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ message: 'Database unavailable' });
    const { q, minCount, maxCount, sortBy = 'title', order = 'asc' } = req.query;
    const where = [];
    const params = [];
    if (q) {
      params.push(`%${String(q).toLowerCase()}%`);
      where.push(`lower(title) like $${params.length}`);
    }
    if (minCount !== undefined) {
      params.push(Number(minCount));
      where.push(`project_count >= $${params.length}`);
    }
    if (maxCount !== undefined) {
      params.push(Number(maxCount));
      where.push(`project_count <= $${params.length}`);
    }
    const sortable = new Set(['title', 'project_count']);
    const field = sortable.has(String(sortBy)) ? String(sortBy) : 'title';
    const sortOrder = String(order).toLowerCase() === 'desc' ? 'desc' : 'asc';
    const sql = `
      select id, title, project_count as "projectCount"
      from categories
      ${where.length ? `where ${where.join(' and ')}` : ''}
      order by ${field} ${sortOrder}
    `;
    const { rows } = await pool.query(sql, params);
    res.json({ data: rows, sort: { by: field, order: sortOrder }, filters: { q, minCount, maxCount } });
  } catch (e) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ message: 'Database unavailable' });
    const id = Number(req.params.id);
    const { rows } = await pool.query(
      `select id, title, project_count as "projectCount" from categories where id = $1`,
      [id]
    );
    const category = rows[0];
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ message: 'Database unavailable' });
    const { title, projectCount = 0 } = req.body || {};
    if (!title) return res.status(400).json({ message: 'title is required' });
    const { rows } = await pool.query(
      `insert into categories (title, project_count) values ($1, $2)
       on conflict (title) do update set project_count = categories.project_count
       returning id, title, project_count as "projectCount"`,
      [title, Number(projectCount) || 0]
    );
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
