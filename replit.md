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
- **UI Improvements (Aug 15, 2025)**: Fixed bedroom information display by properly mapping bedrooms field from LMRoomDescription table. Removed "xx champion offers" counter box for cleaner interface. Removed villa display names (like "The Swell 2BR") from villa cards to focus on taglines and descriptions instead of technical identifiers.
- **Timeline-Style Villa Cards (Aug 17, 2025)**: Replaced circular date selectors with chronological timeline interface showing booking progression: extension dates → check-in → stay nights → check-out → extension dates. Timeline is data-driven and only shows realistic extension options based on actual offer availability for each villa. Prevents showing extension circles when check-in is tomorrow or when no offers exist for extension dates. Interactive timeline allows guests to extend stays with real-time price updates.
- **Champion to Special Offer Rebrand (Aug 17, 2025)**: Removed all "champion" terminology from user-facing interface, replacing with "Special Offer" throughout booking buttons, savings banners, and interface text while maintaining internal function names for stability.
- **Bali Timezone Calendar Fix (Aug 17, 2025)**: Fixed calendar to correctly display Bali time (UTC+8) by updating getBaliDate(), getBaliDayOfWeek(), and renderCalendar() methods. Calendar now properly shows current Bali date as today rather than showing next day. **IMPORTANT: Calendar timezone logic is now correct - do not modify without user approval.**
- **Collapsible Villa Cards (Aug 17, 2025)**: Added "Show Detailed Offer" button below savings banner to hide villa details (tagline, check-in info, perks, booking options) by default for easier comparison. Cards show only essential info (image, price, savings) with expandable details on demand.
- **UI Text Simplification (Aug 17, 2025)**: Shortened savings banner text from "You Save X.XM (XX%) with this Special Offer!" to "You Save X.XM (XX%) !" and simplified booking button from "BOOK SPECIAL OFFER (X NIGHTS)" to "BOOK NOW" for cleaner interface.
- **Booking Navigation Fix (Aug 18, 2025)**: Resolved critical booking button functionality that was preventing users from proceeding to confirmation page. Fixed offer ID mismatches between booking buttons and currentOffers array with enhanced debugging and proper ID handling. Booking flow now works seamlessly from villa selection to confirmation page.
- **Date Calculation Fix (Aug 18, 2025)**: Corrected "In X days" text calculation that was showing incorrect values (e.g., "In 4 days" when should be "In 3 days"). Changed from Math.ceil() to Math.round() in both villa cards and confirmation page for accurate day counting.
- **Flexibility Pills Complete Fix (Aug 18, 2025)**: Resolved critical issue where date flexibility selector was non-functional due to dataset attribute mismatch. Fixed getSelectedFlexibility() method that was looking for 'dataset.tolerance' instead of 'dataset.flexibility', causing it to always return undefined. Flexibility system now works perfectly - clicking ±1, ±2, or ±3 days correctly expands search window and shows significantly more villa options (e.g., 11 offers vs 2 offers with exact matching). Each villa now displays multiple booking options with different check-in dates within the flexibility window.
- **Enhanced Back Navigation State Preservation (Aug 18, 2025)**: Implemented comprehensive state preservation for "Back to Special Offers" navigation. Extended localStorage state management to capture and restore villa expansion states (Show/Hide Details) and selected offers within villas when multiple booking options exist. Added helper functions getExpandedVillaStates(), getSelectedOfferStates(), and restoreVillaStates() to ensure seamless user experience when returning from confirmation page. System now preserves both which villas were expanded and which specific booking dates were selected within each villa.
- **Complete Date Selection Restoration Fix (Aug 18, 2025)**: Resolved critical issue with date selection restoration that was preventing selected booking options from being preserved. Fixed incorrect button selectors (changed from .night-selector-btn.active to .booking-option-btn.selected), implemented stable button identification using index-based capture instead of fragile text matching, and added proper HTML element injection for villa name identification. Both villa expansion and specific date selections now restore perfectly when returning from confirmation page.