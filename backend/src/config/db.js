const DB_CONFIG = {
    user: '',
    host: '',
    database: '',
    password: '',
    port: 5432
}

const { Pool } = require('pg');
const pool = new Pool(DB_CONFIG)

module.exports = pool;