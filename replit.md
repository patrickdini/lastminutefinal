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
    - `LMMailing_List`: Email marketing signup data with user preferences, segmentation fields, and consent tracking.

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

### Hero Carousel Implementation (Aug 18, 2025)
- **Villa Tokay Hero Carousel (Aug 18, 2025)**: Implemented stunning image carousel at the top of homepage replacing the previous header section. Features mobile-first responsive design with portrait aspect ratio on mobile (4:5) and landscape on desktop (16:9). Includes Villa Tokay brand messaging with two beautiful slides showcasing spontaneous getaways and effortless planning. Uses existing brand colors (dark jade green overlay, gold accents) and typography (Crimson Text for headlines, Nexa for body text). Carousel includes navigation arrows, dot indicators, and manual control only (auto-rotation removed per user preference). Images optimized for different screen sizes with responsive picture elements.

### Performance & Architecture Improvements
- **Mobile-First CSS Architecture (Aug 18, 2025)**: Restructured all CSS files from desktop-first (max-width media queries) to mobile-first approach (min-width media queries). Converted public/styles.css, public/admin/villa-config-styles.css, and public/confirm-booking.css to use progressive enhancement with mobile base styles and breakpoints at 481px (tablet) and 769px (desktop). This improves mobile performance by reducing CSS parsing time and follows modern responsive design best practices.
- **Enhanced Layout Robustness with Flexbox & Grid (Aug 18, 2025)**: Improved layout structures throughout the application using modern CSS layout methods. Enhanced header layout in confirm-booking.css to prevent overlapping issues on mobile, upgraded villa image gallery and modal components with better Flexbox structure, implemented Grid areas for booking content layout, and strengthened admin panel layouts. These changes provide more predictable responsive behavior and eliminate layout issues across different screen sizes.
- **Comprehensive Booking Validation System (Aug 18, 2025)**: Implemented robust data validation for `/api/confirm-booking` endpoint to eliminate intermittent booking failures. Added validation for required fields (firstName, lastName, email), field length limits matching database schema, email format validation, numeric validation for guest counts and prices, and safe date/JSON processing with error handling. System now provides clear error messages for validation failures and prevents database constraint violations.

### Logo Integration & Branding (Aug 19, 2025)
- **Dual Logo Header System**: Implemented professional header with Villa Tokay logo (left, clickable to villatokay.com) and Small Luxury Hotels certification logo (right, display only). Both logos set to 80px height with flexbox layout ensuring proper spacing and alignment. Header uses 20px padding and extends full width above the hero carousel for optimal brand visibility and credibility.

### Email Marketing Integration (Aug 19, 2025)
- **"Join the Escape List!" Email Signup System**: Fully functional email marketing signup form with complete database integration. Features Villa Tokay brand styling with white gradient background matching calendar/guest selection sections. Includes segmentation fields for targeted marketing: Travel Type (Couple/Solo, Family), Staycation Window (Weekdays, Weekends, Either), and Lead Time preferences (Within 3 days, 4-7 days, 8+ days). Form includes Name, Email (required), optional WhatsApp number with helper text, and GDPR-compliant consent checkbox. Smart defaults pre-selected: Travel Type="Couple/Solo", Staycation Window="Either", Lead Time="4–7 days", consent checkbox checked by default. Mobile-responsive design with form field stacking and optimized spacing for all screen sizes.
- **Database Integration & Form Behavior**: Successfully integrated with LMMailing_List MySQL table using UPSERT functionality to handle duplicate email submissions. Form properly hides after successful submission and displays success message with "Update preferences" button. IP addresses stored in string format (e.g., "172.31.111.34"), source field consistently set to "lastminute.villatokay.com". Channel opt-in logic: "email" for email-only, "email,whatsapp" when WhatsApp number provided. Includes comprehensive error handling and validation for all form fields.

### Automated Booking Confirmation Emails (Aug 20, 2025)
- **Dynamic Email Template System**: Created professional confirmation email template with Villa Tokay branding, mobile responsiveness, and dynamic data placeholders. Template includes Villa Tokay header, booking details grid, pricing information, included perks section, and conditional transfer content. Uses placeholder replacement system ({{guestName}}, {{villaName}}, etc.) for personalization. Template stored in `public/templates/confirmation_email.html` with utility functions in `server/services/emailTemplate.js`.
- **Email Integration & Delivery**: Fully integrated email sending into `/api/confirm-booking` endpoint with automatic delivery after successful database save. Includes comprehensive error handling with user notifications for email delivery failures. Subject line: "Your Villa Tokay escape is confirmed". Date formatting displays standard Villa Tokay times (check-in: 2:00 PM, check-out: 11:00 AM) without timezone complications. Price display in millions of rupiah format (e.g., "18.6M IDR"). Conditional transfer content based on user preferences (needTransfer, interestedInPrivateBoat).
- **Database Integration & Villa Features**: Successfully integrated with LMRoomDescription table to fetch authentic villa amenities via `key_amenities` field. Includes JSON parsing to convert database format `["amenity1", "amenity2"]` into readable text format `amenity1 • amenity2`. Email amenities now match exactly what's displayed on booking confirmation pages. Automatic database flag updates (`confirmation_email_sent = 1`) track successful email delivery.
- **Transfer Logic & Content Adaptation**: Implemented conditional email content that adapts to user transfer selections. For "No transport" choice: shows "Getting to Villa Tokay" section and excludes transfer contact from "What Happens Next". For "Yes transport": shows "Your Door-to-Door Transfer" section and includes 24-hour contact promise. Private boat interest adds additional text when applicable. System ensures email content matches user selections precisely.