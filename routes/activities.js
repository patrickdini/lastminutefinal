const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * GET /api/activities
 * Retrieve ALL available offers from LMCurrentOffers for specific dates and guest count
 * Query parameters:
 * - checkinDate: exact check-in date (YYYY-MM-DD)
 * - checkoutDate: exact check-out date (YYYY-MM-DD)
 * - adults: number of adults
 * - children: number of children
 */
router.get('/activities', async (req, res) => {
    try {
        console.log('Fetching all available offers from LMCurrentOffers...');
        
        // Extract query parameters or use defaults
        const { checkinDate, checkoutDate, adults = '2', children = '0' } = req.query;
        
        // Require both check-in and check-out dates for specific searches
        if (!checkinDate || !checkoutDate) {
            return res.status(400).json({ 
                message: 'Both checkinDate and checkoutDate are required. Please select dates in the calendar.',
                error: 'MISSING_DATES'
            });
        }
        
        const adultsCount = parseInt(adults);
        const childrenCount = parseInt(children);
        
        // Calculate number of nights for the selected dates
        const checkinDateObj = new Date(checkinDate);
        const checkoutDateObj = new Date(checkoutDate);
        const selectedNights = Math.ceil((checkoutDateObj - checkinDateObj) / (1000 * 60 * 60 * 24));
        
        // Generate date scenarios for flexible matching
        const dateScenarios = [];
        
        // Check if checkin is tomorrow (don't go earlier than tomorrow)
        const now = new Date();
        const baliTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
        const tomorrow = new Date(baliTime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        const canMoveCheckinEarlier = checkinDate > tomorrowStr;
        
        // 1. Exact Match: selected check-in, selected check-out
        dateScenarios.push({
            checkinDate,
            nights: selectedNights,
            matchType: 'exact'
        });
        
        // 2. Nearby Match: check-in - 1 day, selected check-out (if possible)
        if (canMoveCheckinEarlier) {
            const earlierCheckin = new Date(checkinDateObj);
            earlierCheckin.setDate(earlierCheckin.getDate() - 1);
            const earlierCheckinStr = earlierCheckin.toISOString().split('T')[0];
            
            dateScenarios.push({
                checkinDate: earlierCheckinStr,
                nights: selectedNights + 1,
                matchType: 'nearby'
            });
        }
        
        // 3. Nearby Match: check-in - 1 day, check-out - 1 day (if possible)
        if (canMoveCheckinEarlier) {
            const earlierCheckin = new Date(checkinDateObj);
            earlierCheckin.setDate(earlierCheckin.getDate() - 1);
            const earlierCheckinStr = earlierCheckin.toISOString().split('T')[0];
            
            dateScenarios.push({
                checkinDate: earlierCheckinStr,
                nights: selectedNights,
                matchType: 'nearby'
            });
        }
        
        // 4. Nearby Match: selected check-in, check-out - 1 day
        if (selectedNights > 1) { // Only if we have more than 1 night
            dateScenarios.push({
                checkinDate,
                nights: selectedNights - 1,
                matchType: 'nearby'
            });
        }
        
        // 5. Extension Support: Forward extension - offers starting on checkout date
        // This enables frontend to show "+1 night" extensions
        dateScenarios.push({
            checkinDate: checkoutDate,
            nights: 1,
            matchType: 'extension'
        });
        
        // 6. Extension Support: Backward extension - offers starting day before checkin
        // This enables frontend to show backward "+1 night" extensions
        if (canMoveCheckinEarlier) {
            const dayBeforeCheckin = new Date(checkinDateObj);
            dayBeforeCheckin.setDate(dayBeforeCheckin.getDate() - 1);
            const dayBeforeCheckinStr = dayBeforeCheckin.toISOString().split('T')[0];
            
            dateScenarios.push({
                checkinDate: dayBeforeCheckinStr,
                nights: 1,
                matchType: 'extension'
            });
        }
        
        console.log(`Querying offers for ${dateScenarios.length} date scenarios:`, dateScenarios.map(s => `${s.checkinDate} (${s.nights}n, ${s.matchType})`).join(', '));
        
        // Get database connection
        const connection = await db.getConnection();
        
        // Query for all date scenarios
        let allOffers = [];
        
        for (const scenario of dateScenarios) {
            const offersQuery = `
                SELECT 
                    co.*,
                    lrd.tagline,
                    lrd.description,
                    lrd.square_meters,
                    lrd.bathrooms,
                    lrd.bedrooms,
                    lrd.view_type,
                    lrd.pool_type,
                    lrd.image_urls,
                    lrd.key_amenities,
                    lrd.webpage_url
                FROM LMCurrentOffers co
                LEFT JOIN LMRoomDescription lrd ON co.villa_id = lrd.villa_id
                WHERE co.checkin_date = ? 
                    AND co.nights = ?
                    AND co.adults = ?
                    AND co.children = ?
                    AND co.offer_status IN ('Target Met', 'Best Effort')
                ORDER BY co.villa_id, co.offer_id
            `;
            
            const [scenarioOffers] = await connection.execute(offersQuery, [
                scenario.checkinDate, scenario.nights, adultsCount, childrenCount
            ]);
            
            // Add match type to each offer
            const enrichedOffers = scenarioOffers.map(offer => ({
                ...offer,
                match_type: scenario.matchType,
                original_checkin_date: checkinDate,
                original_checkout_date: checkoutDate
            }));
            
            allOffers = [...allOffers, ...enrichedOffers];
            
            console.log(`Found ${scenarioOffers.length} offers for ${scenario.checkinDate} (${scenario.nights}n, ${scenario.matchType})`);
        }
        
        console.log(`Found ${allOffers.length} total offers across all scenarios`)
        
        // Release the connection back to the pool
        connection.release();
        
        // Transform offers to match the frontend expected format
        // The frontend expects data similar to RoomAvailabilityStore format for compatibility
        const transformedOffers = allOffers.map(offer => {
            // Parse JSON fields
            let perkIds = [];
            let imageUrls = [];
            let keyAmenities = [];
            
            try {
                perkIds = JSON.parse(offer.perk_ids || '[]');
                imageUrls = JSON.parse(offer.image_urls || '[]');
                keyAmenities = JSON.parse(offer.key_amenities || '[]');
            } catch (e) {
                console.warn('Error parsing JSON fields for offer:', offer.offer_id, e.message);
            }
            
            // Transform to match expected frontend format (similar to RoomAvailabilityStore)
            return {
                // Match RoomAvailabilityStore field names for frontend compatibility
                EntryDate: offer.checkin_date,
                UserRoomDisplayName: offer.villa_id,
                AvailabilityCount: 1, // Offer is available
                LowestRateAmount: parseFloat(offer.price_for_guests),
                RatePlanName: offer.offer_status,
                Bedrooms: null, // Will be populated from LMRoomDescription if needed
                MaxAdultsPerUnit: offer.adults,
                MaxGuestsPerUnit: offer.adults + offer.children,
                Privacy: null,
                Pool: 'Private', // Default for villas
                UserDefinedClass: null,
                
                // Enhanced villa data from LMRoomDescription join
                villa_display_name: offer.villa_name,
                tagline: offer.tagline,
                description: offer.description,
                square_meters: offer.square_meters,
                bathrooms: offer.bathrooms,
                bedrooms: offer.bedrooms,
                view_type: offer.view_type,
                pool_type: offer.pool_type,
                image_urls: offer.image_urls,
                key_amenities: offer.key_amenities,
                class: null,
                webpage_url: offer.webpage_url,
                
                // LMCurrentOffers specific fields
                offer_id: offer.offer_id,
                nights: offer.nights,
                attractiveness_score: offer.attractiveness_score,
                price_for_guests: offer.price_for_guests,
                total_face_value: offer.total_face_value,
                guest_savings_value: offer.guest_savings_value,
                guest_savings_percent: offer.guest_savings_percent,
                has_wow_factor_perk: offer.has_wow_factor_perk,
                perk_ids: perkIds,
                perks_included: offer.perks_included,
                last_calculated_at: offer.last_calculated_at,
                
                // Enhanced filtering fields
                match_type: offer.match_type,
                original_checkin_date: offer.original_checkin_date,
                original_checkout_date: offer.original_checkout_date
            };
        });
        
        // Return response with all available offers (exact and nearby matches)
        res.json({
            success: true,
            message: `Found ${transformedOffers.length} available offers (exact and nearby matches)`,
            data: transformedOffers,
            metadata: {
                selected_checkin_date: checkinDate,
                selected_checkout_date: checkoutDate,
                selected_nights: selectedNights,
                adults: adultsCount,
                children: childrenCount,
                scenarios_queried: dateScenarios.length
            }
        });
        
    } catch (error) {
        console.error('Error fetching available offers:', error);
        
        // Handle specific database errors
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                error: 'Database connection refused',
                message: 'Unable to connect to the database server'
            });
        }
        
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(404).json({
                success: false,
                error: 'Table not found',
                message: 'LMCurrentOffers table does not exist'
            });
        }
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            return res.status(401).json({
                success: false,
                error: 'Database access denied',
                message: 'Invalid database credentials'
            });
        }
        
        // Generic error response
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to retrieve offers from database'
        });
    }
});

/**
 * GET /api/activities/:date/:room
 * Retrieve a specific room availability record by EntryDate and UserRoomDisplayName
 */
router.get('/activities/:date/:room', async (req, res) => {
    try {
        const { date, room } = req.params;
        
        // Validate parameters
        if (!date || !room) {
            return res.status(400).json({
                success: false,
                error: 'Invalid parameters',
                message: 'Both date and room name are required'
            });
        }
        
        console.log(`Fetching room availability for date: ${date}, room: ${room}`);
        
        const connection = await db.getConnection();
        
        const [rows] = await connection.execute(
            'SELECT * FROM RoomAvailabilityStore WHERE EntryDate = ? AND UserRoomDisplayName = ?',
            [date, decodeURIComponent(room)]
        );
        
        connection.release();
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Record not found',
                message: `No room availability found for date: ${date}, room: ${room}`
            });
        }
        
        console.log(`Successfully retrieved room availability for date: ${date}, room: ${room}`);
        
        res.json({
            success: true,
            data: rows[0]
        });
        
    } catch (error) {
        console.error('Error fetching room availability by date/room:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to retrieve room availability'
        });
    }
});

/**
 * GET /api/health
 * Health check endpoint for database connectivity
 */
router.get('/health', async (req, res) => {
    try {
        const connection = await db.getConnection();
        await connection.execute('SELECT 1');
        connection.release();
        
        res.json({
            success: true,
            message: 'Database connection is healthy',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            success: false,
            error: 'Database connection failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/perks/:villaId/:nights/:adults/:children
 * Get applicable perks for a specific booking combination
 */
router.get('/perks/:villaId/:nights/:adults/:children', async (req, res) => {
    try {
        const { villaId, nights, adults, children } = req.params;
        console.log(`Fetching perks for ${villaId}, ${nights} nights, ${adults} adults, ${children} children`);
        
        const connection = await db.getConnection();
        
        // Find matching perk rule
        const [perkRules] = await connection.execute(`
            SELECT perk_activity_ids 
            FROM LMPerkRules 
            WHERE villa_id = ? AND num_nights = ? AND num_adults = ? AND num_children = ?
        `, [villaId, parseInt(nights), parseInt(adults), parseInt(children)]);
        
        if (perkRules.length === 0) {
            connection.release();
            return res.json({
                success: true,
                perks: []
            });
        }
        
        // Parse the activity IDs from JSON
        const activityIds = JSON.parse(perkRules[0].perk_activity_ids || '[]');
        
        if (activityIds.length === 0) {
            connection.release();
            return res.json({
                success: true,
                perks: []
            });
        }
        
        // Get the actual activities
        const placeholders = activityIds.map(() => '?').join(',');
        const [activities] = await connection.execute(`
            SELECT activity_id, name, tagline, description, face_price, comments
            FROM LMActivities 
            WHERE activity_id IN (${placeholders})
        `, activityIds);
        
        connection.release();
        
        res.json({
            success: true,
            perks: activities
        });
        
    } catch (error) {
        console.error('Error fetching perks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch perks',
            details: error.message
        });
    }
});

/**
 * GET /api/perks-structure
 * Examine the structure and sample data of LMActivities and LMPerkRules tables
 */
router.get('/perks-structure', async (req, res) => {
    try {
        console.log('Examining perks tables structure...');
        
        const connection = await db.getConnection();
        
        // Get structure of LMActivities table
        const [activitiesStructure] = await connection.execute('DESCRIBE LMActivities');
        
        // Get structure of LMPerkRules table
        const [perkRulesStructure] = await connection.execute('DESCRIBE LMPerkRules');
        
        // Get sample data from LMActivities
        const [activitiesSample] = await connection.execute('SELECT * FROM LMActivities LIMIT 10');
        
        // Get sample data from LMPerkRules
        const [perkRulesSample] = await connection.execute('SELECT * FROM LMPerkRules LIMIT 10');
        
        connection.release();
        
        console.log('Successfully retrieved perks table structures');
        
        res.json({
            success: true,
            tables: {
                LMActivities: {
                    structure: activitiesStructure,
                    sampleData: activitiesSample
                },
                LMPerkRules: {
                    structure: perkRulesStructure,
                    sampleData: perkRulesSample
                }
            }
        });
        
    } catch (error) {
        console.error('Error examining perks tables:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to examine perks tables structure',
            details: error.message
        });
    }
});

module.exports = router;
