import dotenv from 'dotenv';
import { startIngestionServer, loadDatabaseConfig } from './src/server/api/keystrokeIngestion.js';

// Load .env file
const result = dotenv.config();
if (result.error) {
  console.warn('Warning: .env file not found or error loading it:', result.error.message);
}

const port = parseInt(process.env.API_PORT || '3000');
const dbConfig = loadDatabaseConfig();

console.log('Starting Behavioral Learning Analytics Server...');
console.log(`Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
console.log(`Using password: ${dbConfig.password ? '***' : '[not set]'}`);

startIngestionServer(port, dbConfig);
