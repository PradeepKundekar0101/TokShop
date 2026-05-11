// Admin App Server Entry Point
// This runs the shared backend on port 5000 for the admin frontend

import dotenv from 'dotenv';

dotenv.config();

await import('../shared-backend/server/index.js');
