# Villa Tokay - Room Availability Dashboard

## Overview

This is a real-time villa availability monitoring dashboard built with Node.js and Express for Villa Tokay on Gili Air. The application provides a web interface to view and monitor room availability from a MySQL database table called "RoomAvailabilityStore". It features Villa Tokay's brand identity with elegant Dark Jade Green background, Gold accents, and refined typography. The dashboard includes auto-refresh capabilities, connection monitoring, and error handling for database connectivity issues.

## User Preferences

Preferred communication style: Simple, everyday language.
Brand identity: Villa Tokay luxury villa brand with sophisticated color palette and elegant typography.
Villa Tokay Brand Voice: "The Knowing Guide" - comfortable luxury, quietly confident, genuinely warm, thoughtfully evocative.
Time Zone: Always use Bali time (Central Indonesia Time, WITA, UTC+8) for all time references and operations. Users are located in Bali and this is the operational time zone for Villa Tokay.

## System Architecture

### Backend Architecture
- **Framework**: Express.js server with RESTful API endpoints
- **Database Layer**: MySQL connection pool using mysql2 with promise support
- **Error Handling**: Comprehensive error handling with specific database error codes
- **Connection Management**: Database connection pooling with automatic reconnection
- **CORS Support**: Cross-origin resource sharing enabled for frontend-backend communication

### Frontend Architecture
- **Static File Serving**: Express serves static HTML, CSS, and JavaScript files
- **Client-Side Architecture**: Vanilla JavaScript with class-based structure
- **Real-time Updates**: Auto-refresh functionality every 30 seconds
- **Responsive Design**: CSS Grid/Flexbox layout with mobile-first approach
- **Error States**: User-friendly error messages and retry mechanisms

### API Design
- **RESTful Endpoints**: Simple API structure under `/api` prefix
- **Activities Endpoint**: `/api/activities` for retrieving all activities
- **Health Check**: Built-in health monitoring capabilities
- **Response Format**: Consistent JSON responses with success/error states

### Security & Configuration
- **Environment Variables**: Database credentials and configuration via environment variables
- **SSL Configuration**: Database SSL connection with certificate validation disabled
- **Graceful Shutdown**: SIGTERM handling for proper application termination

## External Dependencies

### Database
- **MySQL Database**: Remote MySQL server hosted on Infomaniak (fi8jj.myd.infomaniak.com)
- **Table Structure**: RoomAvailabilityStore table with composite primary key (EntryDate, UserRoomDisplayName)
- **Connection Pool**: Configured with 10 connection limit and 60-second timeouts
- **Table Fields**: HotelName, EntryDate, UserRoomDisplayName, AvailabilityCount, LowestRateAmount, RatePlanName, Bedrooms, MaxAdultsPerUnit, MaxGuestsPerUnit, Privacy, Pool, UserDefinedClass, LastSyncedAt, ErrorMessage

### NPM Packages
- **express**: Web framework for Node.js (v5.1.0)
- **mysql2**: MySQL client with promise support (v3.14.3)
- **cors**: Cross-origin resource sharing middleware (v2.8.5)

### Frontend Libraries
- **Font Awesome**: Icon library (v6.0.0) loaded via CDN for dashboard UI icons

### Infrastructure
- **Node.js Runtime**: Server runs on configurable port (default 5000)
- **Static File Hosting**: Public directory serves frontend assets
- **Production Ready**: Environment-based error messaging and logging

### Brand Identity Integration
- **Color Palette**: Dark Jade Green (#0F3128) primary background, Gold (#AA7831) accents, Fossil (#4A4A47) for neutrals, Anthracite (#262626) for content areas
- **Typography**: Crimson Text serif for headings, Nexa for body text (fallback to system fonts)
- **Brand Voice**: Villa Tokay's "Knowing Guide" approach - comfortable luxury, quietly confident, genuinely warm
- **User Experience**: Villa-focused language ("villas" instead of "records", "availability" instead of "activities")