const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const path = require('path');
const { pool } = require('../config/database');

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session && req.session.adminUser) {
        return next();
    }
    res.redirect('/admin/login');
}

// Login page
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/login.html'));
});

// Login API endpoint
router.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Username and password are required' 
        });
    }

    try {
        // Query the database for the user
        const [users] = await pool.query(
            'SELECT * FROM LMadmin_users WHERE username = ? AND is_active = TRUE',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        const user = users[0];

        // Check if account is locked
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            return res.status(403).json({ 
                success: false, 
                message: 'Account is temporarily locked. Please try again later.' 
            });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            // Increment login attempts
            await pool.query(
                'UPDATE LMadmin_users SET login_attempts = login_attempts + 1 WHERE id = ?',
                [user.id]
            );

            // Lock account after 5 failed attempts
            if (user.login_attempts >= 4) {
                const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
                await pool.query(
                    'UPDATE LMadmin_users SET locked_until = ? WHERE id = ?',
                    [lockUntil, user.id]
                );
            }

            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Reset login attempts and update last login
        await pool.query(
            'UPDATE LMadmin_users SET login_attempts = 0, last_login = NOW(), locked_until = NULL WHERE id = ?',
            [user.id]
        );

        // Store user in session
        req.session.adminUser = {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            role: user.role,
            email: user.email
        };

        res.json({ 
            success: true, 
            message: 'Login successful',
            user: {
                username: user.username,
                full_name: user.full_name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred during login' 
        });
    }
});

// Dashboard page
router.get('/', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/dashboard.html'));
});

// Villa Configuration page
router.get('/villa-config', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/villa-config.html'));
});

// Get current user info
router.get('/api/user', isAuthenticated, (req, res) => {
    res.json({
        success: true,
        user: req.session.adminUser
    });
});

// Logout
router.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error logging out' 
            });
        }
        res.json({ 
            success: true, 
            message: 'Logged out successfully' 
        });
    });
});

// Villa Configuration API endpoints
router.get('/api/villas', isAuthenticated, async (req, res) => {
    try {
        const [villas] = await pool.query(`
            SELECT villa_id, villa_name, bedrooms, max_adults_per_unit, max_guests_per_unit,
                   privacy_level, pool_type, villa_class, child_age_limit, description, active_status
            FROM LMvilla_config 
            ORDER BY villa_name
        `);
        
        res.json({ success: true, villas });
    } catch (error) {
        console.error('Error fetching villas:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch villa configurations' 
        });
    }
});

router.put('/api/villas/:id', isAuthenticated, async (req, res) => {
    try {
        const villaId = req.params.id;
        const {
            villa_name,
            bedrooms,
            max_adults_per_unit,
            max_guests_per_unit,
            privacy_level,
            pool_type,
            villa_class,
            child_age_limit,
            description,
            active_status
        } = req.body;

        // Validate required fields
        if (!villa_name || !bedrooms || !max_adults_per_unit || !max_guests_per_unit) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: villa_name, bedrooms, max_adults_per_unit, max_guests_per_unit'
            });
        }

        // Validate numeric values
        if (bedrooms < 1 || max_adults_per_unit < 1 || max_guests_per_unit < 1 || child_age_limit < 1) {
            return res.status(400).json({
                success: false,
                message: 'Numeric values must be greater than 0'
            });
        }

        // Validate that max_guests >= max_adults (guests include adults)
        if (max_guests_per_unit < max_adults_per_unit) {
            return res.status(400).json({
                success: false,
                message: 'Maximum guests cannot be less than maximum adults'
            });
        }

        await pool.query(`
            UPDATE LMvilla_config 
            SET villa_name = ?, bedrooms = ?, max_adults_per_unit = ?, max_guests_per_unit = ?,
                privacy_level = ?, pool_type = ?, villa_class = ?, child_age_limit = ?,
                description = ?, active_status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE villa_id = ?
        `, [
            villa_name, bedrooms, max_adults_per_unit, max_guests_per_unit,
            privacy_level, pool_type, villa_class, child_age_limit,
            description, active_status, villaId
        ]);

        res.json({ 
            success: true, 
            message: 'Villa configuration updated successfully' 
        });
    } catch (error) {
        console.error('Error updating villa:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update villa configuration' 
        });
    }
});

// Temporary route to create initial admin user (remove in production)
router.post('/api/create-initial-admin', async (req, res) => {
    try {
        // Check if any admin users exist
        const [existingUsers] = await pool.query(
            'SELECT COUNT(*) as count FROM LMadmin_users'
        );

        if (existingUsers[0].count > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Admin users already exist' 
            });
        }

        // Create default admin user
        const hashedPassword = await bcrypt.hash('VillaTokay2025!', 10);
        
        await pool.query(
            `INSERT INTO LMadmin_users (username, password_hash, email, full_name, role, is_active) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            ['admin', hashedPassword, 'admin@villatokay.com', 'Villa Tokay Administrator', 'super_admin', true]
        );

        res.json({ 
            success: true, 
            message: 'Initial admin user created. Username: admin, Password: VillaTokay2025!' 
        });

    } catch (error) {
        console.error('Error creating initial admin:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating initial admin user' 
        });
    }
});

// Villa Configuration Management Endpoints
router.get('/api/villa-config', isAuthenticated, async (req, res) => {
    try {
        // Check if migration has been completed by testing for LMRoomDescription structure
        let migrationCompleted = false;
        try {
            // Check if this is the consolidated table structure by looking for expected fields
            const [testResult] = await pool.query('SELECT villa_id, name FROM LMRoomDescription LIMIT 1');
            migrationCompleted = true;
        } catch (columnError) {
            // Table doesn't exist or has wrong structure
            migrationCompleted = false;
        }

        let villas = [];
        let globalConfig = [];

        if (migrationCompleted) {
            // Use consolidated table structure - Get ALL villa fields from LMRoomDescription
            const villaQuery = `
                SELECT 
                    villa_id,
                    name,
                    class,
                    villa_type,
                    square_meters,
                    webpage_url,
                    bedrooms,
                    bathrooms,
                    max_guests,
                    max_adults,
                    tagline,
                    description,
                    image_urls,
                    video_tour_url,
                    ideal_for,
                    is_featured,
                    view_type,
                    pool_type,
                    key_amenities,
                    active_status,
                    created_at,
                    updated_at
                FROM LMRoomDescription 
                ORDER BY name
            `;
            [villas] = await pool.query(villaQuery);
            console.log('API - Full villa data retrieved:', villas[0] ? Object.keys(villas[0]) : 'No villas');

            // Get global configuration from LMGeneralConfig
            try {
                const configQuery = `
                    SELECT config_key, config_value, description
                    FROM LMGeneralConfig
                    ORDER BY config_key
                `;
                [globalConfig] = await pool.query(configQuery);
            } catch (err) {
                // LMGeneralConfig doesn't exist yet
                globalConfig = [];
            }
        } else {
            // Use original table structure - get from LMvilla_config
            const villaQuery = `
                SELECT 
                    villa_id,
                    villa_name,
                    bedrooms,
                    max_adults_per_unit,
                    max_guests_per_unit,
                    privacy_level,
                    pool_type,
                    villa_class,
                    child_age_limit,
                    active_status
                FROM LMvilla_config 
                ORDER BY villa_name
            `;
            [villas] = await pool.query(villaQuery);
            globalConfig = []; // No global config yet
        }

        // Convert global config to object for easier access
        const config = {};
        globalConfig.forEach(item => {
            config[item.config_key] = {
                value: item.config_value,
                description: item.description
            };
        });
        
        // Get table structure for debugging
        let tableStructure = null;
        if (migrationCompleted) {
            try {
                const [columns] = await pool.query('SHOW COLUMNS FROM LMRoomDescription');
                tableStructure = columns;
                console.log('Villa config API - LMRoomDescription columns:', columns.map(c => c.Field));
                console.log('Villa config API - Sample villa keys:', villas[0] ? Object.keys(villas[0]) : 'No villas');
                console.log('Villa config API - Sample villa data:', villas[0]);
            } catch (err) {
                console.log('Could not get table structure:', err.message);
            }
        }

        res.json({
            success: true,
            villas: villas,
            globalConfig: config,
            migrationCompleted: migrationCompleted,
            tableStructure: tableStructure
        });
    } catch (error) {
        console.error('Error fetching villa configurations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch villa configurations'
        });
    }
});

router.post('/api/villa-config', isAuthenticated, async (req, res) => {
    try {
        const { villas, globalConfig } = req.body;

        if (!villas || !Array.isArray(villas)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid villa configuration data'
            });
        }

        // Update each villa configuration in LMRoomDescription
        for (const villa of villas) {
            const updateQuery = `
                UPDATE LMRoomDescription 
                SET 
                    name = ?,
                    class = ?,
                    villa_type = ?,
                    square_meters = ?,
                    webpage_url = ?,
                    bedrooms = ?,
                    bathrooms = ?,
                    max_guests = ?,
                    max_adults = ?,
                    tagline = ?,
                    description = ?,
                    image_urls = ?,
                    video_tour_url = ?,
                    ideal_for = ?,
                    is_featured = ?,
                    view_type = ?,
                    pool_type = ?,
                    key_amenities = ?,
                    active_status = ?,
                    updated_at = NOW()
                WHERE villa_id = ?
            `;

            const updateValues = [
                villa.name,
                villa.class,
                villa.villa_type,
                villa.square_meters,
                villa.webpage_url,
                villa.bedrooms,
                villa.bathrooms,
                villa.max_guests,
                villa.max_adults,
                villa.tagline,
                villa.description,
                villa.image_urls,
                villa.video_tour_url,
                villa.ideal_for,
                villa.is_featured ? 1 : 0,
                villa.view_type,
                villa.pool_type,
                villa.key_amenities,
                villa.active_status ? 1 : 0,
                villa.villa_id
            ];

            await pool.query(updateQuery, updateValues);
        }

        // Update global configuration if provided
        if (globalConfig) {
            for (const [key, value] of Object.entries(globalConfig)) {
                await pool.query(`
                    UPDATE LMGeneralConfig 
                    SET config_value = ?, updated_at = NOW() 
                    WHERE config_key = ?
                `, [value, key]);
            }
        }

        res.json({
            success: true,
            message: 'Villa configurations updated successfully'
        });
    } catch (error) {
        console.error('Error updating villa configurations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update villa configurations'
        });
    }
});

// Debug endpoint to check table structure
router.get('/api/debug/table-structure', isAuthenticated, async (req, res) => {
    try {
        const [columns] = await pool.query('SHOW COLUMNS FROM LMRoomDescription');
        const [sampleData] = await pool.query('SELECT * FROM LMRoomDescription LIMIT 1');
        
        console.log('LMRoomDescription columns from database:', columns.map(c => c.Field));
        console.log('Sample data keys:', sampleData[0] ? Object.keys(sampleData[0]) : 'No data');
        
        res.json({
            success: true,
            columns: columns,
            sampleData: sampleData[0] || null
        });
    } catch (error) {
        console.error('Error checking table structure:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check table structure',
            error: error.message
        });
    }
});

module.exports = router;