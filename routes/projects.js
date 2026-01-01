import express from "express"
import { pool } from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();


// GET /api/projects
// Supports filtering, sorting, and pagination via query params
// Filters: q (search in title/author), category, status, minPrice, maxPrice, minDownloads, maxDownloads, tag
// Sorting: sortBy=createdAt|title|price|downloads, order=asc|desc
// Pagination: page (1-based), limit
router.get(`/`, async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ message: 'Database unavailable' });
    const {
      q,
      category,
      status,
      minPrice,
      maxPrice,
      minDownloads,
      maxDownloads,
      tag,
      university,
      department,
      year,
      type,
      subject,
      language,
      minRating,
      sortBy = 'created_at',
      order = 'desc',
      page = '1',
      limit = '50'
    } = req.query;
    const where = [];
    const params = [];
    if (q) {
      params.push(`%${String(q).toLowerCase()}%`);
      where.push(`(lower(title) like $${params.length} or lower(author) like $${params.length} or lower(description) like $${params.length})`);
    }
    if (category) {
      params.push(String(category).toLowerCase());
      where.push(`lower(category) = $${params.length}`);
    }
    if (status) {
      params.push(String(status).toLowerCase());
      where.push(`lower(status) = $${params.length}`);
    }
    if (university) {
      params.push(`%${String(university).toLowerCase()}%`);
      where.push(`lower(university) like $${params.length}`);
    }
    if (department) {
      params.push(`%${String(department).toLowerCase()}%`);
      where.push(`lower(department) like $${params.length}`);
    }
    if (type) {
      params.push(String(type).toLowerCase());
      where.push(`lower(type) = $${params.length}`);
    }
    if (subject) {
      params.push(`%${String(subject).toLowerCase()}%`);
      where.push(`lower(subject) like $${params.length}`);
    }
    if (language) {
      params.push(String(language).toLowerCase());
      where.push(`lower(language) = $${params.length}`);
    }
    if (year !== undefined) {
      params.push(Number(year));
      where.push(`year = $${params.length}`);
    }
    if (minRating !== undefined) {
      params.push(Number(minRating));
      where.push(`rating >= $${params.length}`);
    }
    if (minPrice !== undefined) {
      params.push(Number(minPrice));
      where.push(`price >= $${params.length}`);
    }
    if (maxPrice !== undefined) {
      params.push(Number(maxPrice));
      where.push(`price <= $${params.length}`);
    }
    if (minDownloads !== undefined) {
      params.push(Number(minDownloads));
      where.push(`downloads >= $${params.length}`);
    }
    if (maxDownloads !== undefined) {
      params.push(Number(maxDownloads));
      where.push(`downloads <= $${params.length}`);
    }
    if (tag) {
      params.push(String(tag).toLowerCase());
      where.push(`exists (select 1 from jsonb_array_elements_text(tags) t where lower(t) = $${params.length})`);
    }
    const sortable = new Set(['created_at', 'title', 'price', 'downloads', 'year', 'rating']);
    const field = sortable.has(String(sortBy)) ? String(sortBy) : 'created_at';
    const sortOrder = String(order).toLowerCase() === 'asc' ? 'asc' : 'desc';
    const pageNum = Math.max(1, parseInt(String(page)) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit)) || 50));
    const offset = (pageNum - 1) * limitNum;
    const baseSql = `
      from projects
      ${where.length ? `where ${where.join(' and ')}` : ''}
    `;
    const { rows: countRows } = await pool.query(`select count(*) as c ${baseSql}`, params);
    const total = Number(countRows[0].c);
    const { rows } = await pool.query(
      `
      select
        id, title, description, author, university, department, year, type, category, subject,
        pages, language, price, rating, downloads, tags, abstract, table_of_contents as "tableOfContents",
        upload_date as "uploadDate", file_size as "fileSize", format, status, created_at as "createdAt"
      ${baseSql}
      order by ${field} ${sortOrder}
      limit $${params.length + 1} offset $${params.length + 2}
      `,
      [...params, limitNum, offset]
    );
    res.json({
      data: rows,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
      sort: { by: field, order: sortOrder }
    });
  } catch {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /api/projects/:id
router.get(`/:id`, async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ message: 'Database unavailable' });
    const id = Number(req.params.id);
    const { rows } = await pool.query(
      `select
        id, title, description, author, university, department, year, type, category, subject,
        pages, language, price, rating, downloads, tags, abstract, table_of_contents as "tableOfContents",
        upload_date as "uploadDate", file_size as "fileSize", format, status, created_at as "createdAt"
       from projects where id = $1`,
      [id]
    );
    const project = rows[0];
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/projects
router.post("/", verifyToken, async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ message: 'Database unavailable' });
    const {
      title,
      description,
      author,
      university,
      department,
      year,
      type,
      category,
      subject,
      pages,
      language,
      price,
      rating,
      downloads = 0,
      tags = [],
      abstract,
      tableOfContents = [],
      uploadDate,
      fileSize,
      format,
      status = 'Unpublished'
    } = req.body || {};
    if (!title || !author || !category) {
      return res.status(400).json({ message: 'title, author and category are required' });
    }
    await pool.query(
      `insert into categories (title) values ($1) on conflict (title) do nothing`,
      [category]
    );
    const { rows } = await pool.query(
      `insert into projects
       (title, description, author, university, department, year, type, category, subject, pages, language, price, rating, downloads, tags, abstract, table_of_contents, upload_date, file_size, format, status)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       returning
       id, title, description, author, university, department, year, type, category, subject,
       pages, language, price, rating, downloads, tags, abstract, table_of_contents as "tableOfContents",
       upload_date as "uploadDate", file_size as "fileSize", format, status, created_at as "createdAt"`,
      [
        title, description, author, university, department,
        year !== undefined ? Number(year) : null,
        type, category, subject,
        pages !== undefined ? Number(pages) : null,
        language,
        price !== undefined ? Number(price) : null,
        rating !== undefined ? Number(rating) : null,
        Number(downloads) || 0,
        Array.isArray(tags) ? JSON.stringify(tags) : JSON.stringify([]),
        abstract,
        Array.isArray(tableOfContents) ? JSON.stringify(tableOfContents) : JSON.stringify([]),
        uploadDate ? new Date(uploadDate) : null,
        fileSize !== undefined ? Number(fileSize) : null,
        format,
        status
      ]
    );
    await pool.query(
      `update categories set project_count = project_count + 1 where title = $1`,
      [category]
    );
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// PUT /api/projects/:id
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ message: 'Database unavailable' });
    const id = Number(req.params.id);
    const {
      title,
      description,
      author,
      university,
      department,
      year,
      type,
      category,
      subject,
      pages,
      language,
      price,
      rating,
      downloads,
      tags,
      abstract,
      tableOfContents,
      uploadDate,
      fileSize,
      format,
      status
    } = req.body || {};
    if (!title || !author || !category) {
      return res.status(400).json({ message: 'title, author and category are required' });
    }
    await pool.query(
      `update projects set
        title=$1, description=$2, author=$3, university=$4, department=$5, year=$6, type=$7, category=$8, subject=$9,
        pages=$10, language=$11, price=$12, rating=$13, downloads=$14, tags=$15, abstract=$16, table_of_contents=$17,
        upload_date=$18, file_size=$19, format=$20, status=$21
       where id=$22`,
      [
        title, description, author, university, department,
        year !== undefined ? Number(year) : null,
        type, category, subject,
        pages !== undefined ? Number(pages) : null,
        language,
        price !== undefined ? Number(price) : null,
        rating !== undefined ? Number(rating) : null,
        downloads !== undefined ? Number(downloads) : null,
        tags !== undefined ? JSON.stringify(tags) : null,
        abstract !== undefined ? abstract : null,
        tableOfContents !== undefined ? JSON.stringify(tableOfContents) : null,
        uploadDate ? new Date(uploadDate) : null,
        fileSize !== undefined ? Number(fileSize) : null,
        format !== undefined ? format : null,
        status !== undefined ? status : null,
        id
      ]
    );
    const { rows } = await pool.query(
      `select
        id, title, description, author, university, department, year, type, category, subject,
        pages, language, price, rating, downloads, tags, abstract, table_of_contents as "tableOfContents",
        upload_date as "uploadDate", file_size as "fileSize", format, status, created_at as "createdAt"
       from projects where id = $1`,
      [id]
    );
    res.json(rows[0]);
  } catch {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// PATCH /api/projects/:id
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ message: 'Database unavailable' });
    const id = Number(req.params.id);
    const existing = await pool.query(`select * from projects where id=$1`, [id]);
    if (!existing.rows[0]) return res.status(404).json({ message: 'Project not found' });
    const body = req.body || {};
    const updated = {
      ...existing.rows[0],
      ...body
    };
    await pool.query(
      `update projects set
        title=$1, description=$2, author=$3, university=$4, department=$5, year=$6, type=$7, category=$8, subject=$9,
        pages=$10, language=$11, price=$12, rating=$13, downloads=$14, tags=$15, abstract=$16, table_of_contents=$17,
        upload_date=$18, file_size=$19, format=$20, status=$21
       where id=$22`,
      [
        updated.title, updated.description, updated.author, updated.university, updated.department,
        updated.year !== undefined ? Number(updated.year) : null,
        updated.type, updated.category, updated.subject,
        updated.pages !== undefined ? Number(updated.pages) : null,
        updated.language,
        updated.price !== undefined ? Number(updated.price) : null,
        updated.rating !== undefined ? Number(updated.rating) : null,
        updated.downloads !== undefined ? Number(updated.downloads) : null,
        updated.tags !== undefined ? JSON.stringify(updated.tags) : null,
        updated.abstract !== undefined ? updated.abstract : null,
        updated.tableOfContents !== undefined ? JSON.stringify(updated.tableOfContents) : null,
        updated.uploadDate ? new Date(updated.uploadDate) : null,
        updated.fileSize !== undefined ? Number(updated.fileSize) : null,
        updated.format !== undefined ? updated.format : null,
        updated.status !== undefined ? updated.status : null,
        id
      ]
    );
    const { rows } = await pool.query(
      `select
        id, title, description, author, university, department, year, type, category, subject,
        pages, language, price, rating, downloads, tags, abstract, table_of_contents as "tableOfContents",
        upload_date as "uploadDate", file_size as "fileSize", format, status, created_at as "createdAt"
       from projects where id = $1`,
      [id]
    );
    res.json(rows[0]);
  } catch {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ message: 'Database unavailable' });
    const id = Number(req.params.id);
    const { rows } = await pool.query(`delete from projects where id=$1 returning category`, [id]);
    if (!rows[0]) return res.status(404).json({ message: 'Project not found' });
    await pool.query(
      `update categories set project_count = greatest(project_count - 1, 0) where title=$1`,
      [rows[0].category]
    );
    res.json({ message: 'Project deleted' });
  } catch {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
