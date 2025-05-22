import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 