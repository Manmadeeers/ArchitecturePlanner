let pool = null;
let db = null;

function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (pool) {
    return pool;
  }

  const { Pool } = require("pg");

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

  return pool;
}

function getDb() {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (db) {
    return db;
  }

  const { drizzle } = require("drizzle-orm/node-postgres");

  db = drizzle(getPool());

  return db;
}

module.exports = {
  getDb,
  getPool,
  isDatabaseConfigured,
};
