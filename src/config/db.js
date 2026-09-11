require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'memory_kings_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Eventos de monitoreo del pool
pool.on('connect', (client) => {
  console.log(' [DB] Nueva conexion establecida con PostgreSQL');
});

pool.on('error', (err, client) => {
  console.error(' [DB ERROR] Error inesperado en el cliente del Pool de PostgreSQL:', err.message);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
