import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
  waitForConnections: true,
  connectionLimit: 4, // REDUCE to 4 (less than the max of 5)
  queueLimit: 10, // Keep a small queue for waiting connections
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000, // 10 seconds
  timezone: "+00:00",
});

// Add pool event listeners for debugging
pool.on('acquire', (connection) => {
  console.log('Connection %d acquired', connection.threadId);
});

pool.on('release', (connection) => {
  console.log('Connection %d released', connection.threadId);
});

pool.on('enqueue', () => {
  console.log('Waiting for available connection slot');
});

export default pool;