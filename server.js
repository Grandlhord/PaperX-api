import express from 'express';
import cors from 'cors';
import config from './config/env.js';
import { initDb } from './config/db.js';

import projectRouter from './routes/projects.js';
import categoryRouter from './routes/categories.js';
import healthRouter from './routes/health.js';

const app = express();
const PORT = config.port;

app.use(cors());

app.use(express.json());

app.use("/api/projects",projectRouter);
app.use("/api/categories",categoryRouter);
app.use("/api/health", healthRouter);

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}!`);
    });
  })
  .catch((e) => {
    console.error('DB init failed', e);
    process.exit(1);
  });
