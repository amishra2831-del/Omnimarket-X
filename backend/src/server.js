import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import discoveryRoutes from './routes/discovery.js';
import candidateRoutes from './routes/candidates.js';
import marketRoutes from './routes/markets.js';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'omnimarketx-api', timestamp: new Date().toISOString() }));
app.use('/api/discovery', discoveryRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/markets', marketRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error', details: err.details || undefined });
});

const port = process.env.PORT || 5000;
connectDB().then(() => app.listen(port, () => console.log(`API listening on ${port}`))).catch(error => {
  console.error('Startup failed:', error.message);
  process.exit(1);
});
