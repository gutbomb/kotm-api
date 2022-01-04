const database = require('../database.js'),
    appConfig = require('../appConfig'),
    jwt = require('jsonwebtoken'),
    verifyToken = require('../verifyToken.js');


exports.get_hero = function(req, res) {
    let hero = {};
    let heroQuery = 'SELECT heroes.id, title, firstname, lastname, updated FROM heroes JOIN users ON authorId = users.id WHERE heroes.id = ?';
    let heroImageQuery = `select * from hero_images WHERE heroId = ?`;
    database.execute(heroQuery, [req.params.heroId], function(err, rows, fields) {
        if(err) {
            console.error(err);
            return res.sendStatus(500);
        } else {
            if(rows.length) {
                database.execute(heroImageQuery, [req.params.heroId], function(err, imageRows, fields) {
                    if(err) {
                        console.error(err);
            
                        return res.sendStatus(500);
                    } else {
                        if(imageRows.length) {
                            return res.json({
                                id: rows[0].id,
                                title: rows[0].title,
                                firstname: rows[0].firstname,
                                lastname: rows[0].lastname,
                                updated: rows[0].updated,
                                items: imageRows
                            });
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

exports.get_heroes = function(req, res) {
    let heroes = [];
    let prevId = -1;
    let heroQuery = 'SELECT heroes.id, heroes.title, hero_images.headline, hero_images.image FROM heroes JOIN hero_images ON hero_images.heroId = heroes.id ORDER BY heroes.id ASC, hero_images.heroOrder ASC';
    database.execute(heroQuery, [], function(err, rows, fields) {
        if(err) {
            console.error(err);
            return res.sendStatus(500);
        } else {
            if(rows.length) {
                let hero={
                    items: []
                };
                for(i=0; i < rows.length; i++) {
                    if (rows[i].id !== prevId) {
                        prevId = rows[i].id;
                        hero = {
                            title: rows[i].title,
                            id: rows[i].id,
                            items: [{
                                headline: rows[i].headline,
                                image: rows[i].image
                            }]
                        };
                        if(i !== (rows.length - 1)) {
                            if(rows[i].id !== rows[i+1].id) {
                                heroes.push(hero);
                            }
                        } else {
                            heroes.push(hero);
                            return res.json(heroes);
                        }
                    } else {
                        hero.items.push({
                            headline: rows[i].headline,
                            image: rows[i].image
                        });
                        if(i !== (rows.length - 1)) {
                            if(rows[i].id !== rows[i+1].id) {
                                heroes.push(hero);
                            }
                        } else {
                            heroes.push(hero);
                            return res.json(heroes);
                        }
                    }
                    
                }
            } else {
                return res.sendStatus(404);
            }
        }
    });
};

exports.update_hero = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let submitErrors = false;
        let decodedToken = jwt.decode(req.token);
        if (decodedToken.role === 'admin') {
            let heroPromise = new Promise((resolve, reject) => {
                let heroQuery = `UPDATE heroes SET title=?, updated=NOW(), authorId=${decodedToken.id} WHERE id = ?`;
                let heroValues = [
                    req.body.title,
                    req.body.id
                ]
                database.execute(heroQuery, heroValues, function(err, rows, fields) {
                    if(err) {
                        console.error(err);
                        reject();
                    } else {
                        resolve();
                    }
                });
            });
            let itemPromise = new Promise((resolve, reject) => {
                let itemCounter = -1;
                req.body.items.forEach((item) => {
                    itemCounter++;
                    if (item.deleted) {
                        let itemQuery = `DELETE FROM hero_images WHERE id=?`;
                        database.execute(itemQuery, [item.id], function(err, rows, fields) {
                            if(err) {
                                console.error(err);
                                reject();
                            }
                        });
                    } else {
                        let itemQuery = `hero_images SET description=?, headline=?, heroOrder=?, image=?, link=?, position=?, topline=?`;
                        let itemValues = [
                            item.description, item.headline, item.heroOrder, item.image, item.link, item.position, item.topline
                        ];
                        let itemInsertId = false;
                        if(item.newItem) {
                            itemQuery = `INSERT INTO ${itemQuery}, heroId=?`;
                            itemValues.push(req.body.id);
                        } else {
                            itemQuery = `UPDATE ${itemQuery} WHERE id=?`;
                            itemValues.push(item.id);
                        }
                        database.execute(itemQuery, itemValues, function(err, rows, fields) {
                            if(err) {
                                console.error(err);
                                reject();
                            } else {
                                if (itemCounter === req.body.items.length) {
                                    resolve();
                                }
                            }
                        });
                    }
                });
            });
            heroPromise.then(() => {}, () => {
                submitErrors = true;
                console.error('hero problem');
            })
            .then(() => {
                itemPromise.then(() => {}, () => {
                    submitErrors = true;
                    console.error('item problem');
                })
            })
            .then(() => {
                if(submitErrors) {
                    return res.status(500).json({'status': 'There were some problems.'});
                } else {
                    return res.json({'status': 'hero updated successfully'});
                }
            })
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};

exports.create_hero = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        if (decodedToken.role === 'admin') {
            let heroPromise = new Promise((resolve, reject) => {
                let heroQuery = `INSERT INTO heroes SET title=?, updated=NOW(), authorId=${decodedToken.id}`;
                database.execute(heroQuery, [req.body.title], function(err, rows, fields) {
                    if(err) {
                        console.error(err);
                        reject();
                    } else {
                        for(i=0;i<req.body.items.length;i++) {
                            let itemQuery = `INSERT INTO hero_images SET description=?, headline=?, heroOrder=?, image=?, link=?, position=?, topline=?, heroId=?`;
                            let itemValues = [
                                req.body.items[i].description, req.body.items[i].headline, req.body.items[i].heroOrder, req.body.items[i].image, req.body.items[i].link, req.body.items[i].position, req.body.items[i].topline, rows.insertId
                            ];
                            database.execute(itemQuery, itemValues, function(err, itemRows, fields) {
                                if(err) {
                                    console.error(err);
                                    reject();
                                } else {
                                    if (i === (req.body.items.length)) {
                                        resolve();
                                    }
                                }
                            });

                        };
                    }
                });
            });
            heroPromise.then(() => {
                return res.json({'status': 'hero updated successfully'});
            }, () => {
                return res.status(500).json({'status': 'There were some problems.'});
            });
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};