const appConfig = require('../appConfig'),
nodemailer = require('nodemailer'),
transport = nodemailer.createTransport(appConfig.mailConfig);

exports.contact = function(req, res) {
    let mailOptions = {
        from: appConfig.mailConfig.auth.user,
        to: appConfig.contactUsEmail,
        subject: 'Kids on the Move Contact Us Message',
        text: `FROM: ${req.body.name}\n\rPHONE:${req.body.phone}\n\rEMAIL:${req.body.email}\n\r\n\rMESSAGE:\n\r${req.body.message}`
    };
    transport.sendMail(mailOptions, function (e) {
        if (e) {
            console.error(e);
            return res.sendStatus(500);
        } else {
            if (req.body.subscribe) {
                let mailOptions = {
                    from: appConfig.mailConfig.auth.user,
                    to: appConfig.newsLetterEmail,
                    subject: 'Kids on the Move Newsletter Sign-up Request',
                    text: `FROM: ${req.body.name}\n\rEMAIL:${req.body.email}\n\r`
                };
                transport.sendMail(mailOptions, function (e) {
                    if (e) {
                        console.error(e);
                    }
                });
            }
            return res.json({});
        }
    });
};