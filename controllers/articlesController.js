const appConfig = require('../appConfig'),
    database = require('../database.js'),
    jwt = require('jsonwebtoken'),
    verifyToken = require('../verifyToken.js'),
    nodemailer = require('nodemailer'),
    transport = nodemailer.createTransport(appConfig.mailConfig);


exports.get_article = function(req, res) {

    let articleQuery = `SELECT articles.layout, articles.heroId, articles.text, articles.title, articles.url, articles.color, articles.description, articles.posted, articles.updated, articles.id, articles.image, users.firstname, users.lastname, articles.news FROM articles JOIN users ON authorId = users.id WHERE url = ?`;

    database.execute(articleQuery, [req.params.url], function(err, rows, fields) {
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

exports.get_articles = function(req, res) {

    let articlesQuery = `SELECT pages.id AS pageId, articles.title, articles.url, articles.color, articles.description, articles.posted, articles.updated, articles.id, articles.image, users.firstname, users.lastname, articles.news FROM articles JOIN users ON authorId = users.id JOIN pages ON CONCAT('/article/', articles.url) = pages.url`;

    database.query(articlesQuery, function(err, rows, fields) {
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

exports.get_news = function(req, res) {

    let articlesQuery = `SELECT articles.title, articles.url, articles.description, articles.posted, articles.updated, articles.id, articles.image, users.firstname, users.lastname, articles.news FROM articles JOIN users ON authorId = users.id WHERE articles.news = 1`;

    database.query(articlesQuery, function(err, rows, fields) {
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

exports.update_article = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        if (decodedToken.role === 'admin') {
            let pageQuery = `UPDATE pages SET type='article', url=?, title=?, description=?, keywords=?, color=?, image=?, updated=NOW(), authorId=${decodedToken.id} WHERE url=?`;
            let pageValues = [
                `/article/${req.body.url}`,
                req.body.meta.title,
                req.body.meta.description,
                req.body.meta.keywords,
                req.body.color,
                req.body.image,
                req.body.meta.oldUrl
            ];

            let articleUpdateQuery = `UPDATE articles SET layout=?, heroId=?, title=?, description=?, updated=NOW(), text=?, color=?, image=?, authorId=?, url=?, news=? WHERE id=?`;
            let values = [
                req.body.layout,
                req.body.heroId,
                req.body.title,
                req.body.description,
                req.body.text,
                req.body.color,
                req.body.image,
                decodedToken.id,
                req.body.url,
                req.body.news,
                req.body.id
            ];

            let articleCheckQuery = `SELECT COUNT(id) as idCount FROM articles WHERE url = ? AND id != ?`;
            let checkValues = [
                req.body.url,
                req.body.id
            ];

            database.execute(articleCheckQuery, checkValues, function (err, rows, fields) {
                if(err) {
                    console.error(err);
                    return res.sendStatus(500);
                } else {
                    if(rows.length) {
                        if(rows[0].idCount) {
                            return res.status(409).json({status: 'URL already exists, please select another URL', module: 'url', error: true});
                        } else {
                            database.execute(articleUpdateQuery, values, function (updateErr, updateResults, updateFields) {
                                if (updateErr) {
                                    return res.status(500).json({'status': 'Database error', 'errors': updateErr});
                                } else {
                                    database.execute(pageQuery, pageValues, function (pageErr, pageResults, pageFields) {
                                    if (pageErr) {
                                        return res.status(500).json({'status': 'Database error', 'errors': pageErr});
                                    } else {
                                        let stagingQuery = `INSERT INTO staged_changes SET type=?, contentId=?, created=NOW(), userId=?, object=?, approved = 1, approverUserId = ?, description = ?`;
                                        let stagingValues = [
                                            'article',
                                            req.body.id,
                                            decodedToken.id,
                                            req.body,
                                            decodedToken.id,
                                            req.body.revisionDescription
                                        ];
                                        database.execute(stagingQuery, stagingValues, function (stagingErr, stagingResults, stagingFields) {
                                            if (stagingErr) {
                                                return res.status(500).json({'status': 'Database error', 'errors': stagingErr});
                                            } else {
                                                return res.json({'status': 'Article updated successfully'});
                                            }
                                        });
                                    }
                                });
                                }
                            });
                        }
                    } else {
                        return res.status(500);
                    }
                } 
            });
        } else if (decodedToken.role === 'editor') {
            let revisionId = -1;
            let countQuery = `SELECT id FROM staged_changes WHERE type = 'article' AND contentId = ? AND userId = ? AND approved = 0`;
            database.execute(countQuery, [req.body.id, decodedToken.id], function (countErr, countResults, countFields) {
                if (countErr) {
                    return res.status(500).json({'status': 'Database error', 'errors': updateErr});
                } else {
                    let stagingQuery = `staged_changes SET type=?, contentId=?, created=NOW(), userId=?, object=?, description=?`;
                    let stagingValues = [
                        'article',
                        req.body.id,
                        decodedToken.id,
                        req.body,
                        req.body.revisionDescription
                    ];
                    if (countResults.length) {
                        stagingQuery = `UPDATE ${stagingQuery} WHERE type= ? AND contentId = ? AND userId = ?`;
                        stagingValues.push('article', req.body.id, decodedToken.id);
                        revisionId = countResults[0].id;
                    } else {
                        stagingQuery = `INSERT INTO ${stagingQuery}`;
                    }
                    database.execute(stagingQuery, stagingValues, function (stagingErr, stagingResults, stagingFields) {
                        if (stagingErr) {
                            return res.status(500).json({'status': 'Database error', 'errors': stagingErr});
                        } else {
                            if(!countResults.length) {
                                revisionId = stagingResults.insertId;
                            }
                            let mailOptions = {
                                from: appConfig.mailConfig.auth.user,
                                to: appConfig.approvalEmail,
                                subject: 'KOTM.org Page Edit Approval Request',
                                text: `Hello, an edit has been submitted for your approval to the article page: "${req.body.title}".\r\n\r\nDescription: ${req.body.revisionDescription}\r\n\r\nPlease visit ${appConfig.appUrl}/admin/edit-article/${req.body.url}/${revisionId} to review the changes.`
                            };
                            transport.sendMail(mailOptions, function(){});
                            return res.json({'status': 'Article sumbitted for approval successfully'});
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



exports.create_article = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        if (decodedToken.role === 'admin') {
            let pageQuery = `INSERT INTO pages SET type='article', url=?, title=?, description=?, keywords=?, color=?, image=?, updated=NOW(), authorId=${decodedToken.id}`;
            let pageValues = [
                `/article/${req.body.url}`,
                req.body.meta.title,
                req.body.meta.description,
                req.body.meta.keywords,
                req.body.color,
                req.body.image
            ];
            let values = [
                req.body.layout,
                req.body.heroId,
                req.body.title,
                req.body.description,
                req.body.text,
                req.body.color,
                req.body.image,
                req.body.url,
                req.body.news,
                decodedToken.id                
            ];
            let articleCreateQuery = 'INSERT INTO articles (layout, heroId, title, description, posted, updated, text, color, image, url, news, authorId) VALUES (?, ?, ?, ?, NOW(), NOW(), ?, ?, ?, ?, ?, ?)';
            let articleCheckQuery = 'SELECT COUNT(id) as idCount FROM articles WHERE url = ?';

            database.execute(articleCheckQuery, [req.body.url], function (err, rows, fields) {
                if(err) {
                    console.error(err);
                    return res.sendStatus(500);
                } else {
                    if(rows.length) {
                        if(rows[0].idCount) {
                            return res.status(409).json({status: 'URL already exists, please select another URL', module: 'url', error: true});
                        } else {
                            database.execute(articleCreateQuery, values, function (err) {
                                if (err) {
                                    return res.status(500).json({'status': 'Database error', 'errors': err});
                                } else {
                                    database.execute(pageQuery, pageValues, function (err) {
                                        if (err) {
                                            return res.status(500).json({'status': 'Database error', 'errors': err});
                                        } else {
                                            return res.json({'status': 'Article updated successfully'});
                                        }
                                    });
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

exports.delete_article = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        if (decodedToken.role === 'admin') {
            let articleDeleteQuery = `DELETE FROM articles WHERE url = ?`;
            let pageDeleteQuery = `DELETE FROM pages WHERE url = ?`;
            let pageListDeleteQuery = `DELETE FROM page_list_items WHERE id = ?`
            database.execute(articleDeleteQuery, [req.params.url], function (err) {
                if (err) {
                    return res.status(500).json({'status': 'Database error', 'errors': err});
                } else {
                    database.execute(pageDeleteQuery, [`/article/${req.params.url}`], function (err) {
                        if (err) {
                            return res.status(500).json({'status': 'Database error', 'errors': err});
                        } else {
                            database.execute(pageListDeleteQuery, [req.params.id], function (err) {
                                if (err) {
                                    return res.status(500).json({'status': 'Database error', 'errors': err});
                                } else {
                                    return res.json({'status': 'Article deleted successfully'});
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