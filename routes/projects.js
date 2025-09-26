import express from "express"

const router = express.Router();

// In-memory store (replace with a database in production)
const projects = [
  {
    id: 1,
    title: "Machine Learning Applications in Healthcare Diagnosis",
    description:
      "A comprehensive study on implementing machine learning algorithms for early disease detection and diagnosis in healthcare systems.",
    author: "Sarah Johnson",
    university: "Stanford University",
    department: "Computer Science",
    year: 2024,
    type: "Thesis",
    category: "Technology",
    subject: "Machine Learning",
    pages: 156,
    language: "English",
    price: 45.99,
    rating: 4.8,
    downloads: 234,
    tags: ["Machine Learning", "Healthcare", "AI", "Diagnosis", "Deep Learning"],
    abstract:
      "This thesis explores the application of advanced machine learning techniques in healthcare diagnosis, focusing on early detection of cardiovascular diseases and cancer. The research presents novel algorithms that achieve 94% accuracy in preliminary diagnosis, potentially revolutionizing healthcare delivery in underserved communities.",
    tableOfContents: [
      "Introduction and Literature Review",
      "Methodology and Data Collection",
      "Machine Learning Model Development",
      "Implementation and Testing",
      "Results and Analysis",
      "Conclusion and Future Work"
    ],
    uploadDate: "2024-01-15",
    fileSize: "12.4 MB",
    format: "PDF",
    status: "Published",
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: "Machine Learning in Agriculture",
    description: "Exploring ML applications in crop yield prediction and pest detection.",
    author: "John Doe",
    university: "University of California, Davis",
    department: "Computer Engineering",
    year: 2023,
    type: "Dissertation",
    category: "Technology",
    subject: "Machine Learning",
    pages: 210,
    language: "English",
    price: 209,
    rating: 4.2,
    downloads: 5234,
    tags: ["Machine Learning", "Agriculture", "AI"],
    abstract: "This work analyzes ML techniques for agriculture, including remote sensing and time-series forecasting for yield optimization.",
    tableOfContents: [
      "Introduction",
      "Related Work",
      "Data and Methods",
      "Experiments",
      "Results",
      "Discussion and Conclusions"
    ],
    uploadDate: "2023-06-10",
    fileSize: "8.7 MB",
    format: "PDF",
    status: "Unpublished",
    createdAt: new Date().toISOString()
  }
];

// GET /api/projects
// Supports filtering, sorting, and pagination via query params
// Filters: q (search in title/author), category, status, minPrice, maxPrice, minDownloads, maxDownloads, tag
// Sorting: sortBy=createdAt|title|price|downloads, order=asc|desc
// Pagination: page (1-based), limit
router.get(`/`, (req, res) => {
  try {
    const {
      q,
      category,
      status,
      minPrice,
      maxPrice,
      minDownloads,
      maxDownloads,
      tag,
      sortBy = 'createdAt',
      order = 'desc',
      page = '1',
      limit = '50'
    } = req.query;

    let result = [...projects];

    // Text search
    if (q) {
      const needle = String(q).toLowerCase();
      result = result.filter(p =>
        (p.title && p.title.toLowerCase().includes(needle)) ||
        (p.author && p.author.toLowerCase().includes(needle)) ||
        (p.university && p.university.toLowerCase().includes(needle)) ||
        (p.department && p.department.toLowerCase().includes(needle)) ||
        (p.subject && p.subject.toLowerCase().includes(needle)) ||
        (p.description && p.description.toLowerCase().includes(needle))
      );
    }

    // Category filter
    if (category) {
      const categories = String(category).toLowerCase().split(',').map(s => s.trim());
      result = result.filter(p => categories.includes(p.category.toLowerCase()));
    }

    // Status filter
    if (status) {
      const statuses = String(status).toLowerCase().split(',').map(s => s.trim());
      result = result.filter(p => statuses.includes(p.status.toLowerCase()));
    }

    // Tag filter
    if (tag) {
      const tags = String(tag).toLowerCase().split(',').map(s => s.trim());
      result = result.filter(p => p.tags?.some(t => tags.includes(String(t).toLowerCase())));
    }

    // Numeric filters
    const minP = minPrice !== undefined ? Number(minPrice) : undefined;
    const maxP = maxPrice !== undefined ? Number(maxPrice) : undefined;
    const minD = minDownloads !== undefined ? Number(minDownloads) : undefined;
    const maxD = maxDownloads !== undefined ? Number(maxDownloads) : undefined;

    if (Number.isNaN(minP) || Number.isNaN(maxP) || Number.isNaN(minD) || Number.isNaN(maxD)) {
      return res.status(400).json({ message: 'Invalid numeric filter provided' });
    }

    if (minP !== undefined) result = result.filter(p => p.price >= minP);
    if (maxP !== undefined) result = result.filter(p => p.price <= maxP);
    if (minD !== undefined) result = result.filter(p => p.downloads >= minD);
    if (maxD !== undefined) result = result.filter(p => p.downloads <= maxD);

    // Sorting
    const sortable = new Set(['createdAt', 'title', 'price', 'downloads']);
    const sortField = sortable.has(String(sortBy)) ? String(sortBy) : 'createdAt';
    const sortOrder = String(order).toLowerCase() === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];
      if (va == null && vb == null) return 0;
      if (va == null) return 1 * sortOrder;
      if (vb == null) return -1 * sortOrder;
      if (typeof va === 'string' && typeof vb === 'string') {
        return va.localeCompare(vb) * sortOrder;
      }
      return (va > vb ? 1 : va < vb ? -1 : 0) * sortOrder;
    });

    // Pagination
    const pageNum = Math.max(1, parseInt(String(page)) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit)) || 50));
    const total = result.length;
    const start = (pageNum - 1) * limitNum;
    const paginated = result.slice(start, start + limitNum);

    res.json({
      data: paginated,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      },
      sort: { by: sortField, order: sortOrder === 1 ? 'asc' : 'desc' },
      filters: { q, category, status, minPrice: minP, maxPrice: maxP, minDownloads: minD, maxDownloads: maxD, tag }
    });
  } catch (e) {
    console.error('GET /projects error', e);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /api/projects/:id
router.get(`/:id`, (req, res) => {
  const id = Number(req.params.id);
  const project = projects.find(p => p.id === id);
  if (!project) return res.status(404).json({ message: "Project not found" });
  res.json(project);
});

// POST /api/projects
router.post("/", (req, res) => {
  try {
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

    const id = projects.length ? Math.max(...projects.map(p => p.id)) + 1 : 1;
    const project = {
      id,
      title,
      description,
      author,
      university,
      department,
      year: year !== undefined ? Number(year) : undefined,
      type,
      category,
      subject,
      pages: pages !== undefined ? Number(pages) : undefined,
      language,
      price: Number(price) || 0,
      rating: rating !== undefined ? Number(rating) : undefined,
      downloads: Number(downloads) || 0,
      tags,
      abstract,
      tableOfContents,
      uploadDate,
      fileSize,
      format,
      status,
      createdAt: new Date().toISOString()
    };

    projects.push(project);
    res.status(201).json(project);
  } catch (e) {
    console.error('POST /projects error', e);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;