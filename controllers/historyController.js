const database = require('../database.js'),
    appConfig = require('../appConfig'),
    jwt = require('jsonwebtoken'),
    verifyToken = require('../verifyToken.js');


exports.get_history = function(req, res) {
    let history = {
        years: [],
        content: {}
    }
    let historyQuery = `SELECT id, year, headline, content, image FROM history`;
    let contentQuery = `SELECT name, content FROM components WHERE name='aboutHeadline' OR name='aboutDescription' OR name='aboutHistoryEndHeadline' OR name = 'aboutHistoryEndText'`;

    database.query(historyQuery, function(err, rows, fields) {
        if(err) {
            console.error(err);
            return res.sendStatus(500);
        } else {
            if(rows.length) {
                history.years = rows;
                database.query(contentQuery, function(contentErr, contentRows, contentFields) {
                    if(contentErr) {
                        console.error(contentErr);
                        return res.sendStatus(500);
                    } else {
                        if(contentRows.length) {
                            history.content = contentRows;
                            return res.json(history);
                        } else {
                            return res.sendStatus(404);
                        }
                    } 
                });
            } else {
                return res.sendStatus(404);
            }
        } 
    });
};

exports.update_history = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        let submitErrors = false;
        if (decodedToken.role === 'admin') {
            let metaPromise = new Promise((resolve, reject) => {
                let heroImageQuery = `SELECT image FROM hero_images WHERE heroId = 9 and heroOrder = 0`;
                database.execute(heroImageQuery, [], function(err, heroRows, fields) {
                    if(err) {
                        console.error(err);
                        reject();
                    } else {
                        let metaQuery = `UPDATE pages SET title=?, description=?, keywords=?, image=?, updated=NOW(), authorId=${decodedToken.id} WHERE url = '/about'`;
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
            let contentPromise = new Promise((resolve, reject) => {
                let contentCounter = -1;
                req.body.content.forEach((contentItem) => {
                    let contentQuery = `UPDATE components SET content=? WHERE name=?`;
                    let contentValues = [
                        contentItem.content,
                        contentItem.name
                    ];
                    database.execute(contentQuery, contentValues, function(err, rows, fields) {
                        if(err) {
                            console.error(err);
                            reject();
                        } else {
                            if (contentCounter === (req.body.content.length - 1)) {
                                resolve();
                            }
                        }
                    });
                });
            });
            let deletePromise = new Promise((resolve, reject) => {
                let deleteCounter = -1;
                req.body.deleteYears.forEach((id) => {
                    deleteCounter++;
                    let deleteQuery = `DELETE FROM history WHERE id = ?`;
                    database.execute(deleteQuery, [id], function(err, rows, fields) {
                        if(err) {
                            console.error(err);
                            reject();
                        } else {
                            if (deleteCounter === (req.body.deleteYears.length - 1)) {
                                resolve();
                            }
                        }
                    });
                });
            });
            let itemsPromise = new Promise((resolve, reject) => {
                let itemCounter = -1;
                req.body.years.forEach((item) => {
                    itemCounter++;
                    let itemQuery = `history SET content=?, headline=?, image=?, year=?`;
                    let itemValues = [
                        item.content,
                        item.headline,
                        item.image,
                        item.year
                    ];
                    if(item.newItem) {
                        itemQuery = `INSERT INTO ${itemQuery}`;
                    } else {
                        itemQuery = `UPDATE ${itemQuery} WHERE id=?`;
                        itemValues.push(item.id);
                    }
                    database.execute(itemQuery, itemValues, function(err, rows, fields) {
                        if(err) {
                            console.error(err);
                            reject();
                        } else {
                            if (itemCounter === (req.body.years.length - 1)) {
                                resolve();
                            }
                        }
                    });
                });
            });
            metaPromise.then(() => {}, () => {
                submitErrors = true;
                console.error('meta problem');
            })
            contentPromise.then(() => {}, () => {
                submitErrors = true;
                console.error('content problem');
            })
            deletePromise.then(() => {}, (e) => {
                submitErrors = true;
                console.error('delete problem');
                console.error(e);
            })
            itemsPromise.then(() => {}, (e) => {
                submitErrors = true;
                console.error('years problem');
                console.error(e);
            })
            .then(() => {
                if(submitErrors) {
                    return res.status(500).json({'status': 'There were some problems.'});
                } else {
                    return res.json({'status': 'about us page updated successfully'});
                }
            })
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};