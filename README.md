PaperX API

Overview
- Simple Express API to manage projects and categories.
- Endpoints:
  - GET /api/health
  - GET /api/projects
  - GET /api/projects/:id
  - POST /api/projects
  - PUT /api/projects/:id
  - PATCH /api/projects/:id
  - DELETE /api/projects/:id
  - GET /api/categories
- GET /api/categories/:id
- POST /api/categories

Projects follow this shape (example):
{
  id: 1,
  title: "Machine Learning Applications in Healthcare Diagnosis",
  description: "A comprehensive study on implementing machine learning algorithms for early disease detection and diagnosis in healthcare systems.",
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
  abstract: "...",
  tableOfContents: ["Introduction and Literature Review", "Methodology and Data Collection", "Machine Learning Model Development", "Implementation and Testing", "Results and Analysis", "Conclusion and Future Work"],
  uploadDate: "2024-01-15",
  fileSize: "12.4 MB",
  format: "PDF",
  status: "Published",
  createdAt: "ISO date"
}

Projects listing supports filtering, sorting, and pagination via query parameters:
- q: text search in title and author
- category: comma-separated categories
- status: comma-separated statuses (Published, Unpublished)
- tag: comma-separated tags
- minPrice, maxPrice: numeric price bounds
- minDownloads, maxDownloads: numeric downloads bounds
- sortBy: createdAt|title|price|downloads
- order: asc|desc
- page: page number starting from 1
- limit: items per page (1..100)

Run
- npm install
- npm run dev (hot reload) or npm start

Categories endpoint supports:
- q: text search in category title
- minCount, maxCount: numeric bounds for projectCount
- sortBy: title|projectCount
- order: asc|desc

Note: Uses in-memory data for demo purposes. Replace with a database for production use.
