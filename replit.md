# Activities Dashboard

## Overview

This is a real-time activities monitoring dashboard built with Node.js and Express. The application provides a web interface to view and monitor activities from a MySQL database table called "ActivitiesLastMinutes". It features a responsive dashboard with auto-refresh capabilities, health monitoring, and error handling for database connectivity issues.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- **Table Structure**: ActivitiesLastMinutes table with auto-incrementing ID field
- **Connection Pool**: Configured with 10 connection limit and 60-second timeouts

### NPM Packages
- **express**: Web framework for Node.js (v5.1.0)
- **mysql2**: MySQL client with promise support (v3.14.3)
- **cors**: Cross-origin resource sharing middleware (v2.8.5)

### Frontend Libraries
- **Font Awesome**: Icon library (v6.0.0) loaded via CDN for dashboard UI icons

### Infrastructure
- **Node.js Runtime**: Server runs on configurable port (default 8000)
- **Static File Hosting**: Public directory serves frontend assets
- **Production Ready**: Environment-based error messaging and logging