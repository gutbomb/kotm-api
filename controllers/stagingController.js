const e = require('express');
const appConfig = require('../appConfig.js'),
    database = require('../database.js'),
    jwt = require('jsonwebtoken'),
    verifyToken = require('../verifyToken.js');

exports.get_staged = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        if (decodedToken.role === 'admin' || decodedToken.role === 'editor') {
            let stageQuery = `SELECT id, created, object AS object FROM staged_changes WHERE userId = ? AND type = ? AND contentId = ? AND approved = 0`;
            let stageValues = [
                decodedToken.id,
                req.params.type,
                req.params.id
            ];
            database.execute(stageQuery, stageValues, function(err, rows, fields) {
                if(err) {
                    console.error(err);
                    return res.status(500).json({'status': 'There were some problems.'});
                } else {
                    if(rows.length) {
                        return res.json(
                            {
                                id: rows[0].id,
                                created: rows[0].created,
                                object: JSON.parse(rows[0].object)
                            }
                        );
                    } else {
                        return res.status(404).json({'status': 'nothing staged.'});
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

exports.remove_staged = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        if (decodedToken.role === 'admin' || decodedToken.role === 'editor') {
            let stageQuery = `DELETE FROM staged_changes WHERE id = ?`;
            database.execute(stageQuery, [req.params.id], function(err, rows, fields) {
                if(err) {
                    console.error(err);
                    return res.status(500).json({'status': 'There were some problems.'});
                } else {
                    return res.json({'status': 'request removed.'})
                }
            });
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};

exports.get_revisions = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        if (decodedToken.role === 'admin') {
            let stageQuery = `SELECT staged_changes.id, approved, created, firstname, lastname FROM staged_changes JOIN users ON users.id = userId WHERE type = ? AND contentId = ? ORDER BY created DESC`;
            let stageValues = [
                req.params.type,
                req.params.id
            ];
            database.execute(stageQuery, stageValues, function(err, rows, fields) {
                if(err) {
                    console.error(err);
                    return res.status(500).json({'status': 'There were some problems.'});
                } else {
                    if(rows.length) {
                        return res.json(rows);
                    } else {
                        return res.status(404).json({'status': 'no revisions.'});
                    }
                }
            });
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
}

exports.get_revision = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        if (decodedToken.role === 'admin') {
            let stageQuery = `SELECT staged_changes.id, description, created, object, approved, firstname, lastname FROM staged_changes JOIN users ON users.id = userId WHERE staged_changes.id = ?`;
            database.execute(stageQuery, [req.params.id], function(err, rows, fields) {
                if(err) {
                    console.error(err);
                    return res.status(500).json({'status': 'There were some problems.'});
                } else {
                    if(rows.length) {
                        return res.json(
                            {
                                id: rows[0].id,
                                created: rows[0].created,
                                object: JSON.parse(rows[0].object),
                                firstname: rows[0].firstname,
                                lastname: rows[0].lastname,
                                approved: rows[0].approved,
                                description: rows[0].description
                            }
                        );
                    } else {
                        return res.status(404).json({'status': 'nothing staged.'});
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

exports.action_revision = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        if (decodedToken.role === 'admin') {
            if(req.params.action === 'approve') {
                let actionQuery = 'UPDATE staged_changes SET approved = 1, approverUserId = ? WHERE id = ?';
                database.execute(actionQuery, [decodedToken.id, req.params.id], function(err, rows, fields) {
                    if(err) {
                        console.error(err);
                        return res.status(500).json({'status': 'There were some problems.'});
                    } else {
                        return res.json({'status': 'Revision approved'});
                    }
                });
            } else if (req.params.action === 'reject') {
                return res.json({'status': 'Revision rejected'});
            } else {
                return res.status(400).json({'status': 'Invalid action'});
            }
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};