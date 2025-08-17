const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const session = require("express-session");
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
app.use(session({
    secret: process.env.SESSION_SECRET || 'villa-tokay-admin-secret-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

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
        console.log('Loading all offers into memory cache...');
        const db = require('./config/database');
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
        
        // Transform offers to add villa_display_name similar to the API
        const transformedOffers = offers.map(offer => ({
            ...offer,
            villa_display_name: `The ${offer.villa_id} Villa`
        }));
        
        allOffersCache = transformedOffers;
        lastCacheUpdate = new Date();
        console.log(`Loaded ${transformedOffers.length} offers into cache at ${lastCacheUpdate}`);
        
        return transformedOffers;
    } catch (error) {
        console.error('Error loading offers cache:', error);
        return [];
    }
}

// Expose cache endpoint
app.get('/api/cached-offers', (req, res) => {
    res.json({
        success: true,
        lastUpdated: lastCacheUpdate,
        count: allOffersCache.length,
        data: allOffersCache
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
        } else if (layer.name === 'router') {
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
