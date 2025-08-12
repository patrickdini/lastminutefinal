const express = require("express");
const path = require("path");
const cors = require("cors");
const activitiesRoutes = require("./routes/activities");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/api", activitiesRoutes);

// Root route - serve the main HTML page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Error stack:", err.stack);
    res.status(500).json({
        error: "Something went wrong!",
        message:
            process.env.NODE_ENV === "development"
                ? err.message
                : "Internal server error",
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully");
    process.exit(0);
});

process.on("SIGINT", () => {
    console.log("SIGINT received, shutting down gracefully");
    process.exit(0);
});
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

// Also set headers on static files
app.use(
    express.static(path.join(__dirname, "public"), {
        setHeaders: (res) =>
            res.set(
                "Cache-Control",
                "no-store, no-cache, must-revalidate, proxy-revalidate",
            ),
    }),
);
const fs = require("fs");
const pkg = require("./package.json");

// Preload index.html and inject a version string (uses package.json version)
const rawIndex = fs.readFileSync(
    path.join(__dirname, "public", "index.html"),
    "utf8",
);
const htmlWithVersion = rawIndex.replace(
    /__ASSET_VERSION__/g,
    pkg.version || Date.now(),
);

app.get("/", (req, res) => {
    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(htmlWithVersion);
});
const pkg = require("./package.json");
app.get("/version", (req, res) => {
    res.json({
        version: pkg.version || "0.0.0",
        dir: __dirname,
        time: new Date().toISOString(),
    });
});
