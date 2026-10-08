import dotenv from "dotenv";
dotenv.config();

if (!process.env.MONGO_URI) throw new Error("Missing environment variable: MONGO_URI");

export const env = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGO_URI,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
};
