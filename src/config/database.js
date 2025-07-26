 const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: process.env.HOST || 'localhost',
    user:process.env.user || 'root',
    password: process.env.PASSWORD || 'Test@123',
    database: process.env.DATABASE || 'test'
})
module.exports =  db;