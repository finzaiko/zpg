const DB_CONFIG = {
    user: 'postgres',
    host: 'localhost',
    database: 'testdb',
    password: 'postgres',
    port: 5432
}

const { Pool } = require('pg');
const pool = new Pool(DB_CONFIG)

module.exports = pool;