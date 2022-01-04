const https = require('https'),
    appConfig = require('./appConfig'),
    mysql = require('mysql2'),
    moment = require('moment-timezone'),
    nodemailer = require('nodemailer'),
    transport = nodemailer.createTransport(appConfig.mailConfig);

let reminderDate = moment().add(2, 'days').format('YYYY-MM-DD HH:mm:ss');
let database = mysql.createConnection(appConfig.dbConnect);
let eventQuery = 'SELECT rsvpResponses.id, rsvpResponses.email, rsvpResponses.name, rsvp.reminder, events.title, events.start FROM rsvpResponses JOIN rsvp ON rsvpId = rsvp.id JOIN events ON eventId = events.id WHERE events.start BETWEEN CURRENT_TIMESTAMP AND ? AND reminderSent = 0';
database.execute(eventQuery, [reminderDate], function(err, rows, fields) {
    if(err) {
        console.error(`${moment().format('YYYY-MM-DD HH:mm:ss')}: ${err}`);
    } else {
        if(rows.length) {
            rows.forEach((reminder) => {
                let sentQuery = 'UPDATE rsvpResponses SET reminderSent = 1 WHERE id = ?';
                let database2 = mysql.createConnection(appConfig.dbConnect);
                database2.execute(sentQuery, [reminder.id], function(sentErr, sentRows, sentFields) {
                    if(err) {
                        console.error(`${moment().format('YYYY-MM-DD HH:mm:ss')}: ${sentErr}`);
                    } else {
                        let subject = `Event Reminder for ${reminder.title} scheduled for ${moment(reminder.start).format('LLLL')}`;
                        let message = `${reminder.name},\n\r${reminder.reminder}\n\r`;
                        let mailOptions = {
                            from: appConfig.mailConfig.auth.user,
                            to: reminder.email,
                            subject: subject,
                            text: message
                        };
                        transport.sendMail(mailOptions, function(e){if(e) {console.error(`${moment().format('YYYY-MM-DD HH:mm:ss')}: ${e}`);}});
                        console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')}: Reminder sent to ${reminder.email}`);
                    }
                });
                database2.end();
            });
        }
    }
});
database.end();