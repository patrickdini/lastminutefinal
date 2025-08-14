const { pool } = require('./config/database');

async function examineTableStructure() {
    try {
        console.log('\n=== RoomAvailabilityStore Table Structure ===');
        const [columns] = await pool.query(`
            SHOW COLUMNS FROM RoomAvailabilityStore
        `);
        
        columns.forEach(col => {
            console.log(`${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'} ${col.Default ? `[default: ${col.Default}]` : ''}`);
        });

        console.log('\n=== Sample Villa Data from RoomAvailabilityStore ===');
        const [sampleData] = await pool.query(`
            SELECT DISTINCT 
                UserRoomDisplayName, 
                Bedrooms, 
                MaxAdultsPerUnit, 
                MaxGuestsPerUnit, 
                Privacy, 
                Pool, 
                UserDefinedClass
            FROM RoomAvailabilityStore 
            ORDER BY UserRoomDisplayName
        `);
        
        sampleData.forEach(row => {
            console.log(`\nVilla: ${row.UserRoomDisplayName}`);
            console.log(`  Bedrooms: ${row.Bedrooms}`);
            console.log(`  Max Adults: ${row.MaxAdultsPerUnit}`);
            console.log(`  Max Guests: ${row.MaxGuestsPerUnit}`);
            console.log(`  Privacy: ${row.Privacy}`);
            console.log(`  Pool: ${row.Pool}`);
            console.log(`  Class: ${row.UserDefinedClass}`);
        });

        console.log('\n=== Checking for existing LM tables ===');
        const [tables] = await pool.query(`
            SHOW TABLES LIKE 'LM%'
        `);
        
        console.log('\nExisting LM tables:');
        tables.forEach(table => {
            console.log(`- ${Object.values(table)[0]}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error examining tables:', error.message);
        process.exit(1);
    }
}

examineTableStructure();
