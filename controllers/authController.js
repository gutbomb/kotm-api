const database = require('../database.js')
    appConfig = require('../appConfig.js'),
    bcrypt = require('bcrypt'),
    jwt = require('jsonwebtoken');

exports.login = function(req, res) {
    let loginQuery = `SELECT id, password, role FROM users WHERE email=?`;
    database.execute(loginQuery, [req.body.username], function (err, auth) {
        if (err || !auth || !auth.length) {
            return res.status(401).json({'status': 'Email or password not found.'});
        } else {
            bcrypt.compare(req.body.password, auth[0].password.replace('$2y$', '$2b$'), function (err, result) {
                if (result){
                    let loginDateQuery = `UPDATE users SET lastLoginDate=NOW() WHERE id=${auth[0].id}`;
                    database.query(loginDateQuery, function (err) {
                        if (err) {
                            return res.status(500).json({'status': 'Database error'});
                        } else {
                            let token = jwt.sign({id: auth[0].id, role: auth[0].role}, appConfig.jwtKey);
                            return res.json({'token' : token});
                        }
                    });
                } else {
                    console.error(err);
                    return res.status(401).json({'status': 'Email or password not found.'});
                }
            });
        }
    });
};
