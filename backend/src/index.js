const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const jobRoutes = require("./routes/job.routes");
const executionsRoutes = require("./routes/executions.routes");

const { loadPersistedJobs } = require("./scheduler/scheduler");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/executions", executionsRoutes);

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
    });
});

const PORT = process.env.PORT || 4000;

async function startServer() {
    try {
        // Re-register recurring jobs from DB
        await loadPersistedJobs();

        app.listen(PORT, () => {
            console.log(`Server running on ${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
}

startServer();

// Start BullMQ worker
require("./workers/job.worker");

console.log("Worker started");