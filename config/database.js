const mysql = require('mysql2/promise');

// Database configuration using environment variables
const dbConfig = {
    host: process.env.MYSQL_HOST || 'fi8jj.myd.infomaniak.com',
    user: process.env.MYSQL_USER || 'fi8jj_admin_pat',
    password: process.env.MYSQL_PASSWORD || 'Villa_Tokay1',
    database: process.env.MYSQL_DATABASE || 'fi8jj_VT_DEV',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    charset: 'utf8mb4',
    ssl: {
        rejectUnauthorized: false
    }
};

console.log('Database configuration:');
console.log(`Host: ${dbConfig.host}`);
console.log(`User: ${dbConfig.user}`);
console.log(`Database: ${dbConfig.database}`);

// Create connection pool
const pool = mysql.createPool(dbConfig);

/**
 * Test database connection on startup
 */
async function testConnection() {
    try {
        console.log('Testing database connection...');
        const connection = await pool.getConnection();
        console.log('Database connected successfully!');
        
        // Test query to verify table access
        try {
            const [rows] = await connection.execute('SHOW TABLES LIKE "RoomAvailabilityStore"');
            if (rows.length > 0) {
                console.log('RoomAvailabilityStore table found');
            } else {
                console.warn('Warning: RoomAvailabilityStore table not found');
            }
        } catch (tableError) {
            console.warn('Warning: Could not verify table existence:', tableError.message);
        }
        
        connection.release();
    } catch (error) {
        console.error('Database connection failed:', error.message);
        console.error('Please check your database credentials and network connectivity');
        
        // Don't exit the process, let the application handle errors gracefully
        if (error.code === 'ECONNREFUSED') {
            console.error('Connection refused - database server may be down');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Access denied - check username and password');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('Database does not exist');
        }
    }
}

// Test connection on module load
testConnection();

/**
 * Get a connection from the pool
 * @returns {Promise<Connection>}
 */
async function getConnection() {
    try {
        return await pool.getConnection();
    } catch (error) {
        console.error('Failed to get database connection:', error);
        throw error;
    }
}

/**
 * Execute a query with automatic connection management
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>}
 */
async function executeQuery(query, params = []) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(query, params);
        return result;
    } catch (error) {
        console.error('Query execution failed:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

/**
 * Close all connections in the pool
 */
async function closePool() {
    try {
        await pool.end();
        console.log('Database connection pool closed');
    } catch (error) {
        console.error('Error closing database pool:', error);
    }
}

// Graceful shutdown
process.on('SIGTERM', closePool);
process.on('SIGINT', closePool);

module.exports = {
    pool,
    getConnection,
    executeQuery,
    closePool
};
