const database = require('../database.js'),
    appConfig = require('../appConfig.js'),
    passwordHash = require('password-hash'),
    nodemailer = require('nodemailer'),
    transport = nodemailer.createTransport(appConfig.mailConfig);

exports.reset_password = function(req, res) {
    let userQuery = 'SELECT id, firstname, lastname FROM users WHERE email=?';

    database.execute(userQuery, [req.params.userEmail], function (err, user) {
        if (err || !user || !user.length) {
            return res.sendStatus(200);
        } else {
            let newPassword=Math.random().toString(36).substr(2, 8);
            let newPasswordHash = '';
            bcrypt.hash(newPassword, 10)
            .then((hash) => {
                newPasswordHash = hash;
                let changeQuery=`UPDATE users SET passwordMustChange=1, password='${newPasswordHash}' WHERE id=${user[0].id}`;
                database.query(changeQuery, function (err) {
                    if (err) {
                        return res.sendStatus(500);
                    } else {
                        let mailOptions = {
                            from: appConfig.mailConfig.auth.user,
                            to: req.params.userEmail,
                            subject: 'Kids on the Move Admin Password Reset',
                            text: `Hello ${user[0].firstname} ${user[0].lastname},\n\rYour password has been reset to '${newPassword}'.  Please visit ${appConfig.appUrl}/admin to log in.`
                        };
                        transport.sendMail(mailOptions, function(e){if(e) {console.error(e);}});
                        return res.json({'status': 'password changed successfully'});
                    }
                });

            });
        }
    });
};
