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
- **Activities Endpoint**: `/api/activities` for retrieving availability data (filtered to next 60 days from current Bali date)
- **Date Filtering**: Server-side filtering for efficiency - queries only today to today+60 days in Bali time
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

### Recent Changes (August 2025)
- **Perks System Integration**: Added comprehensive perks system using LMActivities and LMPerkRules tables to display complimentary activities next to night counts in booking options
- **Face Value Calculation**: Implemented total value calculation showing room cost (rate × nights) + perks face_price values, with per-person activity pricing support
- **Enhanced Pricing Display**: Shows both "Face Value" (crossed out) and "Your Price" to highlight guest savings and value proposition
- **Performance Optimization**: Reduced auto-refresh from 30 seconds to 5 minutes to improve user experience and reduce server load
- **Per-Person Activity Logic**: Smart detection of per-person vs fixed-price activities based on LMActivities comments field parsing
- **Database Integration**: Rule-based perks attribution using villa_id, nights, adults, children parameters for personalized perk offerings
- **Date Filtering Fix (Aug 14, 2025)**: Resolved critical date filtering reliability issues by eliminating double filtering logic, implementing single-point filtering in generateOffersFromData(), and correctly defining weekend as Friday-Sunday (Fri-Sun) rather than Saturday-Sunday for proper "This Weekend" filter behavior
- **Villa Configuration Manager (Aug 14, 2025)**: Implemented full-screen admin interface for villa configuration management, replacing modal approach. Added dedicated /admin/villa-config page with comprehensive villa settings, capacity limits, amenities, and guest limit controls.
- **Database Consolidation (Aug 14, 2025)**: Consolidated villa configuration architecture by merging LMvilla_config data into LMRoomDescription table and creating LMGeneralConfig for global settings. Added migration endpoint /admin/api/migrate-villa-tables to seamlessly transfer configuration data. This improves performance by reducing table joins and provides centralized configuration management.
- **Complete Villa Field Management (Aug 14, 2025)**: Enhanced villa configuration interface to display and manage all 22 fields from LMRoomDescription table including villa name, class, type, square meters, webpage URL, bedrooms, bathrooms, max guests/adults, tagline, description, image URLs, video tour URL, ideal for, featured status, view type, pool type, key amenities, and active status. Full CRUD operations now supported with proper database field mapping and validation.
- **Simplified Authentication System (Aug 14, 2025)**: Changed admin authentication from bcrypt password hashing to plain text passwords stored in LMadmin_users table. This allows easy password management directly through phpMyAdmin interface. Admin credentials: username "patrick" with password "VillaTokay2025!" stored as plain text in the database password field.
- **Enhanced Load More Functionality (Aug 15, 2025)**: Implemented comprehensive pagination system supporting unlimited "Load More" actions. Backend now supports pagination across all unique villa/date combinations (not just unique villas), ensuring users can browse through all available champion offers. Frontend prevents page jumps by preserving scroll position, shows loading states, and smoothly appends new villa cards below existing content. System maintains champion selection algorithm while supporting deep pagination through all available offers.