const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');

async function resetPassword() {
    const username = 'patrick';
    const password = 'VillaTokay2025!';
    
    try {
        console.log('\n=== Resetting Password for Admin User "patrick" ===\n');
        
        // Check if user exists
        const [existingUser] = await pool.query(
            'SELECT * FROM LMadmin_users WHERE username = ?',
            [username]
        );
        
        if (!existingUser || existingUser.length === 0) {
            console.log(`❌ User "${username}" not found!`);
            process.exit(1);
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Update the password
        await pool.query(
            'UPDATE LMadmin_users SET password_hash = ?, login_attempts = 0, locked_until = NULL WHERE username = ?',
            [hashedPassword, username]
        );
        
        console.log('✅ Password reset successfully!\n');
        console.log('=== Login Credentials ===');
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);
        console.log('\nYou can now log in to the admin panel by:');
        console.log('1. Click the ⚙️ icon in the top-right corner of your Villa Tokay dashboard');
        console.log('2. Enter these credentials on the login page');
        console.log('\n⚠️  IMPORTANT: Please change this password after your first login!\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting password:', error.message);
        process.exit(1);
    }
}

// Run the reset
resetPassword();