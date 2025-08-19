const db = require('./config/database');

async function testMailingData() {
    try {
        console.log('Checking recent LMMailing_List data...');
        
        const connection = await db.getConnection();
        
        // Get the most recent record
        const [records] = await connection.execute("SELECT * FROM LMMailing_List ORDER BY created_at DESC LIMIT 1");
        
        if (records.length > 0) {
            const record = records[0];
            console.log('\n--- Most Recent Record ---');
            console.log(`ID: ${record.id}`);
            console.log(`Name: ${record.name}`);
            console.log(`Email: ${record.email}`);
            console.log(`WhatsApp: ${record.whatsapp_number || 'None'}`);
            console.log(`Channel Opt-in: "${record.channel_opt_in}"`);
            console.log(`Travel Type: ${record.travel_type}`);
            console.log(`Staycation Window: ${record.staycation_window}`);
            console.log(`Lead Time: ${record.preferred_lead_time}`);
            console.log(`Consent: ${record.consent ? 'Yes' : 'No'}`);
            console.log(`Created: ${record.created_at}`);
        } else {
            console.log('No records found.');
        }
        
        connection.release();
        
    } catch (error) {
        console.error('Error checking mailing data:', error);
    }
}

testMailingData();