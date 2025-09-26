import express from 'express'

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ name: 'paperx-api', status: 'ok' });
});

export default router;
