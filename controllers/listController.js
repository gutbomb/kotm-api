const database = require('../database.js'),
    appConfig = require('../appConfig'),
    jwt = require('jsonwebtoken'),
    verifyToken = require('../verifyToken.js');

exports.get_list = function(req, res) {
    let listQuery = `SELECT pages.id AS pageId, pages.description, pages.image, pages.color, pages.type, pages.start, pages.title, pages.url, page_list_items.pageOrder, page_lists.id AS listId, page_lists.title AS listTitle, page_lists.description AS listDescription, page_lists.url as listUrl, page_lists.color as listColor, page_lists.heroId FROM pages JOIN page_list_items ON pages.id = page_list_items.pageId JOIN page_lists ON pageListId = page_lists.id WHERE page_lists.url=?`;
    let list = {
        items: []
    };
    database.execute(listQuery, [req.params.listUrl], function(err, rows, fields) {
        if(err) {
            console.error(err);
            return res.sendStatus(500);
        } else {
            if(rows.length) {
                list.description = rows[0].listDescription;
                list.title = rows[0].listTitle;
                list.color = rows[0].listColor;
                list.url = rows[0].listUrl;
                list.heroId = rows[0].heroId;
                list.id = rows[0].listId;
                for (i = 0; i < rows.length; i++) {
                    list.items.push({
                        description: rows[i].description,
                        image: rows[i].image,
                        color: rows[i].color,
                        type: rows[i].type,
                        start: rows[i].start,
                        title: rows[i].title,
                        url: rows[i].url,
                        pageOrder: rows[i].pageOrder,
                        id: rows[i].pageId
                    });
                    if(i === (rows.length - 1)) {
                        return res.json(list);
                    }
                }   
            } else {
                return res.sendStatus(404);
            }
        } 
    });
};

exports.get_lists = function(req, res) {
    let listQuery = `SELECT pages.id AS pageId, page_lists.id, page_lists.title, page_lists.url, pages.updated, users.firstname, users.lastname FROM page_lists JOIN pages ON pages.url = CONCAT('/list/',page_lists.url) JOIN users ON pages.authorId = users.id`;
    database.execute(listQuery, [], function(err, rows, fields) {
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

exports.update_list = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        let submitErrors = false;
        if (decodedToken.role === 'admin') {
            let checkQuery = `SELECT COUNT(id) as idCount FROM page_lists WHERE url = ? AND id != ?`;
            let checkValues = [
                req.body.url,
                req.body.id
            ];
            database.execute(checkQuery, checkValues, function (err, checkRows, fields) {
                if(err) {
                    console.error(err);
                    return res.sendStatus(500);
                } else {
                    if(checkRows.length) {
                        if(checkRows[0].idCount) {
                            return res.status(409).json({status: 'URL already exists, please select another URL', module: 'url', error: true});
                        } else {
                            let metaPromise = new Promise((resolve, reject) => {
                                if(req.body.heroId) {
                                    let heroImageQuery = `SELECT image FROM hero_images WHERE heroId=? and heroOrder = 0`;
                                    database.execute(heroImageQuery, [req.body.heroId], function(err, heroRows, fields) {
                                        if(err) {
                                            console.error(err);
                                            reject();
                                        } else {
                                            let metaQuery = `UPDATE pages SET color=?, type='list', title=?, description=?, keywords=?, url=?, image=?, updated=NOW(), authorId=${decodedToken.id} WHERE url=?`;
                                            let metaValues = [
                                                req.body.color,
                                                req.body.meta.title,
                                                req.body.meta.description,
                                                req.body.meta.keywords,
                                                `/list/${req.body.url}`,
                                                heroRows[0].image,
                                                req.body.meta.url
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
                                } else {
                                    let metaQuery = `UPDATE pages SET color=?, type='list', title=?, description=?, keywords=?, url=?, image=?, updated=NOW(), authorId=${decodedToken.id} WHERE url=?`;
                                    let metaValues = [
                                        req.body.color,
                                        req.body.meta.title,
                                        req.body.meta.description,
                                        req.body.meta.keywords,
                                        `/list/${req.body.url}`,
                                        'logo.png',
                                        req.body.meta.url
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
                            let listPromise = new Promise((resolve, reject) => {
                                let listQuery = `UPDATE page_lists SET title=?, color=?, description=?, heroId=?, url=? WHERE id=?`;
                                let listValues = [
                                    req.body.title,
                                    req.body.color,
                                    req.body.description,
                                    req.body.heroId,
                                    req.body.url,
                                    req.body.id
                                ];
                                database.execute(listQuery, listValues, function(err, rows, fields) {
                                    if(err) {
                                        console.error(err);
                                        reject();
                                    } else {
                                        let itemCounter = -1;
                                        req.body.items.forEach((item) => {
                                            itemCounter++
                                            if (item.deleted) {
                                                let itemQuery = `DELETE FROM page_list_items WHERE pageId=? AND pageListId=?`;
                                                let itemValues = [
                                                    item.id,
                                                    req.body.id
                                                ];
                                                database.execute(itemQuery, itemValues, function(err, rows, fields) {
                                                    if(err) {
                                                        console.error(err);
                                                        reject();
                                                    }
                                                });
                                            } else {
                                                let itemQuery = `page_list_items SET pageOrder=?`;
                                                let itemValues = [
                                                    item.pageOrder
                                                ];
                                                if(item.newPage) {
                                                    itemQuery = `INSERT INTO ${itemQuery}, pageId=?, pageListId=?`;
                                                    itemValues.push(item.id);
                                                    itemValues.push(req.body.id);
                                                } else {
                                                    itemQuery = `UPDATE ${itemQuery} WHERE pageId=? AND pageListId=?`;
                                                    itemValues.push(item.id);
                                                    itemValues.push(req.body.id);
                                                }
                                                database.execute(itemQuery, itemValues, function(err, rows, fields) {
                                                    if(err) {
                                                        console.error(err);
                                                        reject();
                                                    } else {
                                                        if (itemCounter === (req.body.items.length - 1)) {
                                                            resolve();
                                                        }
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            });
                            metaPromise.then(() => {}, (e) => {
                                submitErrors = true;
                                console.error(e);
                            })
                            listPromise.then(() => {}, (e) => {
                                submitErrors = true;
                                console.error(e);
                            })
                            .then(() => {
                                if(submitErrors) {
                                    return res.status(500).json({'status': 'There were some problems.'});
                                } else {
                                    return res.json({'status': 'page list updated successfully'});
                                }
                            });
                        }
                    } else {
                        return res.status(500);
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

exports.create_list = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        let submitErrors = false;
        if (decodedToken.role === 'admin') {
            let checkQuery = `SELECT COUNT(id) as idCount FROM page_lists WHERE url = ?`;
            database.execute(checkQuery, [req.body.url], function (err, checkRows, fields) {
                if(err) {
                    console.error(err);
                    return res.sendStatus(500);
                } else {
                    if(checkRows.length) {
                        if(checkRows[0].idCount) {
                            return res.status(409).json({status: 'URL already exists, please select another URL', module: 'url', error: true});
                        } else {
                            let metaPromise = new Promise((resolve, reject) => {
                                if(req.body.heroId) {
                                    let heroImageQuery = `SELECT image FROM hero_images WHERE heroId=? and heroOrder = 0`;
                                    database.execute(heroImageQuery, [req.body.heroId], function(err, heroRows, fields) {
                                        if(err) {
                                            console.error(err);
                                            reject();
                                        } else {
                                            let metaQuery = `INSERT INTO pages SET color=?, type='list', title=?, description=?, keywords=?, url=?, image=?, updated=NOW(), authorId=${decodedToken.id}`;
                                            let metaValues = [
                                                req.body.color,
                                                req.body.meta.title,
                                                req.body.meta.description,
                                                req.body.meta.keywords,
                                                `/list/${req.body.url}`,
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
                                } else {
                                    let metaQuery = `INSERT INTO pages SET color=?, type='list', title=?, description=?, keywords=?, url=?, image=?, updated=NOW(), authorId=${decodedToken.id}`;
                                    let metaValues = [
                                        req.body.color,
                                        req.body.meta.title,
                                        req.body.meta.description,
                                        req.body.meta.keywords,
                                        `/list/${req.body.url}`,
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
                                }
                                
                                
                            });
                            let listPromise = new Promise((resolve, reject) => {
                                let listQuery = `INSERT INTO page_lists SET title=?, color=?, description=?, heroId=?, url=?`;
                                let listValues = [
                                    req.body.title,
                                    req.body.color,
                                    req.body.description,
                                    req.body.heroId,
                                    req.body.url
                                ];
                                database.execute(listQuery, listValues, function(err, rows, fields) {
                                    if(err) {
                                        console.error(err);
                                        reject();
                                    } else {
                                        let itemCounter = -1;
                                        req.body.items.forEach((item) => {
                                            itemCounter++
                                            let itemQuery = `INSERT INTO page_list_items SET pageOrder=?, pageId=?, pageListId=?`;
                                            let itemValues =[
                                                item.pageOrder,
                                                item.id,
                                                rows.insertId
                                            ];
                                            database.execute(itemQuery, itemValues, function(err, itemRows, fields) {
                                                if(err) {
                                                    console.error(err);
                                                    reject();
                                                } else {
                                                    if (itemCounter === (req.body.items.length - 1)) {
                                                        resolve();
                                                    }
                                                }
                                            });
                                        });
                                    }
                                });
                            });
                            metaPromise.then(() => {}, (e) => {
                                submitErrors = true;
                                console.error(e);
                            })
                            listPromise.then(() => {}, (e) => {
                                submitErrors = true;
                                console.error(e);
                            })
                            .then(() => {
                                if(submitErrors) {
                                    return res.status(500).json({'status': 'There were some problems.'});
                                } else {
                                    return res.json({'status': 'page list created successfully'});
                                }
                            });
                        }
                    } else {
                        return res.status(500);
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

exports.delete_list = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        if (decodedToken.role === 'admin') {
            let listDeleteQuery = `DELETE FROM page_lists WHERE url = ?`;
            let pageDeleteQuery = `DELETE FROM pages WHERE url = ?`;
            let listPageDeleteQuery = `DELETE FROM page_list_items WHERE pageListId = ?`
            let listPageLinkDeleteQuery = `DELETE FROM page_list_items WHERE pageId = ?`
            database.execute(listDeleteQuery, [req.params.listUrl], function (err) {
                if (err) {
                    return res.status(500).json({'status': 'Database error', 'errors': err});
                } else {
                    database.execute(pageDeleteQuery, [`/list/${req.params.listUrl}`], function (err) {
                        if (err) {
                            return res.status(500).json({'status': 'Database error', 'errors': err});
                        } else {
                            database.execute(listPageDeleteQuery, [req.params.id], function (err) {
                                if (err) {
                                    return res.status(500).json({'status': 'Database error', 'errors': err});
                                } else {
                                    database.execute(listPageLinkDeleteQuery, [req.params.pageId], function (err) {
                                        if (err) {
                                            return res.status(500).json({'status': 'Database error', 'errors': err});
                                        } else {
                                            return res.json({'status': 'List deleted successfully'});
                                        }
                                    });
                                }
                            });
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