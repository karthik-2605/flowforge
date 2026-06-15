const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require('dotenv').config();
const app= express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const authRoutes = require('./routes/auth.routes');
const jobRoutes = require("./routes/job.routes");

app.use('/api/auth',authRoutes);
app.use("/api/jobs", jobRoutes);

app.get("/health",(req,res)=>{
    res.json({
        status:"ok",
        timestamp:new Date().toISOString(),
    });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT,()=>{
    console.log(`Server running on ${PORT}`);
})

require('./workers/job.worker');

console.log('Worker started');