import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import db from '../db/index.js';

const router = express.Router();

/**
 * @swagger
 * /api/schema/tables:
 *   get:
 *     summary: Get all tables in the database
 *     tags: [Schema]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tables retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/tables', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        table_name 
      FROM 
        information_schema.tables 
      WHERE 
        table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY 
        table_name
    `;
    
    const result = await db.query(query);
    
    res.status(200).json({
      message: 'Tables retrieved successfully',
      tables: result.rows.map(row => row.table_name)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/schema/tables/{tableName}:
 *   get:
 *     summary: Get columns for a specific table
 *     tags: [Schema]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tableName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Columns retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Table not found
 */
router.get('/tables/:tableName', authenticateToken, async (req, res) => {
  try {
    const { tableName } = req.params;
    
    // Check if table exists
    const tableCheck = await db.query(`
      SELECT 
        table_name 
      FROM 
        information_schema.tables 
      WHERE 
        table_schema = 'public' 
        AND table_name = $1
    `, [tableName]);
    
    if (tableCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    // Get columns
    const columnsQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM 
        information_schema.columns 
      WHERE 
        table_schema = 'public' 
        AND table_name = $1
      ORDER BY 
        ordinal_position
    `;
    
    const columnsResult = await db.query(columnsQuery, [tableName]);
    
    // Get primary key
    const pkQuery = `
      SELECT 
        kcu.column_name
      FROM 
        information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
      WHERE 
        tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_name = $1
    `;
    
    const pkResult = await db.query(pkQuery, [tableName]);
    const primaryKeys = pkResult.rows.map(row => row.column_name);
    
    // Get foreign keys
    const fkQuery = `
      SELECT 
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM 
        information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE 
        tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = $1
    `;
    
    const fkResult = await db.query(fkQuery, [tableName]);
    
    // Get sample data
    const sampleDataQuery = `
      SELECT * FROM ${tableName} LIMIT 5
    `;
    
    const sampleDataResult = await db.query(sampleDataQuery);
    
    res.status(200).json({
      message: 'Table schema retrieved successfully',
      table: tableName,
      columns: columnsResult.rows,
      primaryKeys,
      foreignKeys: fkResult.rows,
      sampleData: sampleDataResult.rows
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;