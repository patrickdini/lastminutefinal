const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function resetPassword() {
    console.log('\n=== Admin Password Reset Tool ===\n');
    
    // Show existing users
    const [users] = await pool.query(
        'SELECT username, email, role FROM LMadmin_users'
    );
    
    console.log('Existing admin users:');
    users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username} (${user.email || 'no email'}) - ${user.role}`);
    });
    
    rl.question('\nEnter username to reset password (or press Enter for "patrick"): ', async (username) => {
        username = username || 'patrick';
        
        // Check if user exists
        const [existingUser] = await pool.query(
            'SELECT * FROM LMadmin_users WHERE username = ?',
            [username]
        );
        
        if (!existingUser || existingUser.length === 0) {
            console.log(`\n❌ User "${username}" not found!`);
            rl.close();
            process.exit(1);
        }
        
        rl.question('\nEnter new password (or press Enter for default "VillaTokay2025!"): ', async (password) => {
            password = password || 'VillaTokay2025!';
            
            try {
                // Hash the password
                const hashedPassword = await bcrypt.hash(password, 10);
                
                // Update the password
                await pool.query(
                    'UPDATE LMadmin_users SET password_hash = ?, login_attempts = 0, locked_until = NULL WHERE username = ?',
                    [hashedPassword, username]
                );
                
                console.log('\n✅ Password reset successfully!');
                console.log('\n=== Login Credentials ===');
                console.log(`Username: ${username}`);
                console.log(`Password: ${password}`);
                console.log('\nYou can now log in to the admin panel by:');
                console.log('1. Click the ⚙️ icon in the top-right corner of your Villa Tokay dashboard');
                console.log('2. Enter these credentials on the login page');
                console.log('\n⚠️  IMPORTANT: Please change this password after your first login!');
                
            } catch (error) {
                console.error('\n❌ Error resetting password:', error.message);
            } finally {
                rl.close();
                process.exit(0);
            }
        });
    });
}

// Run the reset tool
resetPassword().catch(error => {
    console.error('Fatal error:', error);
    rl.close();
    process.exit(1);
});