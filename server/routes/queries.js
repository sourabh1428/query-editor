import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import db from '../db/index.js';
import { createClient } from 'redis';
import { stringify } from 'csv-stringify/sync';

const router = express.Router();

// Initialize Redis client
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

(async () => {
  try {
    await redisClient.connect();
    console.log('Redis client connected');
  } catch (err) {
    console.error('Redis connection error:', err);
  }
})();

/**
 * @swagger
 * /api/queries/execute:
 *   post:
 *     summary: Execute a SQL query
 *     tags: [Queries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *     responses:
 *       200:
 *         description: Query executed successfully
 *       400:
 *         description: Invalid query
 *       401:
 *         description: Unauthorized
 */
router.post('/execute', authenticateToken, async (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.user.id;
    
    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }
    
    // Check if query is read-only (for security)
    const lowerQuery = query.toLowerCase().trim();
    if (
      lowerQuery.includes('insert') ||
      lowerQuery.includes('update') ||
      lowerQuery.includes('delete') ||
      lowerQuery.includes('drop') ||
      lowerQuery.includes('alter') ||
      lowerQuery.includes('create')
    ) {
      return res.status(400).json({ message: 'Only SELECT queries are allowed' });
    }
    
    // Check cache first
    const cacheKey = `query:${userId}:${query}`;
    const cachedResult = await redisClient.get(cacheKey);
    
    if (cachedResult) {
      // Save query to history
      await db.query(
        'INSERT INTO queries (user_id, query_text) VALUES ($1, $2)',
        [userId, query]
      );
      
      return res.status(200).json({
        message: 'Query executed successfully (cached)',
        result: JSON.parse(cachedResult)
      });
    }
    
    // Execute query
    const result = await db.query(query);
    
    // Save query to history
    await db.query(
      'INSERT INTO queries (user_id, query_text) VALUES ($1, $2)',
      [userId, query]
    );
    
    // Cache result (expire after 5 minutes)
    await redisClient.set(cacheKey, JSON.stringify(result.rows), {
      EX: 300
    });
    
    res.status(200).json({
      message: 'Query executed successfully',
      result: result.rows
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/queries/history:
 *   get:
 *     summary: Get user's query history
 *     tags: [Queries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Query history retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      'SELECT * FROM queries WHERE user_id = $1 ORDER BY executed_at DESC',
      [userId]
    );
    
    res.status(200).json({
      message: 'Query history retrieved successfully',
      history: result.rows
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/queries/{id}/favorite:
 *   put:
 *     summary: Toggle favorite status of a query
 *     tags: [Queries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Favorite status updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Query not found
 */
router.put('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const queryId = req.params.id;
    const userId = req.user.id;
    
    // Check if query exists and belongs to user
    const queryCheck = await db.query(
      'SELECT * FROM queries WHERE id = $1 AND user_id = $2',
      [queryId, userId]
    );
    
    if (queryCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Query not found' });
    }
    
    // Toggle favorite status
    const currentStatus = queryCheck.rows[0].is_favorite;
    const newStatus = !currentStatus;
    
    await db.query(
      'UPDATE queries SET is_favorite = $1 WHERE id = $2',
      [newStatus, queryId]
    );
    
    res.status(200).json({
      message: `Query ${newStatus ? 'added to' : 'removed from'} favorites`,
      is_favorite: newStatus
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/queries/{id}:
 *   delete:
 *     summary: Delete a query from history
 *     tags: [Queries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Query deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Query not found
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const queryId = req.params.id;
    const userId = req.user.id;
    
    // Check if query exists and belongs to user
    const queryCheck = await db.query(
      'SELECT * FROM queries WHERE id = $1 AND user_id = $2',
      [queryId, userId]
    );
    
    if (queryCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Query not found' });
    }
    
    // Delete query
    await db.query(
      'DELETE FROM queries WHERE id = $1',
      [queryId]
    );
    
    res.status(200).json({
      message: 'Query deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/queries/{id}/download:
 *   get:
 *     summary: Download query results as CSV
 *     tags: [Queries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: CSV file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Query not found
 */
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const queryId = req.params.id;
    const userId = req.user.id;
    
    // Check if query exists and belongs to user
    const queryCheck = await db.query(
      'SELECT * FROM queries WHERE id = $1 AND user_id = $2',
      [queryId, userId]
    );
    
    if (queryCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Query not found' });
    }
    
    const query = queryCheck.rows[0].query_text;
    
    // Execute query to get results
    const result = await db.query(query);
    
    // Convert to CSV
    const csvData = stringify(result.rows, {
      header: true
    });
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="query-${queryId}.csv"`);
    
    res.status(200).send(csvData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;