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
        const query = `
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

        const [results] = await pool.query(query);
        
        res.json({
            success: true,
            villas: results
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
        const { villas, globalChildAge } = req.body;

        if (!villas || !Array.isArray(villas)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid villa configuration data'
            });
        }

        // Update each villa configuration
        for (const villa of villas) {
            const updateQuery = `
                UPDATE LMvilla_config 
                SET 
                    bedrooms = ?,
                    max_adults_per_unit = ?,
                    max_guests_per_unit = ?,
                    privacy_level = ?,
                    pool_type = ?,
                    villa_class = ?,
                    child_age_limit = ?,
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
                villa.child_age_limit,
                villa.active_status ? 1 : 0,
                villa.villa_id
            ];

            await pool.query(updateQuery, updateValues);
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

module.exports = router;