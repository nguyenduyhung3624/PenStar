const allowedOrigins = ["http://localhost:5173", process.env.CORS_ORIGIN];

export const corsOptions = {
  origin: true, // Allow all origins temporarily for debugging
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

// Original origin checker (restore after debugging):
// origin: (origin, callback) => {
//   if (!origin) return callback(null, true);
//   if (allowedOrigins.indexOf(origin) !== -1) {
//     callback(null, true);
//   } else {
//     console.log("CORS blocked origin:", origin);
//     callback(new Error("Not allowed by CORS"));
//   }
// },
