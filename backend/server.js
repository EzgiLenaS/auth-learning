import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { connectDB } from "./db/connectDB.js";
import authRoutes from "./routes/auth.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allows us to parse incoming requests with JSON under the req.body
app.use(express.json());
// Allows us to parse incoming cookies
app.use(cookieParser());
// Authentication route:
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
    connectDB();
    console.log("Server is running on port", PORT);
});