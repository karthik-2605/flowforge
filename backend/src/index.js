const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const jobRoutes = require("./routes/job.routes");
const executionsRoutes = require("./routes/executions.routes");
const workersRoutes = require("./routes/workers.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const notificationsRoutes = require("./routes/notifications.routes");
const healthRoutes = require("./routes/health.routes");

const { runMigrations } = require("./db/migrate");
const { loadPersistedJobs } = require("./scheduler/scheduler");
const {
    startNotificationSubscriber,
} = require("./services/notification.service");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/executions", executionsRoutes);
app.use("/api/workers", workersRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/health", healthRoutes);

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
    });
});

const PORT = process.env.PORT || 4000;

async function startServer() {
    try {
        // Apply migrations on startup (idempotent — safe for Docker).
        if (process.env.RUN_MIGRATIONS !== "false") {
            await runMigrations();
        }

        // Re-register recurring jobs from DB
        await loadPersistedJobs();

        // Observer Pattern — start the notification subscriber.
        startNotificationSubscriber();

        // Start BullMQ worker (registers heartbeat, consumes the queue).
        require("./workers/job.worker");
        console.log("Worker started");

        app.listen(PORT, () => {
            console.log(`Server running on ${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
}

startServer();
