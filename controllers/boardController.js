const { link } = require('fs');
const database = require('../database.js'),
    appConfig = require('../appConfig'),
    jwt = require('jsonwebtoken'),
    verifyToken = require('../verifyToken.js');


exports.get_board = function(req, res) {
    let board = {
        headline: '',
        description: '',
        members: []
    };
    let boardHeadlinePromise = new Promise((resolve, reject) => {
        let boardHeadlineQuery = `SELECT content FROM components WHERE name = 'boardHeadline'`;
        database.execute(boardHeadlineQuery, [], function(err, rows, fields) {
            if(err) {
                reject();
            } else {
                board.headline = rows[0].content;
                resolve();
            }
        });
    });
    let boardDescriptionPromise = new Promise((resolve, reject) => {
        let boardDescriptionQuery = `SELECT content FROM components WHERE name = 'boardDescription'`;
        database.execute(boardDescriptionQuery, [], function(err, rows, fields) {
            if(err) {
                reject();
            } else {
                board.description = rows[0].content;
                resolve();
            }
        });
    });
    let boardMembersPromise = new Promise((resolve, reject) => {
        let boardMembersQuery = `SELECT * FROM board ORDER BY boardOrder ASC`;
        database.execute(boardMembersQuery, [], function(err, rows, fields) {
            if(err) {
                reject();
            } else {
                let memberCount = -1;
                for (i=0; i<rows.length; i++) {
                    memberCount++;
                    board.members.push(rows[i]);
                    if(memberCount === (rows.length - 1)) {
                        resolve();
                    }
                };
            }
        });
    });
    boardHeadlinePromise.then(() => {
        boardDescriptionPromise.then(() => {
            boardMembersPromise.then(() => {
                return res.json(board);
            }, () => {
                return res.status(500).json({'status': 'There were some problems.'});
            })
        }, () => {
            return res.status(500).json({'status': 'There were some problems.'});
        })
    }, () => {
        return res.status(500).json({'status': 'There were some problems.'});
    })
};

exports.update_board = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        let submitErrors = false;
        if (decodedToken.role === 'admin') {
            let metaPromise = new Promise((resolve, reject) => {
                let heroImageQuery = `SELECT image FROM hero_images WHERE heroId = 26 and heroOrder = 0`;
                database.execute(heroImageQuery, [], function(err, heroRows, fields) {
                    if(err) {
                        console.error(err);
                        reject();
                    } else {
                        let metaQuery = `UPDATE pages SET title=?, description=?, keywords=?, image=?, updated=NOW(), authorId=${decodedToken.id} WHERE url = '/about/board'`;
                        let metaValues = [
                            req.body.meta.title,
                            req.body.meta.description,
                            req.body.meta.keywords,
                            heroRows[0].image
                        ];
                        database.execute(metaQuery, metaValues, function(err, rows, fields) {
                            if(err) {
                                console.error(err);
                                reject();
                            } else {
                                resolve();
                            }
                        });
                    }
                });
            });
            let headlinePromise = new Promise((resolve, reject) => {
                let headlineQuery = `UPDATE components SET content=? WHERE name=?`;
                let headlineValues = [
                    req.body.headline,
                    'boardHeadline'
                ];
                database.execute(headlineQuery, headlineValues, function(err, rows, fields) {
                    if(err) {
                        console.error(err);
                        reject();
                    } else {
                        resolve();
                    }
                });
            });
            let descriptionPromise = new Promise((resolve, reject) => {
                let descriptionQuery = `UPDATE components SET content=? WHERE name=?`;
                let descriptionValues = [
                    req.body.description,
                    'boardDescription'
                ];
                database.execute(descriptionQuery, descriptionValues, function(err, rows, fields) {
                    if(err) {
                        console.error(err);
                        reject();
                    } else {
                        resolve();
                    }
                });
            });
            let membersPromise = new Promise((resolve, reject) => {
                let memberCounter = -1;
                req.body.members.forEach((member) => {
                    memberCounter++;
                    if (member.deleted) {
                        let memberQuery = `DELETE FROM board WHERE id=?`;
                        database.execute(memberQuery, [member.id], function(err, rows, fields) {
                            if(err) {
                                console.error(err);
                                reject();
                            }
                        });
                    } else {
                        let memberQuery = `board SET name=?, title=?, subtitle=?, boardOrder=?, image=?, description=?`;
                        let memberValues = [
                            member.name,
                            member.title,
                            member.subtitle,
                            member.boardOrder,
                            member.image,
                            member.description,
                        ];
                        if(member.newMember) {
                            memberQuery = `INSERT INTO ${memberQuery}`;
                        } else {
                            memberQuery = `UPDATE ${memberQuery} WHERE id=?`;
                            memberValues.push(member.id);
                        }
                        database.execute(memberQuery, memberValues, function(err, rows, fields) {
                            if(err) {
                                console.error(err);
                                reject();
                            } else {
                                if (memberCounter === (req.body.members.length - 1)) {
                                    resolve();
                                }
                            }
                        });
                    }
                });
            });
            metaPromise.then(() => {}, () => {
                submitErrors = true;
                console.error('meta problem');
            })
            headlinePromise.then(() => {}, () => {
                submitErrors = true;
                console.error('headline problem');
            })
            descriptionPromise.then(() => {}, () => {
                submitErrors = true;
                console.error('description problem');
            })
            membersPromise.then(() => {}, (e) => {
                submitErrors = true;
                console.error('members problem');
                console.error(e);
            })
            .then(() => {
                if(submitErrors) {
                    return res.status(500).json({'status': 'There were some problems.'});
                } else {
                    return res.json({'status': 'board page updated successfully'});
                }
            })
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};