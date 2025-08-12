const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * GET /api/activities
 * Retrieve all room availability data from RoomAvailabilityStore table
 */
router.get('/activities', async (req, res) => {
    try {
        console.log('Fetching activities from database...');
        
        // Get database connection
        const connection = await db.getConnection();
        
        // Query the RoomAvailabilityStore table ordered by EntryDate
        const [rows] = await connection.execute(
            'SELECT * FROM RoomAvailabilityStore ORDER BY EntryDate DESC, UserRoomDisplayName ASC LIMIT 100'
        );
        
        // Release the connection back to the pool
        connection.release();
        
        console.log(`Successfully retrieved ${rows.length} activities`);
        
        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
        
    } catch (error) {
        console.error('Error fetching activities:', error);
        
        // Handle specific database errors
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                error: 'Database connection refused',
                message: 'Unable to connect to the database server'
            });
        }
        
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(404).json({
                success: false,
                error: 'Table not found',
                message: 'RoomAvailabilityStore table does not exist'
            });
        }
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            return res.status(401).json({
                success: false,
                error: 'Database access denied',
                message: 'Invalid database credentials'
            });
        }
        
        // Generic error response
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to retrieve activities from database'
        });
    }
});

/**
 * GET /api/activities/:date/:room
 * Retrieve a specific room availability record by EntryDate and UserRoomDisplayName
 */
router.get('/activities/:date/:room', async (req, res) => {
    try {
        const { date, room } = req.params;
        
        // Validate parameters
        if (!date || !room) {
            return res.status(400).json({
                success: false,
                error: 'Invalid parameters',
                message: 'Both date and room name are required'
            });
        }
        
        console.log(`Fetching room availability for date: ${date}, room: ${room}`);
        
        const connection = await db.getConnection();
        
        const [rows] = await connection.execute(
            'SELECT * FROM RoomAvailabilityStore WHERE EntryDate = ? AND UserRoomDisplayName = ?',
            [date, decodeURIComponent(room)]
        );
        
        connection.release();
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Record not found',
                message: `No room availability found for date: ${date}, room: ${room}`
            });
        }
        
        console.log(`Successfully retrieved room availability for date: ${date}, room: ${room}`);
        
        res.json({
            success: true,
            data: rows[0]
        });
        
    } catch (error) {
        console.error('Error fetching room availability by date/room:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to retrieve room availability'
        });
    }
});

/**
 * GET /api/health
 * Health check endpoint for database connectivity
 */
router.get('/health', async (req, res) => {
    try {
        const connection = await db.getConnection();
        await connection.execute('SELECT 1');
        connection.release();
        
        res.json({
            success: true,
            message: 'Database connection is healthy',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            success: false,
            error: 'Database connection failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
