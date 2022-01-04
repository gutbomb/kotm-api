const { link } = require('fs');
const database = require('../database.js'),
    appConfig = require('../appConfig'),
    jwt = require('jsonwebtoken'),
    verifyToken = require('../verifyToken.js');

exports.update_home = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        let submitErrors = false;
        if (decodedToken.role === 'admin') {
            let metaPromise = new Promise((resolve, reject) => {
                let metaQuery = `UPDATE pages SET title=?, description=?, keywords=?, image=?, updated=NOW(), authorId=${decodedToken.id} WHERE url = '/home'`;
                let metaValues = [
                    req.body.meta.title,
                    req.body.meta.description,
                    req.body.meta.keywords,
                    'logo.png'
                ];
                database.execute(metaQuery, metaValues, function(err, rows, fields) {
                    if(err) {
                        console.error(err);
                        reject();
                    } else {
                        resolve();
                    }
                });
            });
            let emergencyHeadlinePromise = new Promise((resolve, reject) => {
                let emergencyHeadlineQuery = `UPDATE components SET content=? WHERE name=?`;
                let emergencyHeadlineValues = [
                    req.body.emergencyHeadline,
                    'homePageEmergencyBlockTitle'
                ];
                database.execute(emergencyHeadlineQuery, emergencyHeadlineValues, function(err, rows, fields) {
                    if(err) {
                        console.error(err);
                        reject();
                    } else {
                        resolve();
                    }
                });
            });
            let emergencyTextPromise = new Promise((resolve, reject) => {
                let emergencyTextQuery = `UPDATE components SET content=? WHERE name=?`;
                let emergencyTextValues = [
                    req.body.emergencyText,
                    'homePageEmergencyBlockText'
                ];
                database.execute(emergencyTextQuery, emergencyTextValues, function(err, rows, fields) {
                    if(err) {
                        console.error(err);
                        reject();
                    } else {
                        resolve();
                    }
                });
            });
            metaPromise.then(() => {}, () => {
                submitErrors = true;
                console.error('meta problem');
            })
            emergencyHeadlinePromise.then(() => {}, () => {
                submitErrors = true;
                console.error('emergency headline problem');
            })
            emergencyTextPromise.then(() => {}, () => {
                submitErrors = true;
                console.error('emergency text problem');
            })
            .then(() => {
                if(submitErrors) {
                    return res.status(500).json({'status': 'There were some problems.'});
                } else {
                    return res.json({'status': 'home page updated successfully'});
                }
            })
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};

exports.get_home = function(req, res) {
    let home = {
        emergencyHeadline: '',
        emergencyText: ''
    };
    let emergencyHeadlinePromise = new Promise((resolve, reject) => {
        let emergencyHeadlineQuery = `SELECT content FROM components WHERE name = 'homePageEmergencyBlockTitle'`;
        database.execute(emergencyHeadlineQuery, [], function(err, rows, fields) {
            if(err) {
                reject();
            } else {
                home.emergencyHeadline = rows[0].content;
                resolve();
            }
        });
    });
    let emergencyTextPromise = new Promise((resolve, reject) => {
        let emergencyTextQuery = `SELECT content FROM components WHERE name = 'homePageEmergencyBlockText'`;
        database.execute(emergencyTextQuery, [], function(err, rows, fields) {
            if(err) {
                reject();
            } else {
                home.emergencyText = rows[0].content;
                resolve();
            }
        });
    });
    emergencyHeadlinePromise.then(() => {
        emergencyTextPromise.then(() => {
            return res.json(home);
        }, () => {
            return res.status(500).json({'status': 'There were some problems.'});
        })
    }, () => {
        return res.status(500).json({'status': 'There were some problems.'});
    })
};