# Villa Tokay - Room Availability Dashboard

## Overview

This project is a real-time room availability monitoring dashboard for Villa Tokay on Gili Air. It provides a web interface to display villa availability data from a MySQL database, incorporating Villa Tokay's brand identity. The dashboard includes features such as auto-refresh, connection monitoring, and error handling for database connectivity. It aims to offer a refined and user-friendly experience for managing villa bookings.

## User Preferences

Preferred communication style: Simple, everyday language.
Brand identity: Villa Tokay luxury villa brand with sophisticated color palette and elegant typography.
Villa Tokay Brand Voice: "The Knowing Guide" - comfortable luxury, quietly confident, genuinely warm, thoughtfully evocative.
Time Zone: Always use Bali time (Central Indonesia Time, WITA, UTC+8) for all time references and operations. Users are located in Bali and this is the operational time zone for Villa Tokay.

## System Architecture

### Core Design Principles
- **Brand Integration**: Deep integration of Villa Tokay's brand identity through specific color palettes, typography, and brand voice in the UI/UX.
- **Real-time Monitoring**: Auto-refresh functionality for up-to-date availability information.
- **Robustness**: Comprehensive error handling, database connection pooling, and graceful shutdown mechanisms.
- **Timezone Specificity**: All time-related operations and displays are strictly in Bali time (UTC+8).

### Technical Implementation
- **Backend**: Node.js with Express.js for RESTful API endpoints.
- **Database**: MySQL, utilizing `mysql2` for promise-based interactions and connection pooling.
- **Frontend**: Vanilla JavaScript with a class-based structure, served as static files by Express. Responsive design using CSS Grid/Flexbox with a mobile-first approach.
- **API**: RESTful structure under `/api` prefix, with endpoints like `/api/activities` for filtered availability data (current date + 60 days). Includes health check capabilities and consistent JSON responses.
- **Configuration**: Environment variables for sensitive data.
- **Admin Panel**: Dedicated `/admin/villa-config` page for full-screen management of villa configurations and global settings, supporting CRUD operations for villa fields.

### Feature Specifications
- **Availability Display**: Shows villa availability, rates, and detailed villa information.
- **Perks System**: Integration of complimentary activities and perk rules, including face value and discounted price display.
- **Booking Flow**: Supports selection of booking options, calculation of total value, and confirmation process.
- **Date Flexibility**: Allows users to search for availability within a flexible date range (e.g., ±1, ±2, ±3 days).
- **UI/UX Decisions**:
    - **Color Palette**: Dark Jade Green (#0F3128) for backgrounds, Gold (#AA7831) for accents, Fossil (#4A4A47) for neutrals, Anthracite (#262626) for content.
    - **Typography**: Crimson Text (serif) for headings, Nexa for body text.
    - **Villa Cards**: Collapsible cards for detailed offer viewing, streamlined text, timeline-style booking progression.
    - **Language**: Villa-focused terminology ("villas", "availability", "Special Offer").

## External Dependencies

### Database
- **MySQL Database**: Hosted on Infomaniak (fi8jj.myd.infomaniak.com).
- **Key Tables**:
    - `RoomAvailabilityStore`: Core availability data (EntryDate, UserRoomDisplayName, AvailabilityCount, LowestRateAmount, etc.).
    - `LMActivities`: For complimentary activities.
    - `LMPerkRules`: For defining perk attribution rules.
    - `LMRoomDescription`: Villa configuration details (villa name, class, type, bedrooms, amenities, etc.).
    - `LMGeneralConfig`: Global system settings.
    - `LMadmin_users`: Admin user credentials.
    - `LMReservations`: Stores booking details.

### NPM Packages
- `express`: Web framework for Node.js.
- `mysql2`: MySQL client with promise support.
- `cors`: Cross-origin resource sharing middleware.

### Frontend Libraries
- **Font Awesome**: Icon library loaded via CDN.

### Infrastructure
- **Node.js Runtime**: Application runs on a configurable port (default 5000).
- **Static File Hosting**: Serves assets from a `public` directory.

## Recent Changes

### Performance & Architecture Improvements
- **Mobile-First CSS Architecture (Aug 18, 2025)**: Restructured all CSS files from desktop-first (max-width media queries) to mobile-first approach (min-width media queries). Converted public/styles.css, public/admin/villa-config-styles.css, and public/confirm-booking.css to use progressive enhancement with mobile base styles and breakpoints at 481px (tablet) and 769px (desktop). This improves mobile performance by reducing CSS parsing time and follows modern responsive design best practices.
- **Comprehensive Booking Validation System (Aug 18, 2025)**: Implemented robust data validation for `/api/confirm-booking` endpoint to eliminate intermittent booking failures. Added validation for required fields (firstName, lastName, email), field length limits matching database schema, email format validation, numeric validation for guest counts and prices, and safe date/JSON processing with error handling. System now provides clear error messages for validation failures and prevents database constraint violations.