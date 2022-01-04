const database = require('../database.js'),
    appConfig = require('../appConfig'),
    jwt = require('jsonwebtoken'),
    verifyToken = require('../verifyToken.js');

exports.get_locations = function(req, res) {
    let imagesQuery = `SELECT * FROM eventLocations`;
    database.query(imagesQuery, function(err, rows, fields) {
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

exports.get_location = function(req, res) {
    let imagesQuery = `SELECT * FROM eventLocations WHERE slug = ?`;
    database.execute(imagesQuery, [req.params.locationId], function(err, rows, fields) {
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

exports.update_locations = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        if (decodedToken.role === 'admin') {
            let locationsPromise = new Promise((resolve, reject) => {
                let locationCounter = 0;
                req.body.forEach((location) => {
                    locationCounter++;
                    if(location.deleted) {
                        let locationQuery = 'DELETE FROM eventLocations WHERE id = ?';
                        let locationValues = [
                            location.id
                        ];
                        database.execute(locationQuery, locationValues, function(err, rows, fields) {
                            if(err) {
                                console.error(err);
                                reject();
                            } else {
                                let eventQuery = 'UPDATE events SET eventLocationId = null WHERE eventLocationId = ?';
                                database.execute(eventQuery, locationValues, function(err, rows, fields) {
                                    if(err) {
                                        console.error(err);
                                        reject();
                                    } else {
                                        let programQuery = 'DELETE FROM program_locations WHERE locationId = ?';
                                        database.execute(programQuery, locationValues, function(err, rows, fields) {
                                            if(err) {
                                                console.error(err);
                                                reject();
                                            } else {
                                                if(locationCounter === req.body.length) {
                                                    resolve();
                                                }
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    } else {
                        let locationQuery = 'eventLocations SET title=?, street1=?, street2=?, city=?, state=?, zip=?, description=?, image=?, slug=?';
                        let locationValues = [
                            location.title,
                            location.street1,
                            location.street2,
                            location.city,
                            location.state,
                            location.zip,
                            location.description,
                            location.image,
                            location.title.replace(/\s-\s/gi, '-').replace(/\s/gi, '-').replace(/'/gi, '').toLowerCase()
                        ];
                        if(location.newLocation) {
                            locationQuery = `INSERT INTO ${locationQuery}`;
                        } else {
                            locationQuery = `UPDATE ${locationQuery} WHERE id=?`;
                            locationValues.push(location.id);
                        }
                        database.execute(locationQuery, locationValues, function(err, rows, fields) {
                            if(err) {
                                console.error(err);
                                reject();
                            } else {
                                if(locationCounter === req.body.length) {
                                    resolve();
                                }
                            }
                        });
                    }
                });
            });
            locationsPromise.then(() => {
                return res.json({'status': 'locations updated successfully'});
            }, (e) => {
                return res.status(500).json({'status': 'There were some problems.', error: e});
            })
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};