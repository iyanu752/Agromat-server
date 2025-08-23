import * as dotenv from 'dotenv';
dotenv.config();

export const {
  PORT = 3000,
  DATABASE_URI,
  JWT_SECRET,
  API_KEY,
  API_SECRET,
  CLOUD_NAME,
} = process.env;
