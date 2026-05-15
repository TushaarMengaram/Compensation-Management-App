import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database.js';
import { sendError } from './utils/http.js';
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import proposalRoutes from './routes/proposalRoutes.js';

const app = express();

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/proposals', proposalRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  return sendError(res, status, message);
});

const port = Number(process.env.PORT) || 5000;

async function start() {
  try {
    await connectDatabase();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('\nFailed to connect to MongoDB.\n');
    // eslint-disable-next-line no-console
    console.error(err.message || err);
    if (err.code === 'ECONNREFUSED' && String(process.env.MONGO_URI || '').includes('mongodb+srv')) {
      // eslint-disable-next-line no-console
      console.error(
        '\nAtlas SRV DNS lookup failed. Common fixes:\n' +
          '  • Ensure the cluster is running and your IP is allowed in Atlas Network Access\n' +
          '  • Check internet / VPN / firewall (SRV DNS must be reachable)\n' +
          '  • Or use local MongoDB in server/.env:\n' +
          '      MONGO_URI=mongodb://127.0.0.1:27017/compensation_mvp\n'
      );
    } else if (!process.env.MONGO_URI) {
      // eslint-disable-next-line no-console
      console.error('\nSet MONGO_URI in server/.env (see server/.env.example).\n');
    } else {
      // eslint-disable-next-line no-console
      console.error(
        '\nIf using local MongoDB, start it first, then set:\n' +
          '  MONGO_URI=mongodb://127.0.0.1:27017/compensation_mvp\n'
      );
    }
    process.exit(1);
  }

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${port}`);
  });
}

start();
