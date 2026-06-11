const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");


const app= express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

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