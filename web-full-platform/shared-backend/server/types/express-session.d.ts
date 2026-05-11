import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: any; // User data from Tokshop API
    accessToken?: string; // JWT token from Tokshop API
  }
}