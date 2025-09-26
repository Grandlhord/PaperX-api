import express from 'express';
import cors from 'cors';

import projectRouter from './routes/projects.js';
import categoryRouter from './routes/categories.js';
import healthRouter from './routes/health.js';

const app = express();
const PORT = 8080;

app.use(cors());

app.use(express.json());

app.use("/api/projects",projectRouter);
app.use("/api/categories",categoryRouter);
app.use("/api/health", healthRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}!`);
});
