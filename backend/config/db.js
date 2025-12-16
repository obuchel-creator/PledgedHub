const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const isTest = process.env.NODE_ENV === 'test';
const dbName = isTest ? process.env.TEST_DB_NAME : process.env.DB_NAME;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
});

module.exports = { pool };