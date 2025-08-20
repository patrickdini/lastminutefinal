const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const session = require("express-session");
const { sendEmail } = require("./server/services/mailer");
const { processConfirmationTemplate } = require("./server/services/emailTemplate");
console.log("Loading activities routes...");
const activitiesRoutes = require("./routes/activities");
console.log("Activities routes loaded:", typeof activitiesRoutes);
const adminRoutes = require("./routes/admin");
const pkg = require("./package.json");

const app = express();
const PORT = process.env.PORT || 5000; // Infomaniak GUI listens on 5000

// Global offers cache
let allOffersCache = [];
let lastCacheUpdate = null;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware for admin panel
app.use(
    session({
        secret: process.env.SESSION_SECRET || "villa-tokay-admin-secret-2025",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production", // Use secure cookies in production
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        },
    }),
);

// Disable caching so new CSS/JS show up immediately
app.use((req, res, next) => {
    res.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");
    next();
});

// Serve /public with explicit no-cache headers
app.use(
    express.static(path.join(__dirname, "public"), {
        setHeaders: (res) =>
            res.set(
                "Cache-Control",
                "no-store, no-cache, must-revalidate, proxy-revalidate",
            ),
    }),
);

// Serve confirm-booking page
app.get("/confirm-booking", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "confirm-booking.html"));
});

// Handle booking confirmation and save to LMReservations
app.post("/api/confirm-booking", async (req, res) => {
    try {
        const bookingRequest = req.body;
        console.log("Processing booking request:", bookingRequest);

        // Comprehensive data validation
        const validationErrors = [];

        // Required field validation
        if (
            !bookingRequest.firstName ||
            bookingRequest.firstName.trim() === ""
        ) {
            validationErrors.push("First name is required");
        }
        if (!bookingRequest.lastName || bookingRequest.lastName.trim() === "") {
            validationErrors.push("Last name is required");
        }
        if (!bookingRequest.email || bookingRequest.email.trim() === "") {
            validationErrors.push("Email is required");
        }

        // Field length validation (based on database schema)
        if (bookingRequest.firstName && bookingRequest.firstName.length > 100) {
            validationErrors.push(
                "First name must be less than 100 characters",
            );
        }
        if (bookingRequest.lastName && bookingRequest.lastName.length > 100) {
            validationErrors.push("Last name must be less than 100 characters");
        }
        if (bookingRequest.email && bookingRequest.email.length > 150) {
            validationErrors.push("Email must be less than 150 characters");
        }
        if (bookingRequest.phone && bookingRequest.phone.length > 50) {
            validationErrors.push(
                "Phone number must be less than 50 characters",
            );
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (bookingRequest.email && !emailRegex.test(bookingRequest.email)) {
            validationErrors.push("Please enter a valid email address");
        }

        // Required booking data validation
        if (!bookingRequest.villaKey || bookingRequest.villaKey.trim() === "") {
            validationErrors.push("Villa information is missing");
        }
        if (!bookingRequest.checkIn) {
            validationErrors.push("Check-in date is required");
        }
        if (!bookingRequest.checkOut) {
            validationErrors.push("Check-out date is required");
        }

        // Numeric validation
        if (
            bookingRequest.adults &&
            (isNaN(bookingRequest.adults) || bookingRequest.adults < 1)
        ) {
            validationErrors.push("Number of adults must be at least 1");
        }
        if (
            bookingRequest.children &&
            (isNaN(bookingRequest.children) || bookingRequest.children < 0)
        ) {
            validationErrors.push("Number of children cannot be negative");
        }
        if (
            bookingRequest.totalPrice &&
            (isNaN(bookingRequest.totalPrice) || bookingRequest.totalPrice <= 0)
        ) {
            validationErrors.push("Invalid price information");
        }

        // Date format validation
        let checkInDate, checkOutDate;
        try {
            checkInDate = new Date(bookingRequest.checkIn);
            checkOutDate = new Date(bookingRequest.checkOut);
            if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
                validationErrors.push("Invalid date format");
            }
        } catch (error) {
            validationErrors.push("Invalid date format");
        }

        // Return validation errors if any
        if (validationErrors.length > 0) {
            console.error("Validation errors:", validationErrors);
            return res.status(400).json({
                success: false,
                message:
                    "Please check your booking information: " +
                    validationErrors.join(", "),
                errors: validationErrors,
            });
        }

        // Get database connection
        const db = require("./config/database");
        const connection = await db.getConnection();

        // Create Bali timezone timestamp for date_received
        const baliTime = new Date();
        baliTime.setHours(baliTime.getHours() + 8); // Convert to Bali time (UTC+8)
        const dateReceived = baliTime
            .toISOString()
            .slice(0, 19)
            .replace("T", " "); // Format: YYYY-MM-DD HH:MM:SS

        // Safe date formatting function
        function formatDateForDatabase(dateInput) {
            try {
                const date = new Date(dateInput);
                if (isNaN(date.getTime())) {
                    throw new Error("Invalid date");
                }
                return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD
            } catch (error) {
                console.error(
                    "Date formatting error:",
                    error,
                    "Input:",
                    dateInput,
                );
                throw new Error("Invalid date format");
            }
        }

        // Safe JSON stringify with error handling
        function safeJSONStringify(data, fieldName) {
            try {
                return JSON.stringify(data);
            } catch (error) {
                console.error(
                    `JSON stringify error for ${fieldName}:`,
                    error,
                    "Data:",
                    data,
                );
                throw new Error(`Invalid ${fieldName} data format`);
            }
        }

        // Map form data to database fields with safe processing
        const reservationData = {
            // Guest information (fields 2-6) - validated above
            first_name: bookingRequest.firstName.trim(),
            last_name: bookingRequest.lastName.trim(),
            email: bookingRequest.email.trim().toLowerCase(),
            phone_number: bookingRequest.phone
                ? bookingRequest.phone.trim()
                : null,
            address: bookingRequest.transferAddress
                ? bookingRequest.transferAddress.trim()
                : null,

            // Location and preferences (fields 7-10)
            location: bookingRequest.transferLocation || null,
            special_requests: bookingRequest.specialRequests
                ? bookingRequest.specialRequests.trim()
                : null,
            transport: bookingRequest.needTransfer || null,
            private_boat_interest: bookingRequest.interestedInPrivateBoat
                ? 1
                : 0,

            // Booking details (fields 11-12) - with safe JSON processing
            accommodations_booked: safeJSONStringify(
                [
                    {
                        villa_id: bookingRequest.villaKey,
                        check_in_date: formatDateForDatabase(
                            bookingRequest.checkIn,
                        ),
                        check_out_date: formatDateForDatabase(
                            bookingRequest.checkOut,
                        ),
                    },
                ],
                "accommodations_booked",
            ),
            villa_id: safeJSONStringify([bookingRequest.villaKey], "villa_id"),

            // Perks and pricing (fields 13-17)
            perks: bookingRequest.perks
                ? safeJSONStringify(bookingRequest.perks, "perks")
                : null,
            price_guests: parseFloat(bookingRequest.totalPrice) || 0,
            number_adults: parseInt(bookingRequest.adults) || 0,
            number_children: parseInt(bookingRequest.children) || 0,
            savings_guests: parseFloat(bookingRequest.savings) || 0,

            // Stay dates (fields 18-19) - with safe date formatting
            check_in_date: formatDateForDatabase(bookingRequest.checkIn),
            check_out_date: formatDateForDatabase(bookingRequest.checkOut),

            // Administrative (fields 20-21)
            date_received: dateReceived, // Bali time timestamp
            date_payment: null, // Initially null, updated when payment confirmed
        };

        console.log("Mapped reservation data:", reservationData);

        // Insert into LMReservations table
        const insertQuery = `
            INSERT INTO LMReservations (
                first_name, last_name, email, phone_number, address, location,
                special_requests, transport, private_boat_interest, accommodations_booked,
                villa_id, perks, price_guests, number_adults, number_children,
                savings_guests, check_in_date, check_out_date, date_received, date_payment
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            reservationData.first_name,
            reservationData.last_name,
            reservationData.email,
            reservationData.phone_number,
            reservationData.address,
            reservationData.location,
            reservationData.special_requests,
            reservationData.transport,
            reservationData.private_boat_interest,
            reservationData.accommodations_booked,
            reservationData.villa_id,
            reservationData.perks,
            reservationData.price_guests,
            reservationData.number_adults,
            reservationData.number_children,
            reservationData.savings_guests,
            reservationData.check_in_date,
            reservationData.check_out_date,
            reservationData.date_received,
            reservationData.date_payment,
        ];

        const [result] = await connection.execute(insertQuery, values);
        connection.release();

        console.log("Reservation saved with ID:", result.insertId);

        // Send confirmation email
        let emailSuccess = true;
        let emailError = null;
        
        try {
            console.log("Processing confirmation email template...");
            const emailHtml = processConfirmationTemplate(bookingRequest);
            
            console.log("Sending confirmation email to:", bookingRequest.email);
            const messageId = await sendEmail({
                to: bookingRequest.email,
                subject: "Your Villa Tokay escape is confirmed",
                html: emailHtml
            });
            
            console.log("Confirmation email sent successfully. Message ID:", messageId);
            
            // Update confirmation_email_sent flag in database
            try {
                const connection = await pool.getConnection();
                await connection.execute(
                    'UPDATE LMReservations SET confirmation_email_sent = 1 WHERE id = ?',
                    [result.insertId]
                );
                connection.release();
                console.log("Confirmation email flag updated for reservation ID:", result.insertId);
            } catch (updateError) {
                console.error("Failed to update confirmation_email_sent flag:", updateError);
                // Continue - don't affect user response
            }
            
        } catch (error) {
            console.error("Failed to send confirmation email:", error);
            emailSuccess = false;
            emailError = error.message;
        }

        // Return success response with email status
        const response = {
            success: true,
            bookingId: result.insertId,
            message: "Booking confirmed successfully!",
            reservationData: {
                id: result.insertId,
                villa: bookingRequest.villaName,
                checkIn: bookingRequest.checkIn,
                checkOut: bookingRequest.checkOut,
                guests: `${bookingRequest.adults} Adults${bookingRequest.children > 0 ? `, ${bookingRequest.children} Children` : ""}`,
                email: bookingRequest.email,
            },
        };

        // Add email status information
        if (!emailSuccess) {
            response.emailWarning = "Booking confirmed but confirmation email could not be sent. You will receive a manual confirmation within 24 hours.";
        }

        res.json(response);
    } catch (error) {
        console.error("Error processing booking:", error);
        res.status(500).json({
            success: false,
            message: "Failed to process booking. Please try again.",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Internal server error",
        });
    }
});

// Handle mailing list signup
app.post("/api/mailing-list", async (req, res) => {
    try {
        const signupRequest = req.body;
        console.log("Processing mailing list signup:", signupRequest);

        // Validation
        const validationErrors = [];

        if (!signupRequest.name || signupRequest.name.trim() === "") {
            validationErrors.push("Name is required");
        }

        if (!signupRequest.email || signupRequest.email.trim() === "") {
            validationErrors.push("Email is required");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupRequest.email)) {
            validationErrors.push("Valid email is required");
        }

        if (!signupRequest.travelType) {
            validationErrors.push("Travel type is required");
        }

        if (!signupRequest.staycationWindow) {
            validationErrors.push("Staycation window is required");
        }

        if (!signupRequest.leadTime) {
            validationErrors.push("Lead time preference is required");
        }

        if (signupRequest.name && signupRequest.name.length > 255) {
            validationErrors.push("Name must be less than 255 characters");
        }

        if (signupRequest.email && signupRequest.email.length > 255) {
            validationErrors.push("Email must be less than 255 characters");
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: validationErrors.join(". "),
                errors: validationErrors,
            });
        }

        // Determine channel opt-in based on form data (MySQL SET format)
        const channelOptIn = [];
        if (signupRequest.email) channelOptIn.push("email");
        if (signupRequest.whatsapp && signupRequest.whatsapp.trim())
            channelOptIn.push("whatsapp");

        // Get client IP and user agent
        const clientIP =
            req.ip ||
            req.connection.remoteAddress ||
            req.headers["x-forwarded-for"];
        const userAgent = req.headers["user-agent"] || "";

        // Create timestamps
        const now = new Date();
        const consentAt = signupRequest.consent ? now : null;

        // Map staycation window to database ENUM values
        const staycationWindowMap = {
            weekdays: "Weekdays",
            weekends: "Weekends",
            either: "Either",
        };

        // Convert IP address to binary format for varbinary(16) field
        function ipToBinary(ip) {
            if (!ip) return null;
            try {
                // For IPv4, convert to 4-byte binary. For IPv6, would be 16 bytes
                const parts = ip.split(".");
                if (parts.length === 4) {
                    const buffer = Buffer.alloc(4);
                    parts.forEach((part, index) => {
                        buffer[index] = parseInt(part, 10);
                    });
                    return buffer;
                }
                return null;
            } catch {
                return null;
            }
        }

        // Prepare data for database
        const mailingListData = {
            name: signupRequest.name.trim(),
            email: signupRequest.email.trim().toLowerCase(),
            whatsapp_number: signupRequest.whatsapp
                ? signupRequest.whatsapp.trim()
                : null,
            travel_type: signupRequest.travelType,
            staycation_window:
                staycationWindowMap[signupRequest.staycationWindow] || "Either",
            preferred_lead_time: signupRequest.leadTime,
            channel_opt_in: channelOptIn.join(","), // MySQL SET format: comma-separated values
            consent: signupRequest.consent || false,
            consent_at: consentAt,
            last_mail_sent: null,
            number_of_bookings: 0,
            source: "lastminute.villatokay.com",
            locale: "en", // Default to English
            ip_address: clientIP,
            user_agent: userAgent ? userAgent.substring(0, 255) : null, // Truncate to field length
            created_at: now,
            updated_at: now,
        };

        console.log("Prepared mailing list data:", mailingListData);

        // Insert into LMMailing_List table
        const values = [
            mailingListData.name,
            mailingListData.email,
            mailingListData.whatsapp_number,
            mailingListData.travel_type,
            mailingListData.staycation_window,
            mailingListData.preferred_lead_time,
            mailingListData.channel_opt_in,
            mailingListData.consent,
            mailingListData.consent_at,
            mailingListData.last_mail_sent,
            mailingListData.number_of_bookings,
            mailingListData.source,
            mailingListData.locale,
            mailingListData.ip_address,
            mailingListData.user_agent,
            mailingListData.created_at,
            mailingListData.updated_at,
        ];

        // Execute the query using MySQL (same as rest of the app)
        const db = require("./config/database");
        const connection = await db.getConnection();

        // Use INSERT ... ON DUPLICATE KEY UPDATE to handle existing emails
        const upsertQuery = `
            INSERT INTO LMMailing_List (
                name, email, whatsapp_number, travel_type, staycation_window,
                preferred_lead_time, channel_opt_in, consent, consent_at,
                last_mail_sent, number_of_bookings, source, locale,
                ip_address, user_agent, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                whatsapp_number = VALUES(whatsapp_number),
                travel_type = VALUES(travel_type),
                staycation_window = VALUES(staycation_window),
                preferred_lead_time = VALUES(preferred_lead_time),
                channel_opt_in = VALUES(channel_opt_in),
                consent = VALUES(consent),
                consent_at = VALUES(consent_at),
                ip_address = VALUES(ip_address),
                user_agent = VALUES(user_agent),
                updated_at = VALUES(updated_at)
        `;

        const [result] = await connection.execute(upsertQuery, values);
        connection.release();

        const recordId = result.insertId || result.affectedRows;
        console.log("Mailing list signup saved/updated with ID:", recordId);

        // Return success response
        const responseMessage = result.insertId
            ? "You're in! 🌞\nNext time paradise calls, you'll be the first to know. Look out for our last-minute villa escapes and insider perks—max 2 messages per month, promise."
            : "Your preferences have been updated! 🌞\nWe've saved your latest choices. Look out for our last-minute villa escapes and insider perks—max 2 messages per month, promise.";

        res.json({
            success: true,
            signupId: recordId,
            message: responseMessage,
            data: {
                id: recordId,
                name: mailingListData.name,
                email: mailingListData.email,
                channelOptIn: channelOptIn,
            },
        });
    } catch (error) {
        console.error("Error processing mailing list signup:", error);
        res.status(500).json({
            success: false,
            message: "Failed to process signup. Please try again.",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Internal server error",
        });
    }
});

// Preload index.html and inject a *fresh* version each restart (busts caches)
let htmlWithVersion;
const ASSET_VERSION = Date.now().toString();
try {
    const rawIndex = fs.readFileSync(
        path.join(__dirname, "public", "index.html"),
        "utf8",
    );
    htmlWithVersion = rawIndex.replace(/__ASSET_VERSION__/g, ASSET_VERSION);
} catch (err) {
    console.error("Failed to preload index.html:", err.message);
    htmlWithVersion = "<!doctype html><html><body><h1>App</h1></body></html>";
}

// --- Cache Management ---
async function loadAllOffersIntoCache() {
    try {
        console.log("Loading all offers into memory cache...");
        const db = require("./config/database");
        const connection = await db.getConnection();

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
                lrd.key_amenities
            FROM LMCurrentOffers co
            LEFT JOIN LMRoomDescription lrd ON co.villa_id = lrd.villa_id
            WHERE co.checkin_date >= CURDATE()
            ORDER BY co.checkin_date, co.villa_id
        `;

        const [offers] = await connection.execute(offersQuery);
        connection.release();

        // Create villa name mapping to match what the working API returns
        const villaNameMapping = {
            Sunset: "The Sunset Room",
            Tide: "The Tide Villa",
            Wave: "The Wave Villa",
            Shore: "The Shore Villa",
            "Swell 2BR": "The Swell 2BR",
            Flow: "The Flow Villa",
            Breeze: "The Breeze Villa",
        };

        // Transform offers to add villa_display_name matching the API format
        const transformedOffers = offers.map((offer) => ({
            ...offer,
            villa_display_name:
                villaNameMapping[offer.villa_id] ||
                `The ${offer.villa_id} Villa`,
        }));

        allOffersCache = transformedOffers;
        lastCacheUpdate = new Date();
        console.log(
            `Loaded ${transformedOffers.length} offers into cache at ${lastCacheUpdate}`,
        );

        return transformedOffers;
    } catch (error) {
        console.error("Error loading offers cache:", error);
        return [];
    }
}

// Expose cache endpoint
app.get("/api/cached-offers", (req, res) => {
    res.json({
        success: true,
        lastUpdated: lastCacheUpdate,
        count: allOffersCache.length,
        data: allOffersCache,
    });
});

// --- Routes ---
console.log("Registering API routes...");
app.use("/api", activitiesRoutes);
console.log("API routes registered");

// Admin routes
console.log("Registering Admin routes...");
app.use("/admin", adminRoutes);
console.log("Admin routes registered");

// Root
app.get("/", (req, res) => {
    res.type("html").send(htmlWithVersion);
});

// Version & health (keep BEFORE 404 & error handlers)
app.get("/version", (req, res) => {
    res.json({
        version: pkg.version || "0.0.0",
        assetVersion: ASSET_VERSION,
        dir: __dirname,
        time: new Date().toISOString(),
    });
});

app.get("/health", (req, res) => res.send("OK"));

// (Optional) debug: list registered routes at startup
function logRoutes() {
    const routes = [];
    (app._router?.stack || []).forEach((layer) => {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods)
                .map((m) => m.toUpperCase())
                .join(",");
            routes.push(`${methods} ${layer.route.path}`);
        } else if (layer.name === "router") {
            // Check nested router routes
            (layer.handle?.stack || []).forEach((subLayer) => {
                if (subLayer.route) {
                    const methods = Object.keys(subLayer.route.methods)
                        .map((m) => m.toUpperCase())
                        .join(",");
                    routes.push(`${methods} /api${subLayer.route.path}`);
                }
            });
        }
    });
    console.log("Registered routes:", routes);
}
logRoutes();

// 404
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// Error handler (must be last)
app.use((err, req, res, next) => {
    console.error("Error stack:", err.stack || err);
    res.status(500).json({
        error: "Something went wrong!",
        message:
            process.env.NODE_ENV === "development"
                ? err.message
                : "Internal server error",
    });
});

// Start
app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);

    // Load offers cache on startup
    await loadAllOffersIntoCache();
});

// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("SIGTERM received");
    process.exit(0);
});
process.on("SIGINT", () => {
    console.log("SIGINT received");
    process.exit(0);
});
