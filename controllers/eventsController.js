const appConfig = require('../appConfig.js'),
    database = require('../database.js'),
    moment = require('moment-timezone'),
    qrcode = require('qrcode'),
    jwt = require('jsonwebtoken'),
    verifyToken = require('../verifyToken.js'),
    nodemailer = require('nodemailer'),
    transport = nodemailer.createTransport(appConfig.mailConfig);


exports.get_event = function(req, res) {
    let event = {};
    let eventQuery = `SELECT events.id AS id, events.programId, events.rsvp, events.url, events.title AS title, DATE_FORMAT(start, '%Y-%m-%d %H:%i:%S') AS start, DATE_FORMAT(end, '%Y-%m-%d %H:%i:%S') AS end, allDay, events.description, events.image, events.link, events.linkTitle, events.eventLocationId, events.locationDescription, eventLocations.title AS locationTitle, street1, street2, city, state, zip, color, rsvp.id AS rsvpId, rsvp.title AS rsvpTitle, rsvp.description AS rsvpDescription, rsvp.attendees, rsvp.email AS rsvpEmail, rsvp.reminder AS rsvpReminder, (SELECT IFNULL(SUM(rsvpResponses.attendingNum), 0) FROM rsvpResponses WHERE rsvpResponses.rsvpId = rsvp.id AND rsvpResponses.response = 1) AS responses FROM events LEFT JOIN programs ON events.programId = programs.id LEFT JOIN eventLocations ON events.eventLocationId = eventLocations.id LEFT JOIN rsvp ON rsvp.eventId = events.id WHERE events.url = ?`;
    database.execute(eventQuery, [req.params.eventUrl], function(err, rows, fields) {
        if(err) {
            console.error(err);
            return res.sendStatus(500);
        } else {
            if(rows.length) {
                return res.json(rows[0]);
            } else {
                return res.sendStatus(404);
            }
        } 
    });
};

exports.get_events = function(req, res) {
    let eventQuery = `SELECT events.id AS id, events.url, events.title AS title, DATE_FORMAT(start, '%Y-%m-%d %H:%i:%S') AS start, DATE_FORMAT(end, '%Y-%m-%d %H:%i:%S') AS end, allDay, events.description, events.image, events.link, events.linkTitle, eventLocations.title AS locationTitle, street1, street2, city, state, zip, color, rsvp, rsvp.id AS rsvpId, rsvp.title AS rsvpTitle, rsvp.description AS rsvpDescription, rsvp.attendees, rsvp.email AS rsvpEmail, rsvp.reminder AS rsvpReminder, (SELECT IFNULL(SUM(rsvpResponses.attendingNum), 0) FROM rsvpResponses WHERE rsvpResponses.rsvpId = rsvp.id AND rsvpResponses.response = 1) AS responses FROM events LEFT JOIN programs ON events.programId = programs.id LEFT JOIN eventLocations ON events.eventLocationId = eventLocations.id LEFT JOIN rsvp ON rsvp.eventId = events.id ORDER BY start ASC`;
    database.execute(eventQuery, [], function(err, rows, fields) {
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

exports.get_month = function(req, res) {
    let eventQuery = `SELECT events.id AS id, events.url, events.title AS title, DATE_FORMAT(start, '%Y-%m-%d %H:%i:%S') AS start, DATE_FORMAT(end, '%Y-%m-%d %H:%i:%S') AS end, allDay, events.description, city, state, color, events.image, programs.id AS programId, programs.name AS programName FROM events LEFT JOIN programs ON events.programId = programs.id LEFT JOIN eventLocations ON events.eventLocationId = eventLocations.id WHERE YEAR(start) = ? AND MONTH(start) = ? ORDER BY programs.id ASC, start ASC`;
    let values = [req.params.year, req.params.month];
    database.execute(eventQuery, values, function(err, rows, fields) {
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

exports.get_search = function(req, res) {
    let searchQuery = `SELECT events.id AS id, events.url, events.title AS title, DATE_FORMAT(start, '%Y-%m-%d %H:%i:%S') AS start, DATE_FORMAT(end, '%Y-%m-%d %H:%i:%S') AS end, allDay, events.description, city, state, color, events.image, programs.id AS programId, programs.name AS programName FROM events LEFT JOIN programs ON events.programId = programs.id LEFT JOIN eventLocations ON events.eventLocationId = eventLocations.id WHERE start >= CURDATE() AND (events.description LIKE ? OR events.title LIKE ?) ORDER BY programs.id ASC, start ASC`;
    let values = [
        `%${req.params.searchTerm}%`,
        `%${req.params.searchTerm}%`
    ]
    database.execute(searchQuery, values, function(err, rows, fields) {
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

exports.get_rsvp = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        if (decodedToken.role === 'admin') {
            let rsvpQuery = `SELECT rsvpResponses.id, rsvpId, response, rsvpResponses.email, notes, name, attendingNum FROM rsvpResponses JOIN rsvp ON rsvp.id = rsvpResponses.rsvpId JOIN events ON events.id = rsvp.eventId WHERE events.id = ?; `;
            database.execute(rsvpQuery, [req.params.eventId], function(err, rows, fields) {
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

exports.save_rsvp = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        if (decodedToken.role === 'admin') {
            let eventQuery = 'UPDATE events SET rsvp = 1 WHERE ID = ?';
            let rsvpQuery = 'SET eventId = ?, title = ?, description = ?, attendees = ?, email = ?, reminder = ?';
            let rsvpValues = [
                req.body.id,
                req.body.rsvpTitle,
                req.body.rsvpDescription,
                req.body.attendees,
                req.body.rsvpEmail,
                req.body.rsvpReminder
            ];
            if (req.body.newRsvp) {
                rsvpQuery = `INSERT INTO rsvp ${rsvpQuery}`;
            } else {
                rsvpQuery = `UPDATE rsvp ${rsvpQuery} WHERE id = ?`;
                rsvpValues.push(req.body.rsvpId);
            }
            database.execute(eventQuery, [req.body.id], function(err, rows, fields) {
                if(err) {
                    console.error(err);
                    return res.sendStatus(500);
                } else {
                    database.execute(rsvpQuery, rsvpValues, function(rsvpErr, rsvpRows, rsvpFields) {
                        if(rsvpErr) {
                            console.error(rsvpErr);
                            return res.sendStatus(500);
                        } else {
                            qrcode.toFile(`${appConfig.imageUploadDirectory}/qr-${req.body.url}.png`, `https://kotm.org/event/${req.body.url}/rsvp`, {
                            color: {
                                dark: '#00F',
                                lightL: '#0000'
                            }
                            }, function(err) {
                                if (err) throw err;
                            });
                            return res.sendStatus(200);
                        }
                    });
                } 
            });
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};

exports.remove_rsvp = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        if (decodedToken.role === 'admin') {
            let eventQuery = 'UPDATE events SET rsvp = 0 WHERE ID = ?';
            let rsvpQuery = `DELETE FROM rsvp WHERE eventId = ?`;
            database.execute(eventQuery, [req.params.eventId], function(err, rows, fields) {
                if(err) {
                    console.error(err);
                    return res.sendStatus(500);
                } else {
                    database.execute(rsvpQuery, [req.params.eventId], function(rsvpErr, rsvpRows, rsvpFields) {
                        if(rsvpErr) {
                            console.error(rsvpErr);
                            return res.sendStatus(500);
                        } else {
                            return res.sendStatus(200);
                        }
                    });
                } 
            });
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};

exports.create_rsvp_response = function(req, res) {
    let responseQuery = 'INSERT INTO rsvpResponses SET name = ?, email = ?, notes = ?, response = ?, attendingNum = ?, rsvpId = ?';
    let responseValues = [
        req.body.rsvpData.name,
        req.body.rsvpData.email,
        req.body.rsvpData.notes,
        req.body.attending,
        req.body.rsvpData.attendingNum,
        req.body.rsvpId
    ];
    database.execute(responseQuery, responseValues, function(responseErr, responseRows, responseFields) {
        if(responseErr) {
            console.error(responseErr);
            return res.sendStatus(500);
        } else {
            if(req.body.rsvpEmail) {
                let subject = `RSVP for ${req.body.eventTitle} scheduled for ${moment(req.body.eventDate).format('LLLL')}`;
                let message = `${subject}\n\r\n\rName: ${req.body.rsvpData.name}\n\rEmail: ${req.body.rsvpData.email}\n\rAttending: ${req.body.attending ? 'Yes' : 'No'}\n\rAttendees: ${req.body.rsvpData.attendingNum}\n\rNotes: ${req.body.rsvpData.notes}`;
                let mailOptions = {
                    from: appConfig.mailConfig.auth.user,
                    to: req.body.rsvpEmail,
                    subject: subject,
                    text: message
                };
                transport.sendMail(mailOptions, function(e){if(e) {console.error(e);}});
            }
            return res.sendStatus(200);
        }
    });
};