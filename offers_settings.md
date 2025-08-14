# Villa Tokay Offers System - Technical Documentation

## Overview

This document provides comprehensive technical details about the Villa Tokay booking system's offer selection and display mechanisms. The system connects to a MySQL database hosted on Infomaniak and dynamically generates personalized booking offers with integrated perks calculations.

## Architecture Overview

### Core Components
- **Express.js Backend**: Node.js server with RESTful API endpoints
- **MySQL Database**: External database (fi8jj.myd.infomaniak.com) with multiple interconnected tables
- **Frontend Interface**: Vanilla JavaScript with responsive design and real-time updates
- **Perks Integration**: Rule-based complimentary activity system with face value calculations

### Key Database Tables
- `RoomAvailabilityStore`: Primary availability and pricing data
- `LMActivities`: Activity definitions with pricing and descriptions
- `LMPerkRules`: Rule-based perk attribution logic
- `LMRoomDescription`: Villa metadata and configuration

## Data Flow Architecture

### 1. Initial Data Retrieval
**Endpoint**: `GET /api/activities`

The system queries availability data with intelligent date filtering:
```sql
SELECT * FROM RoomAvailabilityStore 
WHERE EntryDate >= CURDATE() 
AND EntryDate <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)
ORDER BY EntryDate ASC, UserRoomDisplayName ASC
```

**Key Features**:
- **Bali Time Zone**: All operations use Central Indonesia Time (WITA, UTC+8)
- **60-Day Window**: Queries from current Bali date to today + 60 days for performance
- **Server-Side Filtering**: Initial filtering at database level for efficiency

### 2. Offer Generation Logic

The `generateOffersFromData()` function processes raw database records into booking offers:

#### Date Range Processing
- **Single-Point Filtering**: Eliminates double filtering issues by processing dates once
- **Consecutive Nights**: Groups consecutive available dates for each villa
- **Maximum Stay Limit**: Enforces 4-night maximum stay restriction

#### Villa Grouping
- Groups availability by `UserRoomDisplayName` (villa identifier)
- Sorts by villa name for consistent presentation
- Maintains chronological date ordering within each villa

### 3. Perks Integration System

#### Rule-Based Perk Attribution
The system uses `LMPerkRules` table to determine applicable perks:
```sql
SELECT pa.activity_id, a.activity_name, a.face_price, a.comments
FROM LMPerkRules pr
JOIN LMActivities pa ON pr.id = pa.perk_rule_id
JOIN LMActivities a ON pa.activity_id = a.activity_id
WHERE pr.villa_id = ? AND pr.nights = ? AND pr.adults = ? AND pr.children = ?
```

#### Per-Person Activity Logic
- **Comment Parsing**: Analyzes `LMActivities.comments` field for pricing structure
- **Per-Person Detection**: Identifies activities with "per person" or "each" keywords
- **Fixed Price Activities**: Activities without per-person indicators use base face_price
- **Dynamic Pricing**: Multiplies face_price by adult count for per-person activities

#### Face Value Calculation
Total offer value calculation:
```javascript
const totalFaceValue = (rate * nights) + totalPerkValue
```

Where `totalPerkValue` includes:
- Fixed-price activity face values
- Per-person activities: `face_price * adults`
- Cumulative value of all applicable perks

### 4. Date Filtering System

#### Filter Categories
- **Today**: Current Bali date only
- **Tomorrow**: Next day from current Bali date
- **This Weekend**: Friday-Sunday of current week (corrected from Sat-Sun)
- **Next Weekend**: Friday-Sunday of following week
- **All Dates**: No date filtering applied

#### Weekend Definition
**Critical Fix (Aug 14, 2025)**: Weekend correctly defined as Friday-Sunday (Fri-Sun) rather than Saturday-Sunday for proper "This Weekend" filter behavior.

#### Implementation
```javascript
const today = new Date();
const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

// Calculate Friday of current week
const fridayOffset = (dayOfWeek + 2) % 7; // Days until Friday
const currentFriday = new Date(today);
currentFriday.setDate(today.getDate() + fridayOffset);
```

### 5. Database Performance Optimizations

#### Connection Pooling
```javascript
const pool = mysql.createPool({
    host: 'fi8jj.myd.infomaniak.com',
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: 'fi8jj_VT_DEV',
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    ssl: { rejectUnauthorized: false }
});
```

#### Query Optimizations
- **Single Database Call**: Primary data retrieved in one query
- **Indexed Filtering**: Uses database indexes on EntryDate and UserRoomDisplayName
- **Limit Result Sets**: 60-day window prevents excessive data transfer
- **Connection Reuse**: Pool maintains persistent connections

### 6. Frontend Integration

#### Auto-Refresh System
- **5-Minute Intervals**: Reduced from 30 seconds to improve user experience
- **Background Updates**: Non-intrusive data refreshing
- **Error Handling**: Graceful degradation on connection issues

#### Real-Time Updates
```javascript
// Auto-refresh every 5 minutes
setInterval(() => {
    loadAvailabilityData();
}, 5 * 60 * 1000);
```

#### Responsive Design
- **Mobile-First Approach**: CSS Grid/Flexbox layout
- **Villa Cards**: Individual cards for each villa with booking options
- **Dynamic Pricing Display**: Shows both face value (crossed out) and actual price

## Technical Implementation Details

### API Endpoints

#### Primary Data Endpoint
`GET /api/activities`
- Returns processed availability data with date filtering
- Includes villa metadata and pricing information
- Applies current date range restrictions

#### Perks Calculation Endpoint
`GET /api/perks?villa_id={id}&nights={n}&adults={a}&children={c}`
- Returns applicable perks for given parameters
- Calculates total face value including per-person adjustments
- Provides activity details for display

### Error Handling

#### Database Connection Issues
- Automatic reconnection attempts
- Graceful error messages to frontend
- Connection pool management with timeouts

#### Data Validation
- Date range validation for booking parameters
- Guest count limits enforcement
- Activity pricing validation

#### Frontend Error States
- Loading indicators during data fetch
- Error messages for failed requests
- Retry mechanisms for temporary failures

### Security Considerations

#### Database Access
- Environment variable configuration for credentials
- SSL connections with certificate validation disabled for compatibility
- Connection pooling prevents connection exhaustion

#### Input Validation
- SQL injection prevention through parameterized queries
- Date format validation
- Numeric parameter bounds checking

## Configuration Management

### Environment Variables
```
DB_HOST=fi8jj.myd.infomaniak.com
DB_USER=fi8jj_admin_pat
DB_PASS=[secured]
DB_NAME=fi8jj_VT_DEV
PORT=5000
NODE_ENV=development
```

### Villa Configuration
Recent architectural improvement consolidated villa settings into `LMRoomDescription` table:
- Villa metadata (name, type, class)
- Capacity limits (bedrooms, max guests/adults)
- Marketing content (descriptions, taglines, image URLs)
- Amenities and features
- Active status management

### Global Settings
`LMGeneralConfig` table stores system-wide configuration:
- Booking restrictions
- Default values
- Feature toggles
- System parameters

## Recent Architectural Improvements (August 2025)

### Database Consolidation
- **Migration System**: Seamless transition from `LMvilla_config` to `LMRoomDescription`
- **Reduced Complexity**: Single table for villa data reduces JOIN operations
- **Performance Gains**: Fewer database queries for villa information

### Enhanced Perks System
- **Rule-Based Attribution**: Dynamic perk assignment based on booking parameters
- **Per-Person Pricing**: Intelligent detection of per-person vs fixed-price activities
- **Face Value Display**: Shows savings to guests through crossed-out face values

### Authentication Simplification
- **Plain Text Passwords**: Direct phpMyAdmin password management capability
- **Admin Interface**: Full-screen villa configuration management
- **Comprehensive CRUD**: All 22 villa fields editable through admin panel

### Date Filtering Reliability
- **Single-Point Processing**: Eliminated double filtering logic issues
- **Weekend Correction**: Fixed weekend definition (Fri-Sun vs Sat-Sun)
- **Timezone Consistency**: All operations use Bali time (UTC+8)

## Maintenance and Monitoring

### Health Checks
- Database connection monitoring
- Table existence validation
- Data integrity verification

### Performance Monitoring
- Query execution times
- Connection pool utilization
- Error rate tracking

### Regular Maintenance Tasks
- Database connection pool cleanup
- Error log review
- Performance optimization assessment

## Integration Points

### External Systems
- **Infomaniak MySQL**: Primary data source
- **Villa Tokay Website**: Brand identity integration
- **Admin Panel**: Configuration management interface

### Internal Components
- **Activities Router**: Handles availability data processing
- **Admin Router**: Villa configuration management
- **Database Module**: Connection and query management
- **Frontend Assets**: Static file serving and client-side logic

## Future Considerations

### Scalability
- Connection pool sizing based on traffic patterns
- Query optimization for larger datasets
- Caching strategies for frequently accessed data

### Feature Enhancements
- Advanced filtering options
- Personalization algorithms
- Booking analytics integration

### Maintenance Improvements
- Automated health monitoring
- Performance alerting
- Database backup strategies

---

*This documentation reflects the state of the system as of August 14, 2025. For technical support or clarification, refer to the codebase in the routes/activities.js file and related database configuration.*