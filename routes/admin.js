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
        // Check if migration has been completed by testing for new columns
        let migrationCompleted = false;
        try {
            await pool.query('SELECT max_adults_per_unit FROM LMRoomDescription LIMIT 1');
            migrationCompleted = true;
        } catch (columnError) {
            // Column doesn't exist, migration not completed yet
            migrationCompleted = false;
        }

        let villas = [];
        let globalConfig = [];

        if (migrationCompleted) {
            // Use consolidated table structure
            const villaQuery = `
                SELECT 
                    villa_id,
                    name as villa_name,
                    bedrooms,
                    max_adults_per_unit,
                    max_guests_per_unit,
                    privacy_level,
                    pool_type,
                    class as villa_class,
                    active_status,
                    created_at,
                    updated_at
                FROM LMRoomDescription 
                ORDER BY name
            `;
            [villas] = await pool.query(villaQuery);

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
        
        res.json({
            success: true,
            villas: villas,
            globalConfig: config,
            migrationCompleted: migrationCompleted
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
                    bedrooms = ?,
                    max_adults_per_unit = ?,
                    max_guests_per_unit = ?,
                    privacy_level = ?,
                    pool_type = ?,
                    class = ?,
                    active_status = ?,
                    updated_at = NOW()
                WHERE villa_id = ?
            `;

            const updateValues = [
                villa.bedrooms,
                villa.max_adults_per_unit,
                villa.max_guests_per_unit,
                villa.privacy_level,
                villa.pool_type,
                villa.villa_class,
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

// Temporary migration endpoint for database consolidation
router.post('/api/migrate-villa-tables', isAuthenticated, async (req, res) => {
    try {
        const results = {};

        // Step 1: Check current LMRoomDescription structure
        const [currentColumns] = await pool.query('SHOW COLUMNS FROM LMRoomDescription');
        results.currentStructure = currentColumns;

        // Step 2: Add missing fields to LMRoomDescription (if not already present)
        const hasActiveStatus = currentColumns.some(col => col.Field === 'active_status');
        const hasCreatedAt = currentColumns.some(col => col.Field === 'created_at');
        const hasUpdatedAt = currentColumns.some(col => col.Field === 'updated_at');
        const hasMaxAdults = currentColumns.some(col => col.Field === 'max_adults_per_unit');
        const hasMaxGuests = currentColumns.some(col => col.Field === 'max_guests_per_unit');
        const hasPrivacyLevel = currentColumns.some(col => col.Field === 'privacy_level');
        const hasPoolType = currentColumns.some(col => col.Field === 'pool_type');

        const columnsToAdd = [];
        if (!hasActiveStatus) columnsToAdd.push('ADD COLUMN active_status TINYINT(1) DEFAULT 1');
        if (!hasCreatedAt) columnsToAdd.push('ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        if (!hasUpdatedAt) columnsToAdd.push('ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
        if (!hasMaxAdults) columnsToAdd.push('ADD COLUMN max_adults_per_unit INT DEFAULT 4');
        if (!hasMaxGuests) columnsToAdd.push('ADD COLUMN max_guests_per_unit INT DEFAULT 6');
        if (!hasPrivacyLevel) columnsToAdd.push('ADD COLUMN privacy_level VARCHAR(50) DEFAULT "Full Privacy"');
        if (!hasPoolType) columnsToAdd.push('ADD COLUMN pool_type VARCHAR(50) DEFAULT "Private Pool"');

        if (columnsToAdd.length > 0) {
            let alterQuery = 'ALTER TABLE LMRoomDescription ' + columnsToAdd.join(', ');
            await pool.query(alterQuery);
            results.addedColumns = columnsToAdd;
        } else {
            results.addedColumns = 'All columns already exist';
        }

        // Step 3: Create LMGeneralConfig table (if not exists)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS LMGeneralConfig (
                config_id INT AUTO_INCREMENT PRIMARY KEY,
                config_key VARCHAR(100) NOT NULL UNIQUE,
                config_value VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Step 4: Insert default global configuration values
        const configInserts = [
            ['child_age_limit', '12', 'Children below this age count as children for booking purposes'],
            ['default_privacy_level', 'Full Privacy', 'Default privacy level for new villas'],
            ['default_pool_type', 'Private Pool', 'Default pool type for new villas'],
            ['default_villa_class', 'Premium', 'Default villa class for new villas']
        ];

        for (const [key, value, description] of configInserts) {
            try {
                await pool.query(
                    'INSERT INTO LMGeneralConfig (config_key, config_value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), description = VALUES(description)',
                    [key, value, description]
                );
            } catch (err) {
                // Handle duplicate key errors gracefully
                console.log(`Config ${key} already exists, updating...`);
            }
        }

        // Step 5: Transfer data from LMvilla_config to LMRoomDescription
        await pool.query(`
            UPDATE LMRoomDescription lrd 
            INNER JOIN LMvilla_config lvc ON (
                lvc.villa_name = CASE 
                    WHEN lrd.name = 'The Pearl Villa' THEN 'Pearl & Shell'
                    WHEN lrd.name = 'The Leaf Villa' THEN 'Leaf'
                    WHEN lrd.name = 'The Shore Villa' THEN 'Shore'
                    WHEN lrd.name = 'The Sunset Room' THEN 'Sunset Room'
                    WHEN lrd.name = 'The Swell 2BR' THEN 'Swell 2BR'
                    WHEN lrd.name = 'The Swell 3BR' THEN 'Swell 3BR'
                    WHEN lrd.name = 'The Swell 4BR' THEN 'Swell 4BR'
                    WHEN lrd.name = 'The Tide Villa' THEN 'Tide'
                    WHEN lrd.name = 'The Wave Villa' THEN 'Wave'
                    ELSE lrd.name
                END
            )
            SET 
                lrd.max_adults_per_unit = lvc.max_adults_per_unit,
                lrd.max_guests_per_unit = lvc.max_guests_per_unit,
                lrd.privacy_level = lvc.privacy_level,
                lrd.pool_type = lvc.pool_type,
                lrd.active_status = lvc.active_status,
                lrd.updated_at = NOW()
        `);

        // Step 6: Verify the migration - get updated structure
        const [newColumns] = await pool.query('SHOW COLUMNS FROM LMRoomDescription');
        results.newStructure = newColumns;

        // Get sample data from both tables
        const [roomData] = await pool.query(`
            SELECT villa_id, name, active_status, created_at, updated_at
            FROM LMRoomDescription 
            ORDER BY villa_id
        `);
        results.roomDescriptionData = roomData;

        const [configData] = await pool.query('SELECT * FROM LMGeneralConfig ORDER BY config_key');
        results.generalConfigData = configData;

        res.json({
            success: true,
            message: 'Migration completed successfully',
            results: results
        });

    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({
            success: false,
            message: 'Migration failed',
            error: error.message
        });
    }
});

module.exports = router;