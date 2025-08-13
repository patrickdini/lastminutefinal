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
        
        // Calculate date range: today to today + 60 days in Bali time (UTC+8)
        const now = new Date();
        const baliTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
        const today = baliTime.toISOString().split('T')[0];
        
        const endDate = new Date(baliTime);
        endDate.setDate(endDate.getDate() + 60);
        const maxDate = endDate.toISOString().split('T')[0];
        
        console.log(`Querying availability from ${today} to ${maxDate} (Bali time)`);
        
        // Get database connection
        const connection = await db.getConnection();
        
        // Query RoomAvailabilityStore with villa descriptions from LMRoomDescription
        const [rows] = await connection.execute(`
            SELECT 
                ras.*,
                lrd.name as villa_display_name,
                lrd.tagline,
                lrd.description,
                lrd.square_meters,
                lrd.bathrooms,
                lrd.view_type,
                lrd.pool_type,
                lrd.image_urls,
                lrd.key_amenities,
                lrd.class
            FROM RoomAvailabilityStore ras
            LEFT JOIN LMRoomDescription lrd ON (
                CASE 
                    WHEN ras.UserRoomDisplayName = 'Pearl & Shell' THEN lrd.name = 'The Pearl Villa'
                    WHEN ras.UserRoomDisplayName = 'Leaf' THEN lrd.name = 'The Leaf Villa'
                    WHEN ras.UserRoomDisplayName = 'Shore' THEN lrd.name = 'The Shore Villa'
                    WHEN ras.UserRoomDisplayName = 'Sunset Room' THEN lrd.name = 'The Sunset Room'
                    WHEN ras.UserRoomDisplayName = 'Sunset' THEN lrd.name = 'The Sunset Room'
                    WHEN ras.UserRoomDisplayName = 'Swell 2BR' THEN lrd.name = 'The Swell 2BR'
                    WHEN ras.UserRoomDisplayName = 'Swell 3BR' THEN lrd.name = 'The Swell 3BR'
                    WHEN ras.UserRoomDisplayName = 'Swell 4BR' THEN lrd.name = 'The Swell 4BR'
                    WHEN ras.UserRoomDisplayName = 'Tide' THEN lrd.name = 'The Tide Villa'
                    WHEN ras.UserRoomDisplayName = 'Wave' THEN lrd.name = 'The Wave Villa'
                    ELSE ras.UserRoomDisplayName = lrd.name
                END
            )
            WHERE ras.EntryDate >= ? AND ras.EntryDate <= ? 
            ORDER BY ras.EntryDate ASC, ras.UserRoomDisplayName ASC
        `, [today, maxDate]);
        
        // Release the connection back to the pool
        connection.release();
        
        console.log(`Successfully retrieved ${rows.length} activities`);
        
        // Transform room names: "Pearl & Shell" -> "Pearl"
        const transformedRows = rows.map(row => {
            if (row.UserRoomDisplayName === 'Pearl & Shell') {
                return {
                    ...row,
                    UserRoomDisplayName: 'Pearl'
                };
            }
            return row;
        });
        
        res.json({
            success: true,
            count: transformedRows.length,
            data: transformedRows
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
