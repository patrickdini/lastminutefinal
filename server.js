const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const activitiesRoutes = require("./routes/activities");
const pkg = require("./package.json");

const app = express();
const PORT = process.env.PORT || 5000; // listen on 5000 (matches your GUI)

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Preload index.html and inject a version string from package.json
let htmlWithVersion;
try {
    const rawIndex = fs.readFileSync(
        path.join(__dirname, "public", "index.html"),
        "utf8",
    );
    htmlWithVersion = rawIndex.replace(
        /__ASSET_VERSION__/g,
        pkg.version || Date.now(),
    );
} catch (err) {
    console.error("Failed to preload index.html:", err.message);
    htmlWithVersion = "<!doctype html><html><body><h1>App</h1></body></html>";
}

// --- Routes ---
app.use("/api", activitiesRoutes);

// Root
app.get("/", (req, res) => {
    res.type("html").send(htmlWithVersion);
});

// Version & health (keep BEFORE 404 & error handlers)
app.get("/version", (req, res) => {
    res.json({
        version: pkg.version || "0.0.0",
        dir: __dirname,
        time: new Date().toISOString(),
    });
});

app.get("/health", (req, res) => res.send("OK"));

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
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
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
