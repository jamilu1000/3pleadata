import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { db } from './server/db.js';
import authRoutes from './server/routes/auth.js';
import walletRoutes from './server/routes/wallet.js';
import vtuRoutes from './server/routes/vtu.js';
import flightsRoutes from './server/routes/flights.js';
import educationRoutes from './server/routes/education.js';
import estatesRoutes from './server/routes/estates.js';
import providersRoutes from './server/routes/providers.js';
import retailerRoutes from './server/routes/retailer.js';
import adminRoutes from './server/routes/admin.js';
import openapiRoutes from './server/routes/openapi.js';
import chatRoutes from './server/routes/chat.js';
import notificationsRoutes from './server/routes/notifications.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger for API calls
app.use('/api', (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) {
      console.warn(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Mount modular API routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/vtu', vtuRoutes);
app.use('/api/v1/flights', flightsRoutes);
app.use('/api/v1/education', educationRoutes);
app.use('/api/v1/estates', estatesRoutes);
app.use('/api/v1/providers', providersRoutes);
app.use('/api/v1/retailer', retailerRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/docs', openapiRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/notifications', notificationsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const ledgerIntegrity = db.verifyLedgerIntegrity();
  res.json({
    status: 'healthy',
    platform: '3PLE A DATA LIMITED (RC: 9746103)',
    rcNumber: '9746103',
    version: '1.0.0',
    time: new Date().toISOString(),
    ledger: {
      isBalanced: ledgerIntegrity.isBalanced,
      totalDebits: ledgerIntegrity.totalDebits,
      totalCredits: ledgerIntegrity.totalCredits
    }
  });
});

// Explicit 404 fallback for any unmatched /api/* or /api route
// This guarantees that unmatched API requests ALWAYS return JSON and never fall through to Vite index.html
app.all('/api/*', (req, res) => {
  res.status(404).json({
    error: `API route not found: ${req.method} ${req.originalUrl}`,
    status: 404
  });
});

app.all('/api', (req, res) => {
  res.status(404).json({
    error: 'API root not found. Use /api/health or /api/v1/*',
    status: 404
  });
});

// Catch-all API error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith('/api')) {
    console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
      status: err.status || 500
    });
    return;
  }
  next(err);
});

// In development, hook into Vite development middleware
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[3PLE A] Full-Stack Server running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[3PLE A] Fatal server startup error:', err);
  process.exit(1);
});
