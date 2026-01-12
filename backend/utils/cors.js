const allowedOrigins = ["http://localhost:5173", process.env.CORS_ORIGIN];
export const corsOptions = {
  origin: true, 
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
};
