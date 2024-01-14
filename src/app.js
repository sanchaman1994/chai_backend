// Importing necessary middleware and libraries
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

// Initialize express application
const app = express();

// Apply CORS middleware with specific origin and credentials
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// Apply express.json middleware with a limit of 16KB
app.use(
  express.json({
    limit: "16kb",
  })
);

// Make the "public" directory statically accessible
app.use(express.static("public"));

// Apply express.urlencoded middleware with extended set to true and a limit of 16KB
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

import UserRouter from "./routes/user.routes.js";

app.use("/api/v1/users", UserRouter);


// Export the app to be used in other modules
export { app };
