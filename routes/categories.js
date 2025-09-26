import express from 'express'

const router = express.Router();

// In-memory categories (replace with DB in production)
// Each category has id, title, and projectCount (number)
const categories = [
  { id: 1, title: "Medicine", projectCount: 1900 },
  { id: 2, title: "Economics", projectCount: 1500 },
  { id: 3, title: "Law", projectCount: 1200 }
];

// GET /api/categories
// Supports optional query params:
// - q: text search in title
// - minCount, maxCount: numeric bounds for projectCount
// - sortBy=title|projectCount, order=asc|desc
router.get(`/`, (req, res) => {
  try {
    const { q, minCount, maxCount, sortBy = 'title', order = 'asc' } = req.query;

    let result = [...categories];

    // Text search by title
    if (q) {
      const needle = String(q).toLowerCase();
      result = result.filter(c => c.title.toLowerCase().includes(needle));
    }

    // Numeric filters for projectCount
    const minC = minCount !== undefined ? Number(minCount) : undefined;
    const maxC = maxCount !== undefined ? Number(maxCount) : undefined;
    if (Number.isNaN(minC) || Number.isNaN(maxC)) {
      return res.status(400).json({ message: 'Invalid numeric filter provided' });
    }
    if (minC !== undefined) result = result.filter(c => c.projectCount >= minC);
    if (maxC !== undefined) result = result.filter(c => c.projectCount <= maxC);

    // Sorting
    const sortable = new Set(['title', 'projectCount']);
    const field = sortable.has(String(sortBy)) ? String(sortBy) : 'title';
    const sortOrder = String(order).toLowerCase() === 'desc' ? -1 : 1;
    result.sort((a, b) => {
      const va = a[field];
      const vb = b[field];
      if (typeof va === 'string' && typeof vb === 'string') {
        return va.localeCompare(vb) * sortOrder;
      }
      return (va > vb ? 1 : va < vb ? -1 : 0) * sortOrder;
    });

    res.json({ data: result, sort: { by: field, order: sortOrder === 1 ? 'asc' : 'desc' }, filters: { q, minCount: minC, maxCount: maxC } });
  } catch (e) {
    console.error('GET /categories error', e);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /api/categories/:id
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const category = categories.find(c => c.id === id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json(category);
});

// POST /api/categories
router.post('/', (req, res) => {
  try {
    const { title, projectCount = 0 } = req.body || {};
    if (!title) return res.status(400).json({ message: 'title is required' });

    const id = categories.length ? Math.max(...categories.map(c => c.id)) + 1 : 1;
    const category = { id, title, projectCount: Number(projectCount) || 0 };
    categories.push(category);
    res.status(201).json(category);
  } catch (e) {
    console.error('POST /categories error', e);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;