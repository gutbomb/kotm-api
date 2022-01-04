const database = require('../database.js'),
    appConfig = require('../appConfig.js'),
    bcrypt = require('bcrypt'),
    jwt = require('jsonwebtoken'),
    verifyToken = require('../verifyToken.js'),
    nodemailer = require('nodemailer'),
    transport = nodemailer.createTransport(appConfig.mailConfig);

exports.get_user = function(req, res) {
    let usersQuery = `SELECT id, email, firstname, lastname, passwordMustChange, role, lastLoginDate, createDate, validated FROM users WHERE id=?`;

    database.execute(usersQuery, [req.params.userId], function(err, rows, fields) {
        if(err) {
            console.error(err);
            return res.sendStatus(500);
        } else {
            if(rows.length) {
                return res.json(rows);
            } else {
                return res.sendStatus(404);
            }
        } 
    });
};

exports.get_users = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        if (decodedToken.role === 'admin') {
            let usersQuery = `SELECT id, email, firstname, lastname, passwordMustChange, role, lastLoginDate, createDate, validated FROM users ORDER BY lastname ASC, firstname ASC`;

            database.query(usersQuery, function(err, rows, fields) {
                if(err) {
                    console.error(err);
                    return res.sendStatus(500);
                } else {
                    if(rows.length) {
                        return res.json(rows);
                    } else {
                        return res.sendStatus(404);
                    }
                } 
            });
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};

exports.sign_up = function(req, res) {
    let userQuery = `SELECT email FROM users WHERE email = ?`;
    database.execute(userQuery, [req.body.email], function (err, user) {
        if (err) {
            return res.status(500).json({'status': 'Database error'});
        } else {
            if (!user || !user.length) {
                let validationString=Math.random().toString(36).substr(2, 16);
                let addUserQuery = `INSERT INTO users (username, email, firstname, lastname, passwordMustChange, admin, validated, password, address1, address2, city, state, zip, phone1, phone2, birthdate, howHeardAbout, school, student, emergencyName, emergencyRelationship, emergencyPhone, validationString) VALUES (?, ?, ?, ?, 0, 0, 0, '${passwordHash.generate(req.body.password)}', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '${validationString}')`;
                let values = [
                    req.body.username,
                    req.body.email,
                    req.body.firstname,
                    req.body.lastname,
                    req.body.address1,
                    req.body.address2,
                    req.body.city,
                    req.body.state,
                    req.body.zip,
                    req.body.phone1,
                    req.body.phone2,
                    req.body.birthdate,
                    req.body.howHeardAbout,
                    req.body.school,
                    req.body.student,
                    req.body.emergencyName,
                    req.body.emergencyRelationship,
                    req.body.emergencyPhone
                ];
                database.execute(addUserQuery, values, function (err) {
                    if (err) {
                        return res.status(500).json({'status': 'Database error', 'errors': err, 'sql': addUserQuery});
                    } else {
                        let mailOptions = {
                            from: appConfig.mailConfig.auth.user,
                            to: req.body.email,
                            subject: 'Kids on the Move - New Account',
                            text: `Hello '${req.body.firstname} ${req.body.lastname},\n\rAn account has been created for you on the Kids on the Move system.  Please visit ${appConfig.appUrl}/validate/${validationString} to activate your account.`
                        };
                        transporter.sendMail(mailOptions, function(){});
                        return res.json({'status': 'User added successfully'});
                    }
                });
            } else {
                return res.status(409).json({'status': 'User already exists'});
            }
        }
    });
};

exports.add_user = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        if (decodedToken.role === 'admin') {
            let userQuery = `SELECT email FROM users WHERE email = ?`;
            database.execute(userQuery, [req.body.email], function (err, user) {
                if (err) {
                    return res.status(500).json({'status': 'Database error', 'errors': err});
                } else {
                    if (!user || !user.length) {
                        let newPassword=Math.random().toString(36).substr(2, 8);
                        bcrypt.hash(newPassword, 10)
                        .then((hash) => {
                            let newPasswordHash = hash;
                            let addUserQuery = `INSERT INTO users SET email=?, firstname=?, lastname=?, passwordMustChange=1, role=?, validated=1, password='${newPasswordHash}'`;
                            let values = [
                                req.body.email,
                                req.body.firstname,
                                req.body.lastname,
                                req.body.role
                            ];
                            database.execute(addUserQuery, values, function (err) {
                                if (err) {
                                    return res.status(500).json({'status': 'Database error'});
                                } else {
                                    let mailOptions = {
                                        from: appConfig.mailConfig.auth.user,
                                        to: req.body.email,
                                        subject: 'Kids on the Move - New Account',
                                        text: `Hello ${req.body.firstname} ${req.body.lastname},\n\rAn account has been created for you on Kids on the Move.  Your username is '${req.body.email}' and your password is '${newPassword}'.  Please visit ${appConfig.appUrl}/admin to log in.`
                                    };
                                    transport.sendMail(mailOptions, function(e){if(e) {console.error(e);}});
                                    return res.json({'status': 'User added successfully'});
                                }
                            });
                        });
                    } else {
                        return res.status(409).json({'status': 'User already exists'});
                    }
                }
            });
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};

exports.update_user = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        if (decodedToken.id === req.params.userId || decodedToken.role === 'admin') {
            let updateUserQuery = `UPDATE users SET firstname=?, lastname=?, email=?, role=? WHERE id=?`;
            let values = [
                req.body.firstname,
                req.body.lastname,
                req.body.email,
                req.body.role,
                req.params.userId
            ];
            if(req.body.role === 'admin' && decodedToken.role === 'admin') {
                updateUserQuery = `UPDATE users SET firstname=?, lastname=?, email=?, role=? WHERE id=?`;
                values = [
                    req.body.firstname,
                    req.body.lastname,
                    req.body.email,
                    req.body.role,
                    req.params.userId
                ];
            }

            database.execute(updateUserQuery, values, function (err) {
                if (err) {
                    return res.status(500).json({'status': 'Database error', 'errors': err});
                } else {
                    return res.json({'status': 'User updated successfully'});
                }
            });
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};

exports.delete_user = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        if (decodedToken.role === 'admin') {
            let deleteUserQuery=`DELETE FROM users WHERE id=?`;
            database.execute(deleteUserQuery, [req.params.userId], function (err) {
                if (err) {
                    return res.status(500).json({'status': 'Database error', 'errors': err});
                } else {
                    return res.json({'status': 'User deleted successfully'});
                }
            });
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};

// exports.validate_user = function (req, res) {
//     let userQuery = `SELECT validated FROM users WHERE validationString=?`;
//     database.execute(userQuery, [req.params.userValidationString], function (err, user) {
//         if (err) {
//             return res.status(500).json({'status': 'Database error', 'errors': err});
//         } else {
//             if (!user || !user.length) {
//                 return res.status(404).json({'status': 'User not found'});
//             } else {
//                 if (user[0].user_email_validated === 0) {
//                     let validateUserQuery = `UPDATE users SET validated = 1 WHERE validationString=?`;
//                     database.execute(validateUserQuery, [req.params.userValidationString], function (err) {
//                         if (err) {
//                             return res.status(500).json({'status': 'Database error'});
//                         } else {
//                             return res.json({'status': 'User validated successfully'});
//                         }
//                     });
//                 } else {
//                     return res.json({'status': 'User already validated'});
//                 }
//             }
//         }
//     });
// };

// exports.resend_validation = function (req, res) {
//     let userQuery = `SELECT validated, firstname, lastname, validationString FROM users WHERE username=?`;
//     database.execute(userQuery, [req.params.username], function (err, user) {
//         if (err) {
//             return res.status(500).json({'status': 'Database error', 'errors': err});
//         } else {
//             if (!user || !user.length) {
//                 return res.status(404).json({'status': 'User not found'});
//             } else {
//                 let mailOptions = {
//                     from: appConfig.mailConfig.auth.user,
//                     to: req.params.userEmail,
//                     subject: 'Skeleton - New Account',
//                     text: `Hello ${user[0].firstname} ${user[0].lastname},\n\rAn account has been created for you on the Kids on the Move system.  Please visit ${appConfig.appUrl}/validate/${user[0].user_validation_string} to activate your account.`
//                 };
//                 transporter.sendMail(mailOptions, function(){});
//                 return res.json({'status': 'Validation re-sent successfully'});
//             }
//         }
//     });
// };
