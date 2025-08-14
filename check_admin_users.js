const { pool } = require('./config/database');

async function checkAdminUsers() {
    try {
        const [users] = await pool.query(
            'SELECT username, email, role, is_active, last_login FROM LMadmin_users'
        );
        
        console.log('\n=== Existing Admin Users ===');
        users.forEach(user => {
            console.log(`\nUsername: ${user.username}`);
            console.log(`Email: ${user.email || 'Not set'}`);
            console.log(`Role: ${user.role}`);
            console.log(`Active: ${user.is_active ? 'Yes' : 'No'}`);
            console.log(`Last Login: ${user.last_login || 'Never'}`);
        });
        
        console.log('\n=== Password Reset Instructions ===');
        console.log('To reset a password, you can:');
        console.log('1. Use phpMyAdmin to update the password_hash field');
        console.log('2. Or I can help you generate a new password hash');
        
        process.exit(0);
    } catch (error) {
        console.error('Error checking admin users:', error.message);
        process.exit(1);
    }
}

checkAdminUsers();
