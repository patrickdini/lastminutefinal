const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * GET /api/activities
 * Retrieve the top 3 champion offers from LMCurrentOffers using Two-Step Champion Selection
 * Query parameters:
 * - startDate: check-in date range start (YYYY-MM-DD)
 * - endDate: check-in date range end (YYYY-MM-DD) 
 * - adults: number of adults
 * - children: number of children
 */
router.get('/activities', async (req, res) => {
    try {
        console.log('Fetching champion offers from LMCurrentOffers...');
        
        // Extract query parameters or use defaults
        const { startDate, endDate, adults = '2', children = '0', offset = '0', limit = '3' } = req.query;
        
        // Calculate default date range if not provided: today to today + 7 days in Bali time
        let queryStartDate, queryEndDate;
        
        if (startDate && endDate) {
            queryStartDate = startDate;
            queryEndDate = endDate;
        } else {
            const now = new Date();
            const baliTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
            const tomorrow = new Date(baliTime);
            tomorrow.setDate(tomorrow.getDate() + 1);
            queryStartDate = tomorrow.toISOString().split('T')[0];
            
            const weekLater = new Date(tomorrow);
            weekLater.setDate(tomorrow.getDate() + 7);
            queryEndDate = weekLater.toISOString().split('T')[0];
        }
        
        const adultsCount = parseInt(adults);
        const childrenCount = parseInt(children);
        const offsetCount = parseInt(offset);
        const limitCount = parseInt(limit);
        
        console.log(`Querying offers: ${queryStartDate} to ${queryEndDate}, ${adultsCount} adults, ${childrenCount} children, offset: ${offsetCount}, limit: ${limitCount}`);
        
        // Get database connection
        const connection = await db.getConnection();
        
        // STEP A: Find Local Champions (best offer per villa_id + checkin_date combination)
        // Using window functions to get the highest attractiveness_score for each (villa_id, checkin_date) pair
        const localChampionsQuery = `
            SELECT 
                co.*,
                lrd.tagline,
                lrd.description,
                lrd.square_meters,
                lrd.bathrooms,
                lrd.view_type,
                lrd.pool_type,
                lrd.image_urls,
                lrd.key_amenities,
                lrd.webpage_url
            FROM (
                SELECT *,
                    ROW_NUMBER() OVER (
                        PARTITION BY villa_id, checkin_date 
                        ORDER BY attractiveness_score DESC
                    ) as rn
                FROM LMCurrentOffers 
                WHERE checkin_date >= ? 
                    AND checkin_date <= ?
                    AND adults = ?
                    AND children = ?
                    AND offer_status IN ('Target Met', 'Best Effort')
            ) co
            LEFT JOIN LMRoomDescription lrd ON co.villa_id = lrd.villa_id
            WHERE co.rn = 1
            ORDER BY co.attractiveness_score DESC
        `;
        
        const [localChampions] = await connection.execute(localChampionsQuery, [
            queryStartDate, queryEndDate, adultsCount, childrenCount
        ]);
        
        console.log(`Found ${localChampions.length} local champions`);
        
        // STEP B: Select Global Champion villa/date combinations with pagination
        const championCombinations = [];
        let processedCount = 0;
        
        // Create unique combinations (villa_id + checkin_date)
        const uniqueCombinationsList = [];
        const seenCombinations = new Set();
        
        for (const offer of localChampions) {
            const combinationKey = `${offer.villa_id}_${offer.checkin_date}`;
            if (!seenCombinations.has(combinationKey)) {
                seenCombinations.add(combinationKey);
                uniqueCombinationsList.push(offer);
            }
        }
        
        // Apply pagination to unique combinations
        for (const offer of uniqueCombinationsList) {
            // Apply offset - skip the first offsetCount combinations
            if (processedCount < offsetCount) {
                processedCount++;
                continue;
            }
            
            // Add this villa/date combination to champions
            championCombinations.push({
                villa_id: offer.villa_id,
                checkin_date: offer.checkin_date,
                best_score: offer.attractiveness_score
            });
            
            // Stop once we have the requested limit
            if (championCombinations.length >= limitCount) {
                break;
            }
        }
        
        console.log(`Selected ${championCombinations.length} champion villa/date combinations (offset: ${offsetCount}, limit: ${limitCount})`);
        
        // Log the selected champions with their scores for verification
        championCombinations.forEach((combo, index) => {
            console.log(`  Champion ${index + 1 + offsetCount}: Villa ${combo.villa_id}, Date ${combo.checkin_date}, Score: ${combo.best_score}`);
        });
        
        // STEP C: For each champion combination, fetch ALL available night options
        let allChampionOffers = [];
        
        if (championCombinations.length > 0) {
            // Create query to get all night options for the selected champion combinations
            const championOffersQuery = `
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
                WHERE co.adults = ? AND co.children = ?
                AND co.offer_status IN ('Target Met', 'Best Effort')
                AND (${championCombinations.map(() => '(co.villa_id = ? AND co.checkin_date = ?)').join(' OR ')})
                ORDER BY 
                    co.attractiveness_score DESC
            `;
            
            // Prepare parameters: adults, children, then pairs of (villa_id, checkin_date)
            const queryParams = [adultsCount, childrenCount];
            championCombinations.forEach(combo => {
                queryParams.push(combo.villa_id, combo.checkin_date);
            });
            
            const [championOffers] = await connection.execute(championOffersQuery, queryParams);
            allChampionOffers = championOffers;
            
            console.log(`Found ${allChampionOffers.length} total offers for ${championCombinations.length} champion combinations`);
        }
        
        // Release the connection back to the pool
        connection.release();
        
        // Transform offers to match the frontend expected format
        // The frontend expects data similar to RoomAvailabilityStore format for compatibility
        const transformedOffers = allChampionOffers.map(offer => {
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
                last_calculated_at: offer.last_calculated_at
            };
        });
        
        // Check if there are more offers available
        const uniqueCombinations = new Set();
        localChampions.forEach(offer => {
            uniqueCombinations.add(`${offer.villa_id}_${offer.checkin_date}`);
        });
        const totalUniqueCombinations = uniqueCombinations.size;
        const hasMore = (offsetCount + limitCount) < totalUniqueCombinations;
        
        res.json({
            success: true,
            count: transformedOffers.length,
            data: transformedOffers,
            pagination: {
                offset: offsetCount,
                limit: limitCount,
                hasMore: hasMore,
                totalAvailable: totalUniqueCombinations
            },
            query_params: {
                date_range: `${queryStartDate} to ${queryEndDate}`,
                adults: adultsCount,
                children: childrenCount
            }
        });
        
    } catch (error) {
        console.error('Error fetching champion offers:', error);
        
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
            message: 'Failed to retrieve champion offers from database'
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
