import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('dist'));
app.use(express.json());

// Example API: Save JSON
app.post('/api/save', (req, res) => {
  const data = req.body;
  fs.writeFileSync('./data/store.json', JSON.stringify(data, null, 2));
  res.json({ status: 'ok' });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.resolve('dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Zapadoo is live on http://localhost:${PORT}`);
});
