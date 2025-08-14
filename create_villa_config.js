const { pool } = require('./config/database');

async function createVillaConfigTable() {
    try {
        console.log('\n=== Creating LMvilla_config Table ===');
        
        // Create the table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS LMvilla_config (
                villa_id INT AUTO_INCREMENT PRIMARY KEY,
                villa_name VARCHAR(255) NOT NULL UNIQUE,
                bedrooms INT NOT NULL,
                max_adults_per_unit INT NOT NULL,
                max_guests_per_unit INT NOT NULL,
                privacy_level VARCHAR(100),
                pool_type VARCHAR(100),
                villa_class VARCHAR(100),
                child_age_limit INT DEFAULT 12,
                description TEXT,
                active_status BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        console.log('✅ LMvilla_config table created successfully');

        // Get distinct villa data from RoomAvailabilityStore
        const [villas] = await pool.query(`
            SELECT DISTINCT 
                UserRoomDisplayName,
                Bedrooms,
                MaxAdultsPerUnit,
                MaxGuestsPerUnit,
                Privacy,
                Pool,
                UserDefinedClass
            FROM RoomAvailabilityStore 
            WHERE UserRoomDisplayName IS NOT NULL
            ORDER BY UserRoomDisplayName
        `);

        console.log(`\n=== Pre-populating with ${villas.length} villas ===`);

        // Insert each villa into the config table
        for (const villa of villas) {
            try {
                await pool.query(`
                    INSERT INTO LMvilla_config 
                    (villa_name, bedrooms, max_adults_per_unit, max_guests_per_unit, 
                     privacy_level, pool_type, villa_class, child_age_limit, active_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 12, TRUE)
                    ON DUPLICATE KEY UPDATE
                    bedrooms = VALUES(bedrooms),
                    max_adults_per_unit = VALUES(max_adults_per_unit),
                    max_guests_per_unit = VALUES(max_guests_per_unit),
                    privacy_level = VALUES(privacy_level),
                    pool_type = VALUES(pool_type),
                    villa_class = VALUES(villa_class),
                    updated_at = CURRENT_TIMESTAMP
                `, [
                    villa.UserRoomDisplayName,
                    villa.Bedrooms || 1,
                    villa.MaxAdultsPerUnit || 2,
                    villa.MaxGuestsPerUnit || 2,
                    villa.Privacy,
                    villa.Pool,
                    villa.UserDefinedClass
                ]);
                
                console.log(`✅ Added: ${villa.UserRoomDisplayName}`);
            } catch (error) {
                console.log(`❌ Error adding ${villa.UserRoomDisplayName}: ${error.message}`);
            }
        }

        // Show final results
        console.log('\n=== Final Villa Configuration ===');
        const [finalVillas] = await pool.query(`
            SELECT villa_id, villa_name, bedrooms, max_adults_per_unit, max_guests_per_unit,
                   privacy_level, pool_type, villa_class, child_age_limit, active_status
            FROM LMvilla_config 
            ORDER BY villa_name
        `);

        finalVillas.forEach(villa => {
            console.log(`\n${villa.villa_name} (ID: ${villa.villa_id})`);
            console.log(`  Bedrooms: ${villa.bedrooms}`);
            console.log(`  Max Adults: ${villa.max_adults_per_unit} | Max Guests: ${villa.max_guests_per_unit}`);
            console.log(`  Privacy: ${villa.privacy_level} | Pool: ${villa.pool_type}`);
            console.log(`  Class: ${villa.villa_class} | Child Age Limit: ${villa.child_age_limit}`);
            console.log(`  Active: ${villa.active_status ? 'Yes' : 'No'}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating villa config:', error.message);
        process.exit(1);
    }
}

createVillaConfigTable();
