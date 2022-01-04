const appConfig = require('./appConfig.js'),
    mysql = require('mysql2');
    pool = mysql.createPool(appConfig.dbConnect);

module.exports = pool;