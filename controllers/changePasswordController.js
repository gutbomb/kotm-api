const database = require('../database.js'),
    bcrypt = require('bcrypt'),
    jwt = require('jsonwebtoken');



exports.change_password = function(req, res) {
    let decodedToken=jwt.decode(req.token);
    let userQuery = `SELECT password FROM users WHERE id=${decodedToken.id}`;
    let newPasswordHash = '';
    bcrypt.hash(req.body.newPassword, 10)
    .then((hash) => {
        newPasswordHash = hash;
        database.query(userQuery, function (err, user) {
            if (err || !user || !user.length) {
                return res.sendStatus(404);
            } else {
                bcrypt.compare(req.body.password, user[0].password)
                .then(() => {
                    let changeQuery=`UPDATE users SET passwordMustChange=0, password='${newPasswordHash}' WHERE id=${decodedToken.id}`;
                    database.query(changeQuery, function (err) {
                        if (err) {
                            return res.sendStatus(500);
                        } else {
                            return res.json({'status': 'password changed successfully'})
                        }
                    });
                }, () => {
                    return res.sendStatus(401);
                });
            }
        });
    })
};
