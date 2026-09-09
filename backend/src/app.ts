// src/app.ts
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { env } from "./config/env"; // triggers env validation
import { errorHandler } from "./middleware/errorHandler";
import authRouter from "./routes/auth.routes";
import documentsRouter from "./routes/documents.routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Mount routers
app.use("/auth", authRouter);
app.use("/documents", documentsRouter);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
